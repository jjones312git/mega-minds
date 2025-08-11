// lib/utils/RequestRouter.js

/**
 * RequestRouter - Intelligent request analysis and agent selection
 * Analyzes user requests and automatically routes to the most appropriate agents
 */
class RequestRouter {
    constructor() {
        this.agentCapabilities = this.initializeAgentCapabilities();
        this.routingHistory = [];
        this.learningEnabled = true;
    }

    /**
     * Analyze request and route to appropriate agents
     */
    async routeRequest(userRequest, projectContext = {}) {
        console.log('🔍 Analyzing request for optimal agent routing...');

        // Analyze the request
        const analysis = this.analyzeRequest(userRequest);

        // Get project context factors
        const contextFactors = this.analyzeProjectContext(projectContext);

        // Determine optimal agent sequence
        const routing = this.determineAgentSequence(analysis, contextFactors);

        // Validate routing based on agent availability
        const validatedRouting = await this.validateRouting(routing, projectContext);

        // Save for learning
        if (this.learningEnabled) {
            this.saveRoutingDecision(userRequest, analysis, validatedRouting);
        }

        console.log(`🤖 Routing: ${validatedRouting.primary.join(' → ')}`);

        return validatedRouting;
    }

    /**
     * Analyze user request to understand intent and complexity
     */
    analyzeRequest(request) {
        const requestLower = request.toLowerCase();

        const analysis = {
            keywords: this.extractKeywords(requestLower),
            intent: this.classifyIntent(requestLower),
            complexity: this.assessComplexity(requestLower),
            urgency: this.assessUrgency(requestLower),
            scope: this.determineScope(requestLower),
            requiredCapabilities: this.identifyRequiredCapabilities(requestLower)
        };

        return analysis;
    }

    /**
     * Extract relevant keywords from request
     */
    extractKeywords(request) {
        const keywordPatterns = {
            // Frontend development
            frontend: ['ui', 'interface', 'component', 'react', 'vue', 'frontend', 'page', 'form', 'button', 'styling', 'css', 'responsive', 'mobile'],

            // Backend development  
            backend: ['api', 'endpoint', 'server', 'backend', 'database', 'auth', 'authentication', 'validation', 'business logic'],

            // Database
            database: ['database', 'db', 'sql', 'table', 'schema', 'query', 'migration', 'data model', 'postgresql', 'mysql'],

            // Authentication
            auth: ['login', 'register', 'auth', 'authentication', 'authorization', 'user', 'session', 'token', 'oauth', 'jwt'],

            // Testing
            testing: ['test', 'testing', 'unit test', 'integration test', 'e2e', 'coverage', 'spec', 'jest'],

            // DevOps
            devops: ['deploy', 'deployment', 'ci/cd', 'pipeline', 'infrastructure', 'cloud', 'aws', 'docker', 'kubernetes'],

            // Design
            design: ['design', 'mockup', 'wireframe', 'prototype', 'ux', 'user experience', 'layout', 'brand'],

            // Planning
            planning: ['plan', 'architecture', 'structure', 'organize', 'strategy', 'requirement', 'analyze', 'research'],

            // Performance
            performance: ['performance', 'optimize', 'slow', 'fast', 'speed', 'cache', 'load time', 'bottleneck'],

            // Security
            security: ['security', 'secure', 'vulnerability', 'encryption', 'ssl', 'https', 'audit', 'compliance']
        };

        const foundKeywords = {};

        for (const [category, keywords] of Object.entries(keywordPatterns)) {
            foundKeywords[category] = keywords.filter(keyword => request.includes(keyword));
        }

        return foundKeywords;
    }

    /**
     * Classify the intent of the request
     */
    classifyIntent(request) {
        const intentPatterns = {
            create: ['create', 'build', 'make', 'develop', 'add', 'implement', 'generate'],
            modify: ['update', 'change', 'modify', 'edit', 'refactor', 'improve', 'enhance'],
            fix: ['fix', 'debug', 'resolve', 'solve', 'repair', 'troubleshoot', 'issue'],
            analyze: ['analyze', 'review', 'check', 'evaluate', 'assess', 'investigate'],
            plan: ['plan', 'design', 'architect', 'structure', 'organize', 'strategy'],
            test: ['test', 'verify', 'validate', 'check', 'ensure'],
            deploy: ['deploy', 'release', 'publish', 'launch', 'go live'],
            document: ['document', 'write docs', 'documentation', 'readme', 'guide']
        };

        for (const [intent, patterns] of Object.entries(intentPatterns)) {
            if (patterns.some(pattern => request.includes(pattern))) {
                return intent;
            }
        }

        return 'unknown';
    }

