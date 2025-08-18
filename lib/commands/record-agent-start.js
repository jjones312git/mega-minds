// lib/commands/record-agent-start.js
// Command: npx mega-minds record-agent-start "agent-name" "task-description"
// Purpose: Records agent activation for real-time handoff tracking (PRD Core Feature #1)

const AIDevTeam = require('../core/AIDevTeam');

/**
 * Records agent activation and initiates handoff tracking
 * Implements PRD requirement: Real-Time Agent Coordination with 95%+ accuracy
 */
class AgentStartRecorder {
    constructor() {
        this.projectPath = process.cwd();
    }

    /**
     * Main execution function for recording agent start
     * @param {string} agentName - Name of the agent being activated
     * @param {string} taskDescription - Description of the task being started
     * @returns {Promise<string>} Handoff ID for tracking
     */
    async run(agentName, taskDescription) {
        if (!agentName) {
            console.error('❌ Agent name is required');
            console.log('Usage: npx mega-minds record-agent-start "agent-name" "task-description"');
            process.exit(1);
        }

        if (!taskDescription) {
            console.error('❌ Task description is required');
            console.log('Usage: npx mega-minds record-agent-start "agent-name" "task-description"');
            process.exit(1);
        }

        try {
            const team = new AIDevTeam(this.projectPath);
            await team.initialize();
            
            // Record agent activation with handoff tracking
            const handoffId = await team.agentState.recordHandoffInitiated(
                'user-request', 
                agentName, 
                {
                    taskDescription,
                    context: 'Direct agent activation via CLI',
                    priority: 'normal',
                    timestamp: new Date().toISOString(),
                    source: 'cli-command'
                }
            );
            
            // Update session with handoff event for real-time tracking
            await team.sessions.trackHandoffEvent('agent_start', {
                agentName,
                taskDescription,
                handoffId,
                source: 'cli',
                timestamp: new Date().toISOString()
            });

            // Sync handoff state for session persistence
            await team.sessions.syncHandoffState();
            
            // Auto-save session to persist state
            await team.sessions.saveActiveSession();
            
            console.log(`🤖 Agent ${agentName} started successfully`);
            console.log(`📋 Task: ${taskDescription}`);
            console.log(`🔗 Handoff ID: ${handoffId}`);
            console.log(`💾 Session saved with handoff tracking`);

            // Return handoff ID for potential chaining
            return handoffId;

        } catch (error) {
            console.error(`❌ Failed to record agent start: ${error.message}`);
            
            // Log error for debugging
            if (process.env.MEGA_MINDS_DEBUG) {
                console.error('Stack trace:', error.stack);
            }
            
            process.exit(1);
        }
    }

    /**
     * Validate agent name against known agents
     * @param {string} agentName - Agent name to validate
     * @returns {boolean} Whether agent is valid
     */
    validateAgentName(agentName) {
        const validAgents = [
            'project-orchestrator-agent',
            'requirements-analysis-agent',
            'technical-architecture-agent',
            'frontend-development-agent',
            'backend-development-agent',
            'database-agent',
            'testing-agent',
            'monitoring-agent',
            'ux-ui-design-agent',
            'api-design-agent',
            'database-schema-agent',
            'security-architecture-agent',
            'authentication-agent',
            'code-review-agent',
            'performance-testing-agent',
            'security-testing-agent',
            'ci-cd-pipeline-agent',
            'infrastructure-agent',
            'backup-recovery-agent',
            'bug-tracker-agent',
            'performance-optimizer-agent',
            'feature-manager-agent',
            'ab-tester-agent',
            'analytics-agent',
            'customer-support-agent',
            'documentation-agent',
            'marketing-automation-agent',
            'multi-tenancy-agent',
            'onboarding-agent',
            'subscription-management-agent',
            'usage-tracking-agent',
            'market-research-agent',
            'risk-assessment-agent'
        ];

        return validAgents.includes(agentName);
    }
}

/**
 * CLI entry point
 */
async function recordAgentStart(agentName, taskDescription) {
    const recorder = new AgentStartRecorder();
    
    // Enable debug logging if flag is set
    if (process.env.MEGA_MINDS_DEBUG || process.argv.includes('--debug')) {
        console.log('🔍 Debug mode enabled');
    }

    // Validate agent name
    if (!recorder.validateAgentName(agentName)) {
        console.warn(`⚠️ Warning: '${agentName}' is not a recognized agent name`);
        console.log('This may cause issues with agent coordination.');
        
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const answer = await new Promise(resolve => {
            rl.question('Continue anyway? (y/N): ', resolve);
        });
        rl.close();

        if (answer.toLowerCase() !== 'y') {
            console.log('❌ Operation cancelled');
            process.exit(0);
        }
    }

    return await recorder.run(agentName, taskDescription);
}

module.exports = { AgentStartRecorder, recordAgentStart };