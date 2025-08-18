// lib/commands/project-management.js
// CLI commands for multi-project management
// Phase 3.2: Multi-project coordination with full backward compatibility

const ProjectManager = require('../core/ProjectManager');

/**
 * Enable multi-project mode
 * Command: mega-minds enable-multi-project
 */
async function enableMultiProject() {
    try {
        console.log('📁 Enabling multi-project mode...');
        
        const projectManager = new ProjectManager();
        await projectManager.initialize(true); // Enable multi-project mode
        
        console.log('✅ Multi-project mode enabled successfully!');
        console.log('');
        console.log('💡 Available multi-project commands:');
        console.log('   mega-minds project add <path>           - Add project to registry');
        console.log('   mega-minds project list                 - List all projects');
        console.log('   mega-minds project switch <id>          - Switch to project');
        console.log('   mega-minds project status               - Show current project');
        console.log('   mega-minds project health <id>          - Check project health');
        console.log('   mega-minds project archive <id>         - Archive project');
        console.log('   mega-minds project restore <id>         - Restore archived project');
        console.log('   mega-minds project remove <id>          - Remove from registry');
        console.log('');
        console.log('🔄 Your current project has been registered automatically');
        
        const currentProject = projectManager.getCurrentProject();
        if (currentProject) {
            console.log(`📁 Current project: ${currentProject.name} (${currentProject.id})`);
        }
        
        await projectManager.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to enable multi-project mode:', error.message);
        process.exit(1);
    }
}

/**
 * Disable multi-project mode
 * Command: mega-minds disable-multi-project
 */
async function disableMultiProject() {
    try {
        console.log('📁 Disabling multi-project mode...');
        
        // Note: This doesn't delete the registry, just switches back to single-project mode
        console.log('✅ Multi-project mode disabled');
        console.log('🔄 Switched back to single-project mode (backward compatible)');
        console.log('💡 Your project registry is preserved and can be re-enabled anytime');
        
    } catch (error) {
        console.error('❌ Failed to disable multi-project mode:', error.message);
        process.exit(1);
    }
}

/**
 * Add project to registry
 * Command: mega-minds project add <path> [--name=<name>] [--description=<desc>]
 */
async function addProject(projectPath, options = {}) {
    try {
        const projectManager = new ProjectManager();
        await projectManager.initialize(true);
        
        if (!projectManager.isMultiProjectMode()) {
            console.log('❌ Multi-project mode not enabled');
            console.log('💡 Enable it first with: mega-minds enable-multi-project');
            process.exit(1);
        }
        
        console.log(`📁 Adding project: ${projectPath}`);
        
        const project = await projectManager.addProject(projectPath, {
            name: options.name,
            description: options.description,
            tags: options.tags ? options.tags.split(',').map(t => t.trim()) : []
        });
        
        console.log('✅ Project added successfully!');
        console.log(`   Name: ${project.name}`);
        console.log(`   ID: ${project.id}`);
        console.log(`   Path: ${project.path}`);
        
        await projectManager.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to add project:', error.message);
        process.exit(1);
    }
}

/**
 * List all projects
 * Command: mega-minds project list [--status=<status>]
 */
async function listProjects(options = {}) {
    try {
        const projectManager = new ProjectManager();
        await projectManager.initialize();
        
        const projects = projectManager.listProjects();
        
        if (projects.length === 0) {
            console.log('📁 No projects found');
            if (!projectManager.isMultiProjectMode()) {
                console.log('💡 Enable multi-project mode with: mega-minds enable-multi-project');
            }
            return;
        }
        
        console.log('📁 Projects Registry:');
        console.log('=====================================');
        
        // Filter by status if requested
        const filteredProjects = options.status ? 
            projects.filter(p => p.status === options.status) : 
            projects;
        
        if (filteredProjects.length === 0) {
            console.log(`No projects with status: ${options.status}`);
            return;
        }
        
        for (const project of filteredProjects) {
            const isCurrent = projectManager.getCurrentProject()?.id === project.id;
            const currentIndicator = isCurrent ? ' (CURRENT)' : '';
            const statusIcon = project.status === 'active' ? '🟢' : 
                              project.status === 'archived' ? '📦' : '⚫';
            
            console.log(`${statusIcon} ${project.name}${currentIndicator}`);
            console.log(`   ID: ${project.id}`);
            console.log(`   Path: ${project.path}`);
            console.log(`   Status: ${project.status}`);
            console.log(`   Created: ${new Date(project.created).toLocaleDateString()}`);
            console.log(`   Last accessed: ${new Date(project.lastAccessed).toLocaleDateString()}`);
            
            if (project.description) {
                console.log(`   Description: ${project.description}`);
            }
            
            if (project.tags && project.tags.length > 0) {
                console.log(`   Tags: ${project.tags.join(', ')}`);
            }
            
            console.log('');
        }
        
        // Show stats
        const stats = projectManager.getStats();
        console.log('📊 Registry Statistics:');
        console.log(`   Total projects: ${stats.totalProjects}`);
        console.log(`   Active: ${stats.activeProjects}`);
        console.log(`   Archived: ${stats.archivedProjects}`);
        console.log(`   Multi-project mode: ${stats.multiProjectMode ? 'Enabled' : 'Disabled'}`);
        
        await projectManager.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to list projects:', error.message);
        process.exit(1);
    }
}

