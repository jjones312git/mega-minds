// lib/core/HookManager.js
// Claude Code Hooks Integration Manager for Mega-Minds

const fs = require('fs-extra');
const path = require('path');

/**
 * HookManager handles Claude Code hooks integration for mega-minds workflow automation
 * This is a foundational structure - functionality will be added incrementally
 */
class HookManager {
    constructor(sessionManager = null) {
        this.sessionManager = sessionManager;
        this.hooksEnabled = false;
        this.hookConfigPath = null;
        this.supportedHooks = [
            'PostToolUse',
            'PreToolUse', 
            'Stop',
            'SubagentStop',
            'PreCompact',
            'UserPromptSubmit',
            'SessionStart'
        ];
    }

    /**
     * Initialize hook manager and detect Claude Code hooks configuration
     * @returns {Promise<boolean>} Whether hooks are available and configured
     */
    async initialize() {
        try {
            // Look for Claude Code settings in standard locations
            const possibleConfigPaths = [
                path.join(process.cwd(), '.claude', 'settings.json'),
                path.join(process.cwd(), '.claude', 'settings.local.json'),
                path.join(process.env.HOME || process.env.USERPROFILE, '.claude', 'settings.json')
            ];

            for (const configPath of possibleConfigPaths) {
                if (await fs.pathExists(configPath)) {
                    this.hookConfigPath = configPath;
                    this.hooksEnabled = await this.validateHookConfiguration(configPath);
                    break;
                }
            }

            if (this.hooksEnabled) {
                console.log('🔗 Claude Code hooks detected and validated');
            }

            return this.hooksEnabled;
        } catch (error) {
            console.warn('⚠️ Hook initialization failed:', error.message);
            return false;
        }
    }

    /**
     * Validate that hook configuration is properly formatted
     * @param {string} configPath - Path to Claude Code settings file
     * @returns {Promise<boolean>} Whether configuration is valid
     */
    async validateHookConfiguration(configPath) {
        try {
            const config = await fs.readJSON(configPath);
            
            // Check if hooks section exists and has valid structure
            if (!config.hooks || typeof config.hooks !== 'object') {
                return false;
            }

            // Validate hook structure (basic validation)
            for (const [hookType, hookConfigs] of Object.entries(config.hooks)) {
                if (!this.supportedHooks.includes(hookType)) {
                    console.warn(`⚠️ Unsupported hook type: ${hookType}`);
                    continue;
                }

                if (!Array.isArray(hookConfigs)) {
                    console.warn(`⚠️ Invalid hook configuration for ${hookType}`);
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.warn('⚠️ Hook configuration validation failed:', error.message);
            return false;
        }
    }

    /**
     * Get current hook status and configuration summary
     * @returns {object} Hook status information
     */
    getHookStatus() {
        return {
            enabled: this.hooksEnabled,
            configPath: this.hookConfigPath,
            supportedHooks: this.supportedHooks,
            sessionManagerConnected: !!this.sessionManager
        };
    }

    /**
     * Check if specific hook type is configured
     * @param {string} hookType - Hook type to check
     * @returns {Promise<boolean>} Whether hook is configured
     */
    async isHookConfigured(hookType) {
        if (!this.hooksEnabled || !this.hookConfigPath) {
            return false;
        }

        try {
            const config = await fs.readJSON(this.hookConfigPath);
            return !!(config.hooks && config.hooks[hookType] && config.hooks[hookType].length > 0);
        } catch (error) {
            return false;
        }
    }

    /**
     * Connect to session manager for hook-aware operations
     * @param {object} sessionManager - SessionManager instance
     */
    connectSessionManager(sessionManager) {
        this.sessionManager = sessionManager;
        console.log('🔗 HookManager connected to SessionManager');
    }

    /**
     * Placeholder for quality gate hook functionality
     * @param {string} toolName - Name of the tool that was used
     * @param {object} toolData - Data from the tool execution
     * @returns {Promise<boolean>} Whether quality gates should be triggered
     */
    async shouldTriggerQualityGates(toolName, toolData = {}) {
        // Stub - will be implemented in later tasks
        return false;
    }

    /**
     * Placeholder for session auto-save functionality
     * @param {string} eventType - Type of stop event
     * @param {object} eventData - Event data
     * @returns {Promise<boolean>} Whether session should be auto-saved
     */
    async shouldAutoSaveSession(eventType, eventData = {}) {
        // Stub - will be implemented in later tasks
        return false;
    }

    /**
     * Placeholder for context preservation functionality
     * @returns {Promise<object>} Context preservation result
     */
    async preserveContext() {
        // Stub - will be implemented in later tasks
        return { preserved: false, reason: 'Not implemented yet' };
    }

    /**
     * Log hook-related events for debugging
     * @param {string} level - Log level (info, warn, error)
     * @param {string} message - Log message
     * @param {object} data - Additional log data
     */
    log(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] HookManager ${level.toUpperCase()}: ${message}`;
        
        if (data && Object.keys(data).length > 0) {
            console.log(logMessage, data);
        } else {
            console.log(logMessage);
        }
    }
}

module.exports = HookManager;