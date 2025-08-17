// lib/core/HandoffAcknowledgment.js
/**
 * HandoffAcknowledgment - Manages the acknowledgment lifecycle for agent handoffs
 * Ensures proper two-way communication between agents and tracks acknowledgment status
 * Handles timeouts, retries, and escalation for unacknowledged handoffs
 */

class HandoffAcknowledgment {
    constructor(agentStateTracker, config = {}) {
        this.agentState = agentStateTracker;
        
        this.config = {
            acknowledgmentTimeoutMs: 5 * 60 * 1000,    // 5 minutes
            reminderIntervalMs: 2 * 60 * 1000,         // 2 minutes
            maxReminders: 3,
            escalationTimeoutMs: 15 * 60 * 1000,       // 15 minutes
            requireExplicitAcknowledgment: true,
            autoAcknowledgeAfterTimeout: false,
            ...config
        };

        // Track acknowledgment state
        this.acknowledgmentTracking = new Map(); // handoffId -> tracking data
        this.reminderTimers = new Map();         // handoffId -> timer reference
        this.escalationTimers = new Map();       // handoffId -> timer reference
    }

    /**
     * Request acknowledgment for a handoff
     * @param {string} handoffId - Handoff ID
     * @param {object} handoffData - Handoff data
     * @returns {object} Request result
     */
    async requestAcknowledgment(handoffId, handoffData) {
        try {
            console.log(`📨 Requesting acknowledgment for handoff: ${handoffId}`);

            // Initialize tracking for this handoff
            const trackingData = {
                handoffId: handoffId,
                fromAgent: handoffData.fromAgent,
                toAgent: handoffData.toAgent,
                requestTime: new Date().toISOString(),
                acknowledged: false,
                acknowledgmentTime: null,
                remindersSent: 0,
                lastReminderTime: null,
                escalated: false,
                escalationTime: null,
                timeoutReached: false
            };

            this.acknowledgmentTracking.set(handoffId, trackingData);

            // Set up reminder timer
            this.scheduleReminder(handoffId);

            // Set up escalation timer
            this.scheduleEscalation(handoffId);

            // Generate acknowledgment request message
            const acknowledgmentRequest = this.generateAcknowledgmentRequest(handoffData);

            return {
                success: true,
                handoffId: handoffId,
                request: acknowledgmentRequest,
                timeoutMs: this.config.acknowledgmentTimeoutMs,
                message: 'Acknowledgment request sent'
            };

        } catch (error) {
            console.error(`❌ Error requesting acknowledgment for ${handoffId}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Record an acknowledgment received from an agent
     * @param {string} handoffId - Handoff ID
     * @param {string} acknowledgingAgent - Agent providing acknowledgment
     * @param {object} acknowledgmentData - Acknowledgment details
     * @returns {object} Recording result
     */
    async recordAcknowledgment(handoffId, acknowledgingAgent, acknowledgmentData = {}) {
        try {
            const tracking = this.acknowledgmentTracking.get(handoffId);
            if (!tracking) {
                throw new Error(`No acknowledgment tracking found for handoff: ${handoffId}`);
            }

            if (tracking.acknowledged) {
                return {
                    success: false,
                    message: 'Handoff already acknowledged',
                    acknowledgmentTime: tracking.acknowledgmentTime
                };
            }

            // Validate that the acknowledging agent is the correct recipient
            if (acknowledgingAgent !== tracking.toAgent) {
                throw new Error(`Agent ${acknowledgingAgent} cannot acknowledge handoff meant for ${tracking.toAgent}`);
            }

            // Record the acknowledgment
            tracking.acknowledged = true;
            tracking.acknowledgmentTime = new Date().toISOString();
            tracking.acknowledgmentData = {
                agent: acknowledgingAgent,
                timestamp: tracking.acknowledgmentTime,
                understoodRequirements: acknowledgmentData.understoodRequirements || [],
                questions: acknowledgmentData.questions || [],
                concerns: acknowledgmentData.concerns || [],
                estimatedCompletion: acknowledgmentData.estimatedCompletion || null,
                confidence: acknowledgmentData.confidence || 'medium'
            };

            // Clear timers since acknowledgment is received
            this.clearTimers(handoffId);

            // Update agent state tracker
            await this.agentState.recordHandoffAcknowledged(
                handoffId, 
                acknowledgingAgent, 
                tracking.acknowledgmentData
            );

            console.log(`✅ Handoff ${handoffId} acknowledged by ${acknowledgingAgent}`);

            // Calculate acknowledgment time
            const requestTime = new Date(tracking.requestTime);
            const ackTime = new Date(tracking.acknowledgmentTime);
            const responseTimeMs = ackTime - requestTime;

            return {
                success: true,
                handoffId: handoffId,
                acknowledgingAgent: acknowledgingAgent,
                responseTimeMs: responseTimeMs,
                acknowledgmentData: tracking.acknowledgmentData,
                message: 'Acknowledgment recorded successfully'
            };

        } catch (error) {
            console.error(`❌ Error recording acknowledgment for ${handoffId}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check for overdue acknowledgments and send reminders
     * @returns {object} Check results
     */
    async checkOverdueAcknowledgments() {
        const results = {
            overdueCount: 0,
            remindersSent: 0,
            escalated: 0,
            timedOut: 0
        };

        try {
            const now = Date.now();

            for (const [handoffId, tracking] of this.acknowledgmentTracking.entries()) {
                if (tracking.acknowledged) continue;

                const ageMs = now - new Date(tracking.requestTime).getTime();

                // Check for timeout
                if (ageMs > this.config.acknowledgmentTimeoutMs && !tracking.timeoutReached) {
                    tracking.timeoutReached = true;
                    results.timedOut++;
                    
                    await this.handleAcknowledgmentTimeout(handoffId, tracking);
                }

                // Check for escalation
                else if (ageMs > this.config.escalationTimeoutMs && !tracking.escalated) {
                    tracking.escalated = true;
                    tracking.escalationTime = new Date().toISOString();
                    results.escalated++;
                    
                    await this.handleEscalation(handoffId, tracking);
                }

                // Count overdue
                if (ageMs > this.config.acknowledgmentTimeoutMs) {
                    results.overdueCount++;
                }
            }

            return results;

        } catch (error) {
            console.error('Error checking overdue acknowledgments:', error.message);
            return { ...results, error: error.message };
        }
    }

    /**
     * Generate acknowledgment request message
     * @param {object} handoffData - Handoff data
     * @returns {string} Acknowledgment request message
     */
    generateAcknowledgmentRequest(handoffData) {
        return `## Handoff Acknowledgment Required

🤖 @${handoffData.toAgent} - Please acknowledge this handoff

**From**: @${handoffData.fromAgent}
**To**: @${handoffData.toAgent}
**Task**: ${handoffData.taskDescription}

**Please confirm**:
✅ You have received this handoff
✅ You understand the requirements
✅ You can begin work on this task

**Required Response Format**:
\`\`\`
## Handoff Acknowledgment - @${handoffData.toAgent}

✅ **Handoff Received**: ${new Date().toISOString()}
✅ **Requirements Understood**: [List key requirements as you understand them]
✅ **Questions/Clarifications**: [Any unclear items that need clarification]
✅ **Estimated Timeline**: [Your estimate for completion]

🤖 @${handoffData.toAgent} ACTIVE - Beginning work now.
\`\`\`

**Timeout**: Please acknowledge within ${Math.round(this.config.acknowledgmentTimeoutMs / 60000)} minutes.

If you cannot work on this task, please respond with your constraints or suggest an alternative agent.`;
    }

    /**
     * Schedule a reminder for unacknowledged handoff
     * @param {string} handoffId - Handoff ID
     */
    scheduleReminder(handoffId) {
        const timer = setTimeout(async () => {
            await this.sendReminder(handoffId);
        }, this.config.reminderIntervalMs);

        this.reminderTimers.set(handoffId, timer);
    }

    /**
     * Schedule escalation for unacknowledged handoff
     * @param {string} handoffId - Handoff ID
     */
    scheduleEscalation(handoffId) {
        const timer = setTimeout(async () => {
            const tracking = this.acknowledgmentTracking.get(handoffId);
            if (tracking && !tracking.acknowledged) {
                await this.handleEscalation(handoffId, tracking);
            }
        }, this.config.escalationTimeoutMs);

        this.escalationTimers.set(handoffId, timer);
    }

    /**
     * Send reminder for unacknowledged handoff
     * @param {string} handoffId - Handoff ID
     */
    async sendReminder(handoffId) {
        try {
            const tracking = this.acknowledgmentTracking.get(handoffId);
            if (!tracking || tracking.acknowledged) return;

            if (tracking.remindersSent >= this.config.maxReminders) {
                console.warn(`⚠️ Max reminders reached for handoff ${handoffId}`);
                return;
            }

            tracking.remindersSent++;
            tracking.lastReminderTime = new Date().toISOString();

            const ageMinutes = Math.round((Date.now() - new Date(tracking.requestTime).getTime()) / 60000);

            console.log(`🔔 Sending reminder ${tracking.remindersSent}/${this.config.maxReminders} for handoff ${handoffId} (${ageMinutes}min old)`);

            // Generate reminder message
            const reminderMessage = `## ⚠️ Handoff Acknowledgment Reminder

@${tracking.toAgent} - This handoff requires your acknowledgment.

**Handoff ID**: ${handoffId}
**From**: @${tracking.fromAgent}
**Age**: ${ageMinutes} minutes
**Reminder**: ${tracking.remindersSent}/${this.config.maxReminders}

Please acknowledge this handoff or indicate if you cannot accept it.

**Next action**: ${tracking.remindersSent >= this.config.maxReminders ? 
    'Will escalate if not acknowledged soon' : 
    `Reminder in ${Math.round(this.config.reminderIntervalMs / 60000)} minutes`}`;

            // In a real implementation, would send this reminder to the agent
            console.log(reminderMessage);

            // Schedule next reminder if not at max
            if (tracking.remindersSent < this.config.maxReminders) {
                this.scheduleReminder(handoffId);
            }

        } catch (error) {
            console.error(`Error sending reminder for ${handoffId}:`, error.message);
        }
    }

    /**
     * Handle acknowledgment timeout
     * @param {string} handoffId - Handoff ID
     * @param {object} tracking - Tracking data
     */
    async handleAcknowledgmentTimeout(handoffId, tracking) {
        console.warn(`⏰ Acknowledgment timeout for handoff ${handoffId} (${tracking.fromAgent} → ${tracking.toAgent})`);

        if (this.config.autoAcknowledgeAfterTimeout) {
            // Auto-acknowledge with default response
            const autoAcknowledgment = {
                understoodRequirements: ['Auto-acknowledged after timeout'],
                questions: [],
                concerns: ['Acknowledgment timeout - auto-acknowledged'],
                estimatedCompletion: null,
                confidence: 'low'
            };

            await this.recordAcknowledgment(handoffId, tracking.toAgent, autoAcknowledgment);
            console.log(`🤖 Auto-acknowledged handoff ${handoffId} after timeout`);
        } else {
            // Mark for escalation or manual intervention
            console.log(`📋 Handoff ${handoffId} requires manual intervention due to acknowledgment timeout`);
        }
    }

    /**
     * Handle escalation for unacknowledged handoff
     * @param {string} handoffId - Handoff ID
     * @param {object} tracking - Tracking data
     */
    async handleEscalation(handoffId, tracking) {
        console.warn(`🚨 Escalating unacknowledged handoff ${handoffId}`);

        const escalationMessage = `## 🚨 HANDOFF ESCALATION

**Handoff ID**: ${handoffId}
**From**: @${tracking.fromAgent}
**To**: @${tracking.toAgent}
**Age**: ${Math.round((Date.now() - new Date(tracking.requestTime).getTime()) / 60000)} minutes
**Reminders Sent**: ${tracking.remindersSent}

**Issue**: @${tracking.toAgent} has not acknowledged handoff within ${Math.round(this.config.escalationTimeoutMs / 60000)} minutes.

**Possible Actions**:
1. Manual intervention to contact ${tracking.toAgent}
2. Reassign handoff to alternative agent
3. Mark handoff as failed and notify ${tracking.fromAgent}
4. Investigate agent availability and capacity

**System Recommendation**: Review agent workload and availability for ${tracking.toAgent}.`;

        // In a real implementation, would send to orchestrator or monitoring system
        console.log(escalationMessage);

        // Could implement automatic agent reassignment here
        await this.considerAgentReassignment(handoffId, tracking);
    }

    /**
     * Consider reassigning handoff to alternative agent
     * @param {string} handoffId - Handoff ID
     * @param {object} tracking - Tracking data
     */
    async considerAgentReassignment(handoffId, tracking) {
        // This would integrate with AgentDispatcher to find alternative agents
        console.log(`🔄 Considering agent reassignment for handoff ${handoffId}`);
        
        // For now, just log the consideration
        // Future implementation could:
        // 1. Check agent capabilities
        // 2. Find alternative agents
        // 3. Create new handoff with alternative agent
        // 4. Cancel original handoff
    }

    /**
     * Clear timers for a handoff
     * @param {string} handoffId - Handoff ID
     */
    clearTimers(handoffId) {
        // Clear reminder timer
        const reminderTimer = this.reminderTimers.get(handoffId);
        if (reminderTimer) {
            clearTimeout(reminderTimer);
            this.reminderTimers.delete(handoffId);
        }

        // Clear escalation timer
        const escalationTimer = this.escalationTimers.get(handoffId);
        if (escalationTimer) {
            clearTimeout(escalationTimer);
            this.escalationTimers.delete(handoffId);
        }
    }

    /**
     * Get acknowledgment status for a handoff
     * @param {string} handoffId - Handoff ID
     * @returns {object|null} Acknowledgment status or null if not found
     */
    getAcknowledgmentStatus(handoffId) {
        const tracking = this.acknowledgmentTracking.get(handoffId);
        if (!tracking) return null;

        const now = Date.now();
        const ageMs = now - new Date(tracking.requestTime).getTime();

        return {
            handoffId: handoffId,
            acknowledged: tracking.acknowledged,
            acknowledgmentTime: tracking.acknowledgmentTime,
            ageMs: ageMs,
            ageMinutes: Math.round(ageMs / 60000),
            remindersSent: tracking.remindersSent,
            escalated: tracking.escalated,
            timeoutReached: tracking.timeoutReached,
            fromAgent: tracking.fromAgent,
            toAgent: tracking.toAgent
        };
    }

    /**
     * Get all pending acknowledgments
     * @returns {array} Array of pending acknowledgment statuses
     */
    getPendingAcknowledgments() {
        const pending = [];
        
        for (const [handoffId, tracking] of this.acknowledgmentTracking.entries()) {
            if (!tracking.acknowledged) {
                pending.push(this.getAcknowledgmentStatus(handoffId));
            }
        }

        return pending.sort((a, b) => b.ageMs - a.ageMs); // Oldest first
    }

    /**
     * Clean up completed acknowledgments older than specified time
     * @param {number} maxAgeMs - Maximum age to keep completed acknowledgments
     */
    cleanupCompletedAcknowledgments(maxAgeMs = 24 * 60 * 60 * 1000) { // 24 hours default
        const now = Date.now();
        const toRemove = [];

        for (const [handoffId, tracking] of this.acknowledgmentTracking.entries()) {
            if (tracking.acknowledged) {
                const ackAge = now - new Date(tracking.acknowledgmentTime).getTime();
                if (ackAge > maxAgeMs) {
                    toRemove.push(handoffId);
                }
            }
        }

        for (const handoffId of toRemove) {
            this.acknowledgmentTracking.delete(handoffId);
            this.clearTimers(handoffId);
        }

        if (toRemove.length > 0) {
            console.log(`🧹 Cleaned up ${toRemove.length} completed acknowledgments`);
        }
    }

    /**
     * Get acknowledgment system status
     * @returns {object} Status information
     */
    getStatus() {
        const totalTracked = this.acknowledgmentTracking.size;
        const pending = this.getPendingAcknowledgments();
        const acknowledged = totalTracked - pending.length;
        const overdue = pending.filter(p => p.ageMs > this.config.acknowledgmentTimeoutMs).length;

        return {
            totalTracked: totalTracked,
            acknowledged: acknowledged,
            pending: pending.length,
            overdue: overdue,
            config: {
                acknowledgmentTimeoutMs: this.config.acknowledgmentTimeoutMs,
                reminderIntervalMs: this.config.reminderIntervalMs,
                maxReminders: this.config.maxReminders,
                escalationTimeoutMs: this.config.escalationTimeoutMs
            }
        };
    }

    /**
     * Update configuration
     * @param {object} newConfig - Configuration updates
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔧 HandoffAcknowledgment configuration updated');
    }
}

module.exports = HandoffAcknowledgment;