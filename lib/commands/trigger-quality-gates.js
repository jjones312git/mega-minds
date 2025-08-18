// lib/commands/trigger-quality-gates.js
// Trigger quality gates after Edit/Write operations

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Quality gate runner for automated checks after code changes
 */
class QualityGateRunner {
    constructor() {
        this.projectPath = process.cwd();
        this.logEnabled = false;
        this.qualityGates = [
            {
                name: 'Code Review Check',
                description: 'Basic code quality validation',
                enabled: true,
                command: null // Will use built-in logic
            },
            {
                name: 'Test Runner',
                description: 'Run available test suite',
                enabled: true,
                command: this.detectTestCommand()
            },
            {
                name: 'Linter',
                description: 'Code style and syntax checking',
                enabled: true,
                command: this.detectLintCommand()
            },
            {
                name: 'Type Checker',
                description: 'Type checking if available',
                enabled: true,
                command: this.detectTypeCheckCommand()
            }
        ];
    }

    /**
     * Main execution function for quality gates
     */
    async run() {
        try {
            // Read hook input from stdin if available
            const hookInput = await this.readHookInput();
            
            this.log('info', 'Quality gates triggered', { 
                trigger: hookInput ? 'hook' : 'manual',
                tool: hookInput?.tool_name || 'unknown'
            });

            console.log('🛡️ Running Quality Gates...');
            console.log('==========================\n');

            let overallSuccess = true;
            const results = [];

            // Run each enabled quality gate
            for (const gate of this.qualityGates) {
                if (!gate.enabled) {
                    this.log('info', `Skipping disabled gate: ${gate.name}`);
                    continue;
                }

                console.log(`🔍 ${gate.name}...`);
                
                const result = await this.runQualityGate(gate);
                results.push(result);

                if (result.success) {
                    console.log(`   ✅ ${gate.description} - PASSED`);
                } else {
                    console.log(`   ❌ ${gate.description} - FAILED`);
                    if (result.output) {
                        console.log(`   📝 ${result.output}`);
                    }
                    overallSuccess = false;
                }
            }

            // Summary
            console.log('\n📊 Quality Gate Summary:');
            console.log(`   Total Gates: ${results.length}`);
            console.log(`   Passed: ${results.filter(r => r.success).length}`);
            console.log(`   Failed: ${results.filter(r => !r.success).length}`);

            if (overallSuccess) {
                console.log('\n🎉 All quality gates PASSED! Code is ready for deployment.');
                this.log('info', 'All quality gates passed');
                process.exit(0);
            } else {
                console.log('\n⚠️ Some quality gates FAILED. Please fix issues before proceeding.');
                this.log('warning', 'Some quality gates failed', { failedGates: results.filter(r => !r.success).map(r => r.name) });
                process.exit(1);
            }

        } catch (error) {
            console.error('❌ Quality gate execution failed:', error.message);
            this.log('error', 'Quality gate execution failed', { error: error.message });
            process.exit(1);
        }
    }

    /**
     * Run a single quality gate
     */
    async runQualityGate(gate) {
        try {
            if (gate.name === 'Code Review Check') {
                return await this.runCodeReviewCheck();
            }

            if (!gate.command) {
                return {
                    name: gate.name,
                    success: true,
                    output: 'No command configured - skipped',
                    skipped: true
                };
            }

            // Execute the command
            const output = execSync(gate.command, { 
                cwd: this.projectPath,
                encoding: 'utf8',
                timeout: 30000 // 30 second timeout
            });

            return {
                name: gate.name,
                success: true,
                output: output.trim()
            };

        } catch (error) {
            return {
                name: gate.name,
                success: false,
                output: error.message,
                error: error
            };
        }
    }

    /**
     * Built-in code review check
     */
    async runCodeReviewCheck() {
        try {
            const issues = [];

            // Check for common code quality issues
            const jsFiles = await this.findRecentlyModifiedFiles(['.js', '.ts', '.jsx', '.tsx']);
            
            for (const file of jsFiles) {
                const content = await fs.readFile(file, 'utf8');
                
                // Basic checks
                if (content.includes('console.log')) {
                    issues.push(`${file}: Contains console.log statements`);
                }
                
                if (content.includes('TODO') || content.includes('FIXME')) {
                    issues.push(`${file}: Contains TODO/FIXME comments`);
                }

                if (content.includes('debugger')) {
                    issues.push(`${file}: Contains debugger statements`);
                }

                // Check for very long lines (basic)
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    if (line.length > 120) {
                        issues.push(`${file}:${index + 1}: Line too long (${line.length} chars)`);
                    }
                });
            }

