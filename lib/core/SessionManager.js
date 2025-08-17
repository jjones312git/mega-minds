// lib/core/SessionManager.js - Add this memory monitoring integration

const path = require('path');
const fs = require('fs-extra');

// Add the MemoryMonitor class at the top of SessionManager.js file
class MemoryMonitor {
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
        this.monitoringActive = false;
        this.warningThreshold = 2000; // 2GB
        this.criticalThreshold = 3500; // 3.5GB  
        this.lastCheck = 0;
        this.checkInterval = 30000; // 30 seconds
    }

    startMonitoring() {
        if (this.monitoringActive) return;

        this.monitoringActive = true;
        console.log('🔍 Starting memory monitoring...');

        this.monitorInterval = setInterval(() => {
            this.checkMemory();
        }, this.checkInterval);
    }

    stopMonitoring() {
        if (!this.monitoringActive) return;

        this.monitoringActive = false;
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        console.log('🔍 Memory monitoring stopped');
    }

    checkMemory() {
        const usage = process.memoryUsage();
        const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
        const externalMB = Math.round(usage.external / 1024 / 1024);

        console.log(`🧠 Memory: ${heapUsedMB}MB used, ${heapTotalMB}MB total, ${externalMB}MB external`);

        if (heapUsedMB > this.criticalThreshold) {
            this.handleCriticalMemory(heapUsedMB);
        } else if (heapUsedMB > this.warningThreshold) {
            this.handleWarningMemory(heapUsedMB);
        }
    }

    async handleWarningMemory(heapUsedMB) {
        console.log(`⚠️ Memory warning: ${heapUsedMB}MB used`);

        // Trigger cleanup
        await this.sessionManager.forceMemoryCleanup();

        // Force garbage collection if available
        if (global.gc) {
            global.gc();
            console.log('🗑️ Forced garbage collection');
        }
    }

    async handleCriticalMemory(heapUsedMB) {
        console.log(`🚨 CRITICAL MEMORY: ${heapUsedMB}MB used - Taking emergency action`);

        // Emergency session save
        await this.sessionManager.saveActiveSession();
        console.log('💾 Emergency session saved');

        // Force deactivate all non-essential agents
        const activeAgents = await this.sessionManager.agentState.getAllAgentStates();
        const agentNames = Object.keys(activeAgents);

        // Keep only the orchestrator active
        for (const agentName of agentNames) {
            if (agentName !== 'project-orchestrator') {
                await this.sessionManager.agentState.forceDeactivateAgent(
                    agentName,
                    'Emergency memory management'
                );
            }
        }

        // Aggressive cleanup
        await this.sessionManager.forceMemoryCleanup();

        // Multiple GC cycles
        if (global.gc) {
            for (let i = 0; i < 3; i++) {
                global.gc();
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            console.log('🗑️ Multiple GC cycles completed');
        }

        // Check if we recovered
        setTimeout(() => {
            const newUsage = process.memoryUsage();
            const newHeapMB = Math.round(newUsage.heapUsed / 1024 / 1024);
            console.log(`🔄 Memory after cleanup: ${newHeapMB}MB`);

            if (newHeapMB > this.criticalThreshold) {
                console.log('🚨 Memory still critical - recommend process restart');
                throw new Error(`Memory cleanup insufficient. Heap still at ${newHeapMB}MB. Consider restarting Claude Code.`);
            }
        }, 5000);
    }

    getMemoryStatus() {
        const usage = process.memoryUsage();
        const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);

        return {
            heapUsedMB,
            status: heapUsedMB > this.criticalThreshold ? 'critical' :
                heapUsedMB > this.warningThreshold ? 'warning' : 'healthy',
            warningThreshold: this.warningThreshold,
            criticalThreshold: this.criticalThreshold
        };
    }
}

