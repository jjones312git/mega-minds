
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer').default;
const { execSync } = require('child_process');

// MEGA-MINDS 2.0: Variable-Driven Agent System components
const { ProjectContextAnalyzer } = require('./project-context-analyzer');
const { TemplateAdapter } = require('./template-adapter');
const { StackProfileManager } = require('./stack-profile-manager');

/**
 * Solution 1: Smart Installation Order Detection
 * Detects project state and guides users to avoid package.json conflicts
 */
async function detectProjectState() {
    const currentDir = process.cwd();
    const dirName = path.basename(currentDir);
    const files = await fs.readdir(currentDir);
    
    // Filter out hidden files and common system files for empty check
    const visibleFiles = files.filter(file => !file.startsWith('.') && file !== 'node_modules');
    const isEmpty = visibleFiles.length === 0;
    
    const hasPackageJson = await fs.pathExists('package.json');
    const hasFrameworkFiles = await detectFrameworkFiles();
    const hasMegaMindsFiles = await fs.pathExists('.claude') || await fs.pathExists('.mega-minds');
    
    return {
        isEmpty,
        hasPackageJson,
        hasFrameworkFiles,
        hasMegaMindsFiles,
        dirName,
        visibleFiles
    };
}

/**
 * Detect if framework files are present
 */
async function detectFrameworkFiles() {
    const frameworkIndicators = [
        'next.config.js', 'next.config.ts',
        'nuxt.config.js', 'nuxt.config.ts',
        'vue.config.js',
        'angular.json',
        'svelte.config.js',
        'astro.config.js',
        'remix.config.js',
        'vite.config.js', 'vite.config.ts'
    ];
    
    for (const indicator of frameworkIndicators) {
        if (await fs.pathExists(indicator)) {
            return indicator;
        }
    }
    return false;
}

/**
 * Solution 2: Recovery Mechanism
 * Detects and recovers from package.json overwrites
 */
async function detectAndRecoverMegaMinds() {
    try {
        const hasClaudeDir = await fs.pathExists('.claude');
        const hasMegaMindsDir = await fs.pathExists('.mega-minds');
        
        if (!hasClaudeDir && !hasMegaMindsDir) {
            return { needed: false, reason: 'no-mega-minds-files' };
        }
        
        const hasPackageJson = await fs.pathExists('package.json');
        if (!hasPackageJson) {
            return { needed: true, reason: 'missing-package-json' };
        }
        
        const packageJson = await fs.readJson('package.json');
        const hasMegaMindsDep = packageJson.dependencies?.['mega-minds'] || packageJson.devDependencies?.['mega-minds'];
        
        if (!hasMegaMindsDep) {
            return { needed: true, reason: 'missing-dependency' };
        }
        
        return { needed: false, reason: 'already-configured' };
    } catch (error) {
        return { needed: true, reason: 'error-checking', error: error.message };
    }
}

/**
 * Smart package.json handling with user guidance
 */
async function smartPackageJsonHandling() {
    const state = await detectProjectState();
    const recovery = await detectAndRecoverMegaMinds();
    
    // Recovery scenario - mega-minds files exist but package.json missing/corrupted
    if (recovery.needed) {
        console.log('🔧 Mega-minds files detected but package.json needs recovery');
        
        switch (recovery.reason) {
            case 'missing-package-json':
                console.log('   📦 No package.json found - likely deleted or moved');
                break;
            case 'missing-dependency':
                console.log('   📦 package.json exists but mega-minds dependency missing');
                console.log('   💡 This usually happens when a framework overwrote package.json');
                break;
            case 'error-checking':
                console.log('   ⚠️  Error checking package.json:', recovery.error);
                break;
        }
        
        console.log('   🔄 Recovering mega-minds configuration...\n');
        await ensurePackageJson();
        return;
    }
    
    // New empty directory scenario
    if (state.isEmpty && !state.hasPackageJson) {
        console.log('🤔 This appears to be a new empty project directory.');
        console.log('   📋 Recommended installation order to avoid conflicts:');
        console.log('   1️⃣  Install your framework first:');
        console.log('      • Next.js: npx create-next-app@latest .');
        console.log('      • React: npx create-react-app .');
        console.log('      • Vue: npm create vue@latest .');
        console.log('      • Other frameworks...');
        console.log('   2️⃣  Then run: npx mega-minds init');
        console.log('');
        console.log('   ⚠️  Installing mega-minds first may cause framework installers to fail');
        console.log('      (they require empty directories or refuse to overwrite package.json)');
        console.log('');
        
        const { proceed } = await inquirer.prompt([{
            type: 'confirm',
            name: 'proceed',
            message: 'Continue with mega-minds-only setup anyway?',
            default: false
        }]);
        
        if (!proceed) {
            console.log('💡 Install your framework first, then run: npx mega-minds init');
            console.log('   This will ensure proper integration without conflicts.');
            process.exit(0);
        }
        
        console.log('⚡ Proceeding with mega-minds-only setup...\n');
    }
    
    // Framework detected but no mega-minds
    if (state.hasFrameworkFiles && !state.hasMegaMindsFiles) {
        console.log(`📦 Framework detected (${state.hasFrameworkFiles})`);
        console.log('   🎯 Perfect! Adding mega-minds to existing framework project...\n');
    }
    
    await ensurePackageJson();
}

