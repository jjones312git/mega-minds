// lib/core/HandoffProcessor.js
/**
 * HandoffProcessor - Automated processing of agent handoff queues
 * Manages the lifecycle of handoffs from initiation to completion
 * Ensures handoffs are processed efficiently and don't get stuck
 */

const HandoffValidator = require('../utils/HandoffValidator');

class HandoffProcessor {
    constructor(agentStateTracker, sessionManager, config = {}) {
        this.agentState = agentStateTracker;
        this.sessions = sessionManager;
        
        this.config = {
            maxConcurrentHandoffs: 3,
            handoffTimeoutMs: 30 * 60 * 1000,      // 30 minutes
            acknowledgmentTimeoutMs: 5 * 60 * 1000, // 5 minutes
            retryAttempts: 3,
            retryDelayMs: 60 * 1000,                // 1 minute
            enableAutoProcessing: false,             // Disabled by default
            validateHandoffs: true,
            ...config
        };

        this.validator = new HandoffValidator({
            strictMode: this.config.strictValidation || false
        });

        this.processingTimer = null;
        this.isProcessing = false;
        this.processedHandoffs = new Map(); // Track processing attempts
    }

    /**
     * Start automatic handoff processing
     * @param {number} intervalMs - Processing interval in milliseconds
     */
    startAutoProcessing(intervalMs = 30000) { // 30 seconds default
        if (this.processingTimer) {
            console.warn('⚠️ Auto processing already started');
            return;
        }

        this.config.enableAutoProcessing = true;
        this.processingTimer = setInterval(async () => {
            if (!this.isProcessing) {
                await this.processHandoffQueue();
            }
        }, intervalMs);

        console.log(`🔄 Handoff auto-processing started (interval: ${intervalMs}ms)`);
    }

    /**
     * Stop automatic handoff processing
     */
    stopAutoProcessing() {
        if (this.processingTimer) {
            clearInterval(this.processingTimer);
            this.processingTimer = null;
            this.config.enableAutoProcessing = false;
            console.log('⏹️ Handoff auto-processing stopped');
        }
    }

