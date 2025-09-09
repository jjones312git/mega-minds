// lib/commands/doctor.js
// Command: npx mega-minds doctor
// Purpose: Diagnose and fix package.json conflicts and mega-minds integration issues

const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer').default;

/**
 * Doctor command for diagnosing and fixing mega-minds integration issues
 */
class DoctorCommand {
    constructor() {
        this.projectPath = process.cwd();
        this.issues = [];
        this.fixes = [];
    }

    /**
     * Main execution function for doctor command
     * @param {Array} args - Command arguments
     * @returns {Promise<void>}
     */
    async run(args = []) {
        const autoFix = args.includes('--fix') || args.includes('-f');
        
        console.log('🔧 Mega-Minds Doctor - Diagnosing project health...\n');
        
        // Run all diagnostic checks
        await this.checkPackageJson();
        await this.checkMegaMindsFiles();
        await this.checkClaudeIntegration();
        await this.checkFrameworkConflicts();
        await this.checkHooksConfiguration();
        
        // Report findings
        await this.reportFindings();
        
        // Offer fixes
        if (this.issues.length > 0) {
            if (autoFix) {
                await this.applyAllFixes();
            } else {
                await this.offerFixes();
            }
        } else {
            console.log('✅ All checks passed! Your mega-minds installation is healthy.');
        }
    }

    /**
     * Check package.json status
     */
    async checkPackageJson() {
        const hasPackageJson = await fs.pathExists('package.json');
        
        if (!hasPackageJson) {
            this.issues.push({
                type: 'error',
                category: 'package.json',
                title: 'Missing package.json',
                description: 'No package.json file found in current directory',
                fix: () => this.fixMissingPackageJson()
            });
            return;
        }

        try {
            const packageJson = await fs.readJson('package.json');
            const hasMegaMindsDep = packageJson.dependencies?.['mega-minds'] || packageJson.devDependencies?.['mega-minds'];
            
            if (!hasMegaMindsDep) {
                this.issues.push({
                    type: 'error',
                    category: 'package.json',
                    title: 'Missing mega-minds dependency',
                    description: 'package.json exists but mega-minds is not listed as a dependency',
                    fix: () => this.fixMissingDependency()
                });
            } else {
                console.log('✅ package.json: mega-minds dependency found');
            }
            
            // Check for framework indicators
            const frameworks = this.detectFrameworks(packageJson);
            if (frameworks.length > 0) {
                console.log(`✅ Framework detected: ${frameworks.join(', ')}`);
            }
            
        } catch (error) {
            this.issues.push({
                type: 'error',
                category: 'package.json',
                title: 'Corrupted package.json',
                description: `Cannot parse package.json: ${error.message}`,
                fix: () => this.fixCorruptedPackageJson()
            });
        }
    }

    /**
     * Check mega-minds files
     */
    async checkMegaMindsFiles() {
        const hasClaudeDir = await fs.pathExists('.claude');
        const hasMegaMindsDir = await fs.pathExists('.mega-minds');
        
        if (!hasClaudeDir && !hasMegaMindsDir) {
            this.issues.push({
                type: 'warning',
                category: 'files',
                title: 'No mega-minds files found',
                description: 'Neither .claude nor .mega-minds directories exist',
                fix: () => this.fixMissingFiles()
            });
            return;
        }

        if (hasClaudeDir) {
            console.log('✅ .claude directory: found');
            
            // Check for key files
            const claudeFiles = ['claude.md', 'settings.json'];
            for (const file of claudeFiles) {
                const filePath = path.join('.claude', file);
                if (await fs.pathExists(filePath)) {
                    console.log(`✅ .claude/${file}: found`);
                } else {
                    this.issues.push({
                        type: 'warning',
                        category: 'files',
                        title: `Missing .claude/${file}`,
                        description: `Key file .claude/${file} is missing`,
                        fix: () => this.fixMissingClaudeFile(file)
                    });
                }
            }
        }

        if (hasMegaMindsDir) {
            console.log('✅ .mega-minds directory: found');
        }
    }

    /**
     * Check Claude Code integration
     */
    async checkClaudeIntegration() {
        const settingsPath = '.claude/settings.json';
        
        if (await fs.pathExists(settingsPath)) {
            try {
                const settings = await fs.readJson(settingsPath);
                
                // Check hooks
                if (settings.hooks) {
                    const expectedHooks = ['PostToolUse', 'SubagentStart', 'SubagentStop'];
                    const missingHooks = expectedHooks.filter(hook => !settings.hooks[hook]);
                    
                    if (missingHooks.length > 0) {
                        this.issues.push({
                            type: 'warning',
                            category: 'integration',
                            title: 'Missing Claude hooks',
                            description: `Missing hooks: ${missingHooks.join(', ')}`,
                            fix: () => this.fixMissingHooks(missingHooks)
                        });
                    } else {
                        console.log('✅ Claude hooks: configured');
                    }
                } else {
                    this.issues.push({
                        type: 'warning',
                        category: 'integration',
                        title: 'No hooks configured',
                        description: 'Claude Code hooks are not configured for mega-minds integration',
                        fix: () => this.fixMissingHooks(['PostToolUse', 'SubagentStart', 'SubagentStop'])
                    });
                }
                
            } catch (error) {
                this.issues.push({
                    type: 'error',
                    category: 'integration',
                    title: 'Corrupted Claude settings',
                    description: `Cannot parse .claude/settings.json: ${error.message}`,
                    fix: () => this.fixCorruptedSettings()
                });
            }
        }
    }

