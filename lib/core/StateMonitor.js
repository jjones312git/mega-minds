// lib/core/StateMonitor.js
// Monitors file system state changes and triggers appropriate actions
// Implements PRD Core Feature #1: Real-time state monitoring

const fs = require('fs-extra');
const path = require('path');

/**
 * Monitors file system state changes and triggers appropriate actions
 * Enables real-time coordination between Claude Code and mega-minds
 * Per PRD: Real-time updates without manual refresh
 */
class StateMonitor {
    constructor(sessionManager, agentStateTracker) {
        this.sessionManager = sessionManager;
        this.agentState = agentStateTracker;
        this.projectPath = sessionManager?.memoryPath?.replace('.mega-minds', '') || process.cwd();
        this.stateDir = path.join(this.projectPath, '.mega-minds', 'state');
        this.isMonitoring = false;
        this.watchIntervals = new Map();
        this.lastFileStates = new Map();
        this.pollInterval = 2000; // Poll every 2 seconds for file changes
    }

    /**
     * Start monitoring state files for changes
     * PRD Requirement: Real-time monitoring without requiring file watchers
     */
    async startMonitoring() {
        if (this.isMonitoring) {
            console.log('👁️ State monitoring already active');
            return;
        }

        console.log('👁️ Starting state monitoring...');
        this.isMonitoring = true;

        // Ensure state directory exists
        await fs.ensureDir(this.stateDir);

        // Monitor agent state changes
        this.monitorFile(
            path.join(this.stateDir, 'active-agents.json'),
            'agentState',
            this.handleAgentStateChange.bind(this)
        );

        // Monitor handoff queue changes
        this.monitorFile(
            path.join(this.stateDir, 'handoff-queue.json'),
            'handoffQueue',
            this.handleHandoffQueueChange.bind(this)
        );

        // Monitor system status changes
        this.monitorFile(
            path.join(this.stateDir, 'system-status.json'),
            'systemStatus',
            this.handleSystemStatusChange.bind(this)
        );

        // Monitor work progress changes
        this.monitorFile(
            path.join(this.stateDir, 'work-progress.json'),
            'workProgress',
            this.handleWorkProgressChange.bind(this)
        );

        console.log('✅ State monitoring active');
        console.log(`📁 Monitoring state files in: ${this.stateDir}`);
    }

    /**
     * Stop monitoring state files
     */
    async stopMonitoring() {
        if (!this.isMonitoring) return;

        console.log('⏹️ Stopping state monitoring...');
        
        // Clear all watch intervals
        for (const [name, intervalId] of this.watchIntervals) {
            clearInterval(intervalId);
            console.log(`📝 Stopped monitoring: ${name}`);
        }

        this.watchIntervals.clear();
        this.lastFileStates.clear();
        this.isMonitoring = false;
        
        console.log('✅ State monitoring stopped');
    }

    /**
     * Monitor a specific file for changes using polling
     * @private
     */
    monitorFile(filePath, name, handler) {
        // Initialize last state
        this.lastFileStates.set(filePath, null);

        const intervalId = setInterval(async () => {
            try {
                if (!await fs.pathExists(filePath)) {
                    // File doesn't exist yet, skip
                    return;
                }

                const currentContent = await fs.readFile(filePath, 'utf8');
                const lastContent = this.lastFileStates.get(filePath);

                if (currentContent !== lastContent) {
                    // File has changed
                    this.lastFileStates.set(filePath, currentContent);
                    
                    if (lastContent !== null) { // Skip first read
                        try {
                            const data = JSON.parse(currentContent);
                            await handler(data);
                        } catch (parseError) {
                            console.warn(`⚠️ Error parsing ${name}:`, parseError.message);
                        }
                    }
                }
            } catch (error) {
                // Ignore errors for missing files or read failures
                if (error.code !== 'ENOENT') {
                    console.warn(`⚠️ Error monitoring ${name}:`, error.message);
                }
            }
        }, this.pollInterval);

        this.watchIntervals.set(name, intervalId);
        console.log(`👁️ Monitoring ${name}: ${path.basename(filePath)}`);
    }