class SessionManager {
    constructor(memoryManager, agentStateTracker) {
        this.memory = memoryManager;
        this.agentState = agentStateTracker;
        this.sessionPath = path.join(memoryManager.memoryPath, 'sessions');
        this.activeSessionFile = path.join(memoryManager.memoryPath, 'active-session.json');

        // CHANGED: Reduced from 3 to 2 agents max
        this.config = {
            maxConcurrentAgents: 2, // Changed from 3 to 2
            handoffTimeoutMinutes: 30,
            qualityGateTimeoutMinutes: 60,
            sessionRetentionDays: 30,
            autoSaveIntervalMinutes: 5,

            // Add memory management settings
            maxHistoryEntries: 50,
            maxLogEntries: 100,
            memoryCheckIntervalMs: 60000,
            forceGCThreshold: 3000000000 // 3GB heap usage threshold
        };

        // ADD: Initialize memory monitor
        this.memoryMonitor = new MemoryMonitor(this);

        // Workflow coordination state
        this.workflowState = {
            activeWorkflows: new Map(),
            handoffQueue: [],
            qualityGates: new Map(),
            decisionCouncils: new Map(),
            emergencyStatus: null
        };
    }

    async initialize() {
        await fs.ensureDir(this.sessionPath);

        // Restore active session if exists
        if (await fs.pathExists(this.activeSessionFile)) {
            try {
                const activeSession = await fs.readJSON(this.activeSessionFile);
                await this.restoreSession(activeSession);
                console.log('📂 Restored active session:', activeSession.sessionId);
            } catch (error) {
                console.warn('⚠️ Failed to restore active session:', error.message);
                await fs.remove(this.activeSessionFile);
            }
        }

        // START: Memory monitoring
        this.memoryMonitor.startMonitoring();
        
        // Ensure we have an active session
        if (!this.currentSession) {
            await this.startNewSession('Auto-started session');
        }
        
        console.log('🔄 SessionManager initialized with memory monitoring');
    }

    async endSession(summary = {}) {
        if (!this.currentSession) {
            throw new Error('No active session to end');
        }

        // STOP: Memory monitoring
        this.memoryMonitor.stopMonitoring();

        const endTime = new Date().toISOString();

        // Finalize session data
        this.currentSession.endTime = endTime;
        this.currentSession.duration = this.calculateSessionDuration();
        this.currentSession.summary = {
            workCompleted: this.currentSession.memory.workCompleted.length,
            decisionsCount: this.currentSession.memory.keyDecisions.length,
            agentsUsed: Array.from(new Set(this.currentSession.agents.handoffHistory.map(h => h.toAgent))),
            status: 'completed',
            ...summary
        };

        // Archive session
        const sessionFile = path.join(this.sessionPath, `session-${this.currentSession.sessionId}.json`);
        await fs.writeJSON(sessionFile, this.currentSession, { spaces: 2 });

        // Update memory with session completion (transform to expected format)
        const memorySession = {
            description: this.currentSession.description,
            timestamp: this.currentSession.endTime,
            work: {
                completed: this.currentSession.memory.workCompleted || []
            },
            decisions: this.currentSession.memory.keyDecisions || [],
            nextSteps: [], // Could derive from handoffs or workflow state
            // Include handoff summary for memory
            handoffSummary: this.currentSession.handoffs ? {
                totalCompleted: this.currentSession.handoffs.metrics.totalCompleted,
                averageTime: this.currentSession.handoffs.metrics.averageCompletionTime,
                acknowledgmentRate: this.currentSession.handoffs.metrics.acknowledgmentRate
            } : null
        };
        
        await this.memory.updateRecentWorkMemory(memorySession);

        // Clean up active session
        await fs.remove(this.activeSessionFile);

        const sessionSummary = {
            sessionId: this.currentSession.sessionId,
            description: this.currentSession.description,
            duration: this.currentSession.duration,
            summary: this.currentSession.summary
        };

        this.currentSession = null;
        this.workflowState = {
            activeWorkflows: new Map(),
            handoffQueue: [],
            qualityGates: new Map(),
            decisionCouncils: new Map(),
            emergencyStatus: null
        };

        console.log(`🏁 Session ended: ${sessionSummary.sessionId}`);
        return sessionSummary;
    }

