// lib/commands/record-tool-use.js
// Command: npx mega-minds record-tool-use
// Purpose: Records tool usage from Claude Code PostToolUse hook for agent coordination tracking

const AIDevTeam = require('../core/AIDevTeam');

/**
 * Records tool usage from Claude Code hooks, specifically Task tool usage for agent coordination
 * Implements integration between Claude's native Task tool and mega-minds tracking system
 */
class ToolUseRecorder {
    constructor() {
        this.projectPath = process.cwd();
    }

    /**
     * Main execution function for recording tool use
     * This is called by Claude Code PostToolUse hook
     * @param {Array} args - Command arguments from hook
     * @returns {Promise<void>}
     */
    async run(args = []) {
        try {
            // Get tool use data from environment variables or stdin
            const toolData = await this.getToolUseData();
            
            if (!toolData || !toolData.tool) {
                // Not a tool use we care about, exit silently
                return;
            }

            // Only track Task tool usage for agent coordination
            if (toolData.tool === 'Task') {
                await this.recordTaskToolUsage(toolData);
            }

        } catch (error) {
            // Hooks should fail silently to not interrupt Claude Code workflow
            console.error('⚠️ Tool use recording failed (silent):', error.message);
        }
    }

    /**
     * Get tool use data from Claude Code hook environment
     * @returns {Promise<object|null>} Tool use data or null if not available
     */
    async getToolUseData() {
        try {
            // Try to get data from environment variables (Claude Code hook format)
            const toolName = process.env.CLAUDE_TOOL_NAME;
            const toolArgs = process.env.CLAUDE_TOOL_ARGS;
            
            if (toolName) {
                return {
                    tool: toolName,
                    args: toolArgs ? JSON.parse(toolArgs) : {},
                    timestamp: new Date().toISOString()
                };
            }

            // Try to read from stdin (alternative hook format)
            const stdinData = await this.readStdinData();
            if (stdinData) {
                return JSON.parse(stdinData);
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Read data from stdin with timeout
     * @returns {Promise<string|null>} Stdin data or null
     */
    async readStdinData() {
        return new Promise((resolve) => {
            let data = '';
            const timeout = setTimeout(() => resolve(null), 1000); // 1 second timeout

            process.stdin.on('readable', () => {
                const chunk = process.stdin.read();
                if (chunk !== null) {
                    data += chunk;
                }
            });

            process.stdin.on('end', () => {
                clearTimeout(timeout);
                resolve(data || null);
            });

            // Handle case where stdin is empty immediately
            setTimeout(() => {
                if (data === '') {
                    resolve(null);
                }
            }, 100);
        });
    }

    /**
     * Record Task tool usage for agent coordination
     * @param {object} toolData - Tool usage data
     */
    async recordTaskToolUsage(toolData) {
        const team = new AIDevTeam(this.projectPath);
        await team.initialize('lightweight'); // Lightweight init for hook performance
        
        const args = toolData.args || {};
        
        // Enhanced parameter extraction with debug logging
        const subagentType = args.subagent_type || args.subagentType || args.agent;
        const description = args.description || args.prompt || 'Task tool usage';
        
        // Debug logging to understand what Claude is sending
        console.log('🔍 Debug - Task tool parameters:', {
            subagent_type: args.subagent_type,
            subagentType: args.subagentType,
            agent: args.agent,
            description: args.description,
            prompt: args.prompt,
            resolved_subagentType: subagentType,
            full_args: args
        });
        
        // Validate subagentType before creating handoff
        if (!subagentType || subagentType === 'none' || subagentType === 'null' || subagentType.trim() === '') {
            console.log('⚠️ Invalid or missing subagent_type - skipping handoff creation');
            console.log('   Received args:', JSON.stringify(args, null, 2));
            return;
        }
        
        if (subagentType) {
            // This is an agent activation via Task tool
            console.log(`🤖 Recording Task tool agent activation: ${subagentType}`);
            
            // Record as handoff initiation (from system to agent)
            const handoffId = await team.agentState.recordHandoffInitiated(
                'system',
                subagentType,
                {
                    taskDescription: description,
                    context: 'Task tool activation',
                    priority: 'normal',
                    timestamp: toolData.timestamp,
                    source: 'task-tool-hook',
                    toolArgs: args
                }
            );

            // Update session with agent activity
            if (team.sessions && team.sessions.currentSession) {
                await team.sessions.trackHandoffEvent('task_tool_activation', {
                    agent: subagentType,
                    handoffId: handoffId,
                    description: description,
                    timestamp: toolData.timestamp
                });
            }

            console.log(`✅ Agent activation tracked: ${handoffId}`);
        }
    }
}

// Handle CLI execution
if (require.main === module) {
    const recorder = new ToolUseRecorder();
    const args = process.argv.slice(2);
    
    recorder.run(args)
        .then(() => {
            // Exit silently on success (hook requirement)
        })
        .catch((error) => {
            // Exit silently on error (hook requirement)
            process.exit(0);
        });
}

module.exports = ToolUseRecorder;