async function ensurePackageJson() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!await fs.pathExists(packageJsonPath)) {
        console.log('📦 No package.json found. Initializing npm project...');
        try {
            execSync('npm init -y', { stdio: 'pipe' });
            console.log('✅ Created package.json\n');
        } catch (error) {
            console.error('❌ Failed to initialize npm project:', error.message);
            process.exit(1);
        }
    }
}

async function ensureMegaMindsDependency() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    
    const hasDependency = 
        (packageJson.dependencies && packageJson.dependencies['mega-minds']) ||
        (packageJson.devDependencies && packageJson.devDependencies['mega-minds']);
    
    if (!hasDependency) {
        console.log('📦 Adding mega-minds to project dependencies...');
        
        if (!packageJson.dependencies) {
            packageJson.dependencies = {};
        }
        
        // Get the current version from our package.json
        const ourPackageJson = await fs.readJson(path.join(__dirname, '..', 'package.json'));
        packageJson.dependencies['mega-minds'] = `^${ourPackageJson.version}`;
        
        await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
        console.log('✅ Added mega-minds to dependencies\n');
        
        console.log('📥 Installing dependencies...');
        try {
            execSync('npm install', { stdio: 'inherit' });
            console.log('✅ Dependencies installed\n');
        } catch (error) {
            console.log('⚠️  Could not auto-install. Please run "npm install" manually.\n');
        }
    } else {
        console.log('✅ mega-minds already in dependencies\n');
    }
}

async function run() {
    console.log('🤖 Welcome to Mega Minds Installer!');
    console.log('Installing Claude Code sub-agents for multi-agent development workflow...\n');

    // Smart package.json handling with conflict prevention
    await smartPackageJsonHandling();

    // Ask user configuration questions
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'projectName',
            message: 'What is your project name?',
            default: path.basename(process.cwd())
        },
        {
            type: 'confirm',
            name: 'installAll',
            message: 'Install all agents and workflows?',
            default: true
        },
        {
            type: 'list',
            name: 'agentStructure',
            message: 'How would you like to organize your agents?',
            choices: [
                {
                    name: 'Flat structure (Recommended - guaranteed compatibility)',
                    value: 'flat'
                },
                {
                    name: 'Categorized subdirectories (Experimental)',
                    value: 'categorized'
                }
            ],
            default: 'flat'
        },
        {
            type: 'confirm',
            name: 'overwriteExisting',
            message: 'Overwrite existing .claude directory if it exists?',
            default: false,
            when: () => fs.existsSync(path.join(process.cwd(), '.claude'))
        }
    ]);

    try {
        // Ensure mega-minds is in dependencies
        await ensureMegaMindsDependency();

        // MEGA-MINDS 2.0: Initialize Variable-Driven Agent System
        console.log('\n🔍 Initializing Variable-Driven Agent System...');
        const variableSystemInit = await initializeVariableSystem(answers);
        
        if (!variableSystemInit.success) {
            console.log('⚠️  Variable System initialization failed, falling back to static templates');
        } else {
            console.log(`✅ Tech Stack Detected: ${variableSystemInit.techStack}`);
            console.log(`✅ Variable Engine Active: ${variableSystemInit.variableCount} variables generated`);
        }

        // Setup directory structure
        await setupDirectoryStructure(answers);

        // Copy template files based on structure choice with Variable System integration
        if (answers.agentStructure === 'flat') {
            await installFlatStructure(answers, variableSystemInit);
        } else {
            await installCategorizedStructure(answers, variableSystemInit);
        }

        // MEGA-MINDS 2.1: Initialize Claude Code Integration (Phase 1 Enhancements)
        await initializeClaudeIntegration(
            process.cwd(), 
            { ...variableSystemInit.analysis, agents: agentData }, 
            null
        );

        // Success message with instructions
        displaySuccessMessage(answers, variableSystemInit);
        
        // Run verification
        console.log('\n' + '='.repeat(50));
        console.log('\n🔍 Running installation verification...');
        const { verifyInstallation } = require('./verify-installation');
        const verified = verifyInstallation();
        
        if (!verified) {
            console.log('\n⚠️  Some issues were detected. Please review and fix them.');
        }

    } catch (error) {
        console.error('❌ Installation failed:', error.message);
        console.error('Please check permissions and try again.');
        process.exit(1);
    }
}

