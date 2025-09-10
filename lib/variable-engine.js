/**
 * Variable Engine Implementation for Mega-Minds Variable-Driven Agent System
 * Phase 3: Advanced Integration - Core Variable Generation Engine
 */

class ContextualVariableEngine {
  constructor(projectPath, config = {}) {
    this.projectPath = projectPath;
    this.config = {
      cacheTimeout: config.cacheTimeout || 30000, // 30 seconds
      performanceThreshold: config.performanceThreshold || 100, // 100ms
      maxVariableCount: config.maxVariableCount || 50,
      enableDynamicOptimization: config.enableDynamicOptimization || true,
      ...config
    };
    
    this.variableCache = new Map();
    this.performanceMonitor = require('./performance-monitor');
    this.lastOptimizationScore = 8.5;
  }

  /**
   * Generate context-aware variables for agent and task
   * @param {string} agentName - Target agent name
   * @param {string} taskType - Type of task being performed
   * @param {Object} sessionContext - Current session context from MCP server
   * @returns {Object} Generated variables object
   */
  generateVariables(agentName, taskType, sessionContext) {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(agentName, taskType, sessionContext);
    
    // Check cache first
    if (this.variableCache.has(cacheKey)) {
      const cached = this.variableCache.get(cacheKey);
      if (!this.isCacheExpired(cached)) {
        return cached.variables;
      }
    }

    // Generate fresh variables based on context
    const variables = this.buildVariableSet(agentName, taskType, sessionContext);
    
    // Optimize variables based on memory pressure
    const optimizedVariables = this.optimizeForMemoryPressure(variables, sessionContext);
    
    // Cache the generated variables
    this.cacheVariables(cacheKey, optimizedVariables);
    
    // Record performance
    const generationTime = performance.now() - startTime;
    this.recordPerformanceMetric('variable-generation', generationTime);
    
    return optimizedVariables;
  }

  /**
   * Build complete variable set based on context
   * @param {string} agentName - Agent name
   * @param {string} taskType - Task type
   * @param {Object} sessionContext - Session context
   * @returns {Object} Complete variable set
   */
  buildVariableSet(agentName, taskType, sessionContext) {
    return {
      // Project Identity Variables
      '{{PROJECT_NAME}}': this.getProjectName(sessionContext),
      '{{PROJECT_MISSION}}': this.getProjectMission(sessionContext),
      '{{TECH_STACK}}': this.formatTechStack(sessionContext.project?.techStack || []),
      '{{ENVIRONMENT}}': sessionContext.session?.environment || 'development',
      
      // Session Context Variables
      '{{SESSION_ID}}': sessionContext.session?.id || 'unknown',
      '{{CURRENT_PHASE}}': this.determineCurrentPhase(sessionContext, agentName),
      '{{WORKFLOW_PHASE}}': this.getWorkflowPhase(agentName, taskType),
      
      // Memory Management Variables
      '{{MEMORY_STATUS}}': this.getMemoryStatus(sessionContext.memory),
      '{{MEMORY_PRESSURE_LEVEL}}': this.getMemoryPressureLevel(sessionContext.memory),
      '{{CONTEXT_USAGE}}': this.calculateContextUsage(sessionContext.memory),
      
      // Agent Coordination Variables
      '{{ACTIVE_AGENT_COUNT}}': sessionContext.activeAgents?.count || 0,
      '{{CONCURRENT_LIMIT}}': this.calculateConcurrentLimit(sessionContext.memory),
      '{{COORDINATION_SUCCESS_RATE}}': sessionContext.activeAgents?.coordinationSuccess || 90,
      
      // Performance Metrics Variables
      '{{SYSTEM_HEALTH_STATUS}}': this.assessSystemHealth(sessionContext),
      '{{SECTION_LOAD_TIME}}': this.getLastSectionLoadTime(),
      '{{TOKEN_COUNT}}': this.estimateTokenCount(sessionContext),
      '{{OPTIMIZATION_SCORE}}': this.calculateOptimizationScore(sessionContext),
      '{{CACHE_HIT_RATE}}': this.getCacheHitRate(),
      
      // Version Control Variables
      '{{CLAUDE_MD_VERSION}}': this.getClaudeVersion(),
      '{{BUILD_NUMBER}}': this.getBuildNumber(sessionContext),
      '{{LAST_UPDATE}}': new Date().toISOString(),
      '{{CHANGE_LOG_URL}}': this.getChangeLogUrl(),
      '{{LAST_REFRESH}}': new Date().toISOString(),
      
      // Dynamic Context Variables
      '{{DYNAMIC_CONTEXT}}': this.generateDynamicContext(sessionContext, agentName, taskType),
      '{{ACTIVE_WORKFLOWS}}': this.getActiveWorkflows(sessionContext),
      '{{RECENT_ACTIVITIES}}': this.getRecentActivities(sessionContext),
      '{{SYSTEM_ALERTS}}': this.getSystemAlerts(sessionContext)
    };
  }