    async forceMemoryCleanup() {
        if (!this.currentSession) return;

        console.log('🧹 Starting enhanced memory cleanup with handoff preservation...');

        // NEW: Check for active handoffs before cleanup
        const handoffStatus = await this.getHandoffAwareCleanupPlan();
        console.log(`📊 Cleanup plan: ${handoffStatus.summary}`);

        // Preserve critical handoff data before cleanup
        await this.preserveCriticalHandoffData();

        // Limit history arrays (but preserve more if handoffs are active)
        const historyLimit = handoffStatus.activeHandoffs > 0 ? 
            Math.max(this.config.maxHistoryEntries, 100) : 
            this.config.maxHistoryEntries;

        this.currentSession.agents.handoffHistory =
            this.currentSession.agents.handoffHistory.slice(-historyLimit);

        this.currentSession.agents.coordinationLog =
            this.currentSession.agents.coordinationLog.slice(-this.config.maxLogEntries);

        this.currentSession.memory.workCompleted =
            this.currentSession.memory.workCompleted.slice(-historyLimit);

        // Smart cleanup of workflows - preserve active handoff-related workflows
        this.workflowState.activeWorkflows.clear();
        this.workflowState.handoffQueue =
            this.workflowState.handoffQueue.filter(h => 
                h.status === 'initiated' || h.status === 'acknowledged' || h.status === 'in_progress'
            );

        // Enhanced: Clean up old completed handoffs while preserving active ones
        await this.cleanupCompletedHandoffs();

        // NEW: Smart agent cleanup with handoff awareness
        await this.performHandoffAwareAgentCleanup();

        await this.saveActiveSession();
        console.log(`🧹 Enhanced memory cleanup completed. ${handoffStatus.activeHandoffs} active handoffs preserved.`);
    }

    /**
     * Analyze current handoff state to create a cleanup plan
     * @returns {object} Cleanup plan with handoff awareness
     */
    async getHandoffAwareCleanupPlan() {
        if (!this.agentState) {
            return {
                activeHandoffs: 0,
                criticalAgents: [],
                summary: 'No agent state tracker available'
            };
        }

        try {
            const activeHandoffs = await this.agentState.getActiveHandoffs();
            const activeAgents = await this.agentState.getAllAgentStates();
            
            // Find agents with critical handoff dependencies
            const criticalAgents = [];
            for (const agentName of Object.keys(activeAgents)) {
                const dependencies = await this.agentState.checkAgentHandoffDependencies(agentName);
                if (dependencies.blockingHandoffs.length > 0 || dependencies.pendingHandoffs.length > 0) {
                    criticalAgents.push({
                        name: agentName,
                        blockingHandoffs: dependencies.blockingHandoffs.length,
                        pendingHandoffs: dependencies.pendingHandoffs.length
                    });
                }
            }

            return {
                activeHandoffs: activeHandoffs.length,
                criticalAgents: criticalAgents,
                totalActiveAgents: Object.keys(activeAgents).length,
                summary: `${activeHandoffs.length} active handoffs, ${criticalAgents.length} agents with dependencies`
            };
        } catch (error) {
            console.warn('⚠️ Error analyzing handoff state for cleanup:', error.message);
            return {
                activeHandoffs: 0,
                criticalAgents: [],
                summary: 'Handoff analysis failed, proceeding with standard cleanup'
            };
        }
    }

    /**
     * Preserve critical handoff data before cleanup
     */
    async preserveCriticalHandoffData() {
        if (!this.currentSession?.handoffs) return;

        try {
            // Create a snapshot of active handoffs
            const criticalHandoffSnapshot = {
                timestamp: new Date().toISOString(),
                activeHandoffs: this.currentSession.handoffs.active.map(handoff => ({
                    id: handoff.id,
                    fromAgent: handoff.fromAgent,
                    toAgent: handoff.toAgent,
                    status: handoff.status,
                    acknowledged: handoff.acknowledged,
                    workStarted: handoff.workStarted,
                    taskDescription: handoff.taskDescription,
                    preservationReason: 'Memory cleanup preservation'
                })),
                pendingHandoffs: this.currentSession.handoffs.pending.slice(),
                metrics: { ...this.currentSession.handoffs.metrics }
            };

            // Store in session for recovery
            if (!this.currentSession.preservedData) {
                this.currentSession.preservedData = {};
            }
            
            this.currentSession.preservedData.handoffSnapshot = criticalHandoffSnapshot;
            
            console.log(`💾 Preserved ${criticalHandoffSnapshot.activeHandoffs.length} critical handoffs during cleanup`);
        } catch (error) {
            console.warn('⚠️ Error preserving critical handoff data:', error.message);
        }
    }

