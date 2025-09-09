#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Verifies that mega-minds is properly installed and configured
 * Run this after installation to ensure everything is set up correctly
 */

function verifyInstallation() {
    console.log('\n🔍 Verifying mega-minds installation...\n');
    
    let hasErrors = false;
    let hasWarnings = false;
    
    const projectPath = process.cwd();
    
    // 1. Check for package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        console.log('❌ No package.json found in current directory');
        console.log('   Run this command from your project root');
        return false;
    }
    console.log('✅ package.json found');
    
    // 2. Check if mega-minds is in dependencies
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const hasDependency = 
            (packageJson.dependencies && packageJson.dependencies['mega-minds']) ||
            (packageJson.devDependencies && packageJson.devDependencies['mega-minds']);
        
        if (!hasDependency) {
            console.log('❌ mega-minds not found in package.json dependencies');
            console.log('   Run: npm install mega-minds --save');
            hasErrors = true;
        } else {
            console.log('✅ mega-minds is in package.json dependencies');
        }
    } catch (error) {
        console.log('❌ Error reading package.json:', error.message);
        hasErrors = true;
    }
    
    // 3. Check if node_modules/mega-minds exists
    const megaMindsPath = path.join(projectPath, 'node_modules', 'mega-minds');
    if (!fs.existsSync(megaMindsPath)) {
        console.log('❌ mega-minds not installed in node_modules');
        console.log('   Run: npm install');
        hasErrors = true;
    } else {
        console.log('✅ mega-minds installed in node_modules');
        
        // Check core files
        const coreFiles = [
            'lib/core/SessionManager.js',
            'lib/core/AIDevTeam.js',
            'lib/core/AgentDispatcher.js',
            'lib/memory/TokenManager.js',
            'lib/memory/MemoryManager.js',
            'lib/memory/AgentStateTracker.js',
            'lib/utils/ContextCompressor.js',
            'lib/utils/RequestRouter.js'
        ];
        
        let missingCore = [];
        coreFiles.forEach(file => {
            const filePath = path.join(megaMindsPath, file);
            if (!fs.existsSync(filePath)) {
                missingCore.push(file);
            }
        });
        
        if (missingCore.length > 0) {
            console.log('❌ Missing core files:');
            missingCore.forEach(file => console.log(`   - ${file}`));
            console.log('   Reinstall mega-minds: npm reinstall mega-minds');
            hasErrors = true;
        } else {
            console.log('✅ All core files present');
        }
    }
    
    // 4. Check .claude directory
    const claudeDir = path.join(projectPath, '.claude');
    if (!fs.existsSync(claudeDir)) {
        console.log('❌ .claude directory not found');
        console.log('   Run: npx mega-minds init');
        hasErrors = true;
    } else {
        console.log('✅ .claude directory exists');
        
        // Check subdirectories
        const requiredDirs = ['agents', 'workflows'];
        requiredDirs.forEach(dir => {
            const dirPath = path.join(claudeDir, dir);
            if (!fs.existsSync(dirPath)) {
                console.log(`⚠️  Missing .claude/${dir} directory`);
                hasWarnings = true;
            }
        });
        
        // Check claude.md
        const claudeMdPath = path.join(claudeDir, 'claude.md');
        if (!fs.existsSync(claudeMdPath)) {
            console.log('❌ .claude/claude.md not found');
            console.log('   Run: npx mega-minds init');
            hasErrors = true;
        } else {
            console.log('✅ .claude/claude.md exists');
            
            // Check if it references node_modules
            const claudeMdContent = fs.readFileSync(claudeMdPath, 'utf8');
            if (!claudeMdContent.includes('node_modules/mega-minds')) {
                console.log('⚠️  claude.md may need updating to reference node_modules');
                console.log('   Consider re-running: npx mega-minds init');
                hasWarnings = true;
            }
        }
        
        // Count agents
        const agentsDir = path.join(claudeDir, 'agents');
        if (fs.existsSync(agentsDir)) {
            const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
            console.log(`✅ Found ${agentFiles.length} agent files`);
            
            if (agentFiles.length < 10) {
                console.log('⚠️  Fewer agents than expected. Consider re-initializing.');
                hasWarnings = true;
            }
        }
    }
    
    // 5. Check for .mega-minds directory (memory storage)
    const megaMindsMemoryDir = path.join(projectPath, '.mega-minds');
    if (fs.existsSync(megaMindsMemoryDir)) {
        console.log('✅ .mega-minds memory directory exists');
    } else {
        console.log('ℹ️  .mega-minds directory will be created on first use');
    }
    
    // 6. MEGA-MINDS 2.0: Verify Variable-Driven Agent System
    console.log('\n🔧 Verifying Variable-Driven Agent System...');
    const variableSystemCheck = verifyVariableSystem(projectPath, megaMindsPath);
    if (variableSystemCheck.hasErrors) {
        hasErrors = true;
    }
    if (variableSystemCheck.hasWarnings) {
        hasWarnings = true;
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    if (hasErrors) {
        console.log('\n❌ Installation has errors. Please fix the issues above.');
        return false;
    } else if (hasWarnings) {
        console.log('\n⚠️  Installation complete with warnings.');
        console.log('   The system should work but consider addressing the warnings.');
    } else {
        console.log('\n✅ Installation verified successfully!');
        console.log('\n🚀 Next steps:');
        console.log('   1. Start Claude Code in this directory');
        console.log('   2. Claude Code will read .claude/claude.md automatically');
        console.log('   3. Begin with: "@project-orchestrator I want to build..."');
    }
    
    return !hasErrors;
}

