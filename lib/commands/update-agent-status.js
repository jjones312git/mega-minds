// lib/commands/update-agent-status.js
// Command: npx mega-minds update-agent-status "agent-name" "status-description" "progress-percentage"
// Purpose: Updates agent progress for real-time monitoring (PRD Core Feature #1)

const AIDevTeam = require('../core/AIDevTeam');

/**
 * Updates agent status and progress for real-time monitoring
 * Implements PRD requirements:
 * - Work progress monitoring with status updates
 * - Agent workload visible in real-time dashboard
 */
class AgentStatusUpdater {
    constructor() {
        this.projectPath = process.cwd();
    }

    /**
     * Main execution function for updating agent status
     * @param {string} agentName - Name of the agent
     * @param {string} statusDescription - Current status description
     * @param {string|number} progressPercentage - Progress percentage (0-100)
     * @returns {Promise<object>} Status update result
     */
    async run(agentName, statusDescription, progressPercentage = null) {
        if (!agentName) {
            console.error('❌ Agent name is required');
            console.log('Usage: npx mega-minds update-agent-status "agent-name" "status-description" [progress-percentage]');
            process.exit(1);
        }

        if (!statusDescription) {
            console.error('❌ Status description is required');
            console.log('Usage: npx mega-minds update-agent-status "agent-name" "status-description" [progress-percentage]');
            process.exit(1);
        }

        // Validate and parse progress percentage
        let progress = null;
        if (progressPercentage !== null && progressPercentage !== undefined) {
            progress = parseInt(progressPercentage);
            if (isNaN(progress) || progress < 0 || progress > 100) {
                console.error('❌ Progress percentage must be between 0 and 100');
                process.exit(1);
            }
        }

        try {
            const team = new AIDevTeam(this.projectPath);
            await team.initialize();

            // Get current agent state
            const agentStates = await team.agentState.getAllAgentStates();
            const currentState = agentStates[agentName];

            if (!currentState) {
                console.warn(`⚠️ Agent ${agentName} is not currently active`);
                console.log('Starting agent tracking...');
                
                // Activate agent if not already active
                await team.agentState.activateAgent(agentName, statusDescription, {
                    progress: progress || 0,
                    source: 'status-update'
                });
            } else {
                // Update existing agent state
                await team.agentState.updateAgentProgress(agentName, progress || currentState.progress);
                await team.agentState.updateAgentStatus(agentName, 'active', statusDescription);
            }

            // Determine agent workload based on progress and status
            const workload = this.calculateWorkload(progress, statusDescription);

            // Track status update in session
            await team.sessions.trackHandoffEvent('agent_status_update', {
                agentName,
                statusDescription,
                progress,
                workload,
                timestamp: new Date().toISOString(),
                source: 'cli'
            });

            // Update session with latest agent state
            if (team.sessions.currentSession) {
                if (!team.sessions.currentSession.agents.activeAgents[agentName]) {
                    team.sessions.currentSession.agents.activeAgents[agentName] = {};
                }
                
                Object.assign(team.sessions.currentSession.agents.activeAgents[agentName], {
                    status: 'active',
                    currentTask: statusDescription,
                    progress: progress,
                    workload: workload,
                    lastUpdate: new Date().toISOString()
                });
            }

            // Sync and save session
            await team.sessions.syncHandoffState();
            await team.sessions.saveActiveSession();

            // Check for blockers or issues
            const blockers = this.detectBlockers(statusDescription);
            if (blockers.length > 0) {
                console.log(`\n⚠️ Potential blockers detected:`);
                blockers.forEach(blocker => console.log(`  - ${blocker}`));
                console.log(`Consider escalating or requesting assistance.`);
            }

            // Display status update confirmation
            console.log(`📊 Agent status updated successfully`);
            console.log(`Agent: ${agentName}`);
            console.log(`Status: ${statusDescription}`);
            if (progress !== null) {
                const progressBar = this.generateProgressBar(progress);
                console.log(`Progress: ${progressBar} ${progress}%`);
            }
            console.log(`Workload: ${workload}`);
            console.log(`💾 Session saved with status update`);

            // Show overall agent status
            const activeAgents = await team.agentState.getAllAgentStates();
            const activeCount = Object.keys(activeAgents).length;
            console.log(`\n📈 System Status:`);
            console.log(`Active agents: ${activeCount}`);
            
            // Memory check
            const memoryStatus = team.sessions.getMemoryStatus();
            console.log(`Memory: ${memoryStatus.system.heapUsedMB}MB (${memoryStatus.system.status})`);

            // Warn if approaching agent limit
            if (activeCount >= 2) {
                console.log(`⚠️ Agent limit reached (${activeCount}/2). Consider completing work before activating more agents.`);
            }

            return {
                success: true,
                agentName,
                status: statusDescription,
                progress,
                workload,
                systemStatus: {
                    activeAgents: activeCount,
                    memoryStatus: memoryStatus.system.status
                }
            };

        } catch (error) {
            console.error(`❌ Failed to update agent status: ${error.message}`);
            
            if (process.env.MEGA_MINDS_DEBUG) {
                console.error('Stack trace:', error.stack);
            }
            
            process.exit(1);
        }
    }

    /**
     * Calculate agent workload based on progress and status
     * @private
     */
    calculateWorkload(progress, statusDescription) {
        // Determine workload based on keywords and progress
        const heavyKeywords = ['complex', 'difficult', 'challenging', 'critical', 'urgent', 'blocked'];
        const lightKeywords = ['simple', 'easy', 'straightforward', 'minor', 'trivial', 'waiting'];

        const descLower = statusDescription.toLowerCase();

        if (heavyKeywords.some(keyword => descLower.includes(keyword))) {
            return 'heavy';
        }

        if (lightKeywords.some(keyword => descLower.includes(keyword))) {
            return 'light';
        }

        // Use progress to determine workload
        if (progress !== null) {
            if (progress < 30) return 'heavy';
            if (progress > 70) return 'light';
        }

        return 'medium';
    }

    /**
     * Detect potential blockers in status description
     * @private
     */
    detectBlockers(statusDescription) {
        const blockers = [];
        const blockerPatterns = [
            { pattern: /blocked|stuck/i, message: 'Work appears to be blocked' },
            { pattern: /waiting for|waiting on/i, message: 'Waiting on dependencies' },
            { pattern: /error|failed|failure/i, message: 'Error or failure detected' },
            { pattern: /cannot|can't|unable/i, message: 'Unable to proceed' },
            { pattern: /issue|problem/i, message: 'Issue or problem reported' },
            { pattern: /help|assistance/i, message: 'Help requested' }
        ];

        for (const { pattern, message } of blockerPatterns) {
            if (pattern.test(statusDescription)) {
                blockers.push(message);
            }
        }

        return blockers;
    }

    /**
     * Generate visual progress bar
     * @private
     */
    generateProgressBar(progress) {
        const filled = Math.round(progress / 5); // 20 segments total
        const empty = 20 - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }
}

/**
 * CLI entry point
 */
async function updateAgentStatus(agentName, statusDescription, progressPercentage) {
    const updater = new AgentStatusUpdater();
    
    // Enable debug logging if flag is set
    if (process.env.MEGA_MINDS_DEBUG || process.argv.includes('--debug')) {
        console.log('🔍 Debug mode enabled');
    }

    return await updater.run(agentName, statusDescription, progressPercentage);
}

module.exports = { AgentStatusUpdater, updateAgentStatus };