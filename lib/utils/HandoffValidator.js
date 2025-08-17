// lib/utils/HandoffValidator.js
/**
 * HandoffValidator - Validates handoff content and prevents malformed agent transfers
 * Ensures all handoffs follow the communication protocol and include required information
 */

class HandoffValidator {
    constructor(config = {}) {
        this.config = {
            // Validation strictness levels
            strictMode: false,
            requireAllSections: false,
            
            // Agent validation
            validAgentNames: [],
            enforceAgentNaming: true,
            
            // Template validation
            requiredSections: [
                '## Handoff to @',
                '🤖 @',
                '**Context**:',
                '**Your Task**:',
                '**Success Criteria**:'
            ],
            recommendedSections: [
                '**Requirements & Constraints**:',
                '**Dependencies**:',
                '**Integration Points**:',
                '**Timeline**:'
            ],
            
            // Content validation
            minContextLength: 50,
            maxDescriptionLength: 100,
            minSuccessCriteriaLength: 20,
            
            ...config
        };

        // Load known agent capabilities if available
        this.agentCapabilities = this.loadAgentCapabilities();
    }

    /**
     * Validate complete handoff data structure
     * @param {object} handoffData - The handoff data to validate
     * @returns {object} Validation result with errors, warnings, and score
     */
    validateHandoffData(handoffData) {
        const errors = [];
        const warnings = [];
        const info = [];

        // Structural validation
        const structuralResult = this.validateStructure(handoffData);
        errors.push(...structuralResult.errors);
        warnings.push(...structuralResult.warnings);

        // Agent validation
        const agentResult = this.validateAgents(handoffData);
        errors.push(...agentResult.errors);
        warnings.push(...agentResult.warnings);

        // Content quality validation
        const contentResult = this.validateContent(handoffData);
        errors.push(...contentResult.errors);
        warnings.push(...contentResult.warnings);
        info.push(...contentResult.info);

        // Dependencies validation
        const dependencyResult = this.validateDependencies(handoffData);
        errors.push(...dependencyResult.errors);
        warnings.push(...dependencyResult.warnings);

        const qualityScore = this.calculateQualityScore(handoffData, errors, warnings);

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            info: info,
            qualityScore: qualityScore,
            recommendation: this.getRecommendation(qualityScore, errors, warnings)
        };
    }

    /**
     * Validate handoff template structure
     * @param {string} handoffTemplate - The handoff template string
     * @returns {object} Template validation result
     */
    validateHandoffTemplate(handoffTemplate) {
        const errors = [];
        const warnings = [];
        const info = [];

        if (!handoffTemplate || typeof handoffTemplate !== 'string') {
            errors.push('Handoff template must be a non-empty string');
            return { isValid: false, errors, warnings, info };
        }

        // Check required sections
        for (const section of this.config.requiredSections) {
            if (!handoffTemplate.includes(section)) {
                errors.push(`Missing required section: ${section}`);
            }
        }

        // Check recommended sections
        for (const section of this.config.recommendedSections) {
            if (!handoffTemplate.includes(section)) {
                warnings.push(`Missing recommended section: ${section}`);
            }
        }

        // Validate activation marker
        const activationMarkerResult = this.validateActivationMarker(handoffTemplate);
        errors.push(...activationMarkerResult.errors);
        warnings.push(...activationMarkerResult.warnings);

        // Check template formatting
        const formattingResult = this.validateTemplateFormatting(handoffTemplate);
        warnings.push(...formattingResult.warnings);
        info.push(...formattingResult.info);

        const completeness = this.calculateTemplateCompleteness(handoffTemplate);

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            info: info,
            completeness: completeness,
            missingRequired: this.config.requiredSections.filter(section => 
                !handoffTemplate.includes(section)
            ),
            missingRecommended: this.config.recommendedSections.filter(section => 
                !handoffTemplate.includes(section)
            )
        };
    }

    /**
     * Validate agent capability match
     * @param {string} agentName - Name of the target agent
     * @param {string} taskDescription - Description of the task
     * @returns {object} Agent capability validation result
     */
    validateAgentCapability(agentName, taskDescription) {
        const errors = [];
        const warnings = [];
        const info = [];

        if (!agentName) {
            errors.push('Agent name is required');
            return { isValid: false, errors, warnings, info };
        }

        // Check agent name format
        if (this.config.enforceAgentNaming && !agentName.endsWith('-agent')) {
            warnings.push(`Agent name "${agentName}" doesn't follow convention: [name]-agent`);
        }

        // Check if agent exists in known capabilities
        if (this.agentCapabilities[agentName]) {
            const capability = this.agentCapabilities[agentName];
            const taskLower = taskDescription ? taskDescription.toLowerCase() : '';

            // Check keyword matches
            const keywordMatches = capability.keywords.filter(keyword => 
                taskLower.includes(keyword)
            );

            // Check trigger matches
            const triggerMatches = capability.triggers.filter(trigger => 
                taskLower.includes(trigger)
            );

            if (keywordMatches.length === 0 && triggerMatches.length === 0) {
                warnings.push(`Task description doesn't match ${agentName} capabilities. Consider: ${capability.keywords.slice(0, 3).join(', ')}`);
            } else {
                info.push(`Good match: ${agentName} handles ${keywordMatches.concat(triggerMatches).join(', ')}`);
            }
        } else if (this.config.validAgentNames.length > 0) {
            warnings.push(`Unknown agent: ${agentName}. Known agents: ${this.config.validAgentNames.slice(0, 5).join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            info: info,
            capabilityMatch: this.calculateCapabilityMatch(agentName, taskDescription)
        };
    }

    /**
     * Validate handoff structure (required fields)
     * @param {object} handoffData - Handoff data to validate
     * @returns {object} Structural validation result
     */
    validateStructure(handoffData) {
        const errors = [];
        const warnings = [];

        const requiredFields = ['fromAgent', 'toAgent', 'taskDescription'];
        const recommendedFields = ['context', 'requirements', 'successCriteria', 'timeline'];

        // Check required fields
        for (const field of requiredFields) {
            if (!handoffData[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        // Check recommended fields
        for (const field of recommendedFields) {
            if (!handoffData[field]) {
                warnings.push(`Missing recommended field: ${field}`);
            }
        }

        // Validate field types
        if (handoffData.taskDescription && typeof handoffData.taskDescription !== 'string') {
            errors.push('taskDescription must be a string');
        }

        if (handoffData.priority && !['low', 'normal', 'high', 'urgent'].includes(handoffData.priority)) {
            warnings.push('priority should be one of: low, normal, high, urgent');
        }

        return { errors, warnings };
    }

    /**
     * Validate agent names and relationships
     * @param {object} handoffData - Handoff data to validate
     * @returns {object} Agent validation result
     */
    validateAgents(handoffData) {
        const errors = [];
        const warnings = [];

        // Check agent names exist
        if (!handoffData.fromAgent) {
            errors.push('fromAgent is required');
        }

        if (!handoffData.toAgent) {
            errors.push('toAgent is required');
        }

        // Check agents are different
        if (handoffData.fromAgent && handoffData.toAgent && 
            handoffData.fromAgent === handoffData.toAgent) {
            errors.push('fromAgent and toAgent cannot be the same');
        }

        // Validate agent capabilities if task provided
        if (handoffData.toAgent && handoffData.taskDescription) {
            const capabilityResult = this.validateAgentCapability(
                handoffData.toAgent, 
                handoffData.taskDescription
            );
            warnings.push(...capabilityResult.warnings);
        }

        return { errors, warnings };
    }

    /**
     * Validate content quality
     * @param {object} handoffData - Handoff data to validate
     * @returns {object} Content validation result
     */
    validateContent(handoffData) {
        const errors = [];
        const warnings = [];
        const info = [];

        // Task description validation
        if (handoffData.taskDescription) {
            const desc = handoffData.taskDescription;
            
            if (desc.length > this.config.maxDescriptionLength) {
                warnings.push(`Task description is long (${desc.length} chars). Consider shortening for clarity.`);
            }

            const wordCount = desc.trim().split(/\s+/).length;
            if (wordCount > 10) {
                warnings.push('Task description should be concise (3-5 words recommended)');
            }

            if (wordCount <= 2) {
                warnings.push('Task description seems too brief');
            }
        }

        // Context validation
        if (handoffData.context) {
            if (handoffData.context.length < this.config.minContextLength) {
                warnings.push('Context seems brief. Consider adding more background information.');
            }
            
            info.push(`Context length: ${handoffData.context.length} characters`);
        }

        // Success criteria validation
        if (handoffData.successCriteria) {
            if (typeof handoffData.successCriteria === 'string') {
                if (handoffData.successCriteria.length < this.config.minSuccessCriteriaLength) {
                    warnings.push('Success criteria seems too brief. Be more specific.');
                }
            } else if (Array.isArray(handoffData.successCriteria)) {
                if (handoffData.successCriteria.length === 0) {
                    warnings.push('Success criteria array is empty');
                }
                
                info.push(`Success criteria count: ${handoffData.successCriteria.length}`);
            }
        }

        return { errors, warnings, info };
    }

    /**
     * Validate dependencies and prerequisites
     * @param {object} handoffData - Handoff data to validate
     * @returns {object} Dependency validation result
     */
    validateDependencies(handoffData) {
        const errors = [];
        const warnings = [];

        if (handoffData.dependencies) {
            if (Array.isArray(handoffData.dependencies)) {
                // Check for circular dependencies (basic check)
                if (handoffData.dependencies.includes(handoffData.fromAgent)) {
                    warnings.push('Potential circular dependency detected');
                }

                // Check for self-dependency
                if (handoffData.dependencies.includes(handoffData.toAgent)) {
                    warnings.push('Agent cannot depend on itself');
                }
            } else if (typeof handoffData.dependencies === 'string') {
                if (handoffData.dependencies.length < 10) {
                    warnings.push('Dependencies description seems too brief');
                }
            }
        }

        return { errors, warnings };
    }

    /**
     * Validate activation marker in template
     * @param {string} template - Handoff template
     * @returns {object} Activation marker validation result
     */
    validateActivationMarker(template) {
        const errors = [];
        const warnings = [];

        if (!template.includes('🤖 @')) {
            errors.push('Missing required robot emoji activation marker: 🤖 @');
        }

        if (!template.includes('ACTIVE')) {
            errors.push('Missing required ACTIVE keyword in activation marker');
        }

        // Check for proper formatting
        const markerPattern = /🤖 @[\w-]+-agent ACTIVE/;
        if (!markerPattern.test(template)) {
            warnings.push('Activation marker may not be properly formatted. Expected: 🤖 @agent-name ACTIVE');
        }

        return { errors, warnings };
    }

    /**
     * Validate template formatting quality
     * @param {string} template - Handoff template
     * @returns {object} Formatting validation result
     */
    validateTemplateFormatting(template) {
        const warnings = [];
        const info = [];

        // Check for consistent markdown formatting
        const boldPatterns = template.match(/\*\*[^*]+\*\*:/g) || [];
        if (boldPatterns.length < 3) {
            warnings.push('Consider using more bold section headers (**Section**: format)');
        }

        // Check for bullet points or numbered lists
        const listItems = template.match(/^[\s]*[-*+]\s|^[\s]*\d+\.\s/gm) || [];
        if (listItems.length === 0) {
            info.push('Consider using bullet points or numbered lists for clarity');
        }

        // Check template length
        if (template.length < 200) {
            warnings.push('Template seems quite short. Consider adding more detail.');
        } else if (template.length > 2000) {
            warnings.push('Template is quite long. Consider breaking into sections.');
        }

        return { warnings, info };
    }

    /**
     * Calculate quality score (0-100)
     * @param {object} handoffData - Handoff data
     * @param {array} errors - Validation errors
     * @param {array} warnings - Validation warnings
     * @returns {number} Quality score
     */
    calculateQualityScore(handoffData, errors, warnings) {
        let score = 100;

        // Subtract for errors (major issues)
        score -= errors.length * 25;

        // Subtract for warnings (minor issues)
        score -= warnings.length * 5;

        // Bonus for completeness
        const completenessFields = ['context', 'requirements', 'successCriteria', 'timeline', 'dependencies'];
        const completedFields = completenessFields.filter(field => handoffData[field]).length;
        score += (completedFields / completenessFields.length) * 20;

        // Bonus for good agent matching
        if (handoffData.toAgent && this.agentCapabilities[handoffData.toAgent]) {
            score += 5;
        }

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * Calculate template completeness percentage
     * @param {string} template - Handoff template
     * @returns {number} Completeness percentage
     */
    calculateTemplateCompleteness(template) {
        const allSections = [...this.config.requiredSections, ...this.config.recommendedSections];
        const presentSections = allSections.filter(section => template.includes(section)).length;
        return Math.round((presentSections / allSections.length) * 100);
    }

    /**
     * Calculate agent capability match score
     * @param {string} agentName - Agent name
     * @param {string} taskDescription - Task description
     * @returns {number} Match score (0-100)
     */
    calculateCapabilityMatch(agentName, taskDescription) {
        if (!this.agentCapabilities[agentName] || !taskDescription) {
            return 0;
        }

        const capability = this.agentCapabilities[agentName];
        const taskLower = taskDescription.toLowerCase();
        let score = 0;

        // Check keyword matches
        const keywordMatches = capability.keywords.filter(keyword => 
            taskLower.includes(keyword)
        ).length;
        score += keywordMatches * 10;

        // Check trigger matches (higher weight)
        const triggerMatches = capability.triggers.filter(trigger => 
            taskLower.includes(trigger)
        ).length;
        score += triggerMatches * 20;

        return Math.min(100, score);
    }

    /**
     * Get recommendation based on validation results
     * @param {number} qualityScore - Quality score
     * @param {array} errors - Validation errors
     * @param {array} warnings - Validation warnings
     * @returns {string} Recommendation text
     */
    getRecommendation(qualityScore, errors, warnings) {
        if (errors.length > 0) {
            return 'BLOCKING: Fix errors before proceeding with handoff';
        }

        if (qualityScore >= 90) {
            return 'EXCELLENT: Handoff meets all quality standards';
        } else if (qualityScore >= 75) {
            return 'GOOD: Handoff meets minimum standards, consider addressing warnings';
        } else if (qualityScore >= 60) {
            return 'FAIR: Handoff needs improvement before execution';
        } else {
            return 'POOR: Significant improvements required before handoff';
        }
    }

    /**
     * Load agent capabilities (can be overridden with custom data)
     * @returns {object} Agent capabilities mapping
     */
    loadAgentCapabilities() {
        // This matches the capabilities from AgentDispatcher
        return {
            'requirements-analysis-agent': {
                keywords: ['requirements', 'analyze', 'specification', 'user story', 'feature'],
                triggers: ['what should', 'how should', 'requirements for'],
                expertise: 'requirements analysis, user stories, feature specifications'
            },
            'project-orchestrator-agent': {
                keywords: ['coordinate', 'plan', 'manage', 'organize', 'timeline'],
                triggers: ['manage project', 'coordinate team', 'plan development'],
                expertise: 'project coordination, timeline management, agent orchestration'
            },
            'frontend-development-agent': {
                keywords: ['ui', 'frontend', 'react', 'component', 'interface', 'page', 'form'],
                triggers: ['build page', 'create component', 'frontend', 'ui for'],
                expertise: 'React/Next.js development, UI components, responsive design'
            },
            'backend-development-agent': {
                keywords: ['api', 'backend', 'server', 'endpoint', 'database', 'auth'],
                triggers: ['api for', 'backend', 'server logic', 'endpoint'],
                expertise: 'Node.js/Express APIs, database integration, server logic'
            },
            'database-agent': {
                keywords: ['database', 'schema', 'table', 'query', 'sql', 'data'],
                triggers: ['database', 'table for', 'schema', 'data model'],
                expertise: 'database design, schema optimization, query performance'
            },
            'testing-agent': {
                keywords: ['test', 'testing', 'spec', 'coverage', 'qa'],
                triggers: ['test', 'testing for', 'write tests', 'test coverage'],
                expertise: 'automated testing, test coverage, QA processes'
            }
        };
    }

    /**
     * Update configuration
     * @param {object} newConfig - Configuration updates
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Get current configuration
     * @returns {object} Current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}

module.exports = HandoffValidator;