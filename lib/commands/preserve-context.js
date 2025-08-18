// lib/commands/preserve-context.js
// Preserve critical context before Claude Code compacts memory

const fs = require('fs-extra');
const path = require('path');

/**
 * Context preservation handler for PreCompact hooks
 */
class ContextPreserver {
    constructor() {
        this.projectPath = process.cwd();
        this.logEnabled = false;
        this.preservationPath = path.join(this.projectPath, '.claude', 'preserved-context.json');
    }

    /**
     * Main execution function for context preservation
     */
    async run() {
        try {
            // Read hook input from stdin if available
            const hookInput = await this.readHookInput();
            
            this.log('info', 'Context preservation triggered', { 
                trigger: hookInput ? 'hook' : 'manual',
                hookType: hookInput?.hook_type || 'unknown'
            });

            console.log('🧠 Preserving context before compaction...');

            // Check if mega-minds is initialized
            if (!await this.isMegaMindsProject()) {
                console.log('ℹ️ Not a mega-minds project, skipping context preservation');
                return;
            }

            // Initialize AIDevTeam to access managers
            const AIDevTeam = require('../core/AIDevTeam');
            const team = new AIDevTeam(this.projectPath);
            await team.initialize();

            // Gather critical context data
            const contextData = await this.gatherCriticalContext(team, hookInput);

            // Save preserved context
            await this.savePreservedContext(contextData);

            // Trigger intelligent pre-compaction cleanup
            await this.performPreCompactionCleanup(team);

            console.log('✅ Context preservation completed');
            this.log('info', 'Context preservation completed', { 
                itemsPreserved: Object.keys(contextData).length 
            });

        } catch (error) {
            console.error('❌ Context preservation failed:', error.message);
            this.log('error', 'Context preservation failed', { error: error.message });
            
            // Don't exit with error for preservation failures
            // Just log and continue to avoid breaking compaction
        }
    }

    /**
     * Gather critical context that should be preserved
     */
    async gatherCriticalContext(team, hookInput) {
        const context = {
            timestamp: new Date().toISOString(),
            preservationReason: 'PreCompact hook triggered',
            hookInput: hookInput,
            criticalData: {}
        };

        try {
            // 1. Active session data
            if (team.sessions.currentSession) {
                context.criticalData.activeSession = {
                    sessionId: team.sessions.currentSession.sessionId,
                    description: team.sessions.currentSession.description,
                    startTime: team.sessions.currentSession.startTime,
                    currentPhase: team.sessions.currentSession.workflow?.currentPhase,
                    agentCount: Object.keys(team.sessions.currentSession.agents.activeAgents || {}).length
                };

                // Preserve active handoffs (most critical)
                if (team.sessions.currentSession.handoffs?.active?.length > 0) {
                    context.criticalData.activeHandoffs = team.sessions.currentSession.handoffs.active.map(handoff => ({
                        id: handoff.id,
                        fromAgent: handoff.fromAgent,
                        toAgent: handoff.toAgent,
                        status: handoff.status,
                        taskDescription: handoff.taskDescription,
                        timestamp: handoff.timestamp,
                        acknowledged: handoff.acknowledged
                    }));
                }

                // Preserve recent work (last 5 items)
                if (team.sessions.currentSession.memory?.workCompleted?.length > 0) {
                    context.criticalData.recentWork = team.sessions.currentSession.memory.workCompleted
                        .slice(-5)
                        .map(work => ({
                            description: work.description,
                            timestamp: work.timestamp,
                            agent: work.agent
                        }));
                }

                // Preserve key decisions (last 3)
                if (team.sessions.currentSession.memory?.keyDecisions?.length > 0) {
                    context.criticalData.keyDecisions = team.sessions.currentSession.memory.keyDecisions
                        .slice(-3)
                        .map(decision => ({
                            description: decision.description,
                            timestamp: decision.timestamp,
                            impact: decision.impact
                        }));
                }
            }

            // 2. Agent state information
            if (team.agentState) {
                const activeAgents = await team.agentState.getAllAgentStates();
                context.criticalData.agentStates = {};
                
                for (const [agentName, state] of Object.entries(activeAgents)) {
                    if (state.status === 'active' || state.status === 'working') {
                        context.criticalData.agentStates[agentName] = {
                            status: state.status,
                            currentTask: state.currentTask,
                            lastActivity: state.lastActivity,
                            dependencies: state.dependencies || []
                        };
                    }
                }
            }

            // 3. Current project context
            const projectMemory = await team.memory.getCurrentProjectContext();
            if (projectMemory) {
                context.criticalData.projectContext = {
                    architecture: projectMemory.architecture?.slice(0, 3) || [], // Last 3 arch decisions
                    recentWork: projectMemory.recentWork?.slice(-3) || [], // Last 3 work items
                    currentFocus: projectMemory.currentFocus || 'Unknown'
                };
            }

            // 4. Memory health status
            const memoryStatus = team.sessions.getMemoryStatus();
            context.criticalData.memoryHealth = {
                systemStatus: memoryStatus.system.status,
                heapUsedMB: memoryStatus.system.heapUsedMB,
                sessionHandoffs: memoryStatus.session?.handoffs || 0,
                sessionWorkItems: memoryStatus.session?.workItems || 0
            };

            this.log('info', 'Critical context gathered', { 
                sections: Object.keys(context.criticalData),
                activeHandoffs: context.criticalData.activeHandoffs?.length || 0,
                activeAgents: Object.keys(context.criticalData.agentStates || {}).length
            });

        } catch (error) {
            this.log('warning', 'Error gathering some context data', { error: error.message });
            context.criticalData.gatheringError = error.message;
        }

        return context;
    }

