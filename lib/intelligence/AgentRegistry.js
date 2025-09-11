// lib/intelligence/AgentRegistry.js
// Centralized Agent Registry for managing all 33+ agents dynamically
// Singleton pattern ensures single source of truth for agent capabilities

const fs = require('fs-extra');
const path = require('path');
const AgentMetadataParser = require('./AgentMetadataParser');

/**
 * Centralized registry for all agent capabilities
 * Loads agents dynamically from template files
 * Provides caching for performance optimization
 */
class AgentRegistry {
    constructor() {
        if (AgentRegistry.instance) {
            return AgentRegistry.instance;
        }

        this.agents = new Map();
        this.categories = new Map();
        this.initialized = false;
        this.templatePath = null;
        this.cacheFile = null;
        this.lastScanTime = null;
        
        // Fallback to hardcoded agents if dynamic loading fails
        this.fallbackAgents = this.loadFallbackAgents();
        
        AgentRegistry.instance = this;
    }

    /**
     * Initialize the registry with template path
     * @param {string} templatePath - Path to agent templates directory
     * @param {string} projectPath - Project path for cache location
     */
    async initialize(templatePath, projectPath = process.cwd()) {
        if (this.initialized) {
            return;
        }

        this.templatePath = templatePath;
        this.cacheFile = path.join(projectPath, '.mega-minds', 'intelligence', 'agent-capabilities.json');
        
        try {
            await this.loadAgents();
            this.initialized = true;
            console.log(`🧠 AgentRegistry initialized with ${this.agents.size} agents`);
        } catch (error) {
            console.warn('⚠️ AgentRegistry initialization failed, using fallback agents:', error.message);
            this.loadFallbackAgentsIntoRegistry();
            this.initialized = true;
        }
    }

    /**
     * Load all agents from template files or cache
     */
    async loadAgents() {
        // Try to load from cache first
        if (await this.loadFromCache()) {
            return;
        }

        // Load from template files
        await this.loadFromTemplates();
        
        // Save to cache for next time
        await this.saveToCache();
    }

    /**
     * Load agents from template files
     */
    async loadFromTemplates() {
        if (!this.templatePath || !await fs.pathExists(this.templatePath)) {
            throw new Error('Template path not found or not accessible');
        }

        console.log('🔍 Scanning agent templates for capabilities...');
        
        const parser = new AgentMetadataParser();
        const categories = await this.loadCategories();
        
        // Get all agent template files
        const agentFiles = await this.findAgentTemplates();
        
        for (const agentFile of agentFiles) {
            try {
                const agentData = await parser.parseAgentTemplate(agentFile);
                if (agentData && agentData.name) {
                    // Enhance with category information
                    const category = this.detectAgentCategory(agentFile, agentData);
                    agentData.category = category;
                    agentData.priority = categories.get(category)?.priority || 5;
                    
                    this.agents.set(agentData.name, agentData);
                }
            } catch (error) {
                console.warn(`⚠️ Failed to parse agent template ${agentFile}:`, error.message);
            }
        }

        this.lastScanTime = new Date().toISOString();
        console.log(`✅ Loaded ${this.agents.size} agents from templates`);
    }

