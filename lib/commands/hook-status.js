// lib/commands/hook-status.js
// Display Claude Code hooks status and configuration

const fs = require('fs-extra');
const path = require('path');
const HookManager = require('../core/HookManager');

/**
 * Display comprehensive hook status information
 */
async function showHookStatus() {
    console.log('🔗 Claude Code Hooks Status');
    console.log('===========================\n');

    const projectPath = process.cwd();
    
    // Initialize HookManager to check status
    const hookManager = new HookManager();
    await hookManager.initialize();
    
    const status = hookManager.getHookStatus();

    // Display basic status
    console.log('📊 Basic Status:');
    console.log(`   Hooks Enabled: ${status.enabled ? '✅ Yes' : '❌ No'}`);
    console.log(`   Config File: ${status.configPath ? path.relative(projectPath, status.configPath) : 'Not found'}`);
    console.log(`   Session Manager: ${status.sessionManagerConnected ? '✅ Connected' : '⚠️ Not connected'}`);

    if (!status.enabled) {
        console.log('\n💡 To enable hooks, run: mega-minds setup-hooks');
        return;
    }

    // Display detailed configuration
    await showDetailedConfiguration(status.configPath, projectPath);

    // Show supported hooks
    console.log('\n🛠️ Supported Hook Types:');
    status.supportedHooks.forEach(hookType => {
        console.log(`   • ${hookType}`);
    });

    // Show mega-minds specific commands
    console.log('\n🤖 Mega-Minds Hook Commands:');
    const commands = [
        'npx mega-minds trigger-quality-gates',
        'npx mega-minds save-session-auto', 
        'npx mega-minds preserve-context'
    ];
    
    commands.forEach(cmd => {
        console.log(`   • ${cmd}`);
    });

    // Check if commands exist
    await checkCommandAvailability();
}

/**
 * Show detailed hook configuration
 */
async function showDetailedConfiguration(configPath, projectPath) {
    try {
        const config = await fs.readJSON(configPath);
        
        if (!config.hooks || Object.keys(config.hooks).length === 0) {
            console.log('\n⚠️ No hooks configured in settings file');
            return;
        }

        console.log('\n⚙️ Active Hook Configuration:');
        
        Object.entries(config.hooks).forEach(([hookType, hookConfigs]) => {
            console.log(`\n   📌 ${hookType}:`);
            
            hookConfigs.forEach((hookConfig, index) => {
                console.log(`      ${index + 1}. Matcher: "${hookConfig.matcher || 'any'}"`);
                
                if (hookConfig.hooks && hookConfig.hooks.length > 0) {
                    hookConfig.hooks.forEach((hook, hookIndex) => {
                        console.log(`         Command: ${hook.command}`);
                    });
                }
            });
        });

        // Show mega-minds specific configuration
        if (config.megaMindsHookConfig) {
            console.log('\n🤖 Mega-Minds Configuration:');
            console.log(`   Debug Logging: ${config.megaMindsHookConfig.debugLogging ? '✅ Enabled' : '❌ Disabled'}`);
            console.log(`   Config Version: ${config.megaMindsHookConfig.version || 'Unknown'}`);
        }

    } catch (error) {
        console.log('\n⚠️ Could not read hook configuration:', error.message);
    }
}

/**
 * Check if mega-minds hook commands are available
 */
async function checkCommandAvailability() {
    console.log('\n🔍 Command Availability Check:');
    
    const commandsToCheck = [
        { name: 'trigger-quality-gates', file: 'lib/commands/trigger-quality-gates.js' },
        { name: 'save-session-auto', file: 'lib/commands/save-session-auto.js' },
        { name: 'preserve-context', file: 'lib/commands/preserve-context.js' }
    ];

    for (const cmd of commandsToCheck) {
        const cmdPath = path.join(__dirname, '..', '..', cmd.file);
        const exists = await fs.pathExists(cmdPath);
        
        console.log(`   ${cmd.name}: ${exists ? '✅ Available' : '⚠️ Not implemented yet'}`);
    }
}

/**
 * Show hook testing information
 */
async function showTestingInfo() {
    console.log('\n🧪 Testing Your Hooks:');
    console.log('1. Make a code change with Claude Code (Edit/Write tool)');
    console.log('2. Check if quality gates trigger automatically');
    console.log('3. Stop Claude Code session and check if auto-save occurs');
    console.log('4. Monitor console output for hook execution logs');
    
    console.log('\n📝 Troubleshooting:');
    console.log('• Hooks not triggering? Restart Claude Code');
    console.log('• Commands failing? Check file permissions');
    console.log('• Need more info? Enable debug logging in setup');
}

/**
 * Main export function
 */
async function hookStatus() {
    try {
        await showHookStatus();
        await showTestingInfo();
    } catch (error) {
        console.error('❌ Error checking hook status:', error.message);
        console.log('\n💡 Try running "mega-minds setup-hooks" to initialize hook configuration');
    }
}

module.exports = { hookStatus };