    /**
     * Handle agent state changes
     * PRD Requirement: Agent activation/deactivation tracking
     */
    async handleAgentStateChange(stateData) {
        try {
            const activeAgents = stateData.activeAgents || {};
            const agentCount = Object.keys(activeAgents).length;

            console.log(`🔄 Agent state changed: ${agentCount} active agents`);

            // Update session manager with new agent states
            if (this.sessionManager && this.sessionManager.currentSession) {
                this.sessionManager.currentSession.agents.activeAgents = activeAgents;
                this.sessionManager.currentSession.lastUpdate = new Date().toISOString();
                
                // Auto-save session on significant changes
                if (agentCount > 0) {
                    await this.sessionManager.saveActiveSession();
                    console.log(`💾 Session auto-saved with ${agentCount} active agents`);
                }
            }

            // Update agent state tracker
            await this.syncAgentStateTracker(activeAgents);

            // Check for agent limit violations per PRD
            if (agentCount > 2) {
                console.error(`🚨 AGENT LIMIT EXCEEDED: ${agentCount}/2 agents active!`);
                console.log('Consider completing work or deactivating agents.');
            }

        } catch (error) {
            console.warn('⚠️ Error handling agent state change:', error.message);
        }
    }

    /**
     * Handle handoff queue changes
     * PRD Requirement: Handoff event recording and failed detection
     */
    async handleHandoffQueueChange(queueData) {
        try {
            const handoffs = queueData.handoffs || [];
            const pendingCount = queueData.pendingCount || 0;
            const failedCount = queueData.failedCount || 0;

            console.log(`📤 Handoff queue changed: ${handoffs.length} handoffs (${pendingCount} pending, ${failedCount} failed)`);

            // Update session with handoff data
            if (this.sessionManager && this.sessionManager.currentSession) {
                if (!this.sessionManager.currentSession.handoffs) {
                    this.sessionManager.currentSession.handoffs = {
                        active: [],
                        completed: [],
                        failed: [],
                        pending: [],
                        metrics: {}
                    };
                }

                this.sessionManager.currentSession.handoffs.active = handoffs.filter(h => 
                    ['initiated', 'acknowledged', 'in_progress'].includes(h.status)
                );
                
                this.sessionManager.currentSession.handoffs.pending = handoffs.filter(h => 
                    h.status === 'initiated'
                );

                this.sessionManager.currentSession.handoffs.failed = handoffs.filter(h => 
                    h.status === 'failed'
                );

                // Update metrics
                this.sessionManager.currentSession.handoffs.metrics = {
                    totalInitiated: handoffs.length,
                    totalCompleted: queueData.completedCount || 0,
                    totalFailed: failedCount,
                    acknowledgmentRate: queueData.acknowledgmentRate || 0,
                    averageCompletionTime: queueData.averageCompletionTime || 0
                };

                await this.sessionManager.saveActiveSession();
                console.log(`💾 Session updated with handoff data`);
            }

            // Alert on failed handoffs per PRD requirement
            if (failedCount > 0) {
                console.error(`❌ ${failedCount} handoff(s) have failed!`);
                console.log('Manual intervention may be required.');
            }

            // Check for timeout handoffs (30 seconds per PRD)
            await this.checkHandoffTimeouts(handoffs);

        } catch (error) {
            console.warn('⚠️ Error handling handoff queue change:', error.message);
        }
    }

    /**
     * Handle system status changes
     * PRD Requirement: Memory monitoring and alerts
     */
    async handleSystemStatusChange(statusData) {
        try {
            const memoryStatus = statusData.memoryStatus;
            
            if (!memoryStatus) return;

            console.log(`🖥️ System status update: Memory ${memoryStatus.heapUsedMB}MB (${memoryStatus.status})`);

            // Handle memory warnings per PRD thresholds
            if (memoryStatus.status === 'warning') {
                console.warn(`⚠️ MEMORY WARNING: ${memoryStatus.heapUsedMB}MB used (threshold: 2000MB)`);
                console.log('Consider running: npx mega-minds memory-cleanup');
                
                // Auto-cleanup if session manager available
                if (this.sessionManager) {
                    console.log('🧹 Initiating automatic memory cleanup...');
                    await this.sessionManager.forceMemoryCleanup();
                }
            } else if (memoryStatus.status === 'critical') {
                console.error(`🚨 CRITICAL MEMORY: ${memoryStatus.heapUsedMB}MB used (threshold: 3500MB)`);
                console.log('Emergency cleanup required!');
                
                if (this.sessionManager) {
                    console.log('🚨 Emergency memory cleanup initiated...');
                    await this.sessionManager.forceMemoryCleanup();
                    
                    // Force garbage collection if available
                    if (global.gc) {
                        global.gc();
                        console.log('🗑️ Forced garbage collection');
                    }
                }
            }

        } catch (error) {
            console.warn('⚠️ Error handling system status change:', error.message);
        }
    }

