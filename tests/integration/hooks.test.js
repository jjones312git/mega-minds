// tests/integration/hooks.test.js
// Integration tests for Claude Code hooks functionality

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Import our hook modules
const { HookSetup } = require('../../lib/commands/setup-hooks');
const { QualityGateRunner } = require('../../lib/commands/trigger-quality-gates');
const { SessionAutoSaver } = require('../../lib/commands/save-session-auto');
const { ContextPreserver } = require('../../lib/commands/preserve-context');
const HookManager = require('../../lib/core/HookManager');

describe('Claude Code Hooks Integration', () => {
    let testProjectPath;
    let originalCwd;

    beforeEach(async () => {
        // Create a temporary test project
        originalCwd = process.cwd();
        testProjectPath = path.join(__dirname, '..', 'temp', `test-project-${Date.now()}`);
        await fs.ensureDir(testProjectPath);
        process.chdir(testProjectPath);

        // Create basic project structure
        await setupTestProject();
    });

    afterEach(async () => {
        // Clean up
        process.chdir(originalCwd);
        if (await fs.pathExists(testProjectPath)) {
            await fs.remove(testProjectPath);
        }
    });

    describe('HookManager', () => {
        test('should initialize and detect hook configuration', async () => {
            const hookManager = new HookManager();
            
            // Initially no hooks
            await hookManager.initialize();
            expect(hookManager.getHookStatus().enabled).toBe(false);

            // Create a basic hook configuration
            await createTestHookConfig();

            // Re-initialize
            await hookManager.initialize();
            const status = hookManager.getHookStatus();
            
            expect(status.enabled).toBe(true);
            expect(status.configPath).toBeTruthy();
            expect(status.supportedHooks).toContain('PostToolUse');
        });

        test('should validate hook configuration format', async () => {
            const hookManager = new HookManager();
            
            // Create invalid config
            const invalidConfig = { hooks: "invalid" };
            const configPath = path.join(testProjectPath, '.claude', 'settings.json');
            await fs.writeJSON(configPath, invalidConfig);

            const isValid = await hookManager.validateHookConfiguration(configPath);
            expect(isValid).toBe(false);

            // Create valid config
            const validConfig = {
                hooks: {
                    PostToolUse: [
                        {
                            matcher: "Edit",
                            hooks: [{ type: "command", command: "echo test" }]
                        }
                    ]
                }
            };
            await fs.writeJSON(configPath, validConfig);

            const isValidNow = await hookManager.validateHookConfiguration(configPath);
            expect(isValidNow).toBe(true);
        });
    });

    describe('Quality Gate Runner', () => {
        test('should detect and run basic quality gates', async () => {
            const runner = new QualityGateRunner();
            
            // Create a test file with issues
            await fs.writeFile(
                path.join(testProjectPath, 'test.js'),
                'console.log("debug");\n// TODO: fix this\nconst veryLongLineOfCodeThatExceedsTheRecommendedLengthLimitAndShouldTriggerAWarningInOurCodeReviewCheck = true;'
            );

            // Test the code review check directly instead of full run
            const result = await runner.runCodeReviewCheck();
            
            // Should detect code quality issues
            expect(result.name).toBe('Code Review Check');
            expect(result.success).toBe(false);
            expect(result.output).toContain('console.log');
        });

        test('should detect available test commands', async () => {
            const runner = new QualityGateRunner();
            
            // Create package.json with test script
            await fs.writeJSON(path.join(testProjectPath, 'package.json'), {
                scripts: {
                    test: 'jest'
                },
                devDependencies: {
                    jest: "^29.0.0"
                }
            });

            const testCommand = runner.detectTestCommand();
            expect(testCommand).toBe('npm test');
        });
    });

    describe('Session Auto Saver', () => {
        test('should detect mega-minds projects correctly', async () => {
            // Create a fresh directory without .claude
            const freshPath = path.join(__dirname, '..', 'temp', `fresh-project-${Date.now()}`);
            await fs.ensureDir(freshPath);
            
            const originalChdir = process.chdir;
            process.chdir(freshPath);
            
            try {
                const saver = new SessionAutoSaver();
                
                // Initially not a mega-minds project
                expect(await saver.isMegaMindsProject()).toBe(false);

                // Add .claude directory
                await fs.ensureDir(path.join(freshPath, '.claude'));
                await fs.writeFile(path.join(freshPath, '.claude', 'claude.md'), '# Test');

                // Add package.json with mega-minds dependency  
                await fs.writeJSON(path.join(freshPath, 'package.json'), {
                    dependencies: {
                        'mega-minds': '^1.0.0'
                    }
                });

                expect(await saver.isMegaMindsProject()).toBe(true);
            } finally {
                process.chdir(testProjectPath);
                await fs.remove(freshPath);
            }
        });

        test('should generate appropriate save descriptions', async () => {
            const saver = new SessionAutoSaver();
            
            const stopHook = { hook_type: 'Stop' };
            const agentHook = { hook_type: 'SubagentStop' };
            
            const stopDesc = saver.generateSaveDescription(stopHook);
            const agentDesc = saver.generateSaveDescription(agentHook);
            
            expect(stopDesc).toContain('Claude Code stop');
            expect(agentDesc).toContain('agent completion');
        });
    });

    describe('Context Preserver', () => {
        test('should handle hook input correctly', async () => {
            const preserver = new ContextPreserver();
            
            // Test with no input (manual run)
            const noInput = await preserver.readHookInput();
            expect(noInput).toBeNull();
        });

        test('should create preservation directory structure', async () => {
            const preserver = new ContextPreserver();
            
            const testData = {
                timestamp: new Date().toISOString(),
                criticalData: {
                    test: 'data'
                }
            };

            await preserver.savePreservedContext(testData);
            
            const preservationPath = path.join(testProjectPath, '.claude', 'preserved-context.json');
            expect(await fs.pathExists(preservationPath)).toBe(true);
            
            const saved = await fs.readJSON(preservationPath);
            expect(Array.isArray(saved)).toBe(true);
            expect(saved[0].criticalData.test).toBe('data');
        });
    });

    describe('Hook Setup', () => {
        test('should generate valid hook configurations', async () => {
            const setup = new HookSetup();
            
            const answers = {
                enabledHooks: ['qualityGates', 'sessionAutoSave'],
                enableDebugLogging: false
            };

            const config = setup.generateHookConfiguration(answers);
            
            expect(config.hooks.PostToolUse).toBeDefined();
            expect(config.hooks.Stop).toBeDefined();
            expect(config.hooks.PostToolUse[0].matcher).toBe('(Edit|Write|MultiEdit)');
            expect(config.hooks.Stop[0].hooks[0].command).toContain('save-session-auto');
        });

        test('should detect existing hook configurations', async () => {
            const setup = new HookSetup();
            
            // Initially not configured
            expect(await setup.isAlreadyConfigured()).toBe(false);

            // Create hook config
            await createTestHookConfig();

            // Should now detect configuration
            expect(await setup.isAlreadyConfigured()).toBe(true);
        });
    });

    describe('End-to-End Hook Flow', () => {
        test('should setup, configure, and validate hooks', async () => {
            // 1. Setup hooks
            const setup = new HookSetup();
            const config = setup.generateHookConfiguration({
                enabledHooks: ['qualityGates'],
                enableDebugLogging: false
            });

            await setup.saveHookConfiguration(config, 'local');

            // 2. Validate with HookManager
            const hookManager = new HookManager();
            await hookManager.initialize();
            
            const status = hookManager.getHookStatus();
            expect(status.enabled).toBe(true);
            expect(await hookManager.isHookConfigured('PostToolUse')).toBe(true);

            // 3. Test quality gates can be triggered
            const runner = new QualityGateRunner();
            expect(runner).toBeDefined();
            expect(typeof runner.run).toBe('function');
        });
    });

    // Helper functions
    async function setupTestProject() {
        // Create .claude directory
        await fs.ensureDir(path.join(testProjectPath, '.claude'));
        
        // Create basic claude.md
        await fs.writeFile(
            path.join(testProjectPath, '.claude', 'claude.md'),
            '# Test Project\nThis is a test mega-minds project.'
        );

        // Create package.json
        await fs.writeJSON(path.join(testProjectPath, 'package.json'), {
            name: 'test-project',
            version: '1.0.0',
            dependencies: {
                'mega-minds': '^1.0.0'
            }
        });
    }

    async function createTestHookConfig() {
        const config = {
            hooks: {
                PostToolUse: [
                    {
                        matcher: "(Edit|Write)",
                        hooks: [
                            {
                                type: "command",
                                command: "npx mega-minds trigger-quality-gates"
                            }
                        ]
                    }
                ]
            }
        };

        await fs.ensureDir(path.join(testProjectPath, '.claude'));
        await fs.writeJSON(
            path.join(testProjectPath, '.claude', 'settings.local.json'),
            config
        );
    }
});