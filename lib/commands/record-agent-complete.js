// lib/commands/record-agent-complete.js
// Command: npx mega-minds record-agent-complete "agent-name" "completion-summary" "next-agent"
// Purpose: Records agent work completion and facilitates handoffs (PRD Core Feature #1)

const AIDevTeam = require('../core/AIDevTeam');

/**
 * Records agent completion and manages handoff to next agent
 * Implements PRD requirements: 
 * - Real-Time Agent Coordination with handoff tracking
 * - Session state persistence across Claude Code restarts
 */
class AgentCompleteRecorder {
    constructor() {
        this.projectPath = process.cwd();
    }

    /**
     * Main execution function for recording agent completion
     * @param {string} agentName - Name of the agent completing work
     * @param {string} completionSummary - Summary of completed work
     * @param {string} nextAgent - Optional next agent for handoff
     * @returns {Promise<object>} Completion result with metrics
     */
    async run(agentName, completionSummary, nextAgent = null) {
        if (!agentName) {
            console.error('❌ Agent name is required');
            console.log('Usage: npx mega-minds record-agent-complete "agent-name" "completion-summary" ["next-agent"]');
            process.exit(1);
        }

        if (!completionSummary) {
            console.error('❌ Completion summary is required');
            console.log('Usage: npx mega-minds record-agent-complete "agent-name" "completion-summary" ["next-agent"]');
            process.exit(1);
        }

        try {
            const team = new AIDevTeam(this.projectPath);
            await team.initialize();
            
            // Find all active handoffs for this agent
            const activeHandoffs = await team.agentState.getActiveHandoffs();
            const agentHandoffs = activeHandoffs.filter(h => h.toAgent === agentName);
            
            if (agentHandoffs.length === 0) {
                console.warn(`⚠️ No active handoffs found for ${agentName}`);
                console.log('Recording completion without handoff closure.');
            }

            // Complete all handoffs for this agent
            let completedCount = 0;
            for (const handoff of agentHandoffs) {
                try {
                    await team.agentState.recordHandoffCompleted(handoff.id, agentName, {
                        completionSummary,
                        completionTime: new Date().toISOString(),
                        nextAgent,
                        deliverables: this.extractDeliverables(completionSummary),
                        metrics: {
                            duration: this.calculateDuration(handoff.timestamp),
                            success: true
                        }
                    });
                    completedCount++;
                } catch (error) {
                    console.warn(`⚠️ Failed to complete handoff ${handoff.id}: ${error.message}`);
                }
            }

            // Update session with completion event
            await team.sessions.trackHandoffEvent('agent_complete', {
                agentName,
                completionSummary,
                nextAgent,
                completedHandoffs: completedCount,
                timestamp: new Date().toISOString(),
                source: 'cli'
            });

            // If there's a next agent, initiate new handoff
            let newHandoffId = null;
            if (nextAgent) {
                newHandoffId = await this.initiateNextHandoff(team, agentName, nextAgent, completionSummary);
            }

            // Sync handoff state and save session
            await team.sessions.syncHandoffState();
            await team.sessions.saveActiveSession();

            // Display completion status
            console.log(`✅ Agent ${agentName} completed successfully`);
            console.log(`📝 Summary: ${completionSummary}`);
            console.log(`🔗 Completed ${completedCount} handoff(s)`);
            
            if (nextAgent) {
                console.log(`🔄 Handoff initiated to: ${nextAgent}`);
                console.log(`🆔 New handoff ID: ${newHandoffId}`);
            }
            
            console.log(`💾 Session saved with completion tracking`);

            // Check memory status and provide warning if needed
            const memoryStatus = team.sessions.getMemoryStatus();
            if (memoryStatus.system.status === 'warning') {
                console.log(`⚠️ Memory warning: ${memoryStatus.system.heapUsedMB}MB used`);
                console.log('Consider running: npx mega-minds memory-cleanup');
            } else if (memoryStatus.system.status === 'critical') {
                console.log(`🚨 Critical memory: ${memoryStatus.system.heapUsedMB}MB used`);
                console.log('Running automatic cleanup...');
                await team.sessions.forceMemoryCleanup();
                console.log('✅ Memory cleanup completed');
            }

            return {
                success: true,
                agentName,
                completedHandoffs: completedCount,
                newHandoffId,
                memoryStatus: memoryStatus.system.status
            };

        } catch (error) {
            console.error(`❌ Failed to record agent completion: ${error.message}`);
            
            if (process.env.MEGA_MINDS_DEBUG) {
                console.error('Stack trace:', error.stack);
            }
            
            process.exit(1);
        }
    }

    /**
     * Initiate handoff to next agent
     * @private
     */
    async initiateNextHandoff(team, fromAgent, toAgent, context) {
        return await team.agentState.recordHandoffInitiated(
            fromAgent,
            toAgent,
            {
                taskDescription: `Continue work from ${fromAgent}: ${context}`,
                context: context,
                priority: 'normal',
                timestamp: new Date().toISOString(),
                source: 'agent-handoff'
            }
        );
    }

    /**
     * Extract deliverables from completion summary
     * @private
     */
    extractDeliverables(summary) {
        // Simple extraction - could be enhanced with NLP
        const deliverables = [];
        
        // Look for common patterns
        const patterns = [
            /created?\s+(.+?)(?:\.|,|$)/gi,
            /implemented?\s+(.+?)(?:\.|,|$)/gi,
            /added?\s+(.+?)(?:\.|,|$)/gi,
            /fixed?\s+(.+?)(?:\.|,|$)/gi,
            /updated?\s+(.+?)(?:\.|,|$)/gi,
            /completed?\s+(.+?)(?:\.|,|$)/gi
        ];

        for (const pattern of patterns) {
            const matches = summary.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) {
                    deliverables.push(match[1].trim());
                }
            }
        }

        return deliverables.length > 0 ? deliverables : [summary];
    }

    /**
     * Calculate duration from start timestamp
     * @private
     */
    calculateDuration(startTimestamp) {
        const start = new Date(startTimestamp);
        const end = new Date();
        const durationMs = end - start;
        
        // Return duration in seconds
        return Math.round(durationMs / 1000);
    }
}

/**
 * CLI entry point
 */
async function recordAgentComplete(agentName, completionSummary, nextAgent) {
    const recorder = new AgentCompleteRecorder();
    
    // Enable debug logging if flag is set
    if (process.env.MEGA_MINDS_DEBUG || process.argv.includes('--debug')) {
        console.log('🔍 Debug mode enabled');
    }

    return await recorder.run(agentName, completionSummary, nextAgent);
}

module.exports = { AgentCompleteRecorder, recordAgentComplete };