    /**
     * Handle work progress changes
     * PRD Requirement: Work progress monitoring
     */
    async handleWorkProgressChange(progressData) {
        try {
            const overallProgress = progressData.overallProgress || 0;
            const blockedItems = progressData.blockedItems || 0;

            console.log(`📊 Work progress update: ${overallProgress}% overall`);

            if (blockedItems > 0) {
                console.warn(`⚠️ ${blockedItems} work item(s) are blocked`);
                console.log('Consider escalating or providing assistance.');
            }

            // Update session with progress data
            if (this.sessionManager && this.sessionManager.currentSession) {
                if (!this.sessionManager.currentSession.progress) {
                    this.sessionManager.currentSession.progress = {};
                }

                this.sessionManager.currentSession.progress = {
                    overall: overallProgress,
                    agents: progressData.agents || {},
                    blockedCount: blockedItems,
                    lastUpdate: new Date().toISOString()
                };

                // Auto-save on significant progress changes
                if (overallProgress % 25 === 0 && overallProgress > 0) {
                    await this.sessionManager.saveActiveSession();
                    console.log(`💾 Session saved at ${overallProgress}% progress milestone`);
                }
            }

        } catch (error) {
            console.warn('⚠️ Error handling work progress change:', error.message);
        }
    }

    /**
     * Sync agent states with AgentStateTracker
     * @private
     */
    async syncAgentStateTracker(activeAgents) {
        if (!this.agentState) return;

        for (const [agentName, agentData] of Object.entries(activeAgents)) {
            try {
                // Check if agent is already tracked
                const currentStates = await this.agentState.getAllAgentStates();
                
                if (!currentStates[agentName]) {
                    // New agent, activate it
                    console.log(`🤖 Activating tracked agent: ${agentName}`);
                    await this.agentState.activateAgent(
                        agentName, 
                        agentData.currentTask || 'Unknown task',
                        agentData
                    );
                } else {
                    // Update existing agent
                    await this.agentState.updateAgentProgress(
                        agentName, 
                        agentData.progress || 0
                    );
                    
                    if (agentData.status) {
                        await this.agentState.updateAgentStatus(
                            agentName,
                            agentData.status,
                            agentData.currentTask
                        );
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Error syncing agent state for ${agentName}:`, error.message);
            }
        }
    }

    /**
     * Check for handoff timeouts per PRD requirement (30 seconds)
     * @private
     */
    async checkHandoffTimeouts(handoffs) {
        const now = Date.now();
        const timeoutMs = 30000; // 30 seconds per PRD

        for (const handoff of handoffs) {
            if (handoff.status === 'initiated' && !handoff.acknowledgmentReceived) {
                const handoffAge = now - new Date(handoff.timestamp).getTime();
                
                if (handoffAge > timeoutMs) {
                    console.error(`⏰ HANDOFF TIMEOUT: ${handoff.toAgent} has not acknowledged handoff ${handoff.id}`);
                    console.log(`Handoff from ${handoff.fromAgent} has been waiting for ${Math.round(handoffAge / 1000)} seconds`);
                    console.log('Consider manual intervention or re-initiating the handoff.');
                }
            }
        }
    }

    /**
     * Get monitoring status
     */
    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            monitoredFiles: Array.from(this.watchIntervals.keys()),
            stateDirectory: this.stateDir,
            pollInterval: this.pollInterval
        };
    }
}

module.exports = StateMonitor;