async function setupDirectoryStructure(answers) {
    const claudeDir = path.join(process.cwd(), '.claude');

    // Check if .claude exists and handle overwrite
    if (fs.existsSync(claudeDir)) {
        if (answers.overwriteExisting) {
            console.log('🗑️  Removing existing .claude directory...');
            await fs.remove(claudeDir);
        } else {
            console.log('⚠️  .claude directory exists. Skipping installation.');
            console.log('Run with --force flag or choose overwrite option to replace existing installation.');
            process.exit(0);
        }
    }

    // Create main .claude directory structure
    console.log('📁 Creating .claude directory structure...');
    await fs.ensureDir(claudeDir);
    await fs.ensureDir(path.join(claudeDir, 'agents'));
    await fs.ensureDir(path.join(claudeDir, 'workflows'));
    await fs.ensureDir(path.join(claudeDir, 'workflows', 'logs'));
}

async function installFlatStructure(answers, variableSystemInit) {
    console.log('📦 Installing agents in flat structure...');

    const templatesDir = path.join(__dirname, '..', 'templates');
    const claudeDir = path.join(process.cwd(), '.claude');

    // Agent categories and their files
    const agentCategories = [
        'businessops',
        'development',
        'devops',
        'maintenance',
        'planning',
        'prototyping',
        'qa',
        'saas'
    ];

    // Copy all agent files to flat .claude/agents/ structure with Variable System processing
    for (const category of agentCategories) {
        const categoryPath = path.join(templatesDir, category);

        if (await fs.pathExists(categoryPath)) {
            const files = await fs.readdir(categoryPath);
            const agentFiles = files.filter(file => file.endsWith('-agent.md'));

            for (const agentFile of agentFiles) {
                const sourcePath = path.join(categoryPath, agentFile);
                const destPath = path.join(claudeDir, 'agents', agentFile);

                // MEGA-MINDS 2.0: Process templates with Variable System
                if (variableSystemInit.success && variableSystemInit.templateAdapter) {
                    try {
                        const templateContent = await fs.readFile(sourcePath, 'utf8');
                        const adaptedContent = await variableSystemInit.templateAdapter.adaptAgentTemplate(
                            agentFile.replace('.md', ''),
                            templateContent
                        );
                        await fs.writeFile(destPath, adaptedContent);
                        console.log(`✅ Installed (Variable-Adapted): ${agentFile}`);
                    } catch (error) {
                        // Fallback to static copy
                        await fs.copy(sourcePath, destPath);
                        console.log(`✅ Installed (Static): ${agentFile}`);
                    }
                } else {
                    // Fallback to static copy
                    await fs.copy(sourcePath, destPath);
                    console.log(`✅ Installed: ${agentFile}`);
                }
            }
        }
    }

    // Copy workflow files
    await copyWorkflowFiles(templatesDir, claudeDir);

    // Copy main claude.md file with Variable System context
    await copyMainConfigFile(templatesDir, claudeDir, answers, variableSystemInit);
}

