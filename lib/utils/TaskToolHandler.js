// lib/utils/TaskToolHandler.js
/**
 * TaskToolHandler - Manages Task tool invocation formatting and validation
 * This utility class helps format proper Task tool invocations for agent handoffs
 * without breaking existing prompt-based workflows
 */

class TaskToolHandler {
    constructor(config = {}) {
        this.config = {
            defaultSubagentType: 'general-purpose',
            maxDescriptionLength: 50,
            validateHandoffs: true,
            ...config
        };
    }

    /**
     * Check if Task tool integration is enabled
     * @returns {boolean} True if Task tool should be used
     */
    isTaskToolEnabled() {
        return this.config.enableTaskTool === true;
    }

    /**
     * Get configuration for TaskToolHandler
     * @returns {object} Current configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Update configuration
     * @param {object} newConfig - Configuration updates
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Validate that required dependencies are available
     * @returns {boolean} True if all dependencies are met
     */
    validateDependencies() {
        // Check if required modules are available
        try {
            // Basic validation - can be extended as needed
            return typeof this.formatTaskInvocation === 'function';
        } catch (error) {
            console.warn('TaskToolHandler dependency validation failed:', error.message);
            return false;
        }
    }

    /**
     * Format a Task tool invocation for agent handoff
     * @param {string} targetAgent - The agent to hand off to (e.g., 'frontend-development-agent')
     * @param {string} taskDescription - Brief description of the task (3-5 words)
     * @param {string} handoffPrompt - Complete handoff prompt following communication protocol
     * @param {object} options - Additional options for the Task tool
     * @returns {object} Formatted Task tool invocation
     */
    formatTaskInvocation(targetAgent, taskDescription, handoffPrompt, options = {}) {
        // Validate inputs
        if (!targetAgent || typeof targetAgent !== 'string') {
            throw new Error('Target agent name is required and must be a string');
        }

        if (!taskDescription || typeof taskDescription !== 'string') {
            throw new Error('Task description is required and must be a string');
        }

        if (!handoffPrompt || typeof handoffPrompt !== 'string') {
            throw new Error('Handoff prompt is required and must be a string');
        }

        // Validate description length
        if (taskDescription.length > this.config.maxDescriptionLength) {
            throw new Error(`Task description must be ${this.config.maxDescriptionLength} characters or less`);
        }

        // Build the Task tool invocation
        const taskInvocation = {
            function_calls: [
                {
                    invoke: {
                        name: 'Task',
                        parameters: {
                            subagent_type: options.subagent_type || this.config.defaultSubagentType,
                            description: taskDescription,
                            prompt: handoffPrompt
                        }
                    }
                }
            ]
        };

        return taskInvocation;
    }

    /**
     * Format a Task tool invocation as XML string (Claude Code format)
     * @param {string} targetAgent - The agent to hand off to
     * @param {string} taskDescription - Brief description of the task
     * @param {string} handoffPrompt - Complete handoff prompt
     * @param {object} options - Additional options
     * @returns {string} XML-formatted Task tool invocation
     */
    formatTaskInvocationXML(targetAgent, taskDescription, handoffPrompt, options = {}) {
        const subagentType = options.subagentType || this.config.defaultSubagentType;
        
        // Escape XML special characters in the prompt
        const escapedPrompt = this.escapeXML(handoffPrompt);
        const escapedDescription = this.escapeXML(taskDescription);

        return `<function_calls>
<invoke name="Task">
<parameter name="subagent_type">${subagentType}</parameter>
<parameter name="description">${escapedDescription}</parameter>
<parameter name="prompt">${escapedPrompt}</parameter>
</invoke>
</function_calls>`;
    }

