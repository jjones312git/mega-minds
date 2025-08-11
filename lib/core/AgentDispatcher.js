// lib/core/AgentDispatcher.js
const path = require('path');
const fs = require('fs-extra');

class AgentDispatcher {
    constructor(memoryManager, agentStateTracker) {
        this.memory = memoryManager;
        this.agentState = agentStateTracker;
        this.agentCapabilities = this.loadAgentCapabilities();
    }

    loadAgentCapabilities() {
        return {
            // Planning & Strategy
            'requirements-analysis': {
                keywords: ['requirements', 'analyze', 'specification', 'user story', 'feature'],
                triggers: ['what should', 'how should', 'requirements for'],
                expertise: 'requirements analysis, user stories, feature specifications'
            },
            'project-orchestrator': {
                keywords: ['coordinate', 'plan', 'manage', 'organize', 'timeline'],
                triggers: ['manage project', 'coordinate team', 'plan development'],
                expertise: 'project coordination, timeline management, agent orchestration'
            },
            'technical-architecture': {
                keywords: ['architecture', 'design', 'system', 'structure', 'technology'],
                triggers: ['architect', 'design system', 'technology choice'],
                expertise: 'system architecture, technology decisions, integration patterns'
            },

            // Development
            'frontend-development': {
                keywords: ['ui', 'frontend', 'react', 'component', 'interface', 'page', 'form'],
                triggers: ['build page', 'create component', 'frontend', 'ui for'],
                expertise: 'React/Next.js development, UI components, responsive design'
            },
            'backend-development': {
                keywords: ['api', 'backend', 'server', 'endpoint', 'database', 'auth'],
                triggers: ['api for', 'backend', 'server logic', 'endpoint'],
                expertise: 'Node.js/Express APIs, database integration, server logic'
            },
            'authentication': {
                keywords: ['auth', 'login', 'register', 'user', 'security', 'permission'],
                triggers: ['login', 'authentication', 'user auth', 'permissions'],
                expertise: 'authentication flows, JWT, OAuth, user management'
            },

            // Data & Design
            'database': {
                keywords: ['database', 'schema', 'table', 'query', 'sql', 'data'],
                triggers: ['database', 'table for', 'schema', 'data model'],
                expertise: 'database design, schema optimization, query performance'
            },
            'ux-ui-design': {
                keywords: ['design', 'ux', 'user experience', 'wireframe', 'mockup'],
                triggers: ['design', 'user experience', 'wireframe', 'mockup'],
                expertise: 'user experience design, wireframes, design systems'
            },

            // Testing & Quality
            'testing': {
                keywords: ['test', 'testing', 'spec', 'coverage', 'qa'],
                triggers: ['test', 'testing for', 'write tests', 'test coverage'],
                expertise: 'automated testing, test coverage, QA processes'
            },
            'security-testing': {
                keywords: ['security', 'vulnerability', 'secure', 'penetration'],
                triggers: ['security test', 'vulnerability', 'security audit'],
                expertise: 'security testing, vulnerability assessment, penetration testing'
            }
        };
    }

    async routeRequest(userRequest) {
        console.log('🤖 Analyzing request and routing to best agents...');

        const request = userRequest.toLowerCase();
        const scores = {};

        // Score each agent based on keyword matches
        for (const [agentName, capabilities] of Object.entries(this.agentCapabilities)) {
            let score = 0;

            // Check keyword matches
            capabilities.keywords.forEach(keyword => {
                if (request.includes(keyword)) score += 2;
            });

            // Check trigger phrase matches (higher weight)
            capabilities.triggers.forEach(trigger => {
                if (request.includes(trigger)) score += 5;
            });

            scores[agentName] = score;
        }

        // Sort agents by score
        const rankedAgents = Object.entries(scores)
            .filter(([_, score]) => score > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([agentName, score]) => ({ agentName, score }));

        if (rankedAgents.length === 0) {
            // Default to project orchestrator for complex requests
            return this.createAgentPlan(['project-orchestrator'], userRequest);
        }

        // Determine if this needs multiple agents (complex request)
        const topAgents = rankedAgents.slice(0, 3).map(a => a.agentName);
        const isComplexRequest = this.isComplexRequest(userRequest);

        if (isComplexRequest && topAgents.length > 1) {
            return this.createMultiAgentPlan(topAgents, userRequest);
        } else {
            return this.createAgentPlan([topAgents[0]], userRequest);
        }
    }

    isComplexRequest(request) {
        const complexIndicators = [
            'build', 'create', 'implement', 'develop',
            'system', 'feature', 'complete', 'full'
        ];

        return complexIndicators.some(indicator =>
            request.toLowerCase().includes(indicator)
        );
    }

    createMultiAgentPlan(agents, userRequest) {
        const plan = {
            type: 'multi-agent',
            agents: agents,
            request: userRequest,
            workflow: this.generateWorkflow(agents, userRequest),
            estimatedSteps: agents.length + 1
        };

        console.log(`📋 Multi-agent plan: ${agents.join(' → ')}`);
        return plan;
    }

    createAgentPlan(agents, userRequest) {
        const plan = {
            type: 'single-agent',
            agents: agents,
            request: userRequest,
            workflow: [`Execute with ${agents[0]} agent`],
            estimatedSteps: 1
        };

        console.log(`🎯 Single agent: ${agents[0]}`);
        return plan;
    }

    generateWorkflow(agents, userRequest) {
        // Smart workflow generation based on agent types
        const workflow = [];

        if (agents.includes('requirements-analysis')) {
            workflow.push('1. Analyze requirements and define specifications');
        }

        if (agents.includes('ux-ui-design')) {
            workflow.push('2. Create user experience design and wireframes');
        }

        if (agents.includes('database')) {
            workflow.push('3. Design database schema and data models');
        }

        if (agents.includes('backend-development')) {
            workflow.push('4. Implement backend API and business logic');
        }

        if (agents.includes('frontend-development')) {
            workflow.push('5. Build frontend components and user interface');
        }

        if (agents.includes('testing')) {
            workflow.push('6. Create comprehensive tests and quality assurance');
        }

        return workflow.length > 0 ? workflow : ['Execute request with selected agents'];
    }

    async updateAgentState(agentName, task, status = 'active') {
        await this.agentState.updateAgent(agentName, {
            currentTask: task,
            status: status,
            lastActive: new Date().toISOString()
        });
    }

    async getAgentStatus() {
        return await this.agentState.getAllAgentStates();
    }
}

module.exports = AgentDispatcher;