async function installCategorizedStructure(answers, variableSystemInit) {
    console.log('📦 Installing agents in categorized structure...');
    console.log('⚠️  Note: This is experimental - Claude Code may not recognize subdirectories');

    const templatesDir = path.join(__dirname, '..', 'templates');
    const claudeDir = path.join(process.cwd(), '.claude');

    // Agent categories mapping
    const categoryMapping = {
        'planning': ['project-orchestrator-agent.md', 'requirements-analysis-agent.md', 'market-research-agent.md', 'risk-assessment-agent.md', 'technical-architecture-agent.md'],
        'development': ['frontend-development-agent.md', 'backend-development-agent.md', 'database-agent.md', 'authentication-agent.md'],
        'prototyping': ['ux-ui-design-agent.md', 'api-design-agent.md', 'database-schema-agent.md', 'security-architecture-agent.md'],
        'qa': ['testing-agent.md', 'code-review-agent.md', 'security-testing-agent.md', 'performance-testing-agent.md'],
        'devops': ['ci-cd-pipeline-agent.md', 'infrastructure-agent.md', 'monitoring-agent.md', 'backup-recovery-agent.md'],
        'maintenance': ['bug-tracker-agent.md', 'performance-optimizer-agent.md', 'feature-manager-agent.md', 'ab-tester-agent.md'],
        'businessops': ['analytics-agent.md', 'customer-support-agent.md', 'marketing-automation-agent.md', 'documentation-agent.md'],
        'saas': ['multi-tenancy-agent.md', 'onboarding-agent.md', 'subscription-management-agent.md', 'usage-tracking-agent.md']
    };

    // Create category subdirectories and copy files with Variable System processing
    for (const [category, agentFiles] of Object.entries(categoryMapping)) {
        const categoryDir = path.join(claudeDir, 'agents', category);
        await fs.ensureDir(categoryDir);

        const sourceCategoryDir = path.join(templatesDir, category);

        if (await fs.pathExists(sourceCategoryDir)) {
            for (const agentFile of agentFiles) {
                const sourcePath = path.join(sourceCategoryDir, agentFile);
                const destPath = path.join(categoryDir, agentFile);

                if (await fs.pathExists(sourcePath)) {
                    // MEGA-MINDS 2.0: Process templates with Variable System
                    if (variableSystemInit.success && variableSystemInit.templateAdapter) {
                        try {
                            const templateContent = await fs.readFile(sourcePath, 'utf8');
                            const adaptedContent = await variableSystemInit.templateAdapter.adaptAgentTemplate(
                                agentFile.replace('.md', ''),
                                templateContent
                            );
                            await fs.writeFile(destPath, adaptedContent);
                            console.log(`✅ Installed (Variable-Adapted): ${category}/${agentFile}`);
                        } catch (error) {
                            // Fallback to static copy
                            await fs.copy(sourcePath, destPath);
                            console.log(`✅ Installed (Static): ${category}/${agentFile}`);
                        }
                    } else {
                        // Fallback to static copy
                        await fs.copy(sourcePath, destPath);
                        console.log(`✅ Installed: ${category}/${agentFile}`);
                    }
                }
            }
        }
    }

    // Copy workflow files
    await copyWorkflowFiles(templatesDir, claudeDir);

    // Copy main claude.md file with Variable System context
    await copyMainConfigFile(templatesDir, claudeDir, answers, variableSystemInit);
}

async function copyWorkflowFiles(templatesDir, claudeDir) {
    console.log('📋 Installing workflow files...');

    const workflowsSourceDir = path.join(templatesDir, 'workflows');
    const workflowsDestDir = path.join(claudeDir, 'workflows');

    if (await fs.pathExists(workflowsSourceDir)) {
        // Copy all workflow files
        const workflowFiles = await fs.readdir(workflowsSourceDir, { withFileTypes: true });

        for (const item of workflowFiles) {
            const sourcePath = path.join(workflowsSourceDir, item.name);
            const destPath = path.join(workflowsDestDir, item.name);

            if (item.isDirectory()) {
                await fs.copy(sourcePath, destPath);
                console.log(`✅ Installed workflow directory: ${item.name}/`);
            } else {
                await fs.copy(sourcePath, destPath);
                console.log(`✅ Installed workflow: ${item.name}`);
            }
        }
    }
}

async function copyMainConfigFile(templatesDir, claudeDir, answers, variableSystemInit) {
    console.log('⚙️  Installing main configuration...');

    const destClaudeFile = path.join(claudeDir, 'claude.md');

    // Generate dynamic CLAUDE.md content based on project analysis
    const claudeContent = generateDynamicClaudeContent(answers, variableSystemInit);

    await fs.writeFile(destClaudeFile, claudeContent);
    console.log('✅ Installed: claude.md');
}

