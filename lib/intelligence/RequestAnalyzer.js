// lib/intelligence/RequestAnalyzer.js
// Intelligent Agent Selection Engine - Core Feature #2 from PRD
// Analyzes user requests and determines appropriate agent assignments with 90%+ accuracy

const fs = require('fs-extra');
const path = require('path');
const AgentRegistry = require('./AgentRegistry');

/**
 * Analyzes user requests and determines appropriate agent assignments
 * PRD Requirements: 90%+ agent selection accuracy, <2s response time, learning from feedback
 */
class RequestAnalyzer {
    constructor(projectPath = process.cwd()) {
        this.projectPath = projectPath;
        this.feedbackFile = path.join(projectPath, '.mega-minds', 'intelligence', 'selection-feedback.json');
        this.metricsFile = path.join(projectPath, '.mega-minds', 'intelligence', 'selection-metrics.json');
        
        // Initialize AgentRegistry for dynamic agent loading
        this.agentRegistry = new AgentRegistry();
        this.agentCapabilities = null; // Will be loaded dynamically
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
            
            // Initialize AgentRegistry with template path
            const templatePath = path.join(__dirname, '../../templates');
            await this.agentRegistry.initialize(templatePath, this.projectPath);
            
            // Load agent capabilities from registry
            this.agentCapabilities = this.agentRegistry.getAllAgents();
            
            // Load existing feedback data if available
            if (await fs.pathExists(this.feedbackFile)) {
                try {
                    this.feedbackData = await fs.readJSON(this.feedbackFile);
                } catch (error) {
                    console.warn('⚠️ Could not load selection feedback data:', error.message);
                    this.feedbackData = [];
                }
            }
            
            console.log(`🧠 Intelligence system initialized with ${Object.keys(this.agentCapabilities).length} agents`);
        } catch (error) {
            console.warn('⚠️ Intelligence system initialization failed:', error.message);
            // Fallback to registry's fallback agents
            this.agentCapabilities = this.agentRegistry.getAllAgents();
            console.log(`🔄 Using fallback agents: ${Object.keys(this.agentCapabilities).length} available`);
        }
    }

    /**
     * Get agent capabilities from registry
     * Note: This method is now deprecated - capabilities are loaded dynamically via AgentRegistry
     */
    getAgentCapabilities() {
        return this.agentCapabilities || {};
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
     * Calculate confidence scores for each agent using enhanced multi-algorithm approach
     * Enhanced for 33+ agents with category-based weighting and specialized scoring
     * @private
     */
    async calculateAgentScores(tokens, requestText, context) {
        const scores = new Map();
        const requestLower = requestText.toLowerCase();
        
        for (const [agentName, agentData] of Object.entries(this.agentCapabilities)) {
            let score = 0;
            let matchDetails = {
                keywordMatches: [],
                capabilityMatches: [],
                expertiseMatches: [],
                categoryBonus: 0,
                contextBonus: 0,
                specialistBonus: 0
            };
            
            // Algorithm 1: Enhanced keyword matching (35% weight)
            if (agentData.keywords && Array.isArray(agentData.keywords)) {
                agentData.keywords.forEach(keyword => {
                    if (tokens.includes(keyword)) {
                        score += 4; // Increased weight for exact matches
                        matchDetails.keywordMatches.push(keyword);
                    }
                    // Enhanced partial matching for compound keywords
                    if (requestLower.includes(keyword)) {
                        score += 2;
                    }
                    // Fuzzy matching for related terms
                    if (this.isSimilarKeyword(keyword, tokens)) {
                        score += 1;
                    }
                });
            }
            
            // Algorithm 2: Enhanced capability matching (30% weight)
            if (agentData.capabilities && Array.isArray(agentData.capabilities)) {
                agentData.capabilities.forEach(capability => {
                    const capabilityWords = capability.split('-');
                    if (capabilityWords.some(word => tokens.includes(word))) {
                        score += 3;
                        matchDetails.capabilityMatches.push(capability);
                    }
                    // Check for capability synonyms
                    if (this.matchesCapabilitySynonym(capability, requestLower)) {
                        score += 2;
                    }
                });
            }
            
            // Algorithm 3: Expertise area matching (20% weight)
            if (agentData.expertiseAreas && Array.isArray(agentData.expertiseAreas)) {
                agentData.expertiseAreas.forEach(expertise => {
                    const expertiseWords = expertise.split('-');
                    if (expertiseWords.some(word => tokens.includes(word))) {
                        score += 2;
                        matchDetails.expertiseMatches.push(expertise);
                    }
                });
            }
            
            // Algorithm 4: Category-based scoring (15% weight)
            const categoryWeight = this.getCategoryWeight(agentData.category);
            const categoryMatch = this.calculateCategoryMatch(agentData.category, requestLower, tokens);
            if (categoryMatch > 0) {
                const categoryBonus = categoryMatch * categoryWeight;
                score += categoryBonus;
                matchDetails.categoryBonus = categoryBonus;
            }
            
            // Algorithm 5: Specialist bonus for highly specific requests
            if (this.isSpecialistRequest(requestLower, agentName)) {
                const specialistBonus = 3;
                score += specialistBonus;
                matchDetails.specialistBonus = specialistBonus;
            }
            
            // Context bonuses
            if (context.previousAgent && context.previousAgent !== agentName) {
                score += 0.5;
            }
            
            if (context.projectType) {
                if (this.matchesProjectType(agentName, context.projectType)) {
                    score += 1;
                    matchDetails.contextBonus += 1;
                }
            }
            
            // Enhanced priority weighting with category consideration
            const priorityWeight = this.calculatePriorityWeight(agentData.priority, agentData.category);
            score += priorityWeight;
            
            // Apply category multipliers for better differentiation
            if (agentData.category) {
                const categoryMultiplier = this.getCategoryMultiplier(agentData.category, requestLower);
                score *= categoryMultiplier;
            }
            
            scores.set(agentName, {
                score: Math.round(score * 100) / 100,
                confidence: Math.min(score / 15, 1.0), // Adjusted normalization for higher scores
                matchDetails: matchDetails,
                description: agentData.description,
                category: agentData.category || 'unknown',
                priority: agentData.priority || 5
            });
        }
        
        return scores;
    }

    /**
     * Check if keyword is similar to any token using basic similarity
     * @private
     */
    isSimilarKeyword(keyword, tokens) {
        // Check for plurals, past tense, etc.
        const variations = [
            keyword + 's',
            keyword + 'ing',
            keyword.endsWith('e') ? keyword + 'd' : keyword + 'ed'
        ];
        
        return variations.some(variation => tokens.includes(variation));
    }

    /**
     * Check if capability matches using synonyms
     * @private
     */
    matchesCapabilitySynonym(capability, requestText) {
        const synonymMap = {
            'react-development': ['react', 'jsx', 'component'],
            'vue-development': ['vue', 'vuejs', 'composition'],
            'api-development': ['rest', 'graphql', 'endpoint', 'service'],
            'testing-automation': ['test', 'spec', 'junit', 'cypress'],
            'deployment-automation': ['deploy', 'cd', 'release', 'pipeline'],
            'security-analysis': ['secure', 'vulnerability', 'auth', 'encryption']
        };
        
        const synonyms = synonymMap[capability];
        return synonyms && synonyms.some(synonym => requestText.includes(synonym));
    }

    /**
     * Get category weight for scoring
     * @private
     */
    getCategoryWeight(category) {
        const weights = {
            'planning': 1.3,
            'development': 1.2,
            'prototyping': 1.1,
            'qa': 1.0,
            'devops': 0.9,
            'businessops': 0.8,
            'saas': 0.9,
            'maintenance': 0.7
        };
        
        return weights[category] || 1.0;
    }

    /**
     * Calculate category match score
     * @private
     */
    calculateCategoryMatch(category, requestText, tokens) {
        const categoryKeywords = {
            'planning': ['plan', 'coordinate', 'manage', 'strategy', 'orchestrate'],
            'development': ['build', 'create', 'develop', 'implement', 'code'],
            'prototyping': ['design', 'prototype', 'mockup', 'wireframe', 'schema'],
            'qa': ['test', 'quality', 'validate', 'verify', 'review'],
            'devops': ['deploy', 'infrastructure', 'ci', 'cd', 'docker'],
            'businessops': ['analytics', 'support', 'marketing', 'customer'],
            'saas': ['tenant', 'subscription', 'billing', 'multi-user'],
            'maintenance': ['optimize', 'maintain', 'fix', 'improve', 'refactor']
        };
        
        const keywords = categoryKeywords[category] || [];
        return keywords.filter(keyword => 
            tokens.includes(keyword) || requestText.includes(keyword)
        ).length;
    }

    /**
     * Check if this is a specialist request that should prefer specific agents
     * @private
     */
    isSpecialistRequest(requestText, agentName) {
        const specialistPatterns = {
            'multi-tenancy-agent': ['multi-tenant', 'saas', 'tenant'],
            'subscription-management-agent': ['subscription', 'billing', 'payment'],
            'security-architecture-agent': ['security', 'vulnerability', 'encrypt'],
            'performance-optimizer-agent': ['performance', 'optimize', 'speed'],
            'ab-tester-agent': ['a/b test', 'experiment', 'variation'],
            'api-design-agent': ['api', 'rest', 'graphql', 'endpoint']
        };
        
        const patterns = specialistPatterns[agentName];
        return patterns && patterns.some(pattern => requestText.includes(pattern));
    }

    /**
     * Calculate priority weight with category consideration
     * @private
     */
    calculatePriorityWeight(priority, category) {
        const basePriority = (6 - (priority || 5)) * 0.3;
        
        // Boost high-priority categories
        const categoryBoost = {
            'planning': 0.5,
            'development': 0.3,
            'prototyping': 0.2,
            'qa': 0.1,
            'devops': 0,
            'businessops': -0.1,
            'saas': 0,
            'maintenance': -0.2
        };
        
        return basePriority + (categoryBoost[category] || 0);
    }

    /**
     * Get category multiplier for final score adjustment
     * @private
     */
    getCategoryMultiplier(category, requestText) {
        // Default multipliers
        let multiplier = 1.0;
        
        // Boost categories that appear to be mentioned in the request
        if (requestText.includes('plan') || requestText.includes('coordinate')) {
            multiplier += category === 'planning' ? 0.2 : 0;
        }
        if (requestText.includes('build') || requestText.includes('develop')) {
            multiplier += category === 'development' ? 0.2 : 0;
        }
        if (requestText.includes('test') || requestText.includes('quality')) {
            multiplier += category === 'qa' ? 0.2 : 0;
        }
        if (requestText.includes('deploy') || requestText.includes('infrastructure')) {
            multiplier += category === 'devops' ? 0.2 : 0;
        }
        
        return multiplier;
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