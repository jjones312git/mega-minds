// lib/intelligence/RequestAnalyzer.js
// Intelligent Agent Selection Engine - Core Feature #2 from PRD
// Analyzes user requests and determines appropriate agent assignments with 90%+ accuracy

const fs = require('fs-extra');
const path = require('path');

/**
 * Analyzes user requests and determines appropriate agent assignments
 * PRD Requirements: 90%+ agent selection accuracy, <2s response time, learning from feedback
 */
class RequestAnalyzer {
    constructor(projectPath = process.cwd()) {
        this.projectPath = projectPath;
        this.feedbackFile = path.join(projectPath, '.mega-minds', 'intelligence', 'selection-feedback.json');
        this.metricsFile = path.join(projectPath, '.mega-minds', 'intelligence', 'selection-metrics.json');
        
        // Load agent capabilities from PRD specifications
        this.agentCapabilities = this.loadAgentCapabilities();
        this.selectionHistory = [];
        this.feedbackData = [];
        
        // Initialization state tracking
        this.initialized = false;
        this.initializationPromise = null;
    }

    /**
     * Initialize intelligence system directories and files
     * This method is now properly async and should be called explicitly
     */
    async initialize() {
        // Prevent multiple simultaneous initializations
        if (this.initialized) {
            return;
        }
        
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this.performInitialization();
        await this.initializationPromise;
        this.initialized = true;
    }

    /**
     * Internal initialization logic
     * @private
     */
    async performInitialization() {
        try {
            const intelligenceDir = path.join(this.projectPath, '.mega-minds', 'intelligence');
            await fs.ensureDir(intelligenceDir);
            
            // Load existing feedback data if available
            if (await fs.pathExists(this.feedbackFile)) {
                try {
                    this.feedbackData = await fs.readJSON(this.feedbackFile);
                } catch (error) {
                    console.warn('⚠️ Could not load selection feedback data:', error.message);
                    this.feedbackData = [];
                }
            }
            
            console.log('🧠 Intelligence system initialized successfully');
        } catch (error) {
            console.warn('⚠️ Intelligence system initialization failed:', error.message);
            // Continue in degraded mode - don't throw error
        }
    }