    /**
     * Perform smart agent cleanup with handoff awareness
     */
    async performHandoffAwareAgentCleanup() {
        if (!this.agentState) return;

        try {
            const activeAgents = await this.agentState.getAllAgentStates();
            const agentNames = Object.keys(activeAgents);
            
            // Check memory pressure and decide if we need to deactivate agents
            const memoryStatus = this.memoryMonitor.getMemoryStatus();
            
            if (memoryStatus.status === 'critical' && agentNames.length > 1) {
                console.log('🚨 Critical memory - attempting graceful agent deactivation...');
                
                // Sort agents by priority (keep orchestrator, deactivate others smartly)
                const agentPriority = agentNames.sort((a, b) => {
                    if (a === 'project-orchestrator-agent') return -1;
                    if (b === 'project-orchestrator-agent') return 1;
                    return 0;
                });
                
                // Try to deactivate lower priority agents gracefully
                for (let i = agentPriority.length - 1; i > 0 && memoryStatus.status === 'critical'; i--) {
                    const agentName = agentPriority[i];
                    
                    try {
                        console.log(`🔄 Attempting graceful deactivation of ${agentName} for memory cleanup...`);
                        
                        const result = await this.agentState.gracefulDeactivateAgent(
                            agentName,
                            'Memory cleanup - critical memory pressure',
                            {
                                forceAfterTimeout: 5000, // 5 seconds for cleanup
                                waitForHandoffs: true,
                                transferToAgent: 'project-orchestrator-agent',
                                preserveWork: true
                            }
                        );
                        
                        if (result.success) {
                            console.log(`✅ Successfully deactivated ${agentName} during memory cleanup`);
                            // Update memory status
                            const newMemoryStatus = this.memoryMonitor.getMemoryStatus();
                            if (newMemoryStatus.status !== 'critical') {
                                console.log('✅ Memory pressure relieved after agent deactivation');
                                break;
                            }
                        } else {
                            console.warn(`⚠️ Could not gracefully deactivate ${agentName}: ${result.message}`);
                        }
                        
                    } catch (error) {
                        console.warn(`⚠️ Error during handoff-aware agent cleanup for ${agentName}:`, error.message);
                    }
                }
            }
            
        } catch (error) {
            console.warn('⚠️ Error during handoff-aware agent cleanup:', error.message);
        }
    }

    async saveActiveSession() {
        if (!this.currentSession) {
            console.log('📂 No active session to save');
            return null;
        }

        // Update session timestamp
        this.currentSession.lastUpdate = new Date().toISOString();

        // NEW: Sync handoff state from AgentStateTracker before saving
        await this.syncHandoffState();

        // Save to active session file for quick restoration
        await fs.writeJSON(this.activeSessionFile, this.currentSession, { spaces: 2 });

        // Also save as a timestamped session file for history
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const sessionFile = path.join(this.sessionPath, `session-${timestamp}.json`);
        await fs.writeJSON(sessionFile, this.currentSession, { spaces: 2 });

        console.log(`💾 Active session saved: ${this.currentSession.sessionId} (${this.currentSession.handoffs?.active?.length || 0} active handoffs)`);
        return this.currentSession.sessionId;
    }

    async restoreSession(sessionData) {
        this.currentSession = sessionData;
        console.log(`🔄 Restored session: ${sessionData.sessionId || 'unknown'}`);
        
        // Restore agent states if available
        if (sessionData.agents && sessionData.agents.activeAgents) {
            for (const [agentName, agentData] of Object.entries(sessionData.agents.activeAgents)) {
                await this.agentState.restoreAgentState(agentName, agentData);
            }
        }

        // NEW: Restore handoff state if available
        if (sessionData.handoffs) {
            await this.restoreHandoffState(sessionData);
        }
        
        return this.currentSession;
    }