    /**
     * Save preserved context to file
     */
    async savePreservedContext(contextData) {
        try {
            // Ensure .claude directory exists
            await fs.ensureDir(path.dirname(this.preservationPath));

            // Load existing preserved contexts
            let existingContexts = [];
            if (await fs.pathExists(this.preservationPath)) {
                try {
                    existingContexts = await fs.readJSON(this.preservationPath);
                    if (!Array.isArray(existingContexts)) {
                        existingContexts = [existingContexts]; // Convert old format
                    }
                } catch (error) {
                    this.log('warning', 'Could not read existing preserved contexts', { error: error.message });
                    existingContexts = [];
                }
            }

            // Add new context (keep last 10 preservation snapshots)
            existingContexts.push(contextData);
            if (existingContexts.length > 10) {
                existingContexts = existingContexts.slice(-10);
            }

            // Save updated contexts
            await fs.writeJSON(this.preservationPath, existingContexts, { spaces: 2 });
            
            console.log(`💾 Context preserved to: ${path.relative(this.projectPath, this.preservationPath)}`);
            this.log('info', 'Context saved successfully', { 
                totalSnapshots: existingContexts.length,
                filePath: this.preservationPath
            });

        } catch (error) {
            this.log('error', 'Failed to save preserved context', { error: error.message });
            throw error;
        }
    }

