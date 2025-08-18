// lib/commands/save-session-auto.js
// Auto-save session when Claude Code stops or agents complete work

const fs = require('fs-extra');
const path = require('path');

/**
 * Auto-save session handler for Claude Code hooks
 */
class SessionAutoSaver {
    constructor() {
        this.projectPath = process.cwd();
        this.logEnabled = false;
    }

    /**
     * Main execution function for auto-save
     */
    async run() {
        try {
            // Read hook input from stdin if available
            const hookInput = await this.readHookInput();
            
            this.log('info', 'Session auto-save triggered', { 
                trigger: hookInput ? 'hook' : 'manual',
                hookType: hookInput?.hook_type || 'unknown'
            });

            // Check if mega-minds is initialized in this project
            if (!await this.isMegaMindsProject()) {
                this.log('info', 'Not a mega-minds project, skipping auto-save');
                return;
            }

            console.log('💾 Auto-saving session...');

            // Initialize AIDevTeam to access session manager
            const AIDevTeam = require('../core/AIDevTeam');
            const team = new AIDevTeam(this.projectPath);
            await team.initialize();

            // Determine save description based on hook context
            const saveDescription = this.generateSaveDescription(hookInput);

            // Update session description if we have one
            if (team.sessions.currentSession) {
                const currentDesc = team.sessions.currentSession.description || '';
                const timestamp = new Date().toISOString().split('T')[0];
                
                // Append auto-save info to description
                team.sessions.currentSession.description = currentDesc.includes('Auto-saved') 
                    ? currentDesc 
                    : `${currentDesc} (Auto-saved ${timestamp})`;

                // Add hook context to session metadata
                if (hookInput) {
                    if (!team.sessions.currentSession.hookMetadata) {
                        team.sessions.currentSession.hookMetadata = [];
                    }
                    
                    team.sessions.currentSession.hookMetadata.push({
                        timestamp: new Date().toISOString(),
                        hookType: hookInput.hook_type,
                        trigger: hookInput.trigger || 'unknown',
                        description: saveDescription
                    });
                }
            }

            // Perform the save
            const sessionId = await team.sessions.saveActiveSession();
            
            if (sessionId) {
                console.log(`✅ Session auto-saved: ${sessionId}`);
                this.log('info', 'Session auto-save completed', { sessionId });

                // Show current session stats
                const status = team.sessions.getMemoryStatus();
                if (status.session) {
                    console.log(`📊 Session stats: ${status.session.handoffs} handoffs, ${status.session.workItems} work items`);
                }

                // Memory health check
                if (status.system.status === 'warning') {
                    console.log('⚠️ Memory usage is high - consider manual cleanup');
                } else if (status.system.status === 'critical') {
                    console.log('🚨 CRITICAL memory usage - cleanup recommended');
                    // Trigger automatic cleanup for critical memory
                    await team.sessions.forceMemoryCleanup();
                    console.log('🧹 Automatic memory cleanup performed');
                }

            } else {
                console.log('ℹ️ No active session to save');
                this.log('info', 'No active session to save');
            }

        } catch (error) {
            console.error('❌ Auto-save failed:', error.message);
            this.log('error', 'Session auto-save failed', { error: error.message });
            
            // Don't exit with error code for auto-save failures to avoid breaking hooks
            // Just log the error and continue
        }
    }

    /**
     * Generate appropriate save description based on hook context
     */
    generateSaveDescription(hookInput) {
        if (!hookInput) {
            return 'Manual session save';
        }

        const timestamp = new Date().toLocaleString();

        switch (hookInput.hook_type) {
            case 'Stop':
                return `Auto-saved on Claude Code stop (${timestamp})`;
            case 'SubagentStop':
                return `Auto-saved on agent completion (${timestamp})`;
            case 'SessionStart':
                return `Auto-saved on session start (${timestamp})`;
            default:
                return `Auto-saved on ${hookInput.hook_type} (${timestamp})`;
        }
    }

    /**
     * Check if this is a mega-minds enabled project
     */
    async isMegaMindsProject() {
        try {
            // Check for .claude directory
            const claudeDir = path.join(this.projectPath, '.claude');
            if (!await fs.pathExists(claudeDir)) {
                return false;
            }

            // Check for claude.md file (main mega-minds indicator)
            const claudeFile = path.join(claudeDir, 'claude.md');
            if (!await fs.pathExists(claudeFile)) {
                return false;
            }

            // Check package.json for mega-minds dependency
            const packageJsonPath = path.join(this.projectPath, 'package.json');
            if (await fs.pathExists(packageJsonPath)) {
                const packageJson = await fs.readJSON(packageJsonPath);
                const hasDependency = 
                    (packageJson.dependencies && packageJson.dependencies['mega-minds']) ||
                    (packageJson.devDependencies && packageJson.devDependencies['mega-minds']);
                
                return !!hasDependency;
            }

            // If we have .claude directory but no package.json, assume it's a mega-minds project
            return true;

        } catch (error) {
            this.log('warning', 'Error checking if mega-minds project', { error: error.message });
            return false;
        }
    }

    /**
     * Read hook input from stdin (when called by Claude Code hooks)
     */
    async readHookInput() {
        return new Promise((resolve) => {
            if (process.stdin.isTTY) {
                // Running manually, not from hook
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
                    this.log('debug', 'Hook input received', hookData);
                    resolve(hookData);
                } catch (error) {
                    this.log('warning', 'Failed to parse hook input', { input, error: error.message });
                    resolve(null);
                }
            });

            // Timeout after 1 second if no input
            setTimeout(() => {
                this.log('debug', 'Hook input timeout, proceeding without input');
                resolve(null);
            }, 1000);
        });
    }

    /**
     * Perform intelligent session cleanup if needed
     */
    async performIntelligentCleanup(team) {
        try {
            const status = team.sessions.getMemoryStatus();
            
            if (status.system.status === 'critical') {
                this.log('info', 'Performing emergency cleanup due to critical memory');
                await team.sessions.forceMemoryCleanup();
                
                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                    this.log('info', 'Forced garbage collection');
                }
                
                console.log('🧹 Emergency memory cleanup performed');
                return true;
            }
            
            return false;
        } catch (error) {
            this.log('warning', 'Intelligent cleanup failed', { error: error.message });
            return false;
        }
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
        const logMessage = `[${timestamp}] SessionAutoSave ${level.toUpperCase()}: ${message}`;
        
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
async function saveSessionAuto() {
    const saver = new SessionAutoSaver();
    
    // Enable logging if debug is set
    if (process.env.MEGA_MINDS_DEBUG || process.argv.includes('--debug')) {
        saver.enableLogging();
    }

    await saver.run();
}

module.exports = { saveSessionAuto, SessionAutoSaver };