function generateDynamicClaudeContent(answers, variableSystemInit) {
    const projectMode = variableSystemInit?.analysis?.projectMode || {
        mode: 'unknown',
        confidence: 'low',
        description: 'Project mode could not be determined',
        instructions: 'Please specify your project type.',
        quickStart: '@project-orchestrator-agent "Help me get started with this project"',
        examples: []
    };

    const techStack = variableSystemInit?.analysis?.techStack || { languages: [], confidence: 'unknown' };
    const stackDisplay = techStack.languages.length > 0 ? 
        techStack.languages.join(', ') : 'Not yet determined';

    const confidenceEmoji = {
        'high': '✅',
        'medium': '⚠️',
        'low': '❓',
        'unknown': '❓'
    }[projectMode.confidence] || '❓';

    return `# ${answers.projectName}

*Powered by Mega-Minds AI Development System*

## 🔍 Project Analysis
**Detected**: ${projectMode.mode.toUpperCase().replace('-', ' ')} ${confidenceEmoji} (${projectMode.confidence} confidence)
**Tech Stack**: ${stackDisplay}
**Description**: ${projectMode.description}

## 🚀 Quick Start
${projectMode.instructions}

### Recommended First Command:
\`\`\`
${projectMode.quickStart}
\`\`\`

### Examples:
${projectMode.examples && projectMode.examples.length > 0 ? 
    projectMode.examples.map(example => `- @project-orchestrator-agent "${example}"`).join('\n') : 
    '- @project-orchestrator-agent "Help me understand this project structure"\n- @project-orchestrator-agent "Set up a development workflow for this stack"'}

### Alternative Commands:
- **New Project**: \`@project-orchestrator-agent "I want to build [your idea]"\`
- **Existing Project**: \`@project-orchestrator-agent "Analyze this codebase and continue"\`
- **Override Detection**: \`@project-orchestrator-agent "This is actually a [new/existing] project"\`

## 🤖 Agent Coordination
The @project-orchestrator-agent will automatically coordinate all specialist agents based on your project needs:

- **Frontend Development**: React, Vue, Angular specialists
- **Backend Development**: Node.js, Python, Go, Java specialists  
- **Database**: PostgreSQL, MongoDB, Supabase specialists
- **Testing**: Unit, integration, E2E testing specialists
- **DevOps**: CI/CD, deployment, infrastructure specialists

## 📋 Quick Commands
- \`mega-minds memory-status\` - Check memory health
- \`mega-minds agent-status\` - See active agents
- \`mega-minds variable-status\` - View tech stack variables
- \`mega-minds save-session\` - Save your progress

## 🔧 Variable-Driven System
${variableSystemInit?.success ? 
    `✅ **Active** - Templates adapted for ${variableSystemInit.techStack}` :
    '⚠️  **Static Mode** - Using generic templates'
}

---

💡 **Pro tip**: Always start with the @project-orchestrator-agent for best coordination between all specialist agents!

*Generated by Mega-Minds v2.0 with Variable-Driven Agent System*
`;
}

function displaySuccessMessage(answers, variableSystemInit) {
    console.log('\n🎉 Success! Your mega-minds agents are installed!\n');

    // MEGA-MINDS 2.0: Show Variable System status
    if (variableSystemInit && variableSystemInit.success) {
        console.log('🔧 Variable-Driven Agent System: ✅ ACTIVE');
        console.log(`   📊 Tech Stack: ${variableSystemInit.techStack}`);
        console.log(`   🔢 Variables Generated: ${variableSystemInit.variableCount}`);
        console.log(`   🎯 Templates: Adapted for your tech stack`);
        console.log('');
    } else {
        console.log('⚠️  Variable-Driven Agent System: Static mode (tech stack not detected)');
        console.log('');
    }

    console.log('📁 Installed structure:');
    console.log('├── .claude/');
    console.log('│   ├── agents/          (Claude Code sub-agents)');
    if (answers.agentStructure === 'categorized') {
        console.log('│   │   ├── planning/');
        console.log('│   │   ├── development/');
        console.log('│   │   ├── qa/');
        console.log('│   │   └── ... (other categories)');
    } else {
        console.log('│   │   ├── project-orchestrator-agent.md');
        console.log('│   │   ├── frontend-development-agent.md');
        console.log('│   │   └── ... (all agents)');
    }
    console.log('│   ├── workflows/       (Communication protocols & quality gates)');
    console.log('│   └── claude.md        (Main configuration)');
    console.log('├── node_modules/');
    console.log('│   └── mega-minds/      (Core AI team functionality)');
    console.log('│       └── lib/');
    console.log('│           ├── core/    (SessionManager, AIDevTeam, etc.)');
    console.log('│           ├── memory/  (TokenManager, MemoryManager, etc.)');
    console.log('│           └── variable-driven/ (Variable System, Stack Detection, etc.)');
    console.log('');

    console.log('✅ IMPORTANT: Dependencies Configuration');
    console.log('   mega-minds has been added to your package.json');
    console.log('   Core functionality remains in node_modules/mega-minds/');
    console.log('');

    console.log('🚀 To activate your agents:');
    console.log('1. Start Claude Code in your project directory');
    console.log('2. Claude Code will automatically read .claude/claude.md');
    console.log('3. Verify agents are loaded with: "/agents"');
    console.log('4. Start building: "@project-orchestrator I want to build <your idea here>"');
    console.log('');

    console.log('🧠 Memory Management Commands (use with npx):');
    console.log('   npx mega-minds memory-status   - Check memory health');
    console.log('   npx mega-minds save-session    - Save development session');
    console.log('   npx mega-minds compress-context - Optimize for Claude Code');
    console.log('');

    if (answers.agentStructure === 'categorized') {
        console.log('⚠️  Note: You chose categorized structure (experimental)');
        console.log('   If Claude Code doesn\'t recognize your agents, try:');
        console.log('   - Use "/agents" to check if they\'re detected');
        console.log('   - Flatten the structure by moving all .md files to .claude/agents/');
        console.log('   - Or reinstall with flat structure option');
        console.log('');
    }

    console.log('🤝 Your agents will coordinate the entire development process!');
    console.log('📖 Check .claude/workflows/ for communication protocols and quality gates.');
    console.log('');
    console.log('⚡ NEW: Claude Code Integration Features');
    console.log('   - Quick slash commands: All 31+ agents available (e.g., /orchestrator, /frontend, /backend)');
    console.log('   - Real-time statusline: Shows agents, memory, and performance');
    console.log('   - Optimal settings: Auto-configured for your project');
    console.log('   - Utility commands: /mega-status, /handoff, /memory-check');
    console.log('');
    console.log('💡 Pro tip: Always start with @project-orchestrator-agent for best results!');
}

