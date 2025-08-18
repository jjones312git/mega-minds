// lib/core/ProjectManager.js
// Multi-project management for mega-minds with full backward compatibility
// Phase 3.2: Enterprise Features - Multi-project coordination

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

/**
 * ProjectManager handles multiple mega-minds projects simultaneously
 * Maintains 100% backward compatibility with single-project workflows
 * PRD Requirements: Support 10+ concurrent projects with isolation
 */
class ProjectManager {
    constructor(options = {}) {
        this.options = {
            multiProjectMode: false,  // Default: single-project mode (backward compatible)
            registryPath: options.registryPath || path.join(os.homedir(), '.mega-minds-registry'),
            maxProjects: options.maxProjects || 15, // PRD: 10+ projects support
            autoSaveInterval: options.autoSaveInterval || 5 * 60 * 1000, // 5 minutes
            ...options
        };
        
        // Current project context (maintains existing behavior)
        this.currentProject = null;
        this.currentProjectPath = process.cwd();
        
        // Multi-project registry
        this.projectRegistry = new Map();
        this.registryLoaded = false;
        
        // Project metadata cache
        this.projectMetadata = new Map();
        
        // Auto-save timer for registry
        this.autoSaveTimer = null;
    }

    /**
     * Initialize project manager
     * Maintains single-project mode unless explicitly enabled
     */
    async initialize(enableMultiProject = false) {
        try {
            // Load existing registry if it exists
            await this.loadProjectRegistry();
            
            // Enable multi-project mode only if requested
            if (enableMultiProject) {
                this.options.multiProjectMode = true;
                console.log('📁 Multi-project mode enabled');
            }
            
            // Initialize current project (backward compatible)
            await this.initializeCurrentProject();
            
            // Start auto-save timer if multi-project mode is enabled
            if (this.options.multiProjectMode) {
                this.startAutoSave();
            }
            
            return true;
            
        } catch (error) {
            console.warn('⚠️ ProjectManager initialization warning:', error.message);
            // Graceful degradation - continue in single-project mode
            this.options.multiProjectMode = false;
            return false;
        }
    }

    /**
     * Initialize current project (maintains existing behavior)
     */
    async initializeCurrentProject() {
        const projectPath = this.currentProjectPath;
        const projectName = path.basename(projectPath);
        
        // Create project info for current directory
        this.currentProject = {
            id: this.generateProjectId(projectPath),
            name: projectName,
            path: projectPath,
            status: 'active',
            created: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
            megamindsPath: path.join(projectPath, '.mega-minds'),
            isDefault: true
        };
        
        // Register project if multi-project mode is enabled
        if (this.options.multiProjectMode) {
            this.projectRegistry.set(this.currentProject.id, this.currentProject);
            await this.saveProjectRegistry();
        }
        
        // Ensure project directory structure exists
        await this.ensureProjectStructure(this.currentProject);
    }

    /**
     * Get current project info (backward compatible)
     */
    getCurrentProject() {
        return this.currentProject;
    }

    /**
     * Get current project path (maintains existing behavior)
     */
    getCurrentProjectPath() {
        return this.currentProjectPath;
    }

    /**
     * Check if multi-project mode is enabled
     */
    isMultiProjectMode() {
        return this.options.multiProjectMode;
    }

    /**
     * Add a new project to the registry
     */
    async addProject(projectPath, options = {}) {
        if (!this.options.multiProjectMode) {
            throw new Error('Multi-project mode not enabled. Use mega-minds enable-multi-project first.');
        }
        
        // Validate project path
        if (!await fs.pathExists(projectPath)) {
            throw new Error(`Project path does not exist: ${projectPath}`);
        }
        
        const absolutePath = path.resolve(projectPath);
        const projectId = this.generateProjectId(absolutePath);
        
        // Check if project already exists
        if (this.projectRegistry.has(projectId)) {
            console.log('📁 Project already registered:', path.basename(absolutePath));
            return this.projectRegistry.get(projectId);
        }
        
        // Check project limit
        if (this.projectRegistry.size >= this.options.maxProjects) {
            throw new Error(`Maximum projects limit reached (${this.options.maxProjects}). Remove inactive projects first.`);
        }
        
        // Create project entry
        const project = {
            id: projectId,
            name: options.name || path.basename(absolutePath),
            path: absolutePath,
            status: 'active',
            created: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
            megamindsPath: path.join(absolutePath, '.mega-minds'),
            description: options.description || '',
            tags: options.tags || []
        };
        
        // Ensure project structure
        await this.ensureProjectStructure(project);
        
        // Add to registry
        this.projectRegistry.set(projectId, project);
        await this.saveProjectRegistry();
        
        console.log(`✅ Project added: ${project.name} (${projectId})`);
        return project;
    }