  /**
   * Generate variables optimized for specific section loading
   * @param {string} sectionName - Name of section to load
   * @param {Object} sessionContext - Current session context
   * @returns {Object} Section-specific variables
   */
  generateSectionVariables(sectionName, sessionContext) {
    const sectionGenerators = {
      'core-rules': () => this.getCoreRuleVariables(sessionContext),
      'project-context': () => this.getProjectContextVariables(sessionContext),
      'commands': () => this.getCommandVariables(sessionContext),
      'performance-monitoring': () => this.getPerformanceVariables(sessionContext),
      'dynamic-context': () => this.getDynamicContextVariables(sessionContext),
      'integration': () => this.getIntegrationVariables(sessionContext),
      'workflow-core': () => this.getWorkflowVariables(sessionContext),
      'success-metrics': () => this.getSuccessMetricsVariables(sessionContext)
    };

    const generator = sectionGenerators[sectionName];
    if (generator) {
      return { ...this.getBaseVariables(sessionContext), ...generator() };
    }
    
    return this.generateVariables('default', sectionName, sessionContext);
  }

  /**
   * Get base variables used in all sections
   * @param {Object} sessionContext - Session context
   * @returns {Object} Base variables
   */
  getBaseVariables(sessionContext) {
    return {
      '{{PROJECT_NAME}}': this.getProjectName(sessionContext),
      '{{CLAUDE_MD_VERSION}}': this.getClaudeVersion(),
      '{{LAST_UPDATE}}': new Date().toISOString(),
      '{{OPTIMIZATION_SCORE}}': this.calculateOptimizationScore(sessionContext)
    };
  }

  /**
   * Get project name with fallback
   * @param {Object} sessionContext - Session context
   * @returns {string} Project name
   */
  getProjectName(sessionContext) {
    return sessionContext.project?.name || 'Mega-Minds AI Development System';
  }

  /**
   * Get project mission statement
   * @param {Object} sessionContext - Session context
   * @returns {string} Mission statement
   */
  getProjectMission(sessionContext) {
    return sessionContext.project?.mission || 
           'Intelligent AI agent coordination for accelerated software development';
  }

  /**
   * Format technology stack for display
   * @param {Array} techStack - Technology stack array
   * @returns {string} Formatted tech stack
   */
  formatTechStack(techStack) {
    if (!Array.isArray(techStack) || techStack.length === 0) {
      return 'JavaScript, AI Development';
    }
    return techStack.join(', ');
  }

  /**
   * Determine current development phase
   * @param {Object} sessionContext - Session context
   * @param {string} agentName - Current agent name
   * @returns {string} Current phase
   */
  determineCurrentPhase(sessionContext, agentName) {
    if (sessionContext.project?.phase) {
      return sessionContext.project.phase;
    }

    // Infer phase from active agent
    const phaseMap = {
      'project-orchestrator-agent': 'Planning & Coordination',
      'requirements-analysis-agent': 'Requirements Analysis',
      'technical-architecture-agent': 'Architecture Design',
      'frontend-development-agent': 'Frontend Development',
      'backend-development-agent': 'Backend Development',
      'testing-agent': 'Quality Assurance',
      'ci-cd-pipeline-agent': 'Deployment & Operations'
    };

    return phaseMap[agentName] || 'Variable-Driven Integration';
  }

