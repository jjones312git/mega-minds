// lib/commands/setup-hooks.js
// Setup Claude Code hooks for mega-minds automation

const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

/**
 * Setup Claude Code hooks for mega-minds workflow automation
 */
class HookSetup {
    constructor() {
        this.projectPath = process.cwd();
        this.claudeSettingsPath = path.join(this.projectPath, '.claude', 'settings.json');
        this.localSettingsPath = path.join(this.projectPath, '.claude', 'settings.local.json');
    }

    /**
     * Main setup workflow
     */
    async run() {
        console.log('🔗 Claude Code Hooks Setup for Mega-Minds');
        console.log('==========================================\n');

        // Check if .claude directory exists
        const claudeDir = path.join(this.projectPath, '.claude');
        if (!await fs.pathExists(claudeDir)) {
            console.log('❌ .claude directory not found. Please run "mega-minds init" first.');
            return;
        }

        // Ask user what hooks they want to enable
        const answers = await this.promptUserPreferences();

        // Generate hook configuration
        const hookConfig = this.generateHookConfiguration(answers);

        // Choose where to save (project vs local)
        const saveLocation = await this.promptSaveLocation();

        // Save configuration
        await this.saveHookConfiguration(hookConfig, saveLocation);

        // Show success message with next steps
        this.showSuccessMessage(saveLocation, answers);
    }

    /**
     * Prompt user for hook preferences
     */
    async promptUserPreferences() {
        const questions = [
            {
                type: 'checkbox',
                name: 'enabledHooks',
                message: 'Which Claude Code hooks would you like to enable?',
                choices: [
                    {
                        name: 'Quality Gates - Auto-run tests and code review after Edit/Write',
                        value: 'qualityGates',
                        checked: true
                    },
                    {
                        name: 'Session Auto-Save - Save session when agents stop',
                        value: 'sessionAutoSave',
                        checked: true
                    },
                    {
                        name: 'Context Preservation - Smart memory cleanup before compaction',
                        value: 'contextPreservation',
                        checked: true
                    },
                    {
                        name: 'Development Notifications - Desktop alerts for key events',
                        value: 'notifications',
                        checked: false
                    }
                ]
            },
            {
                type: 'confirm',
                name: 'enableDebugLogging',
                message: 'Enable debug logging for hooks?',
                default: false
            }
        ];

        return await inquirer.prompt(questions);
    }

    /**
     * Prompt user for save location
     */
    async promptSaveLocation() {
        const questions = [
            {
                type: 'list',
                name: 'location',
                message: 'Where should the hook configuration be saved?',
                choices: [
                    {
                        name: 'Project (.claude/settings.local.json) - Not committed to git',
                        value: 'local'
                    },
                    {
                        name: 'Project (.claude/settings.json) - Shared with team',
                        value: 'project'
                    }
                ],
                default: 'local'
            }
        ];

        const answer = await inquirer.prompt(questions);
        return answer.location;
    }

    /**
     * Generate hook configuration based on user preferences
     */
    generateHookConfiguration(answers) {
        const config = {
            hooks: {}
        };

        if (answers.enabledHooks.includes('qualityGates')) {
            config.hooks.PostToolUse = [
                {
                    matcher: "(Edit|Write|MultiEdit)",
                    hooks: [
                        {
                            type: "command",
                            command: "npx mega-minds trigger-quality-gates"
                        }
                    ]
                }
            ];
        }

        if (answers.enabledHooks.includes('sessionAutoSave')) {
            config.hooks.Stop = [
                {
                    matcher: "",
                    hooks: [
                        {
                            type: "command",
                            command: "npx mega-minds save-session-auto"
                        }
                    ]
                }
            ];

            config.hooks.SubagentStop = [
                {
                    matcher: "",
                    hooks: [
                        {
                            type: "command",
                            command: "npx mega-minds save-session-auto"
                        }
                    ]
                }
            ];
        }

        if (answers.enabledHooks.includes('contextPreservation')) {
            config.hooks.PreCompact = [
                {
                    matcher: "",
                    hooks: [
                        {
                            type: "command",
                            command: "npx mega-minds preserve-context"
                        }
                    ]
                }
            ];
        }

        if (answers.enabledHooks.includes('notifications')) {
            // Add platform-specific notification commands
            const notificationCommand = process.platform === 'darwin' 
                ? 'osascript -e \'display notification "Mega-minds agent completed work" with title "Claude Code"\''
                : process.platform === 'win32'
                ? 'powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show(\'Agent completed work\', \'Mega-minds\')"'
                : 'notify-send "Mega-minds" "Agent completed work"';

            config.hooks.SubagentStop = config.hooks.SubagentStop || [];
            config.hooks.SubagentStop.push({
                matcher: "",
                hooks: [
                    {
                        type: "command",
                        command: notificationCommand
                    }
                ]
            });
        }

        // Add debug logging if requested
        if (answers.enableDebugLogging) {
            config.megaMindsHookConfig = {
                debugLogging: true,
                version: "1.0.0"
            };
        }

        return config;
    }