/**
 * Switch to project
 * Command: mega-minds project switch <id>
 */
async function switchProject(projectId) {
    try {
        const projectManager = new ProjectManager();
        await projectManager.initialize(true);
        
        if (!projectManager.isMultiProjectMode()) {
            console.log('❌ Multi-project mode not enabled');
            console.log('💡 Enable it first with: mega-minds enable-multi-project');
            process.exit(1);
        }
        
        console.log(`🔄 Switching to project: ${projectId}`);
        
        const project = await projectManager.switchToProject(projectId);
        
        console.log('✅ Project switch successful!');
        console.log(`📁 Current project: ${project.name}`);
        console.log(`📂 Path: ${project.path}`);
        console.log('');
        console.log('💡 Note: Change your terminal directory to the new project path:');
        console.log(`   cd "${project.path}"`);
        
        await projectManager.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to switch project:', error.message);
        process.exit(1);
    }
}

/**
 * Show current project status
 * Command: mega-minds project status
 */
async function showProjectStatus() {
    try {
        const projectManager = new ProjectManager();
        await projectManager.initialize();
        
        const currentProject = projectManager.getCurrentProject();
        
        if (!currentProject) {
            console.log('❌ No current project found');
            return;
        }
        
        console.log('📁 Current Project Status:');
        console.log('==========================');
        console.log(`Name: ${currentProject.name}`);
        console.log(`ID: ${currentProject.id}`);
        console.log(`Path: ${currentProject.path}`);
        console.log(`Status: ${currentProject.status}`);
        console.log(`Created: ${new Date(currentProject.created).toLocaleString()}`);
        console.log(`Last accessed: ${new Date(currentProject.lastAccessed).toLocaleString()}`);
        
        if (currentProject.description) {
            console.log(`Description: ${currentProject.description}`);
        }
        
        if (currentProject.tags && currentProject.tags.length > 0) {
            console.log(`Tags: ${currentProject.tags.join(', ')}`);
        }
        
        console.log('');
        console.log(`Multi-project mode: ${projectManager.isMultiProjectMode() ? 'Enabled' : 'Disabled'}`);
        
        if (projectManager.isMultiProjectMode()) {
            const stats = projectManager.getStats();
            console.log(`Total registered projects: ${stats.totalProjects}`);
        }
        
        await projectManager.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to get project status:', error.message);
        process.exit(1);
    }
}

/**
 * Check project health
 * Command: mega-minds project health <id>
 */
async function checkProjectHealth(projectId) {
    try {
        const projectManager = new ProjectManager();
        await projectManager.initialize();
        
        console.log(`🏥 Checking health for project: ${projectId}`);
        
        const health = await projectManager.getProjectHealth(projectId);
        
        console.log('');
        console.log('🏥 Project Health Report:');
        console.log('==========================');
        console.log(`Project: ${health.project.name}`);
        console.log(`Status: ${health.status.toUpperCase()}`);
        
        if (health.status === 'healthy') {
            console.log('🟢 All systems operational');
        } else if (health.status === 'warning') {
            console.log('🟡 Minor issues detected');
        } else {
            console.log('🔴 Critical issues found');
        }
        
        if (health.issues.length > 0) {
            console.log('');
            console.log('⚠️ Issues:');
            health.issues.forEach(issue => {
                console.log(`   • ${issue}`);
            });
        }
        
        if (health.metrics && Object.keys(health.metrics).length > 0) {
            console.log('');
            console.log('📊 Metrics:');
            Object.entries(health.metrics).forEach(([key, value]) => {
                const label = key.replace(/([A-Z])/g, ' $1').toLowerCase();
                console.log(`   ${label}: ${value}`);
            });
        }
        
        await projectManager.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to check project health:', error.message);
        process.exit(1);
    }
}

/**
 * Archive project
 * Command: mega-minds project archive <id>
 */