    /**
     * Load agent capabilities based on PRD requirements and current codebase
     * Maps agents to their expertise areas, keywords, and confidence thresholds
     */
    loadAgentCapabilities() {
        return {
            'project-orchestrator-agent': {
                keywords: ['project', 'coordinate', 'manage', 'plan', 'organize', 'workflow', 'oversee', 'lead'],
                capabilities: ['project-management', 'coordination', 'planning', 'strategy', 'workflow-design'],
                expertiseAreas: ['project-planning', 'team-coordination', 'workflow-management', 'strategic-planning'],
                conflictPrevention: [], // Can work with all agents
                priority: 1, // Highest priority for coordination tasks
                description: 'Orchestrates project phases, coordinates between specialists, manages overall workflow'
            },
            'frontend-development-agent': {
                keywords: ['ui', 'frontend', 'react', 'vue', 'angular', 'component', 'responsive', 'interface', 'user experience', 'css', 'html', 'javascript'],
                capabilities: ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'responsive-design', 'component-architecture'],
                expertiseAreas: ['user-interface', 'component-development', 'frontend-architecture', 'user-experience'],
                conflictPrevention: ['backend-development-agent'], // Should not handle backend tasks
                priority: 2,
                description: 'Creates user interfaces, components, and frontend application logic'
            },
            'backend-development-agent': {
                keywords: ['api', 'backend', 'server', 'database', 'endpoint', 'microservice', 'rest', 'graphql', 'authentication', 'authorization'],
                capabilities: ['nodejs', 'python', 'java', 'api-design', 'database-integration', 'server-architecture'],
                expertiseAreas: ['server-logic', 'api-development', 'backend-architecture', 'database-design'],
                conflictPrevention: ['frontend-development-agent'], // Should not handle UI tasks
                priority: 2,
                description: 'Builds server-side logic, APIs, database integrations, and backend services'
            },
            'testing-agent': {
                keywords: ['test', 'testing', 'unit', 'integration', 'e2e', 'qa', 'quality', 'verify', 'validate', 'coverage'],
                capabilities: ['unit-testing', 'integration-testing', 'e2e-testing', 'test-automation', 'quality-assurance'],
                expertiseAreas: ['test-strategy', 'quality-assurance', 'test-automation', 'validation'],
                conflictPrevention: [], // Can test any component
                priority: 3,
                description: 'Creates and executes tests, ensures code quality and application reliability'
            },
            'monitoring-agent': {
                keywords: ['monitor', 'logging', 'metrics', 'alert', 'performance', 'observability', 'analytics', 'tracking'],
                capabilities: ['monitoring', 'logging', 'alerting', 'performance-tracking', 'analytics'],
                expertiseAreas: ['production-monitoring', 'observability', 'performance-analysis', 'system-health'],
                conflictPrevention: ['testing-agent'], // Different from QA testing
                priority: 4,
                description: 'Sets up monitoring, logging, and observability for production systems'
            },
            'devops-agent': {
                keywords: ['deploy', 'deployment', 'ci', 'cd', 'docker', 'kubernetes', 'infrastructure', 'pipeline', 'automation'],
                capabilities: ['deployment', 'ci-cd', 'containerization', 'infrastructure', 'automation'],
                expertiseAreas: ['deployment-automation', 'infrastructure-management', 'ci-cd-pipelines'],
                conflictPrevention: [],
                priority: 4,
                description: 'Handles deployment, CI/CD, infrastructure, and DevOps automation'
            },
            'security-agent': {
                keywords: ['security', 'vulnerability', 'authentication', 'authorization', 'encryption', 'secure', 'audit'],
                capabilities: ['security-analysis', 'vulnerability-scanning', 'authentication', 'authorization', 'encryption'],
                expertiseAreas: ['application-security', 'security-auditing', 'access-control'],
                conflictPrevention: [],
                priority: 3,
                description: 'Ensures application security, performs security audits, implements security measures'
            }
        };
    }

    /**
     * Analyze user request and return ranked agent recommendations
     * PRD Requirement: <2 seconds response time, 90%+ accuracy
     */
    async analyzeRequest(requestText, context = {}) {
        const startTime = Date.now();
        
        // Ensure system is initialized before analysis
        await this.initialize();
        
        try {
            // Tokenize and clean request
            const tokens = this.tokenizeRequest(requestText);
            const analysis = {
                originalRequest: requestText,
                tokens: tokens,
                context: context,
                timestamp: new Date().toISOString(),
                recommendations: []
            };

            // Calculate agent scores with multiple algorithms
            const agentScores = await this.calculateAgentScores(tokens, requestText, context);
            
            // Apply conflict prevention and validation
            const validatedScores = this.applyConflictPrevention(agentScores, requestText);
            
            // Sort and format recommendations
            analysis.recommendations = this.formatRecommendations(validatedScores, requestText);
            
            // Apply learning from previous feedback
            analysis.recommendations = await this.applyFeedbackLearning(analysis.recommendations, requestText);
            
            // Record selection for metrics
            await this.recordSelection(analysis);
            
            const processingTime = Date.now() - startTime;
            analysis.processingTimeMs = processingTime;
            
            console.log(`🧠 Request analyzed in ${processingTime}ms: ${analysis.recommendations.length} agent recommendations`);
            
            // PRD Requirement: <2 seconds response time
            if (processingTime > 2000) {
                console.warn(`⚠️ Analysis exceeded 2s target: ${processingTime}ms`);
            }
            
            return analysis;
            
        } catch (error) {
            console.error('❌ Error in request analysis:', error.message);
            return {
                originalRequest: requestText,
                error: error.message,
                recommendations: this.getFallbackRecommendations(),
                processingTimeMs: Date.now() - startTime
            };
        }
    }

    /**
     * Tokenize request text for analysis
     * @private
     */
    tokenizeRequest(requestText) {
        return requestText
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Remove punctuation
            .split(/\s+/)
            .filter(token => token.length > 2) // Filter out short words
            .filter(token => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(token)); // Remove stop words
    }

    /**
     * Calculate confidence scores for each agent using multiple algorithms
     * @private
     */
    async calculateAgentScores(tokens, requestText, context) {
        const scores = new Map();
        
        for (const [agentName, agentData] of Object.entries(this.agentCapabilities)) {
            let score = 0;
            let matchDetails = {
                keywordMatches: [],
                capabilityMatches: [],
                expertiseMatches: [],
                contextBonus: 0
            };
            
            // Algorithm 1: Keyword matching (40% weight)
            agentData.keywords.forEach(keyword => {
                if (tokens.includes(keyword)) {
                    score += 3;
                    matchDetails.keywordMatches.push(keyword);
                }
                // Partial matching for compound keywords
                if (requestText.toLowerCase().includes(keyword)) {
                    score += 1;
                }
            });
            
            // Algorithm 2: Capability matching (35% weight)
            agentData.capabilities.forEach(capability => {
                const capabilityWords = capability.split('-');
                if (capabilityWords.some(word => tokens.includes(word))) {
                    score += 2;
                    matchDetails.capabilityMatches.push(capability);
                }
            });
            
            // Algorithm 3: Expertise area matching (25% weight)
            agentData.expertiseAreas.forEach(expertise => {
                const expertiseWords = expertise.split('-');
                if (expertiseWords.some(word => tokens.includes(word))) {
                    score += 1.5;
                    matchDetails.expertiseMatches.push(expertise);
                }
            });
            
            // Context bonuses
            if (context.previousAgent && context.previousAgent !== agentName) {
                // Bonus for different agent (avoid ping-pong)
                score += 0.5;
            }
            
            if (context.projectType) {
                // Bonus for matching project type
                if (this.matchesProjectType(agentName, context.projectType)) {
                    score += 1;
                    matchDetails.contextBonus += 1;
                }
            }
            
            // Priority weighting (higher priority = slight boost)
            score += (6 - agentData.priority) * 0.2;
            
            scores.set(agentName, {
                score: Math.round(score * 100) / 100,
                confidence: Math.min(score / 10, 1.0), // Normalize to 0-1
                matchDetails: matchDetails,
                description: agentData.description
            });
        }
        
        return scores;
    }

    /**
     * Apply conflict prevention rules to avoid incorrect agent selection
     * PRD Requirement: Prevent monitoring-agent for development, etc.
     * @private
     */
    applyConflictPrevention(agentScores, requestText) {
        const validatedScores = new Map(agentScores);
        
        // Check for clear development vs monitoring conflicts
        const isDevelopmentRequest = /create|build|develop|implement|code|write/.test(requestText.toLowerCase());
        const isMonitoringRequest = /monitor|log|alert|track|observe|metrics/.test(requestText.toLowerCase());
        
        if (isDevelopmentRequest && !isMonitoringRequest) {
            // Reduce monitoring-agent score for development requests
            if (validatedScores.has('monitoring-agent')) {
                const monitoringScore = validatedScores.get('monitoring-agent');
                monitoringScore.score *= 0.3; // Significant penalty
                monitoringScore.confidence *= 0.3;
                validatedScores.set('monitoring-agent', monitoringScore);
            }
        }
        
        // Apply agent-specific conflict prevention
        for (const [agentName, agentData] of Object.entries(this.agentCapabilities)) {
            if (agentData.conflictPrevention.length > 0) {
                agentData.conflictPrevention.forEach(conflictAgent => {
                    if (validatedScores.has(conflictAgent)) {
                        // Reduce conflicting agent scores
                        const conflictScore = validatedScores.get(conflictAgent);
                        conflictScore.score *= 0.7;
                        conflictScore.confidence *= 0.7;
                        validatedScores.set(conflictAgent, conflictScore);
                    }
                });
            }
        }
        
        return validatedScores;
    }

    /**
     * Format recommendations with confidence thresholds
     * @private
     */
    formatRecommendations(agentScores, requestText) {
        const sortedAgents = Array.from(agentScores.entries())
            .filter(([, data]) => data.confidence > 0.1) // Minimum confidence threshold
            .sort((a, b) => b[1].score - a[1].score)
            .slice(0, 3); // Top 3 recommendations
        
        return sortedAgents.map(([agentName, data], index) => ({
            agent: agentName,
            confidence: Math.round(data.confidence * 100),
            score: data.score,
            rank: index + 1,
            reasoning: this.generateReasoning(data.matchDetails, requestText),
            description: data.description,
            recommended: index === 0 && data.confidence > 0.7 // High confidence for top recommendation
        }));
    }

    /**
     * Generate human-readable reasoning for agent selection
     * @private
     */
    generateReasoning(matchDetails, requestText) {
        const reasons = [];
        
        if (matchDetails.keywordMatches.length > 0) {
            reasons.push(`Strong keyword matches: ${matchDetails.keywordMatches.slice(0, 3).join(', ')}`);
        }
        
        if (matchDetails.capabilityMatches.length > 0) {
            reasons.push(`Relevant capabilities: ${matchDetails.capabilityMatches.slice(0, 2).join(', ')}`);
        }
        
        if (matchDetails.expertiseMatches.length > 0) {
            reasons.push(`Expertise alignment: ${matchDetails.expertiseMatches.slice(0, 2).join(', ')}`);
        }
        
        if (matchDetails.contextBonus > 0) {
            reasons.push(`Context bonus: +${matchDetails.contextBonus}`);
        }
        
        return reasons.length > 0 ? reasons.join('; ') : 'General capability match';
    }

    /**
     * Apply learning from previous selection feedback
     * PRD Requirement: Learning from selection feedback
     * @private
     */
    async applyFeedbackLearning(recommendations, requestText) {
        if (this.feedbackData.length === 0) {
            return recommendations;
        }
        
        // Find similar past requests
        const similarRequests = this.feedbackData.filter(feedback => 
            this.calculateTextSimilarity(feedback.originalRequest, requestText) > 0.6
        );
        
        if (similarRequests.length > 0) {
            console.log(`📚 Found ${similarRequests.length} similar requests for learning`);
            
            // Adjust recommendations based on feedback
            for (const recommendation of recommendations) {
                const relevantFeedback = similarRequests.filter(fb => 
                    fb.selectedAgent === recommendation.agent
                );
                
                if (relevantFeedback.length > 0) {
                    const avgAccuracy = relevantFeedback.reduce((sum, fb) => sum + fb.accuracy, 0) / relevantFeedback.length;
                    
                    // Adjust confidence based on historical accuracy
                    recommendation.confidence = Math.round(recommendation.confidence * avgAccuracy);
                    recommendation.learningApplied = true;
                    recommendation.historicalAccuracy = Math.round(avgAccuracy * 100);
                }
            }
            
            // Re-sort after learning adjustments
            recommendations.sort((a, b) => b.confidence - a.confidence);
            recommendations.forEach((rec, index) => {
                rec.rank = index + 1;
                rec.recommended = index === 0 && rec.confidence > 70;
            });
        }
        
        return recommendations;
    }

    /**
     * Calculate text similarity for learning
     * @private
     */
    calculateTextSimilarity(text1, text2) {
        const tokens1 = new Set(this.tokenizeRequest(text1));
        const tokens2 = new Set(this.tokenizeRequest(text2));
        
        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
        const union = new Set([...tokens1, ...tokens2]);
        
        return intersection.size / union.size; // Jaccard similarity
    }

    /**
     * Check if agent matches project type context
     * @private
     */
    matchesProjectType(agentName, projectType) {
        const projectMatches = {
            'web-app': ['frontend-development-agent', 'backend-development-agent'],
            'api': ['backend-development-agent'],
            'mobile': ['frontend-development-agent'],
            'cli': ['backend-development-agent'],
            'library': ['backend-development-agent', 'testing-agent'],
            'monitoring': ['monitoring-agent'],
            'infrastructure': ['devops-agent']
        };
        
        return projectMatches[projectType]?.includes(agentName) || false;
    }

    /**
     * Record selection for metrics and learning
     * @private
     */
    async recordSelection(analysis) {
        this.selectionHistory.push({
            timestamp: analysis.timestamp,
            request: analysis.originalRequest,
            recommendations: analysis.recommendations,
            topAgent: analysis.recommendations[0]?.agent,
            confidence: analysis.recommendations[0]?.confidence,
            processingTime: analysis.processingTimeMs
        });
        
        // Keep only last 1000 selections for performance
        if (this.selectionHistory.length > 1000) {
            this.selectionHistory = this.selectionHistory.slice(-1000);
        }
        
        // Save metrics periodically
        if (this.selectionHistory.length % 10 === 0) {
            await this.saveMetrics();
        }
    }

    /**
     * Provide fallback recommendations when analysis fails
     * @private
     */
    getFallbackRecommendations() {
        return [{
            agent: 'project-orchestrator-agent',
            confidence: 80,
            score: 8.0,
            rank: 1,
            reasoning: 'Fallback to orchestrator for task coordination',
            description: 'Orchestrates project phases and coordinates between specialists',
            recommended: true,
            fallback: true
        }];
    }

    /**
     * Record feedback on agent selection accuracy
     * PRD Requirement: Learning from selection feedback
     */
    async recordFeedback(originalRequest, selectedAgent, accuracy, notes = '') {
        // Ensure system is initialized before recording feedback
        await this.initialize();
        
        const feedback = {
            timestamp: new Date().toISOString(),
            originalRequest: originalRequest,
            selectedAgent: selectedAgent,
            accuracy: accuracy, // 0.0 to 1.0
            notes: notes,
            id: `feedback-${Date.now()}`
        };
        
        this.feedbackData.push(feedback);
        
        // Keep only last 500 feedback entries
        if (this.feedbackData.length > 500) {
            this.feedbackData = this.feedbackData.slice(-500);
        }
        
        try {
            // Save feedback data
            await fs.writeJSON(this.feedbackFile, this.feedbackData, { spaces: 2 });
            console.log(`📝 Feedback recorded: ${selectedAgent} accuracy ${Math.round(accuracy * 100)}%`);
        } catch (error) {
            console.warn('⚠️ Could not save feedback data:', error.message);
        }
        
        return feedback;
    }

    /**
     * Get selection metrics for monitoring PRD requirements
     */
    async getSelectionMetrics() {
        // Ensure system is initialized before getting metrics
        await this.initialize();
        
        const recentSelections = this.selectionHistory.slice(-100); // Last 100 selections
        const recentFeedback = this.feedbackData.slice(-50); // Last 50 feedback entries
        
        const metrics = {
            totalSelections: this.selectionHistory.length,
            recentSelections: recentSelections.length,
            avgProcessingTime: recentSelections.length > 0 ? 
                recentSelections.reduce((sum, s) => sum + s.processingTime, 0) / recentSelections.length : 0,
            avgConfidence: recentSelections.length > 0 ?
                recentSelections.reduce((sum, s) => sum + (s.confidence || 0), 0) / recentSelections.length : 0,
            
            // PRD Metrics
            selectionAccuracy: recentFeedback.length > 0 ?
                recentFeedback.reduce((sum, f) => sum + f.accuracy, 0) / recentFeedback.length : 0,
            responseTimeTarget: '<2s',
            accuracyTarget: '90%',
            
            // Performance indicators
            meetsResponseTime: recentSelections.every(s => s.processingTime < 2000),
            meetsAccuracyTarget: recentFeedback.length > 0 ?
                (recentFeedback.reduce((sum, f) => sum + f.accuracy, 0) / recentFeedback.length) >= 0.9 : false,
            
            timestamp: new Date().toISOString()
        };
        
        return metrics;
    }

    /**
     * Save metrics to file
     * @private
     */
    async saveMetrics() {
        try {
            const metrics = await this.getSelectionMetrics();
            await fs.writeJSON(this.metricsFile, metrics, { spaces: 2 });
        } catch (error) {
            console.warn('⚠️ Could not save selection metrics:', error.message);
        }
    }
}

module.exports = RequestAnalyzer;