    /**
     * Remove project from registry (does not delete files)
     */
    async removeProject(projectId) {
        if (!this.options.multiProjectMode) {
            throw new Error('Multi-project mode not enabled');
        }
        
        const project = this.projectRegistry.get(projectId);
        if (!project) {
            throw new Error(`Project not found: ${projectId}`);
        }
        
        // Prevent removing current project
        if (this.currentProject && this.currentProject.id === projectId) {
            throw new Error('Cannot remove currently active project. Switch to another project first.');
        }
        
        // Remove from registry
        this.projectRegistry.delete(projectId);
        await this.saveProjectRegistry();
        
        console.log(`✅ Project removed from registry: ${project.name}`);
        return project;
    }

    /**
     * Switch to a different project
     */
    async switchToProject(projectId) {
        if (!this.options.multiProjectMode) {
            throw new Error('Multi-project mode not enabled');
        }
        
        const project = this.projectRegistry.get(projectId);
        if (!project) {
            throw new Error(`Project not found: ${projectId}`);
        }
        
        // Validate project path still exists
        if (!await fs.pathExists(project.path)) {
            throw new Error(`Project path no longer exists: ${project.path}`);
        }
        
        // Update last accessed time for current project
        if (this.currentProject) {
            this.currentProject.lastAccessed = new Date().toISOString();
            this.projectRegistry.set(this.currentProject.id, this.currentProject);
        }
        
        // Switch to new project
        this.currentProject = project;
        this.currentProjectPath = project.path;
        project.lastAccessed = new Date().toISOString();
        project.status = 'active';
        
        // Update registry
        this.projectRegistry.set(projectId, project);
        await this.saveProjectRegistry();
        
        console.log(`🔄 Switched to project: ${project.name}`);
        console.log(`📁 Project path: ${project.path}`);
        
        return project;
    }

    /**
     * List all registered projects
     */
    listProjects() {
        if (!this.options.multiProjectMode) {
            return [this.currentProject].filter(Boolean);
        }
        
        return Array.from(this.projectRegistry.values()).sort((a, b) => {
            // Current project first, then by last accessed
            if (this.currentProject && a.id === this.currentProject.id) return -1;
            if (this.currentProject && b.id === this.currentProject.id) return 1;
            return new Date(b.lastAccessed) - new Date(a.lastAccessed);
        });
    }

    /**
     * Get project by ID
     */
    getProject(projectId) {
        if (!this.options.multiProjectMode) {
            return this.currentProject?.id === projectId ? this.currentProject : null;
        }
        
        return this.projectRegistry.get(projectId);
    }

