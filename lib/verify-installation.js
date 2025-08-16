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

// Export for use as module
module.exports = { verifyInstallation };

// Run if called directly
if (require.main === module) {
    const success = verifyInstallation();
    process.exit(success ? 0 : 1);
}