// lib/memory/AgentStateTracker.js
const fs = require('fs-extra');
const path = require('path');

/**
 * AgentStateTracker - Tracks what agents are doing, their progress, and coordination state
 * This enables the AI dev team to know who's working on what and coordinate handoffs
 */
class AgentStateTracker {
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.memoryPath = path.join(projectPath, '.mega-minds');
        this.agentStateFile = path.join(this.memoryPath, 'agents', 'state.json');
        this.agentHistoryFile = path.join(this.memoryPath, 'agents', 'history.json');

        this.initializeAgentState();
    }

    async initializeAgentState() {
        await fs.ensureDir(path.join(this.memoryPath, 'agents'));

        // Initialize empty state if doesn't exist
        if (!await fs.pathExists(this.agentStateFile)) {
            await this.saveAgentState({
                activeAgents: {},
                completedTasks: [],
                handoffQueue: [],
                lastUpdate: new Date().toISOString()
            });
        }
    }
    /**
     * Initialize the agent state system
     */
    async initialize() {
        await this.initializeAgentState(); // Use existing method
        console.log('🤖 Agent state tracking initialized');
    }

    /**
     * Get all current agent states
     */
    async getAllAgentStates() {
        const state = await this.loadAgentState();
        return state.activeAgents || {};
    }

    /**
     * Restore a single agent state
     * @param {string} agentName - Name of the agent
     * @param {object} agentData - Agent state data to restore
     */
    async restoreAgentState(agentName, agentData) {
        const state = await this.loadAgentState();
        
        // Restore the agent with the provided data
        state.activeAgents[agentName] = {
            ...agentData,
            status: agentData.status || 'active',
            lastUpdate: new Date().toISOString(),
            restored: true
        };
        
        state.lastUpdate = new Date().toISOString();
        await this.saveAgentState(state);
        
        console.log(`🔄 Restored agent state: ${agentName}`);
    }

    /**
     * Restore agent states from a previous session
     */
    async restoreFromSession(sessionData) {
        if (sessionData && sessionData.agentStates) {
            const currentState = await this.loadAgentState();

            // Merge session agent states with current state
            currentState.activeAgents = {
                ...currentState.activeAgents,
                ...sessionData.agentStates
            };

            await this.saveAgentState(currentState);
            console.log('🔄 Agent states restored from previous session');
        }
    }
    async activateAgent(agentName, task, context = {}) {
        const state = await this.loadAgentState();

        // CRITICAL: Check current active agent count
        const currentActiveCount = Object.keys(state.activeAgents).length;
        const MAX_AGENTS = 2; // Hard-coded safety limit

        if (currentActiveCount >= MAX_AGENTS) {
            throw new Error(`🚨 AGENT LIMIT REACHED: Cannot activate ${agentName}. Currently ${currentActiveCount}/${MAX_AGENTS} agents active. Deactivate agents first or save session.`);
        }

        state.activeAgents[agentName] = {
            taskId: this.generateTaskId(),
            task: task,
            status: 'active',
            startTime: new Date().toISOString(),
            context: context,
            progress: 0,
            blockedOn: null,
            dependencies: context.dependencies || [],
            estimatedCompletion: context.estimatedCompletion || null
        };

        state.lastUpdate = new Date().toISOString();
        await this.saveAgentState(state);

        console.log(`🤖 ${agentName} activated for: ${task} (${currentActiveCount + 1}/${MAX_AGENTS} active)`);
        return state.activeAgents[agentName].taskId;
    }
    /**
     * ENHANCED: Force deactivate agent to free memory - now with handoff handling
     */
    async forceDeactivateAgent(agentName, reason = "Memory limit enforcement", options = {}) {
        const {
            handleHandoffsFirst = true,
            maxHandoffWaitTime = 10000, // 10 seconds for force mode
            preserveWork = true
        } = options;

        console.log(`🚨 Force deactivating ${agentName}: ${reason}`);

        // First attempt: Try graceful deactivation with short timeout if handoff handling enabled
        if (handleHandoffsFirst) {
            console.log(`⏳ Attempting quick handoff resolution before force deactivation...`);
            
            try {
                const gracefulResult = await this.gracefulDeactivateAgent(agentName, reason, {
                    forceAfterTimeout: maxHandoffWaitTime,
                    waitForHandoffs: true,
                    transferToAgent: null, // Don't transfer in force mode
                    preserveWork: preserveWork
                });

                if (gracefulResult.success) {
                    console.log(`✅ Force deactivation completed gracefully for ${agentName}`);
                    return {
                        success: true,
                        method: 'graceful',
                        handoffsSummary: gracefulResult.handoffsSummary,
                        message: `${agentName} force deactivated gracefully`
                    };
                }
                
                console.log(`⚠️ Graceful deactivation failed, proceeding with immediate force deactivation`);
            } catch (error) {
                console.warn(`⚠️ Graceful deactivation attempt failed:`, error.message);
            }
        }

        // Force deactivation: Handle handoffs abruptly
        const dependencyCheck = await this.checkAgentHandoffDependencies(agentName);
        
        if (dependencyCheck.pendingHandoffs.length > 0) {
            console.log(`🚨 Force deactivating ${agentName} with ${dependencyCheck.pendingHandoffs.length} pending handoffs`);
            await this.forceCompleteHandoffs(agentName, dependencyCheck.pendingHandoffs, reason);
        }

        // Preserve work if requested
        if (preserveWork) {
            await this.preserveAgentWork(agentName, `Force deactivation: ${reason}`);
        }

        // Perform immediate deactivation
        const state = await this.loadAgentState();

        if (state.activeAgents[agentName]) {
            const completedTask = {
                ...state.activeAgents[agentName],
                endTime: new Date().toISOString(),
                completionReason: reason,
                status: 'force_completed',
                handoffsSummary: {
                    blocking: dependencyCheck.blockingHandoffs.length,
                    orphaned: dependencyCheck.orphanedHandoffs.length,
                    total: dependencyCheck.pendingHandoffs.length,
                    forceClosed: dependencyCheck.pendingHandoffs.length
                }
            };

            state.completedTasks.push(completedTask);
            delete state.activeAgents[agentName];

            state.lastUpdate = new Date().toISOString();
            await this.saveAgentState(state);

            console.log(`⚠️ Force deactivated ${agentName}: ${reason}`);
            return {
                success: true,
                method: 'force',
                handoffsSummary: completedTask.handoffsSummary,
                message: `${agentName} force deactivated immediately with ${dependencyCheck.pendingHandoffs.length} handoffs closed`
            };
        }

        return {
            success: false,
            method: 'none',
            message: `${agentName} was not in active state`
        };
    }

    /**
     * Force complete all handoffs for an agent during emergency deactivation
     * @param {string} agentName - Name of the agent being deactivated
     * @param {array} handoffs - List of handoffs to force complete
     * @param {string} reason - Reason for force completion
     */
    async forceCompleteHandoffs(agentName, handoffs, reason) {
        console.log(`🚨 Force completing ${handoffs.length} handoffs for ${agentName}`);
        
        const state = await this.loadAgentState();
        
        for (const handoff of handoffs) {
            try {
                // Handle different handoff states
                if (handoff.toAgent === agentName) {
                    // Incoming handoff - force complete it
                    if (!handoff.acknowledgmentReceived) {
                        await this.recordHandoffAcknowledged(handoff.id, agentName, {
                            understoodRequirements: ['Auto-acknowledged during force deactivation'],
                            concerns: ['Agent being force deactivated']
                        });
                    }
                    
                    if (!handoff.workStarted) {
                        await this.recordHandoffWorkStarted(handoff.id, agentName);
                    }
                    
                    if (!handoff.completed) {
                        await this.recordHandoffCompleted(handoff.id, agentName, {
                            summary: `Force completed due to agent deactivation: ${reason}`,
                            deliverables: ['Work interrupted - see preserved agent state'],
                            nextSteps: ['Review interrupted work', 'Reassign to appropriate agent'],
                            qualityGatesPassed: false,
                            nextAgentRecommendation: 'project-orchestrator-agent'
                        });
                    }
                    
                } else if (handoff.fromAgent === agentName) {
                    // Outgoing handoff - mark as cancelled
                    const handoffIndex = state.handoffEvents.findIndex(event => event.id === handoff.id);
                    if (handoffIndex !== -1) {
                        state.handoffEvents[handoffIndex].status = 'force_cancelled';
                        state.handoffEvents[handoffIndex].cancellationReason = `Source agent force deactivated: ${reason}`;
                        state.handoffEvents[handoffIndex].cancellationTimestamp = new Date().toISOString();
                    }
                }
                
                console.log(`🚨 Force processed handoff ${handoff.id}`);
                
            } catch (error) {
                console.error(`❌ Error force completing handoff ${handoff.id}:`, error.message);
                
                // Mark as failed if we can't complete it
                const handoffIndex = state.handoffEvents.findIndex(event => event.id === handoff.id);
                if (handoffIndex !== -1) {
                    state.handoffEvents[handoffIndex].status = 'failed';
                    state.handoffEvents[handoffIndex].failureReason = `Force deactivation error: ${error.message}`;
                    state.handoffEvents[handoffIndex].failureTimestamp = new Date().toISOString();
                }
            }
        }

        await this.saveAgentState(state);
    }
    /**
     * Update agent progress and status
     */
    async updateAgentProgress(agentName, progress, status = 'active', blockedOn = null) {
        const state = await this.loadAgentState();

        if (state.activeAgents[agentName]) {
            state.activeAgents[agentName].progress = progress;
            state.activeAgents[agentName].status = status;
            state.activeAgents[agentName].blockedOn = blockedOn;
            state.activeAgents[agentName].lastUpdate = new Date().toISOString();

            if (status === 'blocked' && blockedOn) {
                console.log(`⚠️ ${agentName} blocked on: ${blockedOn}`);
            }
        }

        state.lastUpdate = new Date().toISOString();
        await this.saveAgentState(state);
    }

    /**
     * Update agent status and current task description
     * @param {string} agentName - Name of the agent
     * @param {string} status - Agent status (active, blocked, completed, etc.)
     * @param {string} currentTask - Current task description
     */
    async updateAgentStatus(agentName, status = 'active', currentTask = null) {
        const state = await this.loadAgentState();

        if (state.activeAgents[agentName]) {
            state.activeAgents[agentName].status = status;
            if (currentTask) {
                state.activeAgents[agentName].task = currentTask;
                state.activeAgents[agentName].currentTask = currentTask;
            }
            state.activeAgents[agentName].lastUpdate = new Date().toISOString();

            console.log(`🔄 Updated ${agentName} status to "${status}"`);
            if (currentTask) {
                console.log(`📋 Task: ${currentTask}`);
            }
        } else {
            console.warn(`⚠️ Agent ${agentName} not found in active agents`);
        }

        state.lastUpdate = new Date().toISOString();
        await this.saveAgentState(state);
    }

    /**
     * Complete an agent's task and prepare for handoff
     */
    async completeAgentTask(agentName, result, nextAgent = null) {
        const state = await this.loadAgentState();

        if (state.activeAgents[agentName]) {
            const completedTask = {
                ...state.activeAgents[agentName],
                status: 'completed',
                endTime: new Date().toISOString(),
                result: result,
                nextAgent: nextAgent
            };

            // Move to completed tasks
            state.completedTasks.push(completedTask);

            // Remove from active agents
            delete state.activeAgents[agentName];

            // Add to handoff queue if next agent specified
            if (nextAgent) {
                state.handoffQueue.push({
                    from: agentName,
                    to: nextAgent,
                    task: result.nextTask || 'Continue from previous work',
                    context: result.handoffContext || {},
                    priority: result.priority || 'normal',
                    createdAt: new Date().toISOString()
                });
            }

            state.lastUpdate = new Date().toISOString();
            await this.saveAgentState(state);

            console.log(`✅ ${agentName} completed task: ${completedTask.task}`);
            if (nextAgent) {
                console.log(`🔄 Handoff queued to ${nextAgent}`);
            }
        }
    }

    /**
     * Get next handoff from queue
     */
    async getNextHandoff() {
        const state = await this.loadAgentState();

        if (state.handoffQueue.length > 0) {
            // Sort by priority and creation time
            state.handoffQueue.sort((a, b) => {
                const priorityOrder = { urgent: 3, high: 2, normal: 1, low: 0 };
                const aPriority = priorityOrder[a.priority] || 1;
                const bPriority = priorityOrder[b.priority] || 1;

                if (aPriority !== bPriority) {
                    return bPriority - aPriority; // Higher priority first
                }

                return new Date(a.createdAt) - new Date(b.createdAt); // Older first for same priority
            });

            const nextHandoff = state.handoffQueue.shift();
            await this.saveAgentState(state);

            return nextHandoff;
        }

        return null;
    }

    /**
     * Get current agent workload and availability
     */
    async getAgentWorkload() {
        const state = await this.loadAgentState();
        const workload = {};

        // Analyze active agents
        for (const [agentName, agentState] of Object.entries(state.activeAgents)) {
            workload[agentName] = {
                status: agentState.status,
                currentTask: agentState.task,
                progress: agentState.progress,
                blockedOn: agentState.blockedOn,
                workingTime: this.calculateWorkingTime(agentState.startTime),
                availability: agentState.status === 'blocked' ? 'blocked' : 'busy'
            };
        }

        // Find available agents (not in active list)
        const allAgents = this.getAllKnownAgents();
        for (const agentName of allAgents) {
            if (!workload[agentName]) {
                workload[agentName] = {
                    status: 'available',
                    currentTask: null,
                    progress: 0,
                    blockedOn: null,
                    workingTime: 0,
                    availability: 'available'
                };
            }
        }

        return workload;
    }

    /**
     * Get agent performance metrics
     */
    async getAgentMetrics(timeRange = '7d') {
        const state = await this.loadAgentState();
        const history = await this.loadAgentHistory();

        const metrics = {
            totalTasks: state.completedTasks.length,
            averageCompletionTime: this.calculateAverageCompletionTime(state.completedTasks),
            tasksByAgent: this.groupTasksByAgent(state.completedTasks),
            handoffEfficiency: this.calculateHandoffEfficiency(state.completedTasks),
            blockedTime: this.calculateBlockedTime(history, timeRange)
        };

        return metrics;
    }

    /**
     * Generate task execution report
     */
    async generateStatusReport() {
        const state = await this.loadAgentState();
        const workload = await this.getAgentWorkload();
        const metrics = await this.getAgentMetrics();

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                activeAgents: Object.keys(state.activeAgents).length,
                pendingHandoffs: state.handoffQueue.length,
                completedTasks: state.completedTasks.length,
                blockedAgents: Object.values(workload).filter(a => a.availability === 'blocked').length
            },
            activeWork: state.activeAgents,
            upcomingHandoffs: state.handoffQueue.slice(0, 5), // Next 5 handoffs
            recentCompletions: state.completedTasks.slice(-10), // Last 10 completed tasks
            metrics: metrics
        };

        return report;
    }

    // Private helper methods
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    calculateWorkingTime(startTime) {
        const start = new Date(startTime);
        const now = new Date();
        return Math.round((now - start) / (1000 * 60)); // Minutes
    }

    getAllKnownAgents() {
        // Return list of all agents from your project structure
        return [
            'project-orchestrator-agent',
            'requirements-analysis-agent',
            'market-research-agent',
            'risk-assessment-agent',
            'technical-architecture-agent',
            'ux-ui-design-agent',
            'database-schema-agent',
            'api-design-agent',
            'security-architecture-agent',
            'frontend-development-agent',
            'backend-development-agent',
            'database-agent',
            'authentication-agent',
            'testing-agent',
            'code-review-agent',
            'performance-testing-agent',
            'security-testing-agent',
            'ci-cd-pipeline-agent',
            'infrastructure-agent',
            'monitoring-agent',
            'backup-recovery-agent'
        ];
    }

    calculateAverageCompletionTime(tasks) {
        if (tasks.length === 0) return 0;

        const totalTime = tasks.reduce((acc, task) => {
            if (task.startTime && task.endTime) {
                const duration = new Date(task.endTime) - new Date(task.startTime);
                return acc + duration;
            }
            return acc;
        }, 0);

        return Math.round(totalTime / tasks.length / (1000 * 60)); // Average minutes
    }

    groupTasksByAgent(tasks) {
        const grouped = {};
        tasks.forEach(task => {
            const agentName = task.agent || 'unknown';
            if (!grouped[agentName]) {
                grouped[agentName] = [];
            }
            grouped[agentName].push(task);
        });
        return grouped;
    }

    calculateHandoffEfficiency(tasks) {
        const handoffs = tasks.filter(task => task.nextAgent);
        const successfulHandoffs = handoffs.filter(task =>
            tasks.some(nextTask => nextTask.previousAgent === task.nextAgent)
        );

        return handoffs.length > 0 ? (successfulHandoffs.length / handoffs.length) * 100 : 100;
    }

    calculateBlockedTime(history, timeRange) {
        // Implementation would analyze agent history for blocked time
        // This is a simplified version
        return 0;
    }

    async loadAgentState() {
        try {
            const data = await fs.readFile(this.agentStateFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return {
                activeAgents: {},
                completedTasks: [],
                handoffQueue: [],
                lastUpdate: new Date().toISOString()
            };
        }
    }

    async saveAgentState(state) {
        await fs.writeFile(this.agentStateFile, JSON.stringify(state, null, 2));
    }

    async loadAgentHistory() {
        try {
            const data = await fs.readFile(this.agentHistoryFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return { events: [] };
        }
    }

    async saveAgentHistory(history) {
        await fs.writeFile(this.agentHistoryFile, JSON.stringify(history, null, 2));
    }

    /**
     * Archive old completed tasks to history
     */
    async archiveOldTasks(maxTasks = 100) {
        const state = await this.loadAgentState();

        if (state.completedTasks.length > maxTasks) {
            const history = await this.loadAgentHistory();
            const tasksToArchive = state.completedTasks.splice(0, state.completedTasks.length - maxTasks);

            history.events.push({
                type: 'task_archive',
                timestamp: new Date().toISOString(),
                archivedTasks: tasksToArchive
            });

            await this.saveAgentHistory(history);
            await this.saveAgentState(state);

            console.log(`📦 Archived ${tasksToArchive.length} old tasks to history`);
        }
    }

    // ===== NEW SMART AGENT DEACTIVATION METHODS =====

    /**
     * Check if an agent has pending handoff dependencies that would block deactivation
     * @param {string} agentName - Name of the agent to check
     * @returns {object} Dependency check result with blocking handoffs
     */
    async checkAgentHandoffDependencies(agentName) {
        const state = await this.loadAgentState();
        
        if (!state.handoffEvents) {
            return {
                canDeactivate: true,
                blockingHandoffs: [],
                pendingHandoffs: [],
                warnings: []
            };
        }

        const activeHandoffs = state.handoffEvents.filter(event => 
            !event.completed && event.status !== 'failed'
        );

        // Find handoffs where this agent is the source (initiated by this agent)
        const outgoingHandoffs = activeHandoffs.filter(event => 
            event.fromAgent === agentName
        );

        // Find handoffs where this agent is the target (received by this agent)
        const incomingHandoffs = activeHandoffs.filter(event => 
            event.toAgent === agentName
        );

        // Find handoffs that would be orphaned if this agent deactivates
        const orphanedHandoffs = activeHandoffs.filter(event => 
            event.fromAgent === agentName && !event.acknowledgmentReceived
        );

        const blockingHandoffs = [];
        const warnings = [];

        // Critical blocking conditions
        if (incomingHandoffs.some(h => h.acknowledgmentReceived && !h.workStarted)) {
            const acknowledgedButNotStarted = incomingHandoffs.filter(h => 
                h.acknowledgmentReceived && !h.workStarted
            );
            blockingHandoffs.push(...acknowledgedButNotStarted);
            warnings.push(`Agent has ${acknowledgedButNotStarted.length} acknowledged handoffs not yet started`);
        }

        if (incomingHandoffs.some(h => h.workStarted && !h.completed)) {
            const inProgressHandoffs = incomingHandoffs.filter(h => 
                h.workStarted && !h.completed
            );
            blockingHandoffs.push(...inProgressHandoffs);
            warnings.push(`Agent has ${inProgressHandoffs.length} handoffs in progress`);
        }

        // Warn about orphaned outgoing handoffs
        if (orphanedHandoffs.length > 0) {
            warnings.push(`Deactivating will orphan ${orphanedHandoffs.length} unacknowledged outgoing handoffs`);
        }

        return {
            canDeactivate: blockingHandoffs.length === 0,
            blockingHandoffs: blockingHandoffs,
            pendingHandoffs: [...incomingHandoffs, ...outgoingHandoffs],
            orphanedHandoffs: orphanedHandoffs,
            warnings: warnings,
            summary: {
                incoming: incomingHandoffs.length,
                outgoing: outgoingHandoffs.length,
                acknowledged: incomingHandoffs.filter(h => h.acknowledgmentReceived).length,
                inProgress: incomingHandoffs.filter(h => h.workStarted).length
            }
        };
    }

    /**
     * Gracefully deactivate an agent after checking and handling handoff dependencies
     * @param {string} agentName - Name of the agent to deactivate
     * @param {string} reason - Reason for deactivation
     * @param {object} options - Deactivation options
     * @returns {object} Deactivation result
     */
    async gracefulDeactivateAgent(agentName, reason = "Graceful deactivation", options = {}) {
        const {
            forceAfterTimeout = 30000, // 30 seconds default timeout
            waitForHandoffs = true,
            transferToAgent = null,
            preserveWork = true
        } = options;

        console.log(`🔄 Starting graceful deactivation of ${agentName}...`);

        // Check handoff dependencies
        const dependencyCheck = await this.checkAgentHandoffDependencies(agentName);
        
        if (!dependencyCheck.canDeactivate && waitForHandoffs) {
            console.log(`⚠️ ${agentName} has blocking handoff dependencies:`);
            dependencyCheck.warnings.forEach(warning => console.log(`  - ${warning}`));
            
            if (dependencyCheck.blockingHandoffs.length > 0) {
                // Attempt to complete blocking handoffs gracefully
                const completionResults = await this.attemptHandoffCompletion(
                    agentName, 
                    dependencyCheck.blockingHandoffs,
                    forceAfterTimeout
                );
                
                if (!completionResults.allCompleted) {
                    return {
                        success: false,
                        reason: 'Handoff dependencies could not be resolved',
                        blockingHandoffs: completionResults.remainingHandoffs,
                        message: `Cannot gracefully deactivate ${agentName}. ${completionResults.remainingHandoffs.length} handoffs still blocking.`
                    };
                }
            }
        }

        // Handle orphaned outgoing handoffs
        if (dependencyCheck.orphanedHandoffs.length > 0) {
            await this.handleOrphanedHandoffs(agentName, dependencyCheck.orphanedHandoffs, transferToAgent);
        }

        // Preserve agent work if requested
        if (preserveWork) {
            await this.preserveAgentWork(agentName, reason);
        }

        // Perform the actual deactivation
        const state = await this.loadAgentState();
        
        if (state.activeAgents[agentName]) {
            const completedTask = {
                ...state.activeAgents[agentName],
                endTime: new Date().toISOString(),
                completionReason: reason,
                status: 'gracefully_deactivated',
                handoffsSummary: {
                    blocking: dependencyCheck.blockingHandoffs.length,
                    orphaned: dependencyCheck.orphanedHandoffs.length,
                    total: dependencyCheck.pendingHandoffs.length
                }
            };

            state.completedTasks.push(completedTask);
            delete state.activeAgents[agentName];

            state.lastUpdate = new Date().toISOString();
            await this.saveAgentState(state);

            console.log(`✅ ${agentName} gracefully deactivated: ${reason}`);
            
            return {
                success: true,
                reason: reason,
                handoffsSummary: completedTask.handoffsSummary,
                message: `Successfully deactivated ${agentName} after handling dependencies`
            };
        }

        return {
            success: false,
            reason: 'Agent was not active',
            message: `${agentName} was not in active state`
        };
    }

    /**
     * Attempt to complete blocking handoffs within a timeout period
     * @param {string} agentName - Name of the agent
     * @param {array} blockingHandoffs - List of blocking handoffs
     * @param {number} timeoutMs - Timeout in milliseconds
     * @returns {object} Completion attempt result
     */
    async attemptHandoffCompletion(agentName, blockingHandoffs, timeoutMs = 30000) {
        console.log(`⏳ Attempting to complete ${blockingHandoffs.length} blocking handoffs for ${agentName} (timeout: ${timeoutMs}ms)`);
        
        const startTime = Date.now();
        const remainingHandoffs = [...blockingHandoffs];

        // Try to complete each handoff
        for (const handoff of blockingHandoffs) {
            const elapsed = Date.now() - startTime;
            if (elapsed >= timeoutMs) {
                console.log(`⏰ Timeout reached while completing handoffs for ${agentName}`);
                break;
            }

            try {
                // If handoff is acknowledged but work not started, try to start it
                if (handoff.acknowledgmentReceived && !handoff.workStarted) {
                    await this.recordHandoffWorkStarted(handoff.id, agentName);
                    console.log(`🔄 Auto-started work on handoff ${handoff.id}`);
                }

                // If work is in progress, attempt quick completion with minimal deliverables
                if (handoff.workStarted && !handoff.completed) {
                    await this.recordHandoffCompleted(handoff.id, agentName, {
                        summary: `Handoff completed during graceful deactivation: ${agentName}`,
                        deliverables: ['Work preserved in agent state'],
                        nextSteps: ['Review preserved work', 'Continue with next agent'],
                        qualityGatesPassed: false, // Mark as not fully quality checked
                        nextAgentRecommendation: null
                    });
                    console.log(`✅ Auto-completed handoff ${handoff.id} for graceful deactivation`);
                    
                    // Remove from remaining handoffs
                    const index = remainingHandoffs.findIndex(h => h.id === handoff.id);
                    if (index !== -1) {
                        remainingHandoffs.splice(index, 1);
                    }
                }

            } catch (error) {
                console.warn(`⚠️ Could not auto-complete handoff ${handoff.id}:`, error.message);
            }
        }

        return {
            allCompleted: remainingHandoffs.length === 0,
            remainingHandoffs: remainingHandoffs,
            completedCount: blockingHandoffs.length - remainingHandoffs.length,
            timeElapsed: Date.now() - startTime
        };
    }

    /**
     * Handle orphaned outgoing handoffs by transferring or canceling them
     * @param {string} agentName - Name of the deactivating agent
     * @param {array} orphanedHandoffs - List of orphaned handoffs
     * @param {string|null} transferToAgent - Agent to transfer handoffs to
     */
    async handleOrphanedHandoffs(agentName, orphanedHandoffs, transferToAgent = null) {
        console.log(`🔄 Handling ${orphanedHandoffs.length} orphaned handoffs from ${agentName}`);
        
        const state = await this.loadAgentState();
        
        for (const handoff of orphanedHandoffs) {
            if (transferToAgent) {
                // Transfer handoff to another agent
                const handoffIndex = state.handoffEvents.findIndex(event => event.id === handoff.id);
                if (handoffIndex !== -1) {
                    state.handoffEvents[handoffIndex].fromAgent = transferToAgent;
                    state.handoffEvents[handoffIndex].data.context += `\n\nTransferred from ${agentName} during deactivation.`;
                    console.log(`📤 Transferred handoff ${handoff.id} from ${agentName} to ${transferToAgent}`);
                }
            } else {
                // Mark handoff as cancelled
                const handoffIndex = state.handoffEvents.findIndex(event => event.id === handoff.id);
                if (handoffIndex !== -1) {
                    state.handoffEvents[handoffIndex].status = 'cancelled';
                    state.handoffEvents[handoffIndex].cancellationReason = `Source agent ${agentName} deactivated`;
                    state.handoffEvents[handoffIndex].cancellationTimestamp = new Date().toISOString();
                    console.log(`❌ Cancelled orphaned handoff ${handoff.id} from ${agentName}`);
                }
            }
        }

        await this.saveAgentState(state);
    }

    /**
     * Preserve agent work state before deactivation
     * @param {string} agentName - Name of the agent
     * @param {string} reason - Reason for preservation
     */
    async preserveAgentWork(agentName, reason) {
        const state = await this.loadAgentState();
        
        if (state.activeAgents[agentName]) {
            const agentData = state.activeAgents[agentName];
            
            // Create a detailed work preservation record
            const workPreservation = {
                agentName: agentName,
                preservationTimestamp: new Date().toISOString(),
                reason: reason,
                task: agentData.task,
                progress: agentData.progress,
                context: agentData.context,
                status: agentData.status,
                workingTime: this.calculateWorkingTime(agentData.startTime),
                blockedOn: agentData.blockedOn,
                dependencies: agentData.dependencies,
                estimatedCompletion: agentData.estimatedCompletion
            };

            // Add to completed tasks with special preservation marker
            if (!state.preservedWork) {
                state.preservedWork = [];
            }
            
            state.preservedWork.push(workPreservation);
            
            // Keep only last 20 preserved work items
            if (state.preservedWork.length > 20) {
                state.preservedWork = state.preservedWork.slice(-20);
            }

            await this.saveAgentState(state);
            console.log(`💾 Preserved work state for ${agentName}`);
        }
    }

    // ===== NEW HANDOFF EVENT TRACKING METHODS =====

    /**
     * Record that a handoff has been initiated from one agent to another
     * @param {string} fromAgent - Source agent name
     * @param {string} toAgent - Target agent name
     * @param {object} handoffData - Handoff details
     * @returns {string} Handoff ID for tracking
     */
    async recordHandoffInitiated(fromAgent, toAgent, handoffData) {
        const state = await this.loadAgentState();
        
        // Ensure handoffEvents array exists
        if (!state.handoffEvents) {
            state.handoffEvents = [];
        }

        const handoffId = this.generateHandoffId(fromAgent, toAgent);
        const handoffEvent = {
            id: handoffId,
            type: 'handoff_initiated',
            fromAgent: fromAgent,
            toAgent: toAgent,
            timestamp: new Date().toISOString(),
            status: 'initiated',
            data: {
                taskDescription: handoffData.taskDescription || '',
                context: handoffData.context || '',
                requirements: handoffData.requirements || '',
                successCriteria: handoffData.successCriteria || '',
                priority: handoffData.priority || 'normal',
                estimatedDuration: handoffData.estimatedDuration || null
            },
            acknowledgmentReceived: false,
            workStarted: false,
            completed: false
        };

        state.handoffEvents.push(handoffEvent);
        state.lastUpdate = new Date().toISOString();
        
        await this.saveAgentState(state);
        
        console.log(`📤 Handoff initiated: ${fromAgent} → ${toAgent} (ID: ${handoffId})`);
        return handoffId;
    }

    /**
     * Record that a handoff has been acknowledged by the receiving agent
     * @param {string} handoffId - ID of the handoff
     * @param {string} acknowledgingAgent - Agent acknowledging the handoff
     * @param {object} acknowledgmentData - Acknowledgment details
     */
    async recordHandoffAcknowledged(handoffId, acknowledgingAgent, acknowledgmentData = {}) {
        const state = await this.loadAgentState();
        
        if (!state.handoffEvents) {
            state.handoffEvents = [];
        }

        const handoffEvent = state.handoffEvents.find(event => event.id === handoffId);
        if (!handoffEvent) {
            throw new Error(`Handoff not found: ${handoffId}`);
        }

        if (handoffEvent.toAgent !== acknowledgingAgent) {
            throw new Error(`Agent ${acknowledgingAgent} cannot acknowledge handoff meant for ${handoffEvent.toAgent}`);
        }

        handoffEvent.acknowledgmentReceived = true;
        handoffEvent.acknowledgmentTimestamp = new Date().toISOString();
        handoffEvent.acknowledgmentData = {
            understoodRequirements: acknowledgmentData.understoodRequirements || [],
            questions: acknowledgmentData.questions || [],
            estimatedCompletion: acknowledgmentData.estimatedCompletion || null,
            concerns: acknowledgmentData.concerns || []
        };
        handoffEvent.status = 'acknowledged';

        state.lastUpdate = new Date().toISOString();
        await this.saveAgentState(state);

        console.log(`✅ Handoff acknowledged: ${handoffId} by ${acknowledgingAgent}`);
    }

    /**
     * Record that work has started on a handoff
     * @param {string} handoffId - ID of the handoff
     * @param {string} workingAgent - Agent starting work
     */
    async recordHandoffWorkStarted(handoffId, workingAgent) {
        const state = await this.loadAgentState();
        
        if (!state.handoffEvents) {
            state.handoffEvents = [];
        }

        const handoffEvent = state.handoffEvents.find(event => event.id === handoffId);
        if (!handoffEvent) {
            throw new Error(`Handoff not found: ${handoffId}`);
        }

        if (handoffEvent.toAgent !== workingAgent) {
            throw new Error(`Agent ${workingAgent} cannot start work on handoff meant for ${handoffEvent.toAgent}`);
        }

        handoffEvent.workStarted = true;
        handoffEvent.workStartTimestamp = new Date().toISOString();
        handoffEvent.status = 'in_progress';

        state.lastUpdate = new Date().toISOString();
        await this.saveAgentState(state);

        console.log(`🔄 Work started: ${handoffId} by ${workingAgent}`);
    }

    /**
     * Record that a handoff has been completed
     * @param {string} handoffId - ID of the handoff
     * @param {string} completingAgent - Agent completing the handoff
     * @param {object} completionData - Completion details
     */
    async recordHandoffCompleted(handoffId, completingAgent, completionData = {}) {
        const state = await this.loadAgentState();
        
        if (!state.handoffEvents) {
            state.handoffEvents = [];
        }

        const handoffEvent = state.handoffEvents.find(event => event.id === handoffId);
        if (!handoffEvent) {
            throw new Error(`Handoff not found: ${handoffId}`);
        }

        if (handoffEvent.toAgent !== completingAgent) {
            throw new Error(`Agent ${completingAgent} cannot complete handoff meant for ${handoffEvent.toAgent}`);
        }

        handoffEvent.completed = true;
        handoffEvent.completionTimestamp = new Date().toISOString();
        handoffEvent.completionData = {
            deliverables: completionData.deliverables || [],
            summary: completionData.summary || '',
            nextSteps: completionData.nextSteps || [],
            qualityGatesPassed: completionData.qualityGatesPassed || false,
            nextAgentRecommendation: completionData.nextAgentRecommendation || null
        };
        handoffEvent.status = 'completed';

        // Calculate completion time
        if (handoffEvent.workStartTimestamp) {
            const workStart = new Date(handoffEvent.workStartTimestamp);
            const completion = new Date(handoffEvent.completionTimestamp);
            handoffEvent.completionTimeMinutes = Math.round((completion - workStart) / (1000 * 60));
        }

        state.lastUpdate = new Date().toISOString();
        await this.saveAgentState(state);

        console.log(`🏁 Handoff completed: ${handoffId} by ${completingAgent}`);
    }

    /**
     * Get all active handoffs (initiated but not completed)
     * @returns {array} Array of active handoff events
     */
    async getActiveHandoffs() {
        const state = await this.loadAgentState();
        
        if (!state.handoffEvents) {
            return [];
        }

        return state.handoffEvents.filter(event => 
            !event.completed && event.status !== 'failed'
        );
    }

    /**
     * Get handoff by ID
     * @param {string} handoffId - ID of the handoff
     * @returns {object|null} Handoff event or null if not found
     */
    async getHandoffById(handoffId) {
        const state = await this.loadAgentState();
        
        if (!state.handoffEvents) {
            return null;
        }

        return state.handoffEvents.find(event => event.id === handoffId) || null;
    }

    /**
     * Get handoffs for a specific agent
     * @param {string} agentName - Name of the agent
     * @param {string} role - 'from', 'to', or 'both' (default: 'both')
     * @returns {array} Array of handoff events
     */
    async getHandoffsForAgent(agentName, role = 'both') {
        const state = await this.loadAgentState();
        
        if (!state.handoffEvents) {
            return [];
        }

        return state.handoffEvents.filter(event => {
            switch (role) {
                case 'from':
                    return event.fromAgent === agentName;
                case 'to':
                    return event.toAgent === agentName;
                case 'both':
                default:
                    return event.fromAgent === agentName || event.toAgent === agentName;
            }
        });
    }

    /**
     * Generate a unique handoff ID
     * @param {string} fromAgent - Source agent
     * @param {string} toAgent - Target agent
     * @returns {string} Unique handoff ID
     */
    generateHandoffId(fromAgent, toAgent) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `handoff_${fromAgent}_to_${toAgent}_${timestamp}_${random}`;
    }

    /**
     * Get handoff performance metrics
     * @param {number} days - Number of days to analyze (default: 7)
     * @returns {object} Performance metrics
     */
    async getHandoffMetrics(days = 7) {
        const state = await this.loadAgentState();
        
        if (!state.handoffEvents) {
            return {
                totalHandoffs: 0,
                completedHandoffs: 0,
                averageCompletionTime: 0,
                acknowledgmentRate: 0,
                completionRate: 0
            };
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentHandoffs = state.handoffEvents.filter(event => 
            new Date(event.timestamp) >= cutoffDate
        );

        const completedHandoffs = recentHandoffs.filter(event => event.completed);
        const acknowledgedHandoffs = recentHandoffs.filter(event => event.acknowledgmentReceived);

        const totalCompletionTime = completedHandoffs.reduce((sum, event) => 
            sum + (event.completionTimeMinutes || 0), 0
        );

        return {
            totalHandoffs: recentHandoffs.length,
            completedHandoffs: completedHandoffs.length,
            averageCompletionTime: completedHandoffs.length > 0 ? 
                Math.round(totalCompletionTime / completedHandoffs.length) : 0,
            acknowledgmentRate: recentHandoffs.length > 0 ? 
                Math.round((acknowledgedHandoffs.length / recentHandoffs.length) * 100) : 0,
            completionRate: recentHandoffs.length > 0 ? 
                Math.round((completedHandoffs.length / recentHandoffs.length) * 100) : 0,
            pendingHandoffs: recentHandoffs.filter(event => 
                !event.completed && event.status !== 'failed'
            ).length
        };
    }
}

module.exports = AgentStateTracker;