// lib/commands/record-handoff.js
// Command: npx mega-minds record-handoff "from-agent" "to-agent" "task-description"
// Purpose: Explicitly records handoff between agents (PRD Core Feature #1)

const AIDevTeam = require('../core/AIDevTeam');

/**
 * Records explicit handoff between agents
 * Implements PRD requirements:
 * - Handoff event recording with complete audit trail
 * - Failed handoff detection within 30 seconds
 */
class HandoffRecorder {
    constructor() {
        this.projectPath = process.cwd();
    }

    /**
     * Main execution function for recording handoff
     * @param {string} fromAgent - Agent handing off work
     * @param {string} toAgent - Agent receiving work
     * @param {string} taskDescription - Description of work being handed off
     * @returns {Promise<object>} Handoff result with tracking ID
     */
    async run(fromAgent, toAgent, taskDescription) {
        if (!fromAgent || !toAgent || !taskDescription) {
            console.error('❌ All parameters are required');
            console.log('Usage: npx mega-minds record-handoff "from-agent" "to-agent" "task-description"');
            process.exit(1);
        }

        if (fromAgent === toAgent) {
            console.error('❌ Cannot handoff to the same agent');
            process.exit(1);
        }

        try {
            const team = new AIDevTeam(this.projectPath);
            await team.initialize();

            // Extract context and requirements from task description
            const handoffData = this.parseTaskDescription(taskDescription);

            // Record the handoff initiation
            const handoffId = await team.agentState.recordHandoffInitiated(
                fromAgent,
                toAgent,
                {
                    taskDescription: handoffData.task,
                    context: handoffData.context,
                    requirements: handoffData.requirements,
                    successCriteria: handoffData.successCriteria,
                    priority: handoffData.priority || 'normal',
                    estimatedDuration: handoffData.estimatedDuration,
                    timestamp: new Date().toISOString(),
                    source: 'explicit-handoff'
                }
            );

            // Update session with handoff event
            await team.sessions.trackHandoffEvent('handoff_initiated', {
                handoffId,
                fromAgent,
                toAgent,
                taskDescription,
                timestamp: new Date().toISOString(),
                source: 'cli'
            });

            // Add to handoff queue in session
            if (team.sessions.currentSession) {
                if (!team.sessions.currentSession.handoffs) {
                    team.sessions.currentSession.handoffs = {
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

                // Add to pending handoffs
                team.sessions.currentSession.handoffs.pending.push({
                    id: handoffId,
                    fromAgent,
                    toAgent,
                    taskDescription,
                    status: 'pending',
                    timestamp: new Date().toISOString()
                });

                // Update metrics
                team.sessions.currentSession.handoffs.metrics.totalInitiated++;
            }

            // Sync and save session
            await team.sessions.syncHandoffState();
            await team.sessions.saveActiveSession();

            // Set up timeout monitoring for failed handoff detection
            this.setupHandoffMonitoring(team, handoffId, toAgent);

            // Set up auto-acknowledgment for agents without Bash capability
            if (process.env.MEGA_MINDS_DEBUG) {
                console.log('🔍 Setting up auto-acknowledgment for:', toAgent);
            }
            await this.setupAutoAcknowledgment(team, handoffId, toAgent);

            // Display handoff confirmation
            console.log(`📤 Handoff initiated successfully`);
            console.log(`From: ${fromAgent}`);
            console.log(`To: ${toAgent}`);
            console.log(`Task: ${taskDescription}`);
            console.log(`🔗 Handoff ID: ${handoffId}`);
            console.log(`⏱️ Monitoring for acknowledgment (30 second timeout)`);
            console.log(`💾 Session saved with handoff tracking`);

            // Show current handoff queue status
            const activeHandoffs = await team.agentState.getActiveHandoffs();
            console.log(`\n📊 Handoff Queue Status:`);
            console.log(`Active handoffs: ${activeHandoffs.length}`);
            console.log(`Pending acknowledgment: ${activeHandoffs.filter(h => h.status === 'initiated').length}`);
            console.log(`In progress: ${activeHandoffs.filter(h => h.status === 'in_progress').length}`);

            return {
                success: true,
                handoffId,
                fromAgent,
                toAgent,
                queueStatus: {
                    total: activeHandoffs.length,
                    pending: activeHandoffs.filter(h => h.status === 'initiated').length
                }
            };

        } catch (error) {
            console.error(`❌ Failed to record handoff: ${error.message}`);
            
            if (process.env.MEGA_MINDS_DEBUG) {
                console.error('Stack trace:', error.stack);
            }
            
            process.exit(1);
        }
    }

    /**
     * Parse task description to extract structured data
     * @private
     */
    parseTaskDescription(description) {
        const data = {
            task: description,
            context: '',
            requirements: [],
            successCriteria: [],
            priority: 'normal',
            estimatedDuration: null
        };

        // Extract priority if mentioned
        if (/urgent|critical|high/i.test(description)) {
            data.priority = 'high';
        } else if (/low|minor/i.test(description)) {
            data.priority = 'low';
        }

        // Extract requirements (look for "must", "should", "need to")
        const requirementPatterns = [
            /must\s+(.+?)(?:\.|,|;|$)/gi,
            /should\s+(.+?)(?:\.|,|;|$)/gi,
            /needs?\s+to\s+(.+?)(?:\.|,|;|$)/gi
        ];

        for (const pattern of requirementPatterns) {
            const matches = description.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) {
                    data.requirements.push(match[1].trim());
                }
            }
        }

        // Extract success criteria (look for "ensure", "verify", "complete when")
        const successPatterns = [
            /ensure\s+(.+?)(?:\.|,|;|$)/gi,
            /verify\s+(.+?)(?:\.|,|;|$)/gi,
            /complete\s+when\s+(.+?)(?:\.|,|;|$)/gi
        ];

        for (const pattern of successPatterns) {
            const matches = description.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) {
                    data.successCriteria.push(match[1].trim());
                }
            }
        }

        // Extract estimated duration if mentioned
        const durationMatch = description.match(/(\d+)\s*(hours?|minutes?|days?)/i);
        if (durationMatch) {
            const [, amount, unit] = durationMatch;
            const multipliers = {
                minute: 60,
                minutes: 60,
                hour: 3600,
                hours: 3600,
                day: 86400,
                days: 86400
            };
            data.estimatedDuration = parseInt(amount) * (multipliers[unit.toLowerCase()] || 3600);
        }

        return data;
    }

    /**
     * Setup monitoring for handoff acknowledgment
     * @private
     */
    setupHandoffMonitoring(team, handoffId, toAgent) {
        // Set 30-second timeout for acknowledgment (per PRD requirement)
        setTimeout(async () => {
            try {
                const handoffs = await team.agentState.getActiveHandoffs();
                const handoff = handoffs.find(h => h.id === handoffId);

                if (handoff && handoff.status === 'initiated' && !handoff.acknowledgmentReceived) {
                    console.warn(`\n⚠️ HANDOFF TIMEOUT: ${toAgent} has not acknowledged handoff ${handoffId}`);
                    console.warn(`This handoff may need manual intervention.`);
                    console.warn(`Run: npx mega-minds get-handoff-status ${handoffId}`);

                    // Mark as potentially failed in session
                    if (team.sessions.currentSession && team.sessions.currentSession.handoffs) {
                        const pendingHandoff = team.sessions.currentSession.handoffs.pending.find(h => h.id === handoffId);
                        if (pendingHandoff) {
                            pendingHandoff.status = 'timeout';
                            pendingHandoff.timeoutAt = new Date().toISOString();
                        }
                        await team.sessions.saveActiveSession();
                    }
                }
            } catch (error) {
                if (process.env.MEGA_MINDS_DEBUG) {
                    console.error('Handoff monitoring error:', error);
                }
            }
        }, 30000); // 30 seconds per PRD requirement
    }

    /**
     * Setup auto-acknowledgment for agents without Bash capability
     * @private
     */
    async setupAutoAcknowledgment(team, handoffId, toAgent) {
        try {
            if (process.env.MEGA_MINDS_DEBUG) {
                console.log('🔍 Checking Bash capability for:', toAgent);
            }
            
            // Check if the agent has Bash capability
            const hasBasCapability = await this.checkAgentBashCapability(toAgent);
            
            if (process.env.MEGA_MINDS_DEBUG) {
                console.log('🔍 Agent', toAgent, 'has Bash capability:', hasBasCapability);
            }
            
            if (!hasBasCapability) {
                console.log(`🤖 ${toAgent} lacks Bash capability - will auto-acknowledge in 1 second`);
                
                // Auto-acknowledge immediately for agents without Bash using Promise-based delay
                (async () => {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    try {
                        if (process.env.MEGA_MINDS_DEBUG) {
                            console.log('🔍 Executing auto-acknowledgment for:', toAgent);
                        }
                        
                        const handoffs = await team.agentState.getActiveHandoffs();
                        const handoff = handoffs.find(h => h.id === handoffId);
                        
                        if (process.env.MEGA_MINDS_DEBUG) {
                            console.log('🔍 Found handoff:', handoff ? `${handoff.id} (status: ${handoff.status})` : 'not found');
                        }
                        
                        if (handoff && handoff.status === 'initiated') {
                            const acknowledgmentData = {
                                understoodRequirements: ['CLI handoff received'],
                                questions: [],
                                concerns: [],
                                estimatedCompletion: null,
                                confidence: 'auto-acknowledged',
                                source: 'auto-acknowledgment-no-bash'
                            };

                            await team.agentState.recordHandoffAcknowledged(handoffId, toAgent, acknowledgmentData);
                            console.log(`🤖 Auto-acknowledged handoff for ${toAgent} (no Bash capability)`);
                        }
                    } catch (error) {
                        console.log('⚠️ Auto-acknowledgment failed:', error.message);
                        if (process.env.MEGA_MINDS_DEBUG) {
                            console.log('⚠️ Auto-acknowledgment error stack:', error.stack);
                        }
                    }
                })();
            } else {
                if (process.env.MEGA_MINDS_DEBUG) {
                    console.log('🔍 Agent has Bash capability, skipping auto-acknowledgment');
                }
            }
        } catch (error) {
            console.log('⚠️ Auto-acknowledgment setup failed:', error.message);
            if (process.env.MEGA_MINDS_DEBUG) {
                console.log('⚠️ Auto-acknowledgment setup error stack:', error.stack);
            }
        }
    }

    /**
     * Check if an agent has Bash capability by examining their template
     * @param {string} agentName - Name of the agent
     * @returns {Promise<boolean>} Whether agent has Bash capability
     */
    async checkAgentBashCapability(agentName) {
        try {
            const path = require('path');
            const fs = require('fs-extra');
            
            // Look for agent template in various locations
            const possibleDirs = [
                path.join(this.projectPath, 'templates'),
                path.join(this.projectPath, 'node_modules', 'mega-minds', 'templates')
            ];
            
            for (const baseDir of possibleDirs) {
                if (await fs.pathExists(baseDir)) {
                    // Search recursively for the agent template
                    const templatePath = await this.findTemplateRecursively(baseDir, `${agentName}.md`);
                    if (templatePath) {
                        const templateContent = await fs.readFile(templatePath, 'utf8');
                        
                        // Check if tools line contains Bash
                        const toolsMatch = templateContent.match(/^tools:\s*(.+)$/m);
                        if (toolsMatch) {
                            const tools = toolsMatch[1].split(/[,\s]+/).map(t => t.trim());
                            return tools.includes('Bash');
                        }
                    }
                }
            }
            
            // Default to no Bash capability if template not found
            return false;
        } catch (error) {
            // Default to no Bash capability on error
            return false;
        }
    }

    /**
     * Recursively find a template file
     * @param {string} dir - Directory to search
     * @param {string} filename - Filename to find
     * @returns {Promise<string|null>} Full path to file or null
     */
    async findTemplateRecursively(dir, filename) {
        try {
            const fs = require('fs-extra');
            const path = require('path');
            
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    // Recursive search in subdirectory
                    const result = await this.findTemplateRecursively(fullPath, filename);
                    if (result) return result;
                } else if (entry.name === filename) {
                    // Found the file
                    return fullPath;
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }
}

/**
 * CLI entry point
 */
async function recordHandoff(fromAgent, toAgent, taskDescription) {
    const recorder = new HandoffRecorder();
    
    // Enable debug logging if flag is set
    if (process.env.MEGA_MINDS_DEBUG || process.argv.includes('--debug')) {
        console.log('🔍 Debug mode enabled');
    }

    return await recorder.run(fromAgent, toAgent, taskDescription);
}

module.exports = { HandoffRecorder, recordHandoff };