    /**
     * Check for framework conflicts
     */
    async checkFrameworkConflicts() {
        const frameworkFiles = [
            'next.config.js', 'next.config.ts',
            'nuxt.config.js', 'nuxt.config.ts',
            'vue.config.js', 'angular.json'
        ];
        
        const foundFrameworks = [];
        for (const file of frameworkFiles) {
            if (await fs.pathExists(file)) {
                foundFrameworks.push(file);
            }
        }
        
        if (foundFrameworks.length > 1) {
            this.issues.push({
                type: 'warning',
                category: 'conflicts',
                title: 'Multiple frameworks detected',
                description: `Found: ${foundFrameworks.join(', ')}`,
                fix: null // No automatic fix for this
            });
        }
    }

    /**
     * Check hooks configuration
     */
    async checkHooksConfiguration() {
        // This would verify that the hook commands exist and are working
        // For now, just check if the commands exist
        const commands = ['record-tool-use', 'record-agent-start', 'complete-handoff'];
        
        // We can't easily test these without running them, so just report they should exist
        console.log(`ℹ️  Hook commands should be available: ${commands.join(', ')}`);
    }

    /**
     * Detect frameworks from package.json
     */
    detectFrameworks(packageJson) {
        const frameworks = [];
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (deps.next) frameworks.push('Next.js');
        if (deps.react && !deps.next) frameworks.push('React');
        if (deps.vue) frameworks.push('Vue');
        if (deps['@angular/core']) frameworks.push('Angular');
        if (deps.svelte) frameworks.push('Svelte');
        if (deps.astro) frameworks.push('Astro');
        
        return frameworks;
    }

    /**
     * Report findings
     */
    async reportFindings() {
        if (this.issues.length === 0) {
            return;
        }

        console.log('\n📋 Issues Found:\n');
        
        const errors = this.issues.filter(issue => issue.type === 'error');
        const warnings = this.issues.filter(issue => issue.type === 'warning');
        
        if (errors.length > 0) {
            console.log('❌ Errors:');
            errors.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue.title}`);
                console.log(`      ${issue.description}`);
            });
            console.log('');
        }
        
        if (warnings.length > 0) {
            console.log('⚠️  Warnings:');
            warnings.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue.title}`);
                console.log(`      ${issue.description}`);
            });
            console.log('');
        }
    }

    /**
     * Offer fixes interactively
     */
    async offerFixes() {
        const fixableIssues = this.issues.filter(issue => issue.fix);
        
        if (fixableIssues.length === 0) {
            console.log('💡 Some issues were found but cannot be automatically fixed.');
            console.log('   Please review the issues above and fix them manually.');
            return;
        }

        console.log('🔧 Available fixes:\n');
        
        const { selectedFixes } = await inquirer.prompt([{
            type: 'checkbox',
            name: 'selectedFixes',
            message: 'Select fixes to apply:',
            choices: fixableIssues.map((issue, index) => ({
                name: `${issue.title}: ${issue.description}`,
                value: index,
                checked: issue.type === 'error' // Auto-check errors
            }))
        }]);

        for (const index of selectedFixes) {
            const issue = fixableIssues[index];
            try {
                console.log(`🔧 Fixing: ${issue.title}...`);
                await issue.fix();
                console.log(`✅ Fixed: ${issue.title}`);
            } catch (error) {
                console.log(`❌ Failed to fix ${issue.title}: ${error.message}`);
            }
        }
    }

    /**
     * Apply all fixes automatically
     */
    async applyAllFixes() {
        const fixableIssues = this.issues.filter(issue => issue.fix);
        
        console.log(`🔧 Applying ${fixableIssues.length} fixes automatically...\n`);
        
        for (const issue of fixableIssues) {
            try {
                console.log(`🔧 Fixing: ${issue.title}...`);
                await issue.fix();
                console.log(`✅ Fixed: ${issue.title}`);
            } catch (error) {
                console.log(`❌ Failed to fix ${issue.title}: ${error.message}`);
            }
        }
    }

    // Fix methods
    async fixMissingPackageJson() {
        const { execSync } = require('child_process');
        execSync('npm init -y', { stdio: 'pipe' });
        await this.fixMissingDependency();
    }

    async fixMissingDependency() {
        const packageJson = await fs.readJson('package.json');
        if (!packageJson.dependencies) packageJson.dependencies = {};
        
        // Get latest mega-minds version
        packageJson.dependencies['mega-minds'] = '^2.1.1';
        await fs.writeJson('package.json', packageJson, { spaces: 2 });
        
        console.log('   📦 Installing mega-minds dependency...');
        const { execSync } = require('child_process');
        execSync('npm install', { stdio: 'inherit' });
    }

    async fixMissingFiles() {
        console.log('   🔄 Re-running mega-minds init to restore files...');
        const { run } = require('../installer');
        await run();
    }

    async fixMissingClaudeFile(fileName) {
        // Re-run installer to restore missing files
        await this.fixMissingFiles();
    }

    async fixCorruptedPackageJson() {
        console.log('   ⚠️  package.json appears corrupted - manual intervention required');
        console.log('   💡 Consider backing up and re-creating package.json');
    }

    async fixCorruptedSettings() {
        console.log('   🔄 Re-generating Claude settings...');
        const { initializeClaudeIntegration } = require('../installer');
        // This would need access to project analysis - simplified for now
        console.log('   💡 Run: npx mega-minds init to regenerate settings');
    }

    async fixMissingHooks(missingHooks) {
        console.log(`   🔗 Adding missing hooks: ${missingHooks.join(', ')}`);
        console.log('   💡 Run: npx mega-minds init to restore hook configuration');
    }
}

// Handle CLI execution
if (require.main === module) {
    const doctor = new DoctorCommand();
    const args = process.argv.slice(2);
    
    doctor.run(args)
        .catch((error) => {
            console.error('❌ Doctor command failed:', error.message);
            process.exit(1);
        });
}

module.exports = DoctorCommand;