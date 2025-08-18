// lib/core/AgentStateBroadcaster.js
// Broadcasts agent state changes via file system for real-time monitoring
// Implements PRD Core Feature #1: Real-Time Agent Coordination

const fs = require('fs-extra');
const path = require('path');

/**
 * Broadcasts agent state changes via file system
 * Creates a communication channel between Claude Code and mega-minds
 * Per PRD: Enable seamless communication and handoff tracking between AI agents
 */
class AgentStateBroadcaster {
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.stateDir = path.join(projectPath, '.mega-minds', 'state');
        this.agentStateFile = path.join(this.stateDir, 'active-agents.json');
        this.handoffQueueFile = path.join(this.stateDir, 'handoff-queue.json');
        this.systemStateFile = path.join(this.stateDir, 'system-status.json');
        this.workProgressFile = path.join(this.stateDir, 'work-progress.json');
    }

    /**
     * Initialize the state broadcasting system
     */
    async initialize() {
        await fs.ensureDir(this.stateDir);
        
        // Initialize state files with default data
        await this.updateAgentState({});
        await this.updateHandoffQueue([]);
        await this.updateSystemState({
            status: 'healthy',
            memoryUsage: process.memoryUsage(),
            timestamp: new Date().toISOString()
        });
        await this.updateWorkProgress({});
        
        console.log('📡 Agent State Broadcaster initialized');
        console.log(`📁 State files location: ${this.stateDir}`);
    }

    /**
     * Broadcast current agent states to file system
     * PRD Requirement: Agent activation/deactivation tracking with timestamps
     */
    async updateAgentState(activeAgents) {
        const stateData = {
            timestamp: new Date().toISOString(),
            activeAgents: activeAgents,
            totalActiveCount: Object.keys(activeAgents).length,
            agentList: Object.keys(activeAgents),
            lastUpdate: new Date().toISOString(),
            // Add agent workload information per PRD
            workloadSummary: this.calculateWorkloadSummary(activeAgents)
        };

        await fs.writeJSON(this.agentStateFile, stateData, { spaces: 2 });
        console.log(`📡 Agent state broadcast: ${Object.keys(activeAgents).length} active agents`);
        
        // Warn if approaching agent limit per PRD memory management
        if (stateData.totalActiveCount >= 2) {
            console.warn(`⚠️ Agent limit reached (${stateData.totalActiveCount}/2). Consider completing work before activating more agents.`);
        }
        
        return stateData;
    }

    /**
     * Broadcast handoff queue changes
     * PRD Requirement: Handoff event recording with complete audit trail
     */
    async updateHandoffQueue(handoffs) {
        const queueData = {
            timestamp: new Date().toISOString(),
            handoffs: handoffs,
            queueLength: handoffs.length,
            pendingCount: handoffs.filter(h => h.status === 'initiated').length,
            acknowledgedCount: handoffs.filter(h => h.status === 'acknowledged').length,
            inProgressCount: handoffs.filter(h => h.status === 'in_progress').length,
            completedCount: handoffs.filter(h => h.status === 'completed').length,
            failedCount: handoffs.filter(h => h.status === 'failed').length,
            // Calculate acknowledgment rate per PRD metrics
            acknowledgmentRate: this.calculateAcknowledgmentRate(handoffs),
            averageCompletionTime: this.calculateAverageCompletionTime(handoffs)
        };

        await fs.writeJSON(this.handoffQueueFile, queueData, { spaces: 2 });
        console.log(`📤 Handoff queue broadcast: ${handoffs.length} total handoffs`);
        
        // Alert on failed handoffs per PRD requirement (30-second detection)
        if (queueData.failedCount > 0) {
            console.warn(`⚠️ ${queueData.failedCount} failed handoff(s) detected`);
        }
        
        return queueData;
    }

    /**
     * Broadcast system status (memory, performance, etc.)
     * PRD Requirement: Real-time memory monitoring with configurable thresholds
     */
    async updateSystemState(systemInfo) {
        const memoryStatus = this.getMemoryStatus();
        const statusData = {
            timestamp: new Date().toISOString(),
            ...systemInfo,
            memoryStatus: memoryStatus,
            performanceMetrics: await this.getPerformanceMetrics(),
            // Add session info per PRD
            sessionActive: await this.checkSessionActive(),
            systemHealth: this.calculateSystemHealth(memoryStatus)
        };

        await fs.writeJSON(this.systemStateFile, statusData, { spaces: 2 });
        
        // Trigger warnings per PRD thresholds
        if (memoryStatus.status === 'warning') {
            console.warn(`⚠️ Memory warning: ${memoryStatus.heapUsedMB}MB used (threshold: 2000MB)`);
        } else if (memoryStatus.status === 'critical') {
            console.error(`🚨 CRITICAL memory: ${memoryStatus.heapUsedMB}MB used (threshold: 3500MB)`);
        }
        
        return statusData;
    }

    /**
     * Broadcast work progress updates
     * PRD Requirement: Work progress monitoring with status updates
     */
    async updateWorkProgress(progressData) {
        const workData = {
            timestamp: new Date().toISOString(),
            agents: progressData,
            overallProgress: this.calculateOverallProgress(progressData),
            activeWorkItems: Object.keys(progressData).length,
            completedItems: Object.values(progressData).filter(p => p.progress === 100).length,
            blockedItems: Object.values(progressData).filter(p => p.status === 'blocked').length
        };

        await fs.writeJSON(this.workProgressFile, workData, { spaces: 2 });
        console.log(`📊 Work progress broadcast: ${workData.overallProgress}% overall`);
        
        return workData;
    }

    /**
     * Get current memory status with thresholds from PRD
     */
    getMemoryStatus() {
        const usage = process.memoryUsage();
        const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
        
        // PRD thresholds: Warning at 2GB, Critical at 3.5GB
        return {
            heapUsedMB,
            heapTotalMB,
            heapPercentage: Math.round((heapUsedMB / heapTotalMB) * 100),
            status: heapUsedMB > 3500 ? 'critical' : 
                    heapUsedMB > 2000 ? 'warning' : 'healthy',
            timestamp: new Date().toISOString(),
            thresholds: {
                warning: 2000,
                critical: 3500
            }
        };
    }

    /**
     * Get performance metrics for monitoring
     */
    async getPerformanceMetrics() {
        const startTime = process.hrtime();
        
        // Simple performance check
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const elapsed = process.hrtime(startTime);
        const responseTime = elapsed[0] * 1000 + elapsed[1] / 1000000; // Convert to ms
        
        return {
            responseTime,
            handoffProcessingTime: 0, // To be implemented with actual handoff processing
            agentResponseTime: 0,     // To be implemented with agent metrics
            systemLoad: process.cpuUsage(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Calculate workload summary for active agents
     * @private
     */
    calculateWorkloadSummary(activeAgents) {
        const summary = {
            light: 0,
            medium: 0,
            heavy: 0
        };

        for (const agent of Object.values(activeAgents)) {
            const workload = agent.workload || 'medium';
            summary[workload]++;
        }

        return summary;
    }

    /**
     * Calculate acknowledgment rate for handoffs
     * @private
     */
    calculateAcknowledgmentRate(handoffs) {
        if (handoffs.length === 0) return 0;
        
        const acknowledged = handoffs.filter(h => 
            h.acknowledgmentReceived || h.status === 'acknowledged' || 
            h.status === 'in_progress' || h.status === 'completed'
        ).length;
        
        return Math.round((acknowledged / handoffs.length) * 100);
    }

    /**
     * Calculate average completion time for handoffs
     * @private
     */
    calculateAverageCompletionTime(handoffs) {
        const completed = handoffs.filter(h => h.status === 'completed' && h.completionTime);
        
        if (completed.length === 0) return 0;
        
        const totalTime = completed.reduce((sum, h) => {
            const start = new Date(h.timestamp);
            const end = new Date(h.completionTime);
            return sum + (end - start);
        }, 0);
        
        return Math.round(totalTime / completed.length / 1000); // Return in seconds
    }

    /**
     * Calculate overall progress from individual agent progress
     * @private
     */
    calculateOverallProgress(progressData) {
        const agents = Object.values(progressData);
        if (agents.length === 0) return 0;
        
        const totalProgress = agents.reduce((sum, agent) => sum + (agent.progress || 0), 0);
        return Math.round(totalProgress / agents.length);
    }

    /**
     * Check if a session is currently active
     * @private
     */
    async checkSessionActive() {
        const sessionFile = path.join(this.projectPath, '.mega-minds', 'sessions', 'active-session.json');
        return await fs.pathExists(sessionFile);
    }

    /**
     * Calculate overall system health
     * @private
     */
    calculateSystemHealth(memoryStatus) {
        if (memoryStatus.status === 'critical') return 'critical';
        if (memoryStatus.status === 'warning') return 'degraded';
        return 'healthy';
    }

    /**
     * Get all current state data for dashboard or monitoring
     */
    async getAllStateData() {
        const [agentState, handoffQueue, systemState, workProgress] = await Promise.all([
            fs.pathExists(this.agentStateFile) ? fs.readJSON(this.agentStateFile) : {},
            fs.pathExists(this.handoffQueueFile) ? fs.readJSON(this.handoffQueueFile) : {},
            fs.pathExists(this.systemStateFile) ? fs.readJSON(this.systemStateFile) : {},
            fs.pathExists(this.workProgressFile) ? fs.readJSON(this.workProgressFile) : {}
        ]);

        return {
            agents: agentState,
            handoffs: handoffQueue,
            system: systemState,
            progress: workProgress,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = AgentStateBroadcaster;