    /**
     * Perform intelligent cleanup before compaction
     */
    async performPreCompactionCleanup(team) {
        try {
            this.log('info', 'Starting pre-compaction cleanup');
            console.log('🧹 Performing pre-compaction cleanup...');

            // Get current memory status
            const memoryStatus = team.sessions.getMemoryStatus();
            
            if (memoryStatus.system.status === 'critical') {
                console.log('🚨 Critical memory detected - performing aggressive cleanup');
                
                // Force aggressive cleanup while preserving handoffs
                await team.sessions.forceMemoryCleanup();
                
                // Additional cleanup for critical situations
                await this.performAggressiveCleanup(team);
                
            } else if (memoryStatus.system.status === 'warning') {
                console.log('⚠️ High memory usage - performing standard cleanup');
                
                // Standard cleanup
                await team.sessions.forceMemoryCleanup();
                
            } else {
                console.log('✅ Memory healthy - performing light optimization');
                
                // Light cleanup - just optimize existing data
                await this.performLightOptimization(team);
            }

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
                console.log('🗑️ Garbage collection completed');
            }

            // Show new memory status
            const newStatus = team.sessions.getMemoryStatus();
            console.log(`📊 Memory after cleanup: ${newStatus.system.heapUsedMB}MB (${newStatus.system.status})`);

        } catch (error) {
            this.log('warning', 'Pre-compaction cleanup failed', { error: error.message });
            console.log('⚠️ Pre-compaction cleanup had issues, but continuing...');
        }
    }

    /**
     * Perform aggressive cleanup for critical memory situations
     */
    async performAggressiveCleanup(team) {
        try {
            // Deactivate non-essential agents (keep orchestrator)
            const activeAgents = await team.agentState.getAllAgentStates();
            const agentNames = Object.keys(activeAgents);
            
            for (const agentName of agentNames) {
                if (agentName !== 'project-orchestrator-agent' && 
                    agentName !== 'project-orchestrator') {
                    
                    try {
                        await team.agentState.gracefulDeactivateAgent(
                            agentName,
                            'Pre-compaction memory cleanup',
                            { 
                                forceAfterTimeout: 2000,
                                preserveWork: true 
                            }
                        );
                        this.log('info', `Deactivated agent for cleanup: ${agentName}`);
                    } catch (error) {
                        this.log('warning', `Could not deactivate agent ${agentName}`, { error: error.message });
                    }
                }
            }

            // Aggressive session cleanup
            if (team.sessions.currentSession) {
                // Trim arrays more aggressively
                const session = team.sessions.currentSession;
                
                if (session.agents.handoffHistory) {
                    session.agents.handoffHistory = session.agents.handoffHistory.slice(-20);
                }
                
                if (session.agents.coordinationLog) {
                    session.agents.coordinationLog = session.agents.coordinationLog.slice(-30);
                }
                
                if (session.memory.workCompleted) {
                    session.memory.workCompleted = session.memory.workCompleted.slice(-25);
                }
            }

        } catch (error) {
            this.log('error', 'Aggressive cleanup failed', { error: error.message });
        }
    }

    /**
     * Perform light optimization for healthy memory
     */
    async performLightOptimization(team) {
        try {
            // Just compress context without aggressive measures
            if (team.tokens) {
                const context = await team.loadProjectContext();
                await team.tokens.manageContext(context, 'Pre-compaction optimization');
            }

        } catch (error) {
            this.log('warning', 'Light optimization failed', { error: error.message });
        }
    }

    /**
     * Check if this is a mega-minds enabled project
     */
    async isMegaMindsProject() {
        try {
            const claudeDir = path.join(this.projectPath, '.claude');
            return await fs.pathExists(claudeDir);
        } catch (error) {
            return false;
        }
    }

    /**
     * Read hook input from stdin (when called by Claude Code hooks)
     */
    async readHookInput() {
        return new Promise((resolve) => {
            if (process.stdin.isTTY) {
                resolve(null);
                return;
            }

            let input = '';
            process.stdin.on('data', (chunk) => {
                input += chunk;
            });

            process.stdin.on('end', () => {
                try {
                    const hookData = JSON.parse(input);
                    resolve(hookData);
                } catch (error) {
                    resolve(null);
                }
            });

            setTimeout(() => resolve(null), 1000);
        });
    }

    /**
     * Enable debug logging
     */
    enableLogging() {
        this.logEnabled = true;
    }

    /**
     * Log messages for debugging
     */
    log(level, message, data = {}) {
        if (!this.logEnabled) return;

        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ContextPreserver ${level.toUpperCase()}: ${message}`;
        
        if (Object.keys(data).length > 0) {
            console.log(logMessage, data);
        } else {
            console.log(logMessage);
        }
    }
}

/**
 * Main export function for CLI usage
 */
async function preserveContext() {
    const preserver = new ContextPreserver();
    
    // Enable logging if debug is set
    if (process.env.MEGA_MINDS_DEBUG || process.argv.includes('--debug')) {
        preserver.enableLogging();
    }

    await preserver.run();
}

module.exports = { preserveContext, ContextPreserver };