    /**
     * Escape XML special characters
     * @param {string} text - Text to escape
     * @returns {string} XML-escaped text
     */
    escapeXML(text) {
        if (typeof text !== 'string') return text;
        
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Validate handoff parameters meet communication protocol requirements
     * @param {object} handoffData - The handoff data to validate
     * @returns {object} Validation result with isValid flag and errors array
     */
    validateHandoffParameters(handoffData) {
        const errors = [];
        const warnings = [];

        // Required fields validation
        const requiredFields = ['targetAgent', 'taskDescription', 'context', 'requirements', 'successCriteria'];
        
        for (const field of requiredFields) {
            if (!handoffData[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        // Agent name validation
        if (handoffData.targetAgent) {
            if (!handoffData.targetAgent.includes('-agent')) {
                warnings.push('Target agent should follow naming convention: [name]-agent');
            }
            
            if (handoffData.targetAgent.length > 50) {
                errors.push('Target agent name too long (max 50 characters)');
            }
        }

        // Task description validation
        if (handoffData.taskDescription) {
            const wordCount = handoffData.taskDescription.trim().split(/\s+/).length;
            if (wordCount > 10) {
                warnings.push('Task description should be 3-5 words for optimal clarity');
            }
            
            if (handoffData.taskDescription.length > this.config.maxDescriptionLength) {
                errors.push(`Task description too long (max ${this.config.maxDescriptionLength} characters)`);
            }
        }

        // Context validation
        if (handoffData.context && handoffData.context.length < 50) {
            warnings.push('Context seems too brief - consider adding more background information');
        }

        // Success criteria validation
        if (handoffData.successCriteria && Array.isArray(handoffData.successCriteria)) {
            if (handoffData.successCriteria.length === 0) {
                errors.push('Success criteria array is empty - at least one criteria required');
            }
        } else if (handoffData.successCriteria && typeof handoffData.successCriteria === 'string') {
            if (handoffData.successCriteria.length < 20) {
                warnings.push('Success criteria seems too brief - be more specific');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            score: this.calculateHandoffQualityScore(handoffData, errors, warnings)
        };
    }

    /**
     * Calculate a quality score for the handoff (0-100)
     * @param {object} handoffData - The handoff data
     * @param {array} errors - Validation errors
     * @param {array} warnings - Validation warnings
     * @returns {number} Quality score from 0-100
     */
    calculateHandoffQualityScore(handoffData, errors, warnings) {
        let score = 100;

        // Subtract points for errors (blocking issues)
        score -= errors.length * 25;

        // Subtract points for warnings (quality issues)
        score -= warnings.length * 10;

        // Bonus points for completeness
        const optionalFields = ['timeline', 'dependencies', 'integrationPoints', 'nextAgent'];
        const completedOptionalFields = optionalFields.filter(field => handoffData[field]).length;
        score += completedOptionalFields * 5;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Validate that handoff prompt follows communication protocol template
     * @param {string} handoffPrompt - The complete handoff prompt
     * @returns {object} Validation result
     */
    validateHandoffTemplate(handoffPrompt) {
        const errors = [];
        const warnings = [];

        if (!handoffPrompt || typeof handoffPrompt !== 'string') {
            errors.push('Handoff prompt is required and must be a string');
            return { isValid: false, errors, warnings };
        }

        // Check for required template sections
        const requiredSections = [
            '## Handoff to @',
            '🤖 @',
            '**Context**:',
            '**Your Task**:',
            '**Success Criteria**:'
        ];

        for (const section of requiredSections) {
            if (!handoffPrompt.includes(section)) {
                errors.push(`Missing required template section: ${section}`);
            }
        }

        // Check for visual activation marker
        if (!handoffPrompt.includes('🤖 @') || !handoffPrompt.includes('ACTIVE')) {
            errors.push('Missing required visual activation marker: 🤖 @[agent-name] ACTIVE');
        }

        // Check template structure quality
        if (!handoffPrompt.includes('**Requirements & Constraints**:')) {
            warnings.push('Consider adding Requirements & Constraints section');
        }

        if (!handoffPrompt.includes('**Integration Points**:')) {
            warnings.push('Consider adding Integration Points section');
        }

        if (!handoffPrompt.includes('**Timeline**:')) {
            warnings.push('Consider adding Timeline section');
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            templateCompleteness: this.calculateTemplateCompleteness(handoffPrompt)
        };
    }

    /**
     * Calculate template completeness percentage
     * @param {string} handoffPrompt - The handoff prompt
     * @returns {number} Completeness percentage (0-100)
     */
    calculateTemplateCompleteness(handoffPrompt) {
        const allSections = [
            '## Handoff to @',
            '🤖 @',
            '**Context**:',
            '**Your Task**:',
            '**Requirements & Constraints**:',
            '**Success Criteria**:',
            '**Dependencies**:',
            '**Integration Points**:',
            '**Timeline**:'
        ];

        const presentSections = allSections.filter(section => 
            handoffPrompt.includes(section)
        ).length;

        return Math.round((presentSections / allSections.length) * 100);
    }

    /**
     * Get the current version of TaskToolHandler
     * @returns {string} Version string
     */
    getVersion() {
        return '1.0.0';
    }
}

module.exports = TaskToolHandler;