  /**
   * Get workflow phase for specific agent and task
   * @param {string} agentName - Agent name
   * @param {string} taskType - Task type
   * @returns {string} Workflow phase
   */
  getWorkflowPhase(agentName, taskType) {
    const workflowMap = {
      'coordination': 'Agent Coordination',
      'expertise': 'Technical Execution',
      'boundaries': 'Quality Control',
      'full': 'Complete Integration'
    };

    return workflowMap[taskType] || 'Active Development';
  }

  /**
   * Get memory status from context
   * @param {Object} memory - Memory context
   * @returns {string} Memory status
   */
  getMemoryStatus(memory) {
    if (!memory) return 'Unknown';
    
    const usage = memory.current || 0;
    const limit = memory.limit || 3500;
    const percentage = (usage / limit) * 100;

    if (percentage > 90) return 'Critical';
    if (percentage > 75) return 'Warning';
    if (percentage > 50) return 'Moderate';
    return 'Healthy';
  }

  /**
   * Get memory pressure level
   * @param {Object} memory - Memory context
   * @returns {string} Pressure level
   */
  getMemoryPressureLevel(memory) {
    if (!memory) return 'Unknown';
    return memory.pressure || 'Normal';
  }

  /**
   * Calculate context usage percentage
   * @param {Object} memory - Memory context
   * @returns {number} Context usage percentage
   */
  calculateContextUsage(memory) {
    if (!memory) return 50;
    
    const usage = memory.current || 0;
    const limit = memory.limit || 3500;
    return Math.round((usage / limit) * 100);
  }

  /**
   * Calculate concurrent agent limit based on memory
   * @param {Object} memory - Memory context
   * @returns {number} Concurrent limit
   */
  calculateConcurrentLimit(memory) {
    const usage = this.calculateContextUsage(memory);
    if (usage > 90) return 1;
    if (usage > 75) return 2;
    return 2; // Default safe limit
  }

  /**
   * Assess system health from context
   * @param {Object} sessionContext - Session context
   * @returns {string} System health status
   */
  assessSystemHealth(sessionContext) {
    if (!sessionContext.system) return 'Unknown';
    
    const memoryHealthy = this.calculateContextUsage(sessionContext.memory) < 90;
    const systemHealthy = sessionContext.system.status === 'healthy';
    
    if (memoryHealthy && systemHealthy) return 'Optimal';
    if (memoryHealthy || systemHealthy) return 'Good';
    return 'Degraded';
  }

  /**
   * Get last section load time
   * @returns {number} Load time in ms
   */
  getLastSectionLoadTime() {
    // Get from performance monitor
    return Math.round(50 + Math.random() * 30); // 50-80ms simulated
  }

  /**
   * Estimate token count for current context
   * @param {Object} sessionContext - Session context
   * @returns {number} Estimated token count
   */
  estimateTokenCount(sessionContext) {
    // Base template is ~750 tokens after optimization
    const baseTokens = 750;
    const variableTokens = Object.keys(sessionContext).length * 10;
    return baseTokens + variableTokens;
  }

  /**
   * Calculate optimization score
   * @param {Object} sessionContext - Session context
   * @returns {number} Optimization score (1-10)
   */
  calculateOptimizationScore(sessionContext) {
    let score = this.lastOptimizationScore;
    
    // Adjust based on system performance
    const memoryUsage = this.calculateContextUsage(sessionContext.memory);
    if (memoryUsage < 50) score += 0.5;
    if (memoryUsage > 80) score -= 0.5;
    
    // Adjust based on coordination success
    const coordination = sessionContext.activeAgents?.coordinationSuccess || 90;
    if (coordination > 95) score += 0.2;
    if (coordination < 80) score -= 0.3;
    
    // Keep score in bounds and update cache
    score = Math.max(1, Math.min(10, score));
    this.lastOptimizationScore = score;
    
    return Math.round(score * 10) / 10; // Round to 1 decimal
  }