// MEGA-MINDS 2.0: Variable-Driven Agent System initialization
async function initializeVariableSystem(answers) {
    try {
        const projectPath = process.cwd();
        
        // Initialize components
        const projectAnalyzer = new ProjectContextAnalyzer(projectPath);
        const templateAdapter = new TemplateAdapter(projectPath);
        const stackProfileManager = new StackProfileManager();
        
        // Analyze project and detect tech stack
        console.log('  🔍 Detecting project technology stack...');
        const analysis = await projectAnalyzer.analyzeProject();
        
        // Get stack profile or use detected stack
        let stackProfile = null;
        if (analysis.techStack && analysis.techStack.confidence === 'high') {
            stackProfile = stackProfileManager.findBestProfile(analysis.techStack);
        }
        
        if (!stackProfile) {
            console.log('  ⚠️  Could not auto-detect stack, using fallback profile');
            // Use the first available profile as fallback
            const availableProfiles = stackProfileManager.getAvailableProfiles();
            if (availableProfiles.length > 0) {
                stackProfile = availableProfiles[0];
            } else {
                // Create minimal fallback if no profiles available
                stackProfile = {
                    name: 'Generic Full Stack',
                    description: 'Generic full-stack development profile',
                    variables: {
                        '{{LANGUAGE_PRIMARY}}': 'JavaScript',
                        '{{FRONTEND_FRAMEWORK}}': 'React',
                        '{{BACKEND_FRAMEWORK}}': 'Node.js',
                        '{{TESTING_FRAMEWORK}}': 'Jest',
                        '{{FILE_EXTENSION}}': '.js'
                    }
                };
            }
        }
        
        // Initialize template adapter with detected stack
        templateAdapter.setStackProfile(stackProfile);
        
        return {
            success: true,
            techStack: stackProfile ? stackProfile.name : 'Generic Full Stack',
            stackProfile: stackProfile,
            templateAdapter: templateAdapter,
            projectAnalyzer: projectAnalyzer,
            variableCount: Object.keys(stackProfile?.variables || {}).length,
            analysis: analysis
        };
        
    } catch (error) {
        console.error('  ❌ Variable System initialization error:', error.message);
        return {
            success: false,
            error: error.message,
            templateAdapter: null,
            stackProfile: null
        };
    }
}