    /**
     * Assess complexity of the request
     */
    assessComplexity(request) {
        let complexity = 1; // Base complexity

        // Complexity indicators
        const complexityIndicators = {
            high: ['integration', 'system', 'architecture', 'complex', 'multiple', 'advanced', 'enterprise'],
            medium: ['feature', 'component', 'service', 'workflow', 'process'],
            simple: ['simple', 'basic', 'quick', 'small', 'minor']
        };

        if (complexityIndicators.high.some(indicator => request.includes(indicator))) {
            complexity = 5;
        } else if (complexityIndicators.medium.some(indicator => request.includes(indicator))) {
            complexity = 3;
        } else if (complexityIndicators.simple.some(indicator => request.includes(indicator))) {
            complexity = 1;
        } else {
            // Count different technical areas mentioned
            const technicalAreas = ['frontend', 'backend', 'database', 'auth', 'testing', 'devops'].filter(area =>
                request.includes(area)
            );
            complexity = Math.min(5, technicalAreas.length + 1);
        }

        return complexity;
    }

    /**
     * Assess urgency of the request
     */
    assessUrgency(request) {
        const urgencyIndicators = {
            urgent: ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'now', 'urgent'],
            high: ['quickly', 'soon', 'priority', 'important', 'deadline'],
            normal: ['when possible', 'eventually', 'future', 'later']
        };

        if (urgencyIndicators.urgent.some(indicator => request.includes(indicator))) {
            return 'urgent';
        } else if (urgencyIndicators.high.some(indicator => request.includes(indicator))) {
            return 'high';
        } else if (urgencyIndicators.normal.some(indicator => request.includes(indicator))) {
            return 'normal';
        }