/**
 * MEGA-MINDS 2.0: Verify Variable-Driven Agent System components
 * @param {string} projectPath - Project root path
 * @param {string} megaMindsPath - Path to installed mega-minds package
 * @returns {object} Verification result with hasErrors and hasWarnings flags
 */
function verifyVariableSystem(projectPath, megaMindsPath) {
    let hasErrors = false;
    let hasWarnings = false;
    
    // Check for Variable System core files
    const variableSystemFiles = [
        'lib/variable-engine.js',
        'lib/template-adapter.js',
        'lib/project-context-analyzer.js',
        'lib/stack-profile-manager.js',
        'lib/section-manager.js',
        'lib/performance-monitor.js'
    ];
    
    for (const file of variableSystemFiles) {
        const filePath = path.join(megaMindsPath, file);
        if (!fs.existsSync(filePath)) {
            console.log(`❌ Variable System component missing: ${file}`);
            hasErrors = true;
        } else {
            console.log(`✅ ${file}`);
        }
    }
    
    // Check for CLI commands
    const cliCommands = [
        'lib/commands/variable-status.js',
        'lib/commands/performance-metrics.js',
        'lib/commands/cache-status.js'
    ];
    
    for (const command of cliCommands) {
        const commandPath = path.join(megaMindsPath, command);
        if (!fs.existsSync(commandPath)) {
            console.log(`⚠️  Variable System CLI command missing: ${command}`);
            hasWarnings = true;
        } else {
            console.log(`✅ ${command}`);
        }
    }
    
    // Test Variable System functionality
    try {
        console.log('🧪 Testing Variable System functionality...');
        
        // Try to require core components
        const { ContextualVariableEngine } = require(path.join(megaMindsPath, 'lib/variable-engine.js'));
        const { ProjectContextAnalyzer } = require(path.join(megaMindsPath, 'lib/project-context-analyzer.js'));
        const { TemplateAdapter } = require(path.join(megaMindsPath, 'lib/template-adapter.js'));
        
        // Test instantiation
        const variableEngine = new ContextualVariableEngine(projectPath);
        const projectAnalyzer = new ProjectContextAnalyzer(projectPath);
        const templateAdapter = new TemplateAdapter(projectPath);
        
        console.log('✅ Variable System components load successfully');
        
        // Test basic functionality with proper context
        const testContext = {
            session: { id: 'test-session', environment: 'test' },
            project: { name: 'test-project' },
            memory: {},
            activeAgents: { count: 0 }
        };
        const testVariables = variableEngine.generateVariables('test-agent', 'full', testContext);
        if (Object.keys(testVariables).length > 0) {
            console.log(`✅ Variable generation working (${Object.keys(testVariables).length} variables)`);
        } else {
            console.log('⚠️  Variable generation returned no variables');
            hasWarnings = true;
        }
        
    } catch (error) {
        console.log(`❌ Variable System functionality test failed: ${error.message}`);
        hasErrors = true;
    }
    
    // Check if templates have been processed with Variable System
    const claudeDir = path.join(projectPath, '.claude');
    if (fs.existsSync(claudeDir)) {
        const agentsDir = path.join(claudeDir, 'agents');
        if (fs.existsSync(agentsDir)) {
            const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
            
            if (agentFiles.length > 0) {
                // Check a sample agent file to see if it has variable replacements
                const sampleAgent = path.join(agentsDir, agentFiles[0]);
                const content = fs.readFileSync(sampleAgent, 'utf8');
                
                if (content.includes('{{') && content.includes('}}')) {
                    console.log('⚠️  Agent templates contain unreplaced variables');
                    console.log('   Templates may not be adapted to your tech stack');
                    hasWarnings = true;
                } else {
                    console.log('✅ Agent templates appear to be processed');
                }
            }
        }
    }
    
    return { hasErrors, hasWarnings };
}

// Export for use as module
module.exports = { verifyInstallation, verifyVariableSystem };

// Run if called directly
if (require.main === module) {
    const success = verifyInstallation();
    process.exit(success ? 0 : 1);
}