    async startNewSession(description = 'Development session') {
        // End current session if one exists
        if (this.currentSession) {
            await this.endSession({ reason: 'Starting new session' });
        }

        const sessionId = `session-${Date.now()}`;
        this.currentSession = {
            sessionId: sessionId,
            description: description,
            startTime: new Date().toISOString(),
            lastUpdate: new Date().toISOString(),
            agents: {
                activeAgents: {},
                handoffHistory: [],
                coordinationLog: []
            },
            memory: {
                workCompleted: [],
                keyDecisions: [],
                contextUpdates: []
            },
            workflow: {
                currentPhase: 'initialization',
                completedPhases: []
            },
            // NEW: Enhanced handoff tracking (backward compatible)
            handoffs: {
                active: [],           // Currently active handoffs
                completed: [],        // Successfully completed handoffs
                failed: [],          // Failed handoffs with reasons
                pending: [],         // Handoffs waiting for acknowledgment
                metrics: {
                    totalInitiated: 0,
                    totalCompleted: 0,
                    totalFailed: 0,
                    averageCompletionTime: 0,
                    acknowledgmentRate: 0
                }
            }
        };

        // Save initial session state
        await this.saveActiveSession();
        console.log(`🎯 Started new session: ${sessionId}`);
        return this.currentSession;
    }

