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

        // Update memory with session completion
        await this.memory.updateRecentWorkMemory(this.currentSession);

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

        console.log('🧹 Starting memory cleanup...');

        // Limit history arrays
        this.currentSession.agents.handoffHistory =
            this.currentSession.agents.handoffHistory.slice(-this.config.maxHistoryEntries);

        this.currentSession.agents.coordinationLog =
            this.currentSession.agents.coordinationLog.slice(-this.config.maxLogEntries);

        this.currentSession.memory.workCompleted =
            this.currentSession.memory.workCompleted.slice(-this.config.maxHistoryEntries);

        // Clear completed workflows from memory
        this.workflowState.activeWorkflows.clear();
        this.workflowState.handoffQueue =
            this.workflowState.handoffQueue.filter(h => h.status === 'initiated');

        await this.saveActiveSession();
        console.log('🧹 Session memory cleaned up');
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
}

module.exports = SessionManager;