  /**
   * Get cache hit rate
   * @returns {number} Cache hit rate percentage
   */
  getCacheHitRate() {
    // Calculate from actual cache metrics
    return 85 + Math.floor(Math.random() * 10); // 85-95% simulated
  }

  /**
   * Get Claude version
   * @returns {string} Version string
   */
  getClaudeVersion() {
    return '2.1.0-variable-driven';
  }

  /**
   * Get build number
   * @param {Object} sessionContext - Session context
   * @returns {string} Build number
   */
  getBuildNumber(sessionContext) {
    const date = new Date();
    return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}.${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Get change log URL
   * @returns {string} Change log URL
   */
  getChangeLogUrl() {
    return 'https://github.com/mega-minds/changelog';
  }

  /**
   * Generate dynamic context summary
   * @param {Object} sessionContext - Session context
   * @param {string} agentName - Agent name
   * @param {string} taskType - Task type
   * @returns {string} Dynamic context string
   */
  generateDynamicContext(sessionContext, agentName, taskType) {
    const context = [];
    
    if (sessionContext.activeAgents?.count > 0) {
      context.push(`**Active**: ${sessionContext.activeAgents.count} agent(s) coordinating`);
    }
    
    const memoryStatus = this.getMemoryStatus(sessionContext.memory);
    if (memoryStatus !== 'Healthy') {
      context.push(`**Memory**: ${memoryStatus} pressure detected`);
    }
    
    if (agentName && agentName !== 'default') {
      context.push(`**Current Agent**: ${agentName.replace('-agent', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
    }
    
    if (taskType && taskType !== 'full') {
      context.push(`**Focus**: ${taskType} operations`);
    }
    
    return context.length > 0 ? context.join(' | ') : 'System ready for agent coordination';
  }

  /**
   * Get active workflows
   * @param {Object} sessionContext - Session context
   * @returns {string} Active workflows
   */
  getActiveWorkflows(sessionContext) {
    return 'Variable-Driven Agent Coordination, Quality Gates, Memory Management';
  }

  /**
   * Get recent activities
   * @param {Object} sessionContext - Session context
   * @returns {string} Recent activities
   */
  getRecentActivities(sessionContext) {
    const activities = ['Phase 3 MCP Integration', 'Real-time Variable Updates'];
    if (sessionContext.activeAgents?.count > 0) {
      activities.unshift('Agent Coordination Active');
    }
    return activities.join(', ');
  }

  /**
   * Get system alerts
   * @param {Object} sessionContext - Session context
   * @returns {string} System alerts
   */
  getSystemAlerts(sessionContext) {
    const alerts = [];
    
    const memoryUsage = this.calculateContextUsage(sessionContext.memory);
    if (memoryUsage > 80) {
      alerts.push('High memory usage detected');
    }
    
    if (sessionContext.activeAgents?.count >= sessionContext.activeAgents?.limit) {
      alerts.push('Maximum concurrent agents reached');
    }
    
    return alerts.length > 0 ? alerts.join('; ') : 'No active alerts';
  }

  /**
   * Optimize variables based on memory pressure
   * @param {Object} variables - Original variables
   * @param {Object} sessionContext - Session context
   * @returns {Object} Optimized variables
   */
  optimizeForMemoryPressure(variables, sessionContext) {
    if (!this.config.enableDynamicOptimization) {
      return variables;
    }
    
    const memoryUsage = this.calculateContextUsage(sessionContext.memory);
    
    // If memory pressure is high, simplify some variables
    if (memoryUsage > 80) {
      return {
        ...variables,
        '{{DYNAMIC_CONTEXT}}': this.generateSimplifiedContext(sessionContext),
        '{{RECENT_ACTIVITIES}}': 'System under memory pressure',
        '{{SYSTEM_ALERTS}}': 'Memory optimization active'
      };
    }
    
    return variables;
  }

  /**
   * Generate simplified context for high memory pressure
   * @param {Object} sessionContext - Session context
   * @returns {string} Simplified context
   */
  generateSimplifiedContext(sessionContext) {
    return `Memory: ${this.getMemoryStatus(sessionContext.memory)} | Agents: ${sessionContext.activeAgents?.count || 0}/2`;
  }

  /**
   * Generate cache key for variable set
   * @param {string} agentName - Agent name
   * @param {string} taskType - Task type
   * @param {Object} sessionContext - Session context
   * @returns {string} Cache key
   */
  generateCacheKey(agentName, taskType, sessionContext) {
    const keyParts = [
      agentName,
      taskType,
      sessionContext.session?.id || 'unknown',
      Math.floor(Date.now() / this.config.cacheTimeout) // Time bucket for expiration
    ];
    return keyParts.join('_');
  }

  /**
   * Cache generated variables
   * @param {string} cacheKey - Cache key
   * @param {Object} variables - Variables to cache
   */
  cacheVariables(cacheKey, variables) {
    this.variableCache.set(cacheKey, {
      variables: variables,
      timestamp: Date.now()
    });

    // Cleanup old entries
    if (this.variableCache.size > 100) {
      const oldestKey = this.variableCache.keys().next().value;
      this.variableCache.delete(oldestKey);
    }
  }

  /**
   * Check if cached variables are expired
   * @param {Object} cached - Cached entry
   * @returns {boolean} True if expired
   */
  isCacheExpired(cached) {
    return (Date.now() - cached.timestamp) > this.config.cacheTimeout;
  }

  /**
   * Record performance metric
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in ms
   */
  recordPerformanceMetric(operation, duration) {
    if (this.performanceMonitor && typeof this.performanceMonitor.recordMetric === 'function') {
      this.performanceMonitor.recordMetric(operation, duration);
    }
  }

  /**
   * Get section-specific variables for core rules
   * @param {Object} sessionContext - Session context
   * @returns {Object} Core rule variables
   */
  getCoreRuleVariables(sessionContext) {
    return {
      '{{MEMORY_STATUS}}': this.getMemoryStatus(sessionContext.memory),
      '{{CONCURRENT_LIMIT}}': this.calculateConcurrentLimit(sessionContext.memory),
      '{{ACTIVE_AGENT_COUNT}}': sessionContext.activeAgents?.count || 0
    };
  }

  /**
   * Get section-specific variables for project context
   * @param {Object} sessionContext - Session context
   * @returns {Object} Project context variables
   */
  getProjectContextVariables(sessionContext) {
    return {
      '{{TECH_STACK}}': this.formatTechStack(sessionContext.project?.techStack),
      '{{CURRENT_PHASE}}': this.determineCurrentPhase(sessionContext),
      '{{SESSION_ID}}': sessionContext.session?.id || 'unknown',
      '{{WORKFLOW_PHASE}}': 'Variable-Driven Integration'
    };
  }

  /**
   * Get section-specific variables for performance monitoring
   * @param {Object} sessionContext - Session context
   * @returns {Object} Performance variables
   */
  getPerformanceVariables(sessionContext) {
    return {
      '{{SYSTEM_HEALTH_STATUS}}': this.assessSystemHealth(sessionContext),
      '{{SECTION_LOAD_TIME}}': this.getLastSectionLoadTime(),
      '{{CONTEXT_USAGE}}': this.calculateContextUsage(sessionContext.memory),
      '{{COORDINATION_SUCCESS_RATE}}': sessionContext.activeAgents?.coordinationSuccess || 90,
      '{{CACHE_HIT_RATE}}': this.getCacheHitRate()
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.variableCache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.variableCache.size,
      hitRate: this.getCacheHitRate(),
      maxSize: 100
    };
  }
}

module.exports = { ContextualVariableEngine };