    /**
     * Save hook configuration to specified location
     */
    async saveHookConfiguration(config, location) {
        const filePath = location === 'local' ? this.localSettingsPath : this.claudeSettingsPath;
        
        // Ensure .claude directory exists
        await fs.ensureDir(path.dirname(filePath));

        // Merge with existing configuration if it exists
        let existingConfig = {};
        if (await fs.pathExists(filePath)) {
            try {
                existingConfig = await fs.readJSON(filePath);
            } catch (error) {
                console.warn('⚠️ Could not read existing configuration, creating new file');
            }
        }

        // Merge configurations (new hooks override existing ones)
        const mergedConfig = {
            ...existingConfig,
            hooks: {
                ...existingConfig.hooks,
                ...config.hooks
            }
        };

        // Add mega-minds specific config if provided
        if (config.megaMindsHookConfig) {
            mergedConfig.megaMindsHookConfig = config.megaMindsHookConfig;
        }

        // Save configuration
        await fs.writeJSON(filePath, mergedConfig, { spaces: 2 });
        console.log(`✅ Hook configuration saved to: ${path.relative(this.projectPath, filePath)}`);
    }

    /**
     * Show success message and next steps
     */
    showSuccessMessage(saveLocation, answers) {
        console.log('\n🎉 Claude Code hooks setup complete!\n');

        console.log('📋 Enabled Features:');
        answers.enabledHooks.forEach(hook => {
            switch (hook) {
                case 'qualityGates':
                    console.log('   ✅ Quality Gates - Auto-testing after code changes');
                    break;
                case 'sessionAutoSave':
                    console.log('   ✅ Session Auto-Save - Persistent development sessions');
                    break;
                case 'contextPreservation':
                    console.log('   ✅ Context Preservation - Smart memory management');
                    break;
                case 'notifications':
                    console.log('   ✅ Desktop Notifications - Real-time alerts');
                    break;
            }
        });

        console.log('\n🚀 Next Steps:');
        console.log('1. Restart Claude Code to activate hooks');
        console.log('2. Begin development - hooks will trigger automatically');
        console.log('3. Use "mega-minds hook-status" to monitor hook activity');

        console.log('\n🔧 Management Commands:');
        console.log('   mega-minds hook-status          - Check hook configuration');
        console.log('   mega-minds trigger-quality-gates - Manual quality gate run');
        console.log('   mega-minds preserve-context     - Manual context preservation');

        if (saveLocation === 'local') {
            console.log('\n📝 Note: Configuration saved to .claude/settings.local.json (not committed to git)');
        } else {
            console.log('\n📝 Note: Configuration saved to .claude/settings.json (shared with team)');
        }

        console.log('\n⚠️ Important: Hooks execute shell commands. Review the configuration file if needed.');
    }

    /**
     * Check if hooks are already configured
     */
    async isAlreadyConfigured() {
        const localExists = await fs.pathExists(this.localSettingsPath);
        const projectExists = await fs.pathExists(this.claudeSettingsPath);

        if (localExists || projectExists) {
            try {
                const config = localExists 
                    ? await fs.readJSON(this.localSettingsPath)
                    : await fs.readJSON(this.claudeSettingsPath);
                
                return !!(config.hooks && Object.keys(config.hooks).length > 0);
            } catch (error) {
                return false;
            }
        }

        return false;
    }
}

/**
 * Export the setup function for CLI usage
 */
async function setupHooks() {
    const setup = new HookSetup();
    
    // Check if already configured and ask user
    if (await setup.isAlreadyConfigured()) {
        const { proceed } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'proceed',
                message: 'Hooks are already configured. Do you want to reconfigure them?',
                default: false
            }
        ]);

        if (!proceed) {
            console.log('🔗 Hook setup cancelled. Use "mega-minds hook-status" to view current configuration.');
            return;
        }
    }

    await setup.run();
}

module.exports = { setupHooks, HookSetup };