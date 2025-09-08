
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer').default;
const { execSync } = require('child_process');

// MEGA-MINDS 2.0: Variable-Driven Agent System components
const { ProjectContextAnalyzer } = require('./project-context-analyzer');
const { TemplateAdapter } = require('./template-adapter');
const { StackProfileManager } = require('./stack-profile-manager');

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

    // First check if we're in a valid npm project
    await ensurePackageJson();

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

    return `# ${answers.projectName} - Mega-Minds Development System

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
${projectMode.examples.map(example => `- @project-orchestrator-agent "${example}"`).join('\n')}

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

// Handle CLI execution
if (require.main === module) {
    run().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { run };