            if (issues.length > 0) {
                return {
                    name: 'Code Review Check',
                    success: false,
                    output: issues.slice(0, 5).join(', ') + (issues.length > 5 ? '...' : '')
                };
            }

            return {
                name: 'Code Review Check',
                success: true,
                output: `Checked ${jsFiles.length} files - no issues found`
            };

        } catch (error) {
            return {
                name: 'Code Review Check',
                success: false,
                output: `Code review check failed: ${error.message}`
            };
        }
    }

    /**
     * Find recently modified files with given extensions
     */
    async findRecentlyModifiedFiles(extensions, maxFiles = 10) {
        try {
            const files = [];
            
            // Simple implementation - look for files in common directories
            const dirsToCheck = ['src', 'lib', 'components', 'pages', 'utils', '.'];
            
            for (const dir of dirsToCheck) {
                const dirPath = path.join(this.projectPath, dir);
                if (await fs.pathExists(dirPath)) {
                    const dirFiles = await fs.readdir(dirPath);
                    
                    for (const file of dirFiles) {
                        const filePath = path.join(dirPath, file);
                        const stat = await fs.stat(filePath);
                        
                        if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
                            files.push({
                                path: filePath,
                                mtime: stat.mtime
                            });
                        }
                    }
                }
            }

            // Sort by modification time, most recent first
            files.sort((a, b) => b.mtime - a.mtime);
            
            return files.slice(0, maxFiles).map(f => f.path);

        } catch (error) {
            this.log('warning', 'Error finding modified files', { error: error.message });
            return [];
        }
    }

    /**
     * Detect available test command
     */
    detectTestCommand() {
        try {
            const packageJsonPath = path.join(this.projectPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                
                if (packageJson.scripts) {
                    if (packageJson.scripts.test) {
                        return 'npm test';
                    }
                    if (packageJson.scripts['test:unit']) {
                        return 'npm run test:unit';
                    }
                }

                // Check for common test frameworks
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                if (deps.jest) return 'npx jest --passWithNoTests';
                if (deps.mocha) return 'npx mocha';
                if (deps.vitest) return 'npx vitest run';
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Detect available lint command
     */
    detectLintCommand() {
        try {
            const packageJsonPath = path.join(this.projectPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                
                if (packageJson.scripts) {
                    if (packageJson.scripts.lint) {
                        return 'npm run lint';
                    }
                    if (packageJson.scripts['lint:check']) {
                        return 'npm run lint:check';
                    }
                }

                // Check for common linters
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                if (deps.eslint) return 'npx eslint . --max-warnings 0';
                if (deps.prettier) return 'npx prettier --check .';
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Detect available type check command
     */
    detectTypeCheckCommand() {
        try {
            const packageJsonPath = path.join(this.projectPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                
                if (packageJson.scripts) {
                    if (packageJson.scripts['type-check']) {
                        return 'npm run type-check';
                    }
                    if (packageJson.scripts.typecheck) {
                        return 'npm run typecheck';
                    }
                }

                // Check for TypeScript
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                if (deps.typescript && fs.existsSync(path.join(this.projectPath, 'tsconfig.json'))) {
                    return 'npx tsc --noEmit';
                }
            }

            return null;
        } catch (error) {
            return null;
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
                    resolve(hookData);
                } catch (error) {
                    resolve(null);
                }
            });

            // Timeout after 1 second if no input
            setTimeout(() => resolve(null), 1000);
        });
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
        const logMessage = `[${timestamp}] QualityGates ${level.toUpperCase()}: ${message}`;
        
        console.log(logMessage, data);
    }
}

/**
 * Main export function for CLI usage
 */
async function triggerQualityGates() {
    const runner = new QualityGateRunner();
    
    // Enable logging if debug is set
    if (process.env.MEGA_MINDS_DEBUG || process.argv.includes('--debug')) {
        runner.enableLogging();
    }

    await runner.run();
}

module.exports = { triggerQualityGates, QualityGateRunner };