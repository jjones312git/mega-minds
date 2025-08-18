
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer').default;
const { execSync } = require('child_process');

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

        // Setup directory structure
        await setupDirectoryStructure(answers);

        // Copy template files based on structure choice
        if (answers.agentStructure === 'flat') {
            await installFlatStructure(answers);
        } else {
            await installCategorizedStructure(answers);
        }

        // Success message with instructions
        displaySuccessMessage(answers);
        
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

async function installFlatStructure(answers) {
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

    // Copy all agent files to flat .claude/agents/ structure
    for (const category of agentCategories) {
        const categoryPath = path.join(templatesDir, category);

        if (await fs.pathExists(categoryPath)) {
            const files = await fs.readdir(categoryPath);
            const agentFiles = files.filter(file => file.endsWith('-agent.md'));

            for (const agentFile of agentFiles) {
                const sourcePath = path.join(categoryPath, agentFile);
                const destPath = path.join(claudeDir, 'agents', agentFile);

                await fs.copy(sourcePath, destPath);
                console.log(`✅ Installed: ${agentFile}`);
            }
        }
    }

    // Copy workflow files
    await copyWorkflowFiles(templatesDir, claudeDir);

    // Copy main claude.md file
    await copyMainConfigFile(templatesDir, claudeDir, answers);
}

async function installCategorizedStructure(answers) {
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

    // Create category subdirectories and copy files
    for (const [category, agentFiles] of Object.entries(categoryMapping)) {
        const categoryDir = path.join(claudeDir, 'agents', category);
        await fs.ensureDir(categoryDir);

        const sourceCategoryDir = path.join(templatesDir, category);

        if (await fs.pathExists(sourceCategoryDir)) {
            for (const agentFile of agentFiles) {
                const sourcePath = path.join(sourceCategoryDir, agentFile);
                const destPath = path.join(categoryDir, agentFile);

                if (await fs.pathExists(sourcePath)) {
                    await fs.copy(sourcePath, destPath);
                    console.log(`✅ Installed: ${category}/${agentFile}`);
                }
            }
        }
    }

    // Copy workflow files
    await copyWorkflowFiles(templatesDir, claudeDir);

    // Copy main claude.md file
    await copyMainConfigFile(templatesDir, claudeDir, answers);
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

async function copyMainConfigFile(templatesDir, claudeDir, answers) {
    console.log('⚙️  Installing main configuration...');

    const sourceClaudeFile = path.join(templatesDir, 'claude.md');
    const destClaudeFile = path.join(claudeDir, 'claude.md');

    if (await fs.pathExists(sourceClaudeFile)) {
        // Read the template and customize it
        let claudeContent = await fs.readFile(sourceClaudeFile, 'utf8');

        // Replace template variables with user inputs
        claudeContent = claudeContent.replace(/\[PROJECT_NAME\]/g, answers.projectName);
        claudeContent = claudeContent.replace(/\[INSTALLATION_DATE\]/g, new Date().toISOString().split('T')[0]);

        await fs.writeFile(destClaudeFile, claudeContent);
        console.log('✅ Installed: claude.md');
    }
}

function displaySuccessMessage(answers) {
    console.log('\n🎉 Success! Your mega-minds agents are installed!\n');

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
    console.log('│           └── memory/  (TokenManager, MemoryManager, etc.)');
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

// Handle CLI execution
if (require.main === module) {
    run().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { run };