        return 'normal'; // Default
    }

    /**
     * Determine scope of work
     */
    determineScope(request) {
        const scopeIndicators = {
            full_project: ['project', 'application', 'app', 'system', 'platform'],
            feature: ['feature', 'functionality', 'capability', 'module'],
            component: ['component', 'widget', 'element', 'part'],
            task: ['task', 'item', 'piece', 'small']
        };

        for (const [scope, indicators] of Object.entries(scopeIndicators)) {
            if (indicators.some(indicator => request.includes(indicator))) {
                return scope;
            }
        }

        return 'feature'; // Default
    }

    /**
     * Identify required capabilities based on request
     */
    identifyRequiredCapabilities(request) {
        const capabilities = [];
        const keywords = this.extractKeywords(request);

        // Map keywords to capabilities
        if (keywords.frontend.length > 0) capabilities.push('frontend_development');
        if (keywords.backend.length > 0) capabilities.push('backend_development');
        if (keywords.database.length > 0) capabilities.push('database_management');
        if (keywords.auth.length > 0) capabilities.push('authentication');
        if (keywords.testing.length > 0) capabilities.push('testing');
        if (keywords.devops.length > 0) capabilities.push('devops');
        if (keywords.design.length > 0) capabilities.push('ui_design');
        if (keywords.planning.length > 0) capabilities.push('planning');
        if (keywords.performance.length > 0) capabilities.push('performance_optimization');
        if (keywords.security.length > 0) capabilities.push('security');

        return capabilities.length > 0 ? capabilities : ['general_development'];
    }

    /**
     * Determine optimal sequence of agents
     */
    determineAgentSequence(analysis, contextFactors) {
        const routing = {
            primary: [],      // Main sequence of agents
            parallel: [],     // Agents that can work in parallel
            optional: [],     // Agents that might be helpful
            priority: analysis.urgency === 'urgent' ? 'high' : 'normal'
        };

        // Start with project orchestrator for complex requests
        if (analysis.complexity >= 3 || analysis.scope === 'full_project') {
            routing.primary.push('project-orchestrator-agent');
        }

        // Add agents based on required capabilities
        const agentSequence = this.mapCapabilitiesToAgents(analysis.requiredCapabilities, analysis.intent);

        // Add planning agents for new features/projects
        if (analysis.intent === 'create' && (analysis.scope === 'feature' || analysis.scope === 'full_project')) {
            if (!routing.primary.includes('project-orchestrator-agent')) {
                routing.primary.push('requirements-analysis-agent');
            }

            if (analysis.complexity >= 4) {
                routing.optional.push('risk-assessment-agent');
                routing.optional.push('market-research-agent');
            }
        }

        // Add design agents for UI work
        if (analysis.requiredCapabilities.includes('frontend_development') ||
            analysis.requiredCapabilities.includes('ui_design')) {
            if (analysis.intent === 'create') {
                routing.primary.push('ux-ui-design-agent');
            }
        }

        // Add technical architecture for complex systems
        if (analysis.complexity >= 4 || analysis.scope === 'full_project') {
            routing.primary.push('technical-architecture-agent');
        }

        // Add database design for data-related work
        if (analysis.requiredCapabilities.includes('database_management')) {
            if (analysis.intent === 'create' || analysis.intent === 'modify') {
                routing.primary.push('database-schema-agent');
            }
            routing.primary.push('database-agent');
        }

        // Add API design for backend work
        if (analysis.requiredCapabilities.includes('backend_development')) {
            if (analysis.intent === 'create') {
                routing.primary.push('api-design-agent');
            }
            routing.primary.push('backend-development-agent');
        }

        // Add security for auth or security work
        if (analysis.requiredCapabilities.includes('authentication') ||
            analysis.requiredCapabilities.includes('security')) {
            routing.primary.push('security-architecture-agent');
            routing.primary.push('authentication-agent');
        }

        // Add frontend development
        if (analysis.requiredCapabilities.includes('frontend_development')) {
            routing.primary.push('frontend-development-agent');
        }

        // Add testing agents
        if (analysis.requiredCapabilities.includes('testing') || analysis.intent === 'create') {
            routing.primary.push('testing-agent');

            if (analysis.requiredCapabilities.includes('security')) {
                routing.parallel.push('security-testing-agent');
            }

            if (analysis.requiredCapabilities.includes('performance_optimization')) {
                routing.parallel.push('performance-testing-agent');
            }
        }

        // Add DevOps for deployment
        if (analysis.requiredCapabilities.includes('devops') || analysis.intent === 'deploy') {
            routing.primary.push('ci-cd-pipeline-agent');
            routing.primary.push('infrastructure-agent');
        }

        // Always add code review for code changes
        if (['create', 'modify', 'fix'].includes(analysis.intent)) {
            routing.primary.push('code-review-agent');
        }

        return routing;
    }

    /**
     * Map capabilities to specific agents
     */
    mapCapabilitiesToAgents(capabilities, intent) {
        const mapping = {
            frontend_development: ['frontend-development-agent'],
            backend_development: ['backend-development-agent'],
            database_management: ['database-agent'],
            authentication: ['authentication-agent'],
            testing: ['testing-agent'],
            devops: ['ci-cd-pipeline-agent', 'infrastructure-agent'],
            ui_design: ['ux-ui-design-agent'],
            planning: ['requirements-analysis-agent', 'project-orchestrator-agent'],
            performance_optimization: ['performance-testing-agent'],
            security: ['security-architecture-agent', 'security-testing-agent']
        };

        const agents = [];
        capabilities.forEach(capability => {
            if (mapping[capability]) {
                agents.push(...mapping[capability]);
            }
        });

        return [...new Set(agents)]; // Remove duplicates
    }

    /**
     * Validate routing based on agent availability and project state
     */
    async validateRouting(routing, projectContext) {
        // Check agent availability
        const agentWorkload = projectContext.agentWorkload || {};

        // Filter out busy agents and suggest alternatives
        const validatedRouting = {
            ...routing,
            primary: await this.validateAgentSequence(routing.primary, agentWorkload),
            parallel: await this.validateAgentSequence(routing.parallel, agentWorkload),
            blocked: [],
            alternatives: []
        };

        // Check for blocked agents and suggest alternatives
        for (const agent of routing.primary) {
            if (agentWorkload[agent]?.availability === 'blocked') {
                validatedRouting.blocked.push(agent);
                const alternative = this.findAlternativeAgent(agent);
                if (alternative) {
                    validatedRouting.alternatives.push({
                        blocked: agent,
                        alternative: alternative,
                        reason: agentWorkload[agent].blockedOn
                    });
                }
            }
        }

        return validatedRouting;
    }

    /**
     * Validate agent sequence for availability
     */
    async validateAgentSequence(agentSequence, agentWorkload) {
        return agentSequence.filter(agent => {
            const workload = agentWorkload[agent];
            return !workload || workload.availability !== 'blocked';
        });
    }

    /**
     * Find alternative agent for blocked agent
     */
    findAlternativeAgent(blockedAgent) {
        const alternatives = {
            'frontend-development-agent': ['ux-ui-design-agent'],
            'backend-development-agent': ['api-design-agent', 'database-agent'],
            'testing-agent': ['code-review-agent'],
            'database-agent': ['database-schema-agent'],
            'infrastructure-agent': ['ci-cd-pipeline-agent']
        };

        return alternatives[blockedAgent]?.[0] || null;
    }

    /**
     * Analyze project context factors
     */
    analyzeProjectContext(projectContext) {
        return {
            projectPhase: projectContext.phase || 'development',
            teamSize: this.calculateTeamSize(projectContext.agentWorkload),
            currentLoad: this.calculateCurrentLoad(projectContext.agentWorkload),
            recentActivity: projectContext.recentActivity || [],
            priorities: projectContext.priorities || []
        };
    }

    /**
     * Calculate team size (active agents)
     */
    calculateTeamSize(agentWorkload) {
        if (!agentWorkload) return 0;
        return Object.values(agentWorkload).filter(agent =>
            agent.availability === 'busy' || agent.availability === 'available'
        ).length;
    }

    /**
     * Calculate current team load
     */
    calculateCurrentLoad(agentWorkload) {
        if (!agentWorkload) return 0;
        const total = Object.keys(agentWorkload).length;
        const busy = Object.values(agentWorkload).filter(agent =>
            agent.availability === 'busy'
        ).length;

        return total > 0 ? (busy / total) * 100 : 0;
    }

    /**
     * Save routing decision for learning
     */
    saveRoutingDecision(request, analysis, routing) {
        this.routingHistory.push({
            timestamp: new Date().toISOString(),
            request: request,
            analysis: analysis,
            routing: routing,
            success: null // Will be updated based on outcome
        });

        // Keep only recent history (last 100 decisions)
        if (this.routingHistory.length > 100) {
            this.routingHistory = this.routingHistory.slice(-100);
        }
    }

    /**
     * Learn from routing outcomes
     */
    updateRoutingOutcome(requestId, success, feedback = null) {
        const decision = this.routingHistory.find(h => h.timestamp === requestId);
        if (decision) {
            decision.success = success;
            decision.feedback = feedback;

            // Use this data to improve future routing decisions
            this.updateRoutingModel(decision);
        }
    }

    /**
     * Update routing model based on outcomes (simple learning)
     */
    updateRoutingModel(decision) {
        // Simple learning: adjust agent preferences based on success
        if (decision.success) {
            // Increase preference for successful routing patterns
            // This is a simplified implementation
            console.log(`✅ Successful routing pattern learned: ${decision.routing.primary.join(' → ')}`);
        } else {
            // Decrease preference for failed routing patterns
            console.log(`❌ Failed routing pattern noted: ${decision.routing.primary.join(' → ')}`);
        }
    }

    /**
     * Get routing suggestions based on similar past requests
     */
    getSimilarRoutingPatterns(analysis) {
        return this.routingHistory
            .filter(h => h.success === true)
            .filter(h => {
                // Find similar requests based on intent and capabilities
                return h.analysis.intent === analysis.intent &&
                    h.analysis.requiredCapabilities.some(cap =>
                        analysis.requiredCapabilities.includes(cap)
                    );
            })
            .slice(-5) // Last 5 similar successful patterns
            .map(h => ({
                routing: h.routing.primary,
                similarity: this.calculateSimilarity(analysis, h.analysis)
            }))
            .sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Calculate similarity between requests
     */
    calculateSimilarity(analysis1, analysis2) {
        let similarity = 0;

        // Intent match
        if (analysis1.intent === analysis2.intent) similarity += 0.3;

        // Capability overlap
        const overlap = analysis1.requiredCapabilities.filter(cap =>
            analysis2.requiredCapabilities.includes(cap)
        ).length;
        const union = [...new Set([...analysis1.requiredCapabilities, ...analysis2.requiredCapabilities])].length;
        similarity += (overlap / union) * 0.5;

        // Complexity similarity
        const complexityDiff = Math.abs(analysis1.complexity - analysis2.complexity);
        similarity += (1 - complexityDiff / 5) * 0.2;

        return similarity;
    }

    /**
     * Initialize agent capabilities matrix
     */
    initializeAgentCapabilities() {
        return {
            'project-orchestrator-agent': {
                capabilities: ['coordination', 'planning', 'task_management'],
                workload_capacity: 10,
                parallel_capable: true
            },
            'requirements-analysis-agent': {
                capabilities: ['requirements_gathering', 'analysis', 'documentation'],
                workload_capacity: 5,
                parallel_capable: false
            },
            'ux-ui-design-agent': {
                capabilities: ['ui_design', 'user_experience', 'prototyping'],
                workload_capacity: 3,
                parallel_capable: true
            },
            'frontend-development-agent': {
                capabilities: ['frontend_development', 'react', 'ui_implementation'],
                workload_capacity: 5,
                parallel_capable: true
            },
            'backend-development-agent': {
                capabilities: ['backend_development', 'api_development', 'business_logic'],
                workload_capacity: 5,
                parallel_capable: true
            },
            'database-agent': {
                capabilities: ['database_management', 'sql', 'data_operations'],
                workload_capacity: 3,
                parallel_capable: false
            },
            'authentication-agent': {
                capabilities: ['authentication', 'security', 'user_management'],
                workload_capacity: 3,
                parallel_capable: false
            },
            'testing-agent': {
                capabilities: ['testing', 'quality_assurance', 'test_automation'],
                workload_capacity: 5,
                parallel_capable: true
            }
            // Add more agents as needed
        };
    }
}

module.exports = RequestRouter;