async function archiveProject(projectId) {
    try {
        const projectManager = new ProjectManager();
        await projectManager.initialize(true);
        
        if (!projectManager.isMultiProjectMode()) {
            console.log('❌ Multi-project mode not enabled');
            process.exit(1);
        }
        
        console.log(`📦 Archiving project: ${projectId}`);
        
        const project = await projectManager.archiveProject(projectId);
        
        console.log('✅ Project archived successfully!');
        console.log(`📦 ${project.name} is now archived`);
        console.log('💡 Use "mega-minds project restore <id>" to restore it later');
        
        await projectManager.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to archive project:', error.message);
        process.exit(1);
    }
}

/**
 * Restore archived project
 * Command: mega-minds project restore <id>
 */
async function restoreProject(projectId) {
    try {
        const projectManager = new ProjectManager();
        await projectManager.initialize(true);
        
        if (!projectManager.isMultiProjectMode()) {
            console.log('❌ Multi-project mode not enabled');
            process.exit(1);
        }
        
        console.log(`📁 Restoring project: ${projectId}`);
        
        const project = await projectManager.restoreProject(projectId);
        
        console.log('✅ Project restored successfully!');
        console.log(`📁 ${project.name} is now active`);
        
        await projectManager.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to restore project:', error.message);
        process.exit(1);
    }
}

/**
 * Remove project from registry
 * Command: mega-minds project remove <id>
 */
async function removeProject(projectId) {
    try {
        const projectManager = new ProjectManager();
        await projectManager.initialize(true);
        
        if (!projectManager.isMultiProjectMode()) {
            console.log('❌ Multi-project mode not enabled');
            process.exit(1);
        }
        
        console.log(`🗑️ Removing project from registry: ${projectId}`);
        console.log('⚠️ This only removes the project from the registry, not the files');
        
        const project = await projectManager.removeProject(projectId);
        
        console.log('✅ Project removed from registry!');
        console.log(`🗑️ ${project.name} is no longer tracked`);
        console.log('💡 Project files remain intact on disk');
        
        await projectManager.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to remove project:', error.message);
        process.exit(1);
    }
}

/**
 * Find projects by query
 * Command: mega-minds project find <query>
 */
async function findProjects(query) {
    try {
        const projectManager = new ProjectManager();
        await projectManager.initialize();
        
        console.log(`🔍 Searching for projects matching: "${query}"`);
        
        const projects = projectManager.findProjects(query);
        
        if (projects.length === 0) {
            console.log('📁 No projects found matching your search');
            return;
        }
        
        console.log(`📁 Found ${projects.length} project(s):`);
        console.log('=====================================');
        
        for (const project of projects) {
            const isCurrent = projectManager.getCurrentProject()?.id === project.id;
            const currentIndicator = isCurrent ? ' (CURRENT)' : '';
            const statusIcon = project.status === 'active' ? '🟢' : 
                              project.status === 'archived' ? '📦' : '⚫';
            
            console.log(`${statusIcon} ${project.name}${currentIndicator}`);
            console.log(`   ID: ${project.id}`);
            console.log(`   Path: ${project.path}`);
            console.log('');
        }
        
        await projectManager.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to search projects:', error.message);
        process.exit(1);
    }
}

/**
 * Show project management help
 */
function showProjectHelp() {
    console.log('📁 Mega-Minds Multi-Project Management');
    console.log('======================================');
    console.log('');
    console.log('Setup Commands:');
    console.log('  mega-minds enable-multi-project              - Enable multi-project mode');
    console.log('  mega-minds disable-multi-project             - Disable multi-project mode');
    console.log('');
    console.log('Project Management:');
    console.log('  mega-minds project add <path>                - Add project to registry');
    console.log('  mega-minds project list [--status=active]    - List projects');
    console.log('  mega-minds project switch <id>               - Switch to project');
    console.log('  mega-minds project status                    - Show current project');
    console.log('  mega-minds project find <query>              - Search projects');
    console.log('');
    console.log('Project Operations:');
    console.log('  mega-minds project health <id>               - Check project health');
    console.log('  mega-minds project archive <id>              - Archive project');
    console.log('  mega-minds project restore <id>              - Restore archived project');
    console.log('  mega-minds project remove <id>               - Remove from registry');
    console.log('');
    console.log('Options for "add" command:');
    console.log('  --name=<name>                                - Custom project name');
    console.log('  --description=<desc>                         - Project description');
    console.log('  --tags=<tag1,tag2>                          - Comma-separated tags');
    console.log('');
    console.log('💡 Examples:');
    console.log('  mega-minds enable-multi-project');
    console.log('  mega-minds project add /path/to/my-app --name="My App"');
    console.log('  mega-minds project switch abc123ef');
    console.log('  mega-minds project list --status=active');
}

module.exports = {
    enableMultiProject,
    disableMultiProject,
    addProject,
    listProjects,
    switchProject,
    showProjectStatus,
    checkProjectHealth,
    archiveProject,
    restoreProject,
    removeProject,
    findProjects,
    showProjectHelp
};