    /**
     * Process the next handoff in the queue
     * @returns {object|null} Processing result or null if no handoffs
     */
    async processNextHandoff() {
        if (this.isProcessing) {
            return { status: 'busy', message: 'Already processing handoffs' };
        }

        this.isProcessing = true;

        try {
            const activeHandoffs = await this.agentState.getActiveHandoffs();
            
            if (activeHandoffs.length === 0) {
                return { status: 'empty', message: 'No handoffs in queue' };
            }

            // Check for timed out handoffs
            await this.checkForTimeouts();

            // Process handoffs by priority and age
            const sortedHandoffs = this.prioritizeHandoffs(activeHandoffs);
            const handoffToProcess = sortedHandoffs[0];

            if (!handoffToProcess) {
                return { status: 'no_ready', message: 'No handoffs ready for processing' };
            }

            const result = await this.processHandoff(handoffToProcess);
            return result;

        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Process all pending handoffs in the queue
     * @returns {object} Batch processing results
     */
    async processHandoffQueue() {
        const results = {
            processed: 0,
            failed: 0,
            skipped: 0,
            errors: []
        };

        try {
            const activeHandoffs = await this.agentState.getActiveHandoffs();
            
            if (activeHandoffs.length === 0) {
                return { ...results, message: 'Queue is empty' };
            }

            console.log(`🔄 Processing ${activeHandoffs.length} handoffs in queue`);

            // Check concurrent handoff limit
            const processingCount = activeHandoffs.filter(h => h.status === 'in_progress').length;
            if (processingCount >= this.config.maxConcurrentHandoffs) {
                return { 
                    ...results, 
                    message: `Concurrent limit reached (${processingCount}/${this.config.maxConcurrentHandoffs})` 
                };
            }

            // Process handoffs in priority order
            const prioritizedHandoffs = this.prioritizeHandoffs(activeHandoffs);
            const availableSlots = this.config.maxConcurrentHandoffs - processingCount;
            const handoffsToProcess = prioritizedHandoffs.slice(0, availableSlots);

            for (const handoff of handoffsToProcess) {
                try {
                    const result = await this.processHandoff(handoff);
                    
                    if (result.status === 'success') {
                        results.processed++;
                    } else if (result.status === 'failed') {
                        results.failed++;
                        results.errors.push(result.error);
                    } else {
                        results.skipped++;
                    }
                } catch (error) {
                    results.failed++;
                    results.errors.push(error.message);
                    console.error(`❌ Error processing handoff ${handoff.id}:`, error.message);
                }
            }

            console.log(`✅ Queue processing complete: ${results.processed} processed, ${results.failed} failed, ${results.skipped} skipped`);
            return results;

        } catch (error) {
            console.error('❌ Error processing handoff queue:', error.message);
            results.errors.push(error.message);
            return results;
        }
    }

    /**
     * Process a single handoff
     * @param {object} handoff - Handoff to process
     * @returns {object} Processing result
     */
    async processHandoff(handoff) {
        console.log(`🔄 Processing handoff: ${handoff.id} (${handoff.fromAgent} → ${handoff.toAgent})`);

        try {
            // Validate handoff readiness
            const readinessCheck = await this.validateHandoffReadiness(handoff);
            if (!readinessCheck.isReady) {
                return {
                    status: 'not_ready',
                    message: readinessCheck.reason,
                    handoffId: handoff.id
                };
            }

            // Track processing attempts
            this.trackProcessingAttempt(handoff.id);

            // Check if this handoff has been processed too many times
            const attempts = this.getProcessingAttempts(handoff.id);
            if (attempts >= this.config.retryAttempts) {
                await this.markHandoffFailed(handoff, 'Max retry attempts exceeded');
                return {
                    status: 'failed',
                    error: 'Max retry attempts exceeded',
                    handoffId: handoff.id
                };
            }

            // Validate handoff content if validation is enabled
            if (this.config.validateHandoffs) {
                const validationResult = this.validator.validateHandoffData({
                    fromAgent: handoff.fromAgent,
                    toAgent: handoff.toAgent,
                    taskDescription: handoff.data.taskDescription,
                    context: handoff.data.context,
                    requirements: handoff.data.requirements,
                    successCriteria: handoff.data.successCriteria
                });

                if (!validationResult.isValid) {
                    await this.markHandoffFailed(handoff, `Validation failed: ${validationResult.errors.join(', ')}`);
                    return {
                        status: 'failed',
                        error: `Validation failed: ${validationResult.errors.join(', ')}`,
                        handoffId: handoff.id
                    };
                }
            }

            // Process based on current handoff status
            switch (handoff.status) {
                case 'initiated':
                    return await this.processInitiatedHandoff(handoff);
                
                case 'acknowledged':
                    return await this.processAcknowledgedHandoff(handoff);
                
                case 'in_progress':
                    return await this.processInProgressHandoff(handoff);
                
                default:
                    return {
                        status: 'skipped',
                        message: `Unknown handoff status: ${handoff.status}`,
                        handoffId: handoff.id
                    };
            }

        } catch (error) {
            console.error(`❌ Error processing handoff ${handoff.id}:`, error.message);
            await this.markHandoffFailed(handoff, error.message);
            return {
                status: 'failed',
                error: error.message,
                handoffId: handoff.id
            };
        }
    }

    /**
     * Validate that a handoff is ready for processing
     * @param {object} handoff - Handoff to validate
     * @returns {object} Readiness validation result
     */
    async validateHandoffReadiness(handoff) {
        // Check if target agent is available
        const agentStates = await this.agentState.getAllAgentStates();
        const targetAgentState = agentStates[handoff.toAgent];

        if (targetAgentState && targetAgentState.status === 'blocked') {
            return {
                isReady: false,
                reason: `Target agent ${handoff.toAgent} is blocked`
            };
        }

        // Check handoff age and timeout
        const handoffAge = Date.now() - new Date(handoff.timestamp).getTime();
        if (handoffAge > this.config.handoffTimeoutMs) {
            return {
                isReady: false,
                reason: 'Handoff has timed out'
            };
        }

        // Check acknowledgment timeout
        if (handoff.status === 'initiated') {
            if (handoffAge > this.config.acknowledgmentTimeoutMs) {
                return {
                    isReady: false,
                    reason: 'Acknowledgment timeout exceeded'
                };
            }
        }

        return { isReady: true };
    }

    /**
     * Process handoff in 'initiated' status
     * @param {object} handoff - Handoff object
     * @returns {object} Processing result
     */
    async processInitiatedHandoff(handoff) {
        // For now, initiated handoffs wait for manual acknowledgment
        // In future, could implement auto-acknowledgment for certain agent types
        
        const age = Date.now() - new Date(handoff.timestamp).getTime();
        if (age > this.config.acknowledgmentTimeoutMs) {
            console.warn(`⚠️ Handoff ${handoff.id} awaiting acknowledgment for ${Math.round(age / 60000)} minutes`);
        }

        return {
            status: 'waiting_acknowledgment',
            message: 'Handoff initiated, waiting for agent acknowledgment',
            handoffId: handoff.id
        };
    }

    /**
     * Process handoff in 'acknowledged' status
     * @param {object} handoff - Handoff object
     * @returns {object} Processing result
     */
    async processAcknowledgedHandoff(handoff) {
        // Handoff is acknowledged but work hasn't started yet
        // Could implement auto-start for certain scenarios
        
        const ackAge = handoff.acknowledgmentTimestamp ? 
            Date.now() - new Date(handoff.acknowledgmentTimestamp).getTime() : 0;

        if (ackAge > 10 * 60 * 1000) { // 10 minutes
            console.warn(`⚠️ Handoff ${handoff.id} acknowledged but work not started for ${Math.round(ackAge / 60000)} minutes`);
        }

        return {
            status: 'waiting_work_start',
            message: 'Handoff acknowledged, waiting for work to begin',
            handoffId: handoff.id
        };
    }

    /**
     * Process handoff in 'in_progress' status
     * @param {object} handoff - Handoff object
     * @returns {object} Processing result
     */
    async processInProgressHandoff(handoff) {
        // Monitor progress and check for stalled handoffs
        
        const workAge = handoff.workStartTimestamp ? 
            Date.now() - new Date(handoff.workStartTimestamp).getTime() : 0;

        // Check if work has been going on too long
        if (workAge > this.config.handoffTimeoutMs) {
            console.warn(`⚠️ Handoff ${handoff.id} has been in progress for ${Math.round(workAge / 60000)} minutes`);
            
            // Could implement escalation or automatic timeout handling here
            return {
                status: 'long_running',
                message: `Work in progress for ${Math.round(workAge / 60000)} minutes`,
                handoffId: handoff.id
            };
        }

        return {
            status: 'monitoring',
            message: 'Work in progress, monitoring for completion',
            handoffId: handoff.id
        };
    }

    /**
     * Prioritize handoffs for processing
     * @param {array} handoffs - Array of handoff objects
     * @returns {array} Sorted handoffs by priority
     */
    prioritizeHandoffs(handoffs) {
        return handoffs.sort((a, b) => {
            // Priority order: urgent > high > normal > low
            const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
            const aPriority = priorityOrder[a.data?.priority] || 2;
            const bPriority = priorityOrder[b.data?.priority] || 2;

            if (aPriority !== bPriority) {
                return bPriority - aPriority; // Higher priority first
            }

            // For same priority, older handoffs first
            return new Date(a.timestamp) - new Date(b.timestamp);
        });
    }

    /**
     * Check for timed out handoffs and handle them
     */
    async checkForTimeouts() {
        try {
            const activeHandoffs = await this.agentState.getActiveHandoffs();
            const now = Date.now();

            for (const handoff of activeHandoffs) {
                const age = now - new Date(handoff.timestamp).getTime();
                
                if (age > this.config.handoffTimeoutMs) {
                    console.warn(`⏰ Handoff ${handoff.id} timed out after ${Math.round(age / 60000)} minutes`);
                    await this.markHandoffFailed(handoff, 'Timeout exceeded');
                }
            }
        } catch (error) {
            console.error('Error checking for timeouts:', error.message);
        }
    }

    /**
     * Mark a handoff as failed
     * @param {object} handoff - Handoff object
     * @param {string} reason - Failure reason
     */
    async markHandoffFailed(handoff, reason) {
        try {
            // In a real implementation, would update the handoff status
            console.error(`❌ Marking handoff ${handoff.id} as failed: ${reason}`);
            
            // Could implement additional failure handling here:
            // - Notify relevant agents
            // - Update metrics
            // - Trigger escalation
            
        } catch (error) {
            console.error('Error marking handoff as failed:', error.message);
        }
    }

    /**
     * Track processing attempt for a handoff
     * @param {string} handoffId - Handoff ID
     */
    trackProcessingAttempt(handoffId) {
        const current = this.processedHandoffs.get(handoffId) || 0;
        this.processedHandoffs.set(handoffId, current + 1);
    }

    /**
     * Get number of processing attempts for a handoff
     * @param {string} handoffId - Handoff ID
     * @returns {number} Number of attempts
     */
    getProcessingAttempts(handoffId) {
        return this.processedHandoffs.get(handoffId) || 0;
    }

    /**
     * Get processor status and metrics
     * @returns {object} Status information
     */
    async getStatus() {
        const activeHandoffs = await this.agentState.getActiveHandoffs();
        
        return {
            isProcessing: this.isProcessing,
            autoProcessingEnabled: this.config.enableAutoProcessing,
            activeHandoffs: activeHandoffs.length,
            config: {
                maxConcurrentHandoffs: this.config.maxConcurrentHandoffs,
                handoffTimeoutMs: this.config.handoffTimeoutMs,
                retryAttempts: this.config.retryAttempts
            },
            processingAttempts: this.processedHandoffs.size
        };
    }

    /**
     * Update processor configuration
     * @param {object} newConfig - Configuration updates
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔧 HandoffProcessor configuration updated');
    }
}

module.exports = HandoffProcessor;