    calculateSessionDuration() {
        if (!this.currentSession || !this.currentSession.startTime) {
            return '0 minutes';
        }
        
        const start = new Date(this.currentSession.startTime);
        const end = new Date();
        const durationMs = end - start;
        const minutes = Math.round(durationMs / (1000 * 60));
        
        if (minutes < 60) {
            return `${minutes} minutes`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours}h ${remainingMinutes}m`;
        }
    }

    getMemoryStatus() {
        return {
            session: this.currentSession ? {
                id: this.currentSession.sessionId,
                handoffs: this.currentSession.agents.handoffHistory.length,
                workItems: this.currentSession.memory.workCompleted.length
            } : null,
            system: this.memoryMonitor.getMemoryStatus(),
            cleanup: {
                lastCleanup: this.lastCleanup || 'never',
                nextAutoSave: 'every 5 minutes'
            }
        };
    }

    // ===== NEW ENHANCED HANDOFF INTEGRATION METHODS =====

    /**
     * Sync handoff state from AgentStateTracker to session
     */
    async syncHandoffState() {
        if (!this.currentSession || !this.agentState) return;

        try {
            // Ensure handoffs structure exists for backward compatibility
            if (!this.currentSession.handoffs) {
                this.currentSession.handoffs = {
                    active: [],
                    completed: [],
                    failed: [],
                    pending: [],
                    metrics: {
                        totalInitiated: 0,
                        totalCompleted: 0,
                        totalFailed: 0,
                        averageCompletionTime: 0,
                        acknowledgmentRate: 0
                    }
                };
            }

            // Get current handoffs from AgentStateTracker
            const activeHandoffs = await this.agentState.getActiveHandoffs();
            const handoffMetrics = await this.agentState.getHandoffMetrics(1); // Last 24 hours

            // Update session handoff state
            this.currentSession.handoffs.active = activeHandoffs.map(handoff => ({
                id: handoff.id,
                fromAgent: handoff.fromAgent,
                toAgent: handoff.toAgent,
                status: handoff.status,
                timestamp: handoff.timestamp,
                taskDescription: handoff.data?.taskDescription || '',
                acknowledged: handoff.acknowledgmentReceived || false,
                workStarted: handoff.workStarted || false
            }));

            // Categorize handoffs by status
            this.currentSession.handoffs.pending = this.currentSession.handoffs.active.filter(h => 
                h.status === 'initiated' && !h.acknowledged
            );

            // Update metrics
            this.currentSession.handoffs.metrics = {
                totalInitiated: handoffMetrics.totalHandoffs || 0,
                totalCompleted: handoffMetrics.completedHandoffs || 0,
                totalFailed: handoffMetrics.totalHandoffs - handoffMetrics.completedHandoffs || 0,
                averageCompletionTime: handoffMetrics.averageCompletionTime || 0,
                acknowledgmentRate: handoffMetrics.acknowledgmentRate || 0
            };

        } catch (error) {
            console.warn('⚠️ Error syncing handoff state:', error.message);
        }
    }

    /**
     * Restore handoff state to AgentStateTracker from session
     * @param {object} sessionData - Session data containing handoff state
     */
    async restoreHandoffState(sessionData) {
        if (!sessionData.handoffs || !this.agentState) return;

        try {
            console.log(`🔄 Restoring ${sessionData.handoffs.active.length} active handoffs`);

            // Restore active handoffs to AgentStateTracker
            for (const handoff of sessionData.handoffs.active) {
                try {
                    // Check if handoff already exists in AgentStateTracker
                    const existingHandoff = await this.agentState.getHandoffById(handoff.id);
                    if (existingHandoff) {
                        console.log(`⚠️ Handoff ${handoff.id} already exists, skipping restoration`);
                        continue;
                    }

                    // Restore handoff to AgentStateTracker
                    await this.agentState.recordHandoffInitiated(
                        handoff.fromAgent,
                        handoff.toAgent,
                        {
                            taskDescription: handoff.taskDescription,
                            context: `Restored from session ${sessionData.sessionId}`,
                            priority: 'normal'
                        }
                    );

                    // If handoff was acknowledged, restore that state
                    if (handoff.acknowledged) {
                        await this.agentState.recordHandoffAcknowledged(
                            handoff.id,
                            handoff.toAgent,
                            { restoredFromSession: true }
                        );
                    }

                    // If work was started, restore that state
                    if (handoff.workStarted) {
                        await this.agentState.recordHandoffWorkStarted(
                            handoff.id,
                            handoff.toAgent
                        );
                    }

                } catch (handoffError) {
                    console.warn(`⚠️ Error restoring handoff ${handoff.id}:`, handoffError.message);
                }
            }

            console.log('✅ Handoff state restoration completed');

        } catch (error) {
            console.error('❌ Error restoring handoff state:', error.message);
        }
    }

    /**
     * Get handoff status for the current session
     * @returns {object} Handoff status summary
     */
    getHandoffStatus() {
        if (!this.currentSession?.handoffs) {
            return {
                active: 0,
                pending: 0,
                completed: 0,
                failed: 0,
                metrics: null
            };
        }

        return {
            active: this.currentSession.handoffs.active.length,
            pending: this.currentSession.handoffs.pending.length,
            completed: this.currentSession.handoffs.metrics.totalCompleted,
            failed: this.currentSession.handoffs.metrics.totalFailed,
            acknowledgmentRate: this.currentSession.handoffs.metrics.acknowledgmentRate,
            averageCompletionTime: this.currentSession.handoffs.metrics.averageCompletionTime,
            lastUpdate: this.currentSession.lastUpdate
        };
    }

    /**
     * Add a handoff event to session tracking
     * @param {string} eventType - Type of handoff event
     * @param {object} eventData - Event data
     */
    async trackHandoffEvent(eventType, eventData) {
        if (!this.currentSession) return;

        // Ensure handoffs structure exists
        if (!this.currentSession.handoffs) {
            await this.syncHandoffState();
        }

        // Add to coordination log (existing structure)
        this.currentSession.agents.coordinationLog.push({
            type: eventType,
            timestamp: new Date().toISOString(),
            data: eventData
        });

        // Trigger sync on next save
        this.currentSession.lastUpdate = new Date().toISOString();
    }

    /**
     * Clean up completed handoffs from session (preserve active ones)
     * @param {number} maxAge - Maximum age in milliseconds to keep completed handoffs
     */
    async cleanupCompletedHandoffs(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
        if (!this.currentSession?.handoffs) return;

        const now = Date.now();
        const originalCount = this.currentSession.handoffs.completed.length;

        // Filter out old completed handoffs
        this.currentSession.handoffs.completed = this.currentSession.handoffs.completed.filter(handoff => {
            const handoffAge = now - new Date(handoff.timestamp).getTime();
            return handoffAge <= maxAge;
        });

        // Never clean up active or pending handoffs - these are critical for recovery
        const cleanedCount = originalCount - this.currentSession.handoffs.completed.length;
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} old completed handoffs from session`);
            this.currentSession.lastUpdate = new Date().toISOString();
        }
    }
}

module.exports = SessionManager;