    /**
     * Find projects by name or path
     */
    findProjects(query) {
        const projects = this.listProjects();
        const lowerQuery = query.toLowerCase();
        
        return projects.filter(project => 
            project.name.toLowerCase().includes(lowerQuery) ||
            project.path.toLowerCase().includes(lowerQuery) ||
            (project.description && project.description.toLowerCase().includes(lowerQuery)) ||
            (project.tags && project.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
        );
    }

    /**
     * Get project health status
     */
    async getProjectHealth(projectId) {
        const project = this.getProject(projectId);
        if (!project) {
            throw new Error(`Project not found: ${projectId}`);
        }
        
        const health = {
            project: project,
            status: 'healthy',
            issues: [],
            metrics: {}
        };
        
        try {
            // Check if project path exists
            if (!await fs.pathExists(project.path)) {
                health.status = 'error';
                health.issues.push('Project directory not found');
                return health;
            }
            
            // Check mega-minds directory
            if (!await fs.pathExists(project.megamindsPath)) {
                health.status = 'warning';
                health.issues.push('Mega-minds directory not found');
            } else {
                // Count state files
                const stateDir = path.join(project.megamindsPath, 'state');
                if (await fs.pathExists(stateDir)) {
                    const stateFiles = await fs.readdir(stateDir);
                    health.metrics.stateFiles = stateFiles.length;
                }
                
                // Count session files
                const sessionsDir = path.join(project.megamindsPath, 'sessions');
                if (await fs.pathExists(sessionsDir)) {
                    const sessionFiles = await fs.readdir(sessionsDir);
                    health.metrics.sessionFiles = sessionFiles.length;
                }
                
                // Count quality reports
                const qualityDir = path.join(project.megamindsPath, 'quality', 'reports');
                if (await fs.pathExists(qualityDir)) {
                    const qualityFiles = await fs.readdir(qualityDir);
                    health.metrics.qualityReports = qualityFiles.length;
                }
            }
            
            // Check project age
            const created = new Date(project.created);
            const ageInDays = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
            health.metrics.ageInDays = ageInDays;
            
            // Check last access
            const lastAccessed = new Date(project.lastAccessed);
            const lastAccessDays = Math.floor((Date.now() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24));
            health.metrics.lastAccessDays = lastAccessDays;
            
            if (lastAccessDays > 30) {
                health.status = health.status === 'healthy' ? 'warning' : health.status;
                health.issues.push('Project not accessed in 30+ days');
            }
            
        } catch (error) {
            health.status = 'error';
            health.issues.push(`Health check failed: ${error.message}`);
        }
        
        return health;
    }

    /**
     * Archive a project (sets status to archived)
     */
    async archiveProject(projectId) {
        if (!this.options.multiProjectMode) {
            throw new Error('Multi-project mode not enabled');
        }
        
        const project = this.projectRegistry.get(projectId);
        if (!project) {
            throw new Error(`Project not found: ${projectId}`);
        }
        
        // Prevent archiving current project
        if (this.currentProject && this.currentProject.id === projectId) {
            throw new Error('Cannot archive currently active project. Switch to another project first.');
        }
        
        project.status = 'archived';
        project.archivedAt = new Date().toISOString();
        
        this.projectRegistry.set(projectId, project);
        await this.saveProjectRegistry();
        
        console.log(`📦 Project archived: ${project.name}`);
        return project;
    }

    /**
     * Restore an archived project
     */
    async restoreProject(projectId) {
        if (!this.options.multiProjectMode) {
            throw new Error('Multi-project mode not enabled');
        }
        
        const project = this.projectRegistry.get(projectId);
        if (!project) {
            throw new Error(`Project not found: ${projectId}`);
        }
        
        project.status = 'active';
        project.restoredAt = new Date().toISOString();
        delete project.archivedAt;
        
        this.projectRegistry.set(projectId, project);
        await this.saveProjectRegistry();
        
        console.log(`📁 Project restored: ${project.name}`);
        return project;
    }

    /**
     * Generate unique project ID
     */
    generateProjectId(projectPath) {
        // Use path hash for consistent IDs
        const crypto = require('crypto');
        return crypto.createHash('md5').update(path.resolve(projectPath)).digest('hex').substring(0, 8);
    }

    /**
     * Ensure project directory structure
     */
    async ensureProjectStructure(project) {
        const megamindsDir = project.megamindsPath;
        
        // Create necessary directories
        await fs.ensureDir(path.join(megamindsDir, 'state'));
        await fs.ensureDir(path.join(megamindsDir, 'sessions'));
        await fs.ensureDir(path.join(megamindsDir, 'quality', 'reports'));
        await fs.ensureDir(path.join(megamindsDir, 'intelligence'));
        
        // Create project info file
        const projectInfoFile = path.join(megamindsDir, 'project-info.json');
        if (!await fs.pathExists(projectInfoFile)) {
            await fs.writeJSON(projectInfoFile, {
                id: project.id,
                name: project.name,
                created: project.created,
                version: '2.0'
            }, { spaces: 2 });
        }
    }

    /**
     * Load project registry from disk
     */
    async loadProjectRegistry() {
        try {
            if (await fs.pathExists(this.options.registryPath)) {
                const registryData = await fs.readJSON(this.options.registryPath);
                
                // Load projects into registry
                if (registryData.projects) {
                    for (const project of registryData.projects) {
                        this.projectRegistry.set(project.id, project);
                    }
                }
                
                // Load options
                if (registryData.options) {
                    Object.assign(this.options, registryData.options);
                }
                
                console.log(`📁 Loaded ${this.projectRegistry.size} projects from registry`);
            }
            
            this.registryLoaded = true;
            
        } catch (error) {
            console.warn('⚠️ Could not load project registry:', error.message);
            this.registryLoaded = false;
        }
    }

    /**
     * Save project registry to disk
     */
    async saveProjectRegistry() {
        try {
            const registryData = {
                version: '2.0',
                lastUpdated: new Date().toISOString(),
                projects: Array.from(this.projectRegistry.values()),
                options: {
                    multiProjectMode: this.options.multiProjectMode,
                    maxProjects: this.options.maxProjects
                }
            };
            
            // Ensure registry directory exists
            await fs.ensureDir(path.dirname(this.options.registryPath));
            
            // Save registry
            await fs.writeJSON(this.options.registryPath, registryData, { spaces: 2 });
            
        } catch (error) {
            console.warn('⚠️ Could not save project registry:', error.message);
        }
    }

    /**
     * Start auto-save timer
     */
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            this.saveProjectRegistry().catch(error => {
                console.warn('⚠️ Auto-save failed:', error.message);
            });
        }, this.options.autoSaveInterval);
    }

    /**
     * Stop auto-save timer
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    /**
     * Cleanup and shutdown
     */
    async shutdown() {
        this.stopAutoSave();
        
        if (this.options.multiProjectMode) {
            await this.saveProjectRegistry();
        }
        
        console.log('📁 ProjectManager shutdown complete');
    }

    /**
     * Get registry statistics
     */
    getStats() {
        const projects = this.listProjects();
        const activeProjects = projects.filter(p => p.status === 'active');
        const archivedProjects = projects.filter(p => p.status === 'archived');
        
        return {
            totalProjects: projects.length,
            activeProjects: activeProjects.length,
            archivedProjects: archivedProjects.length,
            currentProject: this.currentProject?.name || 'None',
            multiProjectMode: this.options.multiProjectMode,
            registryPath: this.options.registryPath
        };
    }
}

module.exports = ProjectManager;