    /**
     * Find all agent template files
     */
    async findAgentTemplates() {
        const agentFiles = [];
        
        // Scan all subdirectories for agent templates
        const scanDirectory = async (dirPath) => {
            const items = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item.name);
                
                if (item.isDirectory()) {
                    await scanDirectory(fullPath);
                } else if (item.isFile() && item.name.endsWith('-agent.md') && !item.name.includes('boundaries')) {
                    agentFiles.push(fullPath);
                }
            }
        };

        await scanDirectory(this.templatePath);
        return agentFiles;
    }

    /**
     * Detect agent category from file path and content
     */
    detectAgentCategory(filePath, agentData) {
        const pathParts = filePath.split(path.sep);
        
        // Look for category in path
        const categoryDirs = ['planning', 'development', 'prototyping', 'qa', 'devops', 'businessops', 'saas', 'maintenance'];
        for (const dir of categoryDirs) {
            if (pathParts.includes(dir)) {
                return dir;
            }
        }

        // Fallback to analyzing agent name/description
        const name = agentData.name.toLowerCase();
        if (name.includes('orchestrator') || name.includes('requirements') || name.includes('architecture')) {
            return 'planning';
        } else if (name.includes('frontend') || name.includes('backend') || name.includes('database')) {
            return 'development';
        } else if (name.includes('test') || name.includes('qa') || name.includes('review')) {
            return 'qa';
        } else if (name.includes('devops') || name.includes('deploy') || name.includes('infrastructure')) {
            return 'devops';
        }

        return 'maintenance'; // Default category
    }

    /**
     * Load categories configuration
     */
    async loadCategories() {
        const categories = new Map();
        
        // Default category configuration
        const defaultCategories = {
            'planning': { priority: 1, weight: 1.2 },
            'development': { priority: 2, weight: 1.1 },
            'prototyping': { priority: 2, weight: 1.0 },
            'qa': { priority: 3, weight: 1.0 },
            'devops': { priority: 4, weight: 0.9 },
            'businessops': { priority: 4, weight: 0.8 },
            'saas': { priority: 3, weight: 0.9 },
            'maintenance': { priority: 5, weight: 0.7 }
        };

        for (const [category, config] of Object.entries(defaultCategories)) {
            categories.set(category, config);
        }

        return categories;
    }

    /**
     * Load from cache if available and not stale
     */
    async loadFromCache() {
        try {
            if (!await fs.pathExists(this.cacheFile)) {
                return false;
            }

            const cacheData = await fs.readJSON(this.cacheFile);
            
            // Check if cache is stale (older than 1 hour)
            const cacheTime = new Date(cacheData.timestamp);
            const now = new Date();
            const maxAge = 60 * 60 * 1000; // 1 hour

            if (now - cacheTime > maxAge) {
                console.log('🔄 Agent cache is stale, refreshing from templates');
                return false;
            }

            // Load agents from cache
            for (const [name, data] of Object.entries(cacheData.agents)) {
                this.agents.set(name, data);
            }

            this.lastScanTime = cacheData.timestamp;
            console.log(`📦 Loaded ${this.agents.size} agents from cache`);
            return true;

        } catch (error) {
            console.warn('⚠️ Failed to load from cache:', error.message);
            return false;
        }
    }

    /**
     * Save current agent data to cache
     */
    async saveToCache() {
        try {
            await fs.ensureDir(path.dirname(this.cacheFile));
            
            const cacheData = {
                timestamp: this.lastScanTime || new Date().toISOString(),
                agents: Object.fromEntries(this.agents),
                totalAgents: this.agents.size
            };

            await fs.writeJSON(this.cacheFile, cacheData, { spaces: 2 });
            console.log('💾 Agent capabilities cached for faster loading');

        } catch (error) {
            console.warn('⚠️ Failed to save to cache:', error.message);
        }
    }

    /**
     * Get agent by name
     */
    getAgent(name) {
        return this.agents.get(name);
    }

    /**
     * Get all agents
     */
    getAllAgents() {
        return Object.fromEntries(this.agents);
    }

    /**
     * Get agents by category
     */
    getAgentsByCategory(category) {
        const categoryAgents = {};
        for (const [name, agent] of this.agents) {
            if (agent.category === category) {
                categoryAgents[name] = agent;
            }
        }
        return categoryAgents;
    }

    /**
     * Get agent count
     */
    getAgentCount() {
        return this.agents.size;
    }

    /**
     * Check if agent exists
     */
    hasAgent(name) {
        return this.agents.has(name);
    }

    /**
     * Refresh agents from templates
     */
    async refresh() {
        this.agents.clear();
        await this.loadFromTemplates();
        await this.saveToCache();
    }

    /**
     * Load fallback agents (original 7 agents) if dynamic loading fails
     */
    loadFallbackAgents() {
        return {
            'project-orchestrator-agent': {
                keywords: ['project', 'coordinate', 'manage', 'plan', 'organize', 'workflow', 'oversee', 'lead'],
                capabilities: ['project-management', 'coordination', 'planning', 'strategy', 'workflow-design'],
                expertiseAreas: ['project-planning', 'team-coordination', 'workflow-management', 'strategic-planning'],
                conflictPrevention: [],
                priority: 1,
                category: 'planning',
                description: 'Orchestrates project phases, coordinates between specialists, manages overall workflow'
            },
            'frontend-development-agent': {
                keywords: ['ui', 'frontend', 'react', 'vue', 'angular', 'component', 'responsive', 'interface', 'user experience', 'css', 'html', 'javascript'],
                capabilities: ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'responsive-design', 'component-architecture'],
                expertiseAreas: ['user-interface', 'component-development', 'frontend-architecture', 'user-experience'],
                conflictPrevention: ['backend-development-agent'],
                priority: 2,
                category: 'development',
                description: 'Creates user interfaces, components, and frontend application logic'
            },
            'backend-development-agent': {
                keywords: ['api', 'backend', 'server', 'database', 'endpoint', 'microservice', 'rest', 'graphql', 'authentication', 'authorization'],
                capabilities: ['nodejs', 'python', 'java', 'api-design', 'database-integration', 'server-architecture'],
                expertiseAreas: ['server-logic', 'api-development', 'backend-architecture', 'database-design'],
                conflictPrevention: ['frontend-development-agent'],
                priority: 2,
                category: 'development',
                description: 'Builds server-side logic, APIs, database integrations, and backend services'
            },
            'testing-agent': {
                keywords: ['test', 'testing', 'unit', 'integration', 'e2e', 'qa', 'quality', 'verify', 'validate', 'coverage'],
                capabilities: ['unit-testing', 'integration-testing', 'e2e-testing', 'test-automation', 'quality-assurance'],
                expertiseAreas: ['test-strategy', 'quality-assurance', 'test-automation', 'validation'],
                conflictPrevention: [],
                priority: 3,
                category: 'qa',
                description: 'Creates and executes tests, ensures code quality and application reliability'
            },
            'monitoring-agent': {
                keywords: ['monitor', 'logging', 'metrics', 'alert', 'performance', 'observability', 'analytics', 'tracking'],
                capabilities: ['monitoring', 'logging', 'alerting', 'performance-tracking', 'analytics'],
                expertiseAreas: ['production-monitoring', 'observability', 'performance-analysis', 'system-health'],
                conflictPrevention: ['testing-agent'],
                priority: 4,
                category: 'devops',
                description: 'Sets up monitoring, logging, and observability for production systems'
            },
            'devops-agent': {
                keywords: ['deploy', 'deployment', 'ci', 'cd', 'docker', 'kubernetes', 'infrastructure', 'pipeline', 'automation'],
                capabilities: ['deployment', 'ci-cd', 'containerization', 'infrastructure', 'automation'],
                expertiseAreas: ['deployment-automation', 'infrastructure-management', 'ci-cd-pipelines'],
                conflictPrevention: [],
                priority: 4,
                category: 'devops',
                description: 'Handles deployment, CI/CD, infrastructure, and DevOps automation'
            },
            'security-agent': {
                keywords: ['security', 'vulnerability', 'authentication', 'authorization', 'encryption', 'secure', 'audit'],
                capabilities: ['security-analysis', 'vulnerability-scanning', 'authentication', 'authorization', 'encryption'],
                expertiseAreas: ['application-security', 'security-auditing', 'access-control'],
                conflictPrevention: [],
                priority: 3,
                category: 'qa',
                description: 'Ensures application security, performs security audits, implements security measures'
            }
        };
    }

    /**
     * Load fallback agents into registry
     */
    loadFallbackAgentsIntoRegistry() {
        for (const [name, data] of Object.entries(this.fallbackAgents)) {
            this.agents.set(name, data);
        }
        console.log(`📋 Loaded ${this.agents.size} fallback agents`);
    }
}

module.exports = AgentRegistry;