// MEGA-MINDS 2.1: Claude Code Integration Initialization
async function initializeClaudeIntegration(answers, variableSystemInit) {
    console.log('\n🔗 Initializing Claude Code Integration...');
    console.log('⚡ Phase 1: Quick Wins (Slash Commands, Statusline, Settings)');
    
    try {
        const { initializeClaudeIntegration } = require('./claude-integration');
        
        // Prepare agent data for slash commands
        const agentData = await prepareAgentData(answers);
        
        // Prepare project analysis for optimization
        const projectAnalysis = await prepareProjectAnalysis(variableSystemInit);
        
        // Initialize all Claude integrations
        const integrationResults = await initializeClaudeIntegration(
            process.cwd(),
            { ...projectAnalysis, agents: agentData },
            null // AIDevTeam will be initialized during runtime
        );
        
        // Report results
        if (integrationResults.slashCommands && integrationResults.slashCommands.totalGenerated > 0) {
            console.log(`✅ Generated ${integrationResults.slashCommands.totalGenerated} slash commands`);
        }
        
        if (integrationResults.statusline && integrationResults.statusline.path) {
            console.log('✅ Created statusline script for real-time monitoring');
        }
        
        if (integrationResults.settings && integrationResults.settings.path) {
            console.log('✅ Generated optimal Claude Code settings');
        }
        
        // Report any errors
        if (integrationResults.errors.length > 0) {
            console.log('⚠️  Some integration features had issues:');
            integrationResults.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        console.log('🎉 Claude Code integration ready!');
        console.log('   Use /mega-status to check system status');
        console.log('   Use /handoff to manage agent transitions');
        
    } catch (error) {
        console.log('⚠️  Claude integration initialization failed:', error.message);
        console.log('   Basic mega-minds functionality will still work');
    }
}

async function prepareAgentData(answers) {
    // Dynamically discover ALL available agents from templates directory
    const templatesDir = path.join(__dirname, '..', 'templates');
    const allAgents = [];
    
    try {
        // Get all agent categories
        const agentCategories = [
            'planning', 'development', 'qa', 'devops', 
            'businessops', 'maintenance', 'prototyping', 'saas'
        ];
        
        // Scan each category for agent files
        for (const category of agentCategories) {
            const categoryPath = path.join(templatesDir, category);
            
            if (await fs.pathExists(categoryPath)) {
                const categoryFiles = await fs.readdir(categoryPath);
                const agentFiles = categoryFiles.filter(file => 
                    file.endsWith('-agent.md') || file.endsWith('-agent.markdown')
                );
                
                // Parse each agent file to extract metadata
                for (const agentFile of agentFiles) {
                    const agentPath = path.join(categoryPath, agentFile);
                    const agentName = path.basename(agentFile, path.extname(agentFile));
                    
                    try {
                        const agentContent = await fs.readFile(agentPath, 'utf8');
                        const description = extractAgentDescription(agentContent, agentName);
                        const specialty = getCategorySpecialty(category, agentName);
                        
                        allAgents.push({
                            name: agentName,
                            description: description,
                            specialty: specialty,
                            category: category
                        });
                        
                    } catch (error) {
                        console.warn(`⚠️  Could not parse agent ${agentName}:`, error.message);
                    }
                }
            }
        }
        
        console.log(`📋 Discovered ${allAgents.length} agents for slash command generation`);
        return allAgents;
        
    } catch (error) {
        console.warn('⚠️  Could not scan agents directory, using fallback set:', error.message);
        
        // Fallback to essential agents if scanning fails
        return [
            {
                name: 'project-orchestrator-agent',
                description: 'Coordinates all agents and manages project workflow',
                specialty: 'multi-agent coordination',
                category: 'planning'
            },
            {
                name: 'frontend-development-agent', 
                description: 'Builds user interfaces and client-side functionality',
                specialty: 'frontend development',
                category: 'development'
            },
            {
                name: 'backend-development-agent',
                description: 'Develops server-side logic and APIs', 
                specialty: 'backend development',
                category: 'development'
            },
            {
                name: 'testing-agent',
                description: 'Ensures code quality through comprehensive testing',
                specialty: 'quality assurance',
                category: 'qa'
            },
            {
                name: 'database-agent',
                description: 'Designs and optimizes database structures and queries',
                specialty: 'database management',
                category: 'development'
            }
        ];
    }
}

// Helper function to extract agent description from markdown content
function extractAgentDescription(content, agentName) {
    // Try to extract from frontmatter description
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
        const descriptionMatch = frontmatterMatch[1].match(/description:\s*(.+)/);
        if (descriptionMatch) {
            return descriptionMatch[1].trim().replace(/^["']|["']$/g, '');
        }
    }
    
    // Try to extract from first heading or paragraph
    const headingMatch = content.match(/^#+\s*(.+)/m);
    if (headingMatch && !headingMatch[1].includes('agent')) {
        return headingMatch[1].trim();
    }
    
    // Generate description from agent name
    return generateDescriptionFromName(agentName);
}

// Helper function to generate description from agent name
function generateDescriptionFromName(agentName) {
    const nameMap = {
        'project-orchestrator-agent': 'Coordinates all agents and manages project workflow',
        'frontend-development-agent': 'Builds user interfaces and client-side functionality',
        'backend-development-agent': 'Develops server-side logic and APIs',
        'database-agent': 'Designs and optimizes database structures and queries',
        'testing-agent': 'Ensures code quality through comprehensive testing',
        'authentication-agent': 'Handles user authentication and authorization systems',
        'api-design-agent': 'Designs and documents RESTful and GraphQL APIs',
        'security-testing-agent': 'Performs security analysis and vulnerability testing',
        'performance-testing-agent': 'Optimizes application performance and load testing',
        'code-review-agent': 'Reviews code quality, standards, and best practices',
        'ci-cd-pipeline-agent': 'Sets up continuous integration and deployment',
        'infrastructure-agent': 'Manages cloud infrastructure and deployment',
        'monitoring-agent': 'Implements logging, monitoring, and alerting systems',
        'backup-recovery-agent': 'Handles data backup and disaster recovery',
        'analytics-agent': 'Implements user analytics and business intelligence',
        'customer-support-agent': 'Develops customer support and help systems',
        'marketing-automation-agent': 'Creates marketing automation and campaigns',
        'ux-ui-design-agent': 'Designs user experience and interface components',
        'technical-architecture-agent': 'Designs system architecture and technical decisions',
        'risk-assessment-agent': 'Analyzes project risks and mitigation strategies',
        'market-research-agent': 'Conducts market analysis and competitive research',
        'database-schema-agent': 'Designs optimal database schemas and relationships',
        'security-architecture-agent': 'Architects secure system designs and protocols',
        'ab-tester-agent': 'Implements A/B testing and experimentation',
        'bug-tracker-agent': 'Manages bug tracking and issue resolution',
        'feature-manager-agent': 'Plans and manages feature development lifecycle',
        'performance-optimizer-agent': 'Optimizes system and application performance',
        'multi-tenancy-agent': 'Implements multi-tenant architecture patterns',
        'onboarding-agent': 'Designs user onboarding and activation flows',
        'subscription-management-agent': 'Handles subscription billing and management',
        'usage-tracking-agent': 'Implements usage analytics and tracking systems'
    };
    
    return nameMap[agentName] || `Specialized agent for ${agentName.replace(/-/g, ' ').replace(' agent', '')}`;
}

// Helper function to get category specialty
function getCategorySpecialty(category, agentName) {
    const categoryMap = {
        'planning': 'project planning and strategy',
        'development': 'software development',
        'qa': 'quality assurance and testing',
        'devops': 'infrastructure and operations',
        'businessops': 'business operations',
        'maintenance': 'system maintenance and optimization',
        'prototyping': 'design and prototyping',
        'saas': 'SaaS platform features'
    };
    
    return categoryMap[category] || 'specialized development';
}

async function prepareProjectAnalysis(variableSystemInit) {
    // Extract project information for settings optimization
    const analysis = {
        projectType: 'development',
        complexity: variableSystemInit.success ? 'medium' : 'low',
        hasPackageJson: fs.existsSync('package.json'),
        hasGit: fs.existsSync('.git'),
        needsBash: true,
        needsNetwork: false,
        hasDatabase: false,
        hasAPI: true,
        needsSecurity: true,
        techStack: {
            languages: ['JavaScript'],
            frameworks: []
        }
    };
    
    // Enhanced analysis if Variable System is available
    if (variableSystemInit.success && variableSystemInit.analysis) {
        analysis.techStack = variableSystemInit.analysis.techStack || analysis.techStack;
        analysis.complexity = variableSystemInit.analysis.complexity || analysis.complexity;
        analysis.hasDatabase = variableSystemInit.analysis.hasDatabase || false;
        analysis.projectType = variableSystemInit.analysis.projectType || 'development';
    }
    
    return analysis;
}

// Handle CLI execution
if (require.main === module) {
    run().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { 
    run, 
    generateDynamicClaudeContent, 
    initializeVariableSystem, 
    initializeClaudeIntegration,
    prepareAgentData,
    prepareProjectAnalysis
};