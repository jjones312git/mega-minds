/**
 * MCP Server Integration for Mega-Minds Variable-Driven Agent System
 * Phase 3: Advanced Integration Implementation
 * 
 * Provides real-time context integration with Claude Code SDK via MCP protocol
 */

const { ContextualVariableEngine } = require('./variable-engine');
const { AgentSectionManager } = require('./section-manager');
const { PerformanceMonitor } = require('./performance-monitor');

class MegaMindsProtocolServer {
  constructor(projectPath, config = {}) {
    this.projectPath = projectPath;
    this.config = {
      refreshInterval: config.refreshInterval || 30000, // 30 seconds
      maxCacheSize: config.maxCacheSize || 100,
      enableStreamingUpdates: config.enableStreamingUpdates || true,
      ...config
    };
    
    this.variableEngine = new ContextualVariableEngine(projectPath, config);
    this.sectionManager = new AgentSectionManager(projectPath, this.variableEngine);
    this.performanceMonitor = new PerformanceMonitor();
    this.activeConnections = new Map();
    this.contextCache = new Map();
  }

  /**
   * Get comprehensive agent context from Claude Code SDK
   * @param {string} sessionId - Current Claude Code session ID
   * @returns {Object} Complete session context for variable generation
   */
  async getAgentContext(sessionId) {
    try {
      // Start performance timing
      this.performanceMonitor.startTiming();
      
      // Check cache first
      const cacheKey = `context_${sessionId}`;
      if (this.contextCache.has(cacheKey)) {
        const cached = this.contextCache.get(cacheKey);
        if (!this.isCacheExpired(cached)) {
          this.performanceMonitor.recordMetric('cache-hit');
          return cached.context;
        }
      }

      // Gather real-time context from Claude Code SDK
      const context = {
        session: {
          id: sessionId,
          startTime: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development'
        },
        
        // Memory status from Claude Code
        memory: await this.getMemoryStatus(sessionId),
        
        // Active agents tracking
        activeAgents: await this.getActiveAgents(sessionId),
        
        // Project context
        project: await this.getProjectContext(sessionId),
        
        // Performance metrics
        performance: this.performanceMonitor.getCurrentMetrics(),
        
        // System health
        system: await this.getSystemHealth()
      };

      // Cache the context
      this.cacheContext(cacheKey, context);
      
      // Record performance
      const duration = this.performanceMonitor.endTiming('context-generation');
      context.performance.contextGenerationTime = duration;

      return context;
    } catch (error) {
      console.error('MCP Context Generation Error:', error);
      return this.getFallbackContext(sessionId);
    }
  }

  /**
   * Invoke agent with dynamic section loading
   * @param {string} agentName - Target agent name
   * @param {Object} context - Session context
   * @param {string} sectionType - Section type to load ('coordination', 'expertise', 'boundaries', 'full')
   * @returns {Object} Agent configuration with injected variables
   */
  async invokeAgent(agentName, context, sectionType = 'full') {
    try {
      this.performanceMonitor.startTiming();

      // Generate context-aware variables
      const variables = await this.variableEngine.generateVariables(
        agentName, 
        sectionType, 
        context
      );

      // Load agent sections with variable injection
      const sections = await this.sectionManager.loadAgentSection(
        agentName, 
        sectionType, 
        context
      );

      // Create optimized claude.md for this agent
      const optimizedClaude = this.sectionManager.renderClaudeTemplate(variables);

      const agentConfig = {
        name: agentName,
        sections: sections,
        variables: variables,
        claudeConfig: optimizedClaude,
        metadata: {
          generatedAt: new Date().toISOString(),
          sectionType: sectionType,
          contextId: context.session.id,
          optimizationScore: variables['{{OPTIMIZATION_SCORE}}']
        }
      };

      // Record performance
      const duration = this.performanceMonitor.endTiming('agent-invocation');
      agentConfig.metadata.invocationTime = duration;

      // Update agent tracking
      await this.recordAgentActivation(agentName, context.session.id);

      return agentConfig;
    } catch (error) {
      console.error('MCP Agent Invocation Error:', error);
      throw new Error(`Failed to invoke agent ${agentName}: ${error.message}`);
    }
  }

  /**
   * Enable real-time streaming updates for active sessions
   * @param {string} sessionId - Session to stream updates to
   * @param {Function} callback - Callback for updates
   */
  enableStreamingUpdates(sessionId, callback) {
    if (!this.config.enableStreamingUpdates) {
      console.warn('Streaming updates disabled in configuration');
      return;
    }

    const streamId = `stream_${sessionId}_${Date.now()}`;
    
    const updateInterval = setInterval(async () => {
      try {
        const freshContext = await this.getAgentContext(sessionId);
        const hasChanges = this.detectContextChanges(sessionId, freshContext);
        
        if (hasChanges) {
          callback({
            type: 'context-update',
            sessionId: sessionId,
            context: freshContext,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Streaming update error:', error);
        callback({
          type: 'error',
          sessionId: sessionId,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }, this.config.refreshInterval);

    this.activeConnections.set(streamId, {
      sessionId: sessionId,
      interval: updateInterval,
      callback: callback,
      startedAt: new Date()
    });

    return streamId;
  }

  /**
   * Disable streaming updates for a session
   * @param {string} streamId - Stream identifier to stop
   */
  disableStreamingUpdates(streamId) {
    const connection = this.activeConnections.get(streamId);
    if (connection) {
      clearInterval(connection.interval);
      this.activeConnections.delete(streamId);
    }
  }

  /**
   * Get current memory status from Claude Code
   * @param {string} sessionId - Session ID
   * @returns {Object} Memory status information
   */
  async getMemoryStatus(sessionId) {
    // Placeholder for Claude Code SDK integration
    // This would interface with actual Claude Code memory APIs
    return {
      current: Math.floor(Math.random() * 3000), // MB
      limit: 3500, // MB
      pressure: 'normal', // normal|warning|critical
      efficiency: 85 + Math.floor(Math.random() * 10) // 85-95%
    };
  }

  /**
   * Get active agents for session
   * @param {string} sessionId - Session ID
   * @returns {Object} Active agent information
   */
  async getActiveAgents(sessionId) {
    // Placeholder for Claude Code SDK integration
    return {
      active: ['project-orchestrator-agent'],
      count: 1,
      limit: 2,
      coordinationSuccess: 95 + Math.floor(Math.random() * 5) // 95-99%
    };
  }

  /**
   * Get project context from Claude Code
   * @param {string} sessionId - Session ID
   * @returns {Object} Project context information
   */
  async getProjectContext(sessionId) {
    const packageJson = await this.readPackageJson();
    
    return {
      name: packageJson?.name || 'mega-minds',
      version: packageJson?.version || '2.1.0',
      techStack: this.detectTechStack(),
      mission: 'AI-powered development team coordination system',
      phase: 'Variable-Driven Integration'
    };
  }

  /**
   * Get system health metrics
   * @returns {Object} System health information
   */
  async getSystemHealth() {
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();
    
    return {
      status: 'healthy',
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) // MB
      },
      uptime: process.uptime()
    };
  }

  /**
   * Detect technology stack from project files
   * @returns {Array} Technology stack array
   */
  detectTechStack() {
    const fs = require('fs');
    const path = require('path');
    const techStack = [];

    try {
      // Check for common config files
      const configFiles = [
        { file: 'package.json', tech: 'Node.js' },
        { file: 'requirements.txt', tech: 'Python' },
        { file: 'Cargo.toml', tech: 'Rust' },
        { file: 'go.mod', tech: 'Go' },
        { file: 'composer.json', tech: 'PHP' }
      ];

      configFiles.forEach(({ file, tech }) => {
        if (fs.existsSync(path.join(this.projectPath, file))) {
          techStack.push(tech);
        }
      });

      // Default if nothing detected
      if (techStack.length === 0) {
        techStack.push('JavaScript', 'AI Development');
      }
    } catch (error) {
      console.error('Tech stack detection error:', error);
      techStack.push('Unknown');
    }

    return techStack;
  }

  /**
   * Read package.json if it exists
   * @returns {Object|null} Package.json contents or null
   */
  async readPackageJson() {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      const packagePath = path.join(this.projectPath, 'package.json');
      const content = await fs.readFile(packagePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Cache context with expiration
   * @param {string} key - Cache key
   * @param {Object} context - Context to cache
   */
  cacheContext(key, context) {
    this.contextCache.set(key, {
      context: context,
      timestamp: Date.now()
    });

    // Cleanup old entries
    if (this.contextCache.size > this.config.maxCacheSize) {
      const oldestKey = this.contextCache.keys().next().value;
      this.contextCache.delete(oldestKey);
    }
  }

  /**
   * Check if cached context is expired
   * @param {Object} cached - Cached entry
   * @returns {boolean} True if expired
   */
  isCacheExpired(cached) {
    return (Date.now() - cached.timestamp) > this.config.refreshInterval;
  }

  /**
   * Get fallback context when main context fails
   * @param {string} sessionId - Session ID
   * @returns {Object} Minimal fallback context
   */
  getFallbackContext(sessionId) {
    return {
      session: {
        id: sessionId,
        startTime: new Date().toISOString(),
        environment: 'fallback'
      },
      memory: {
        current: 1000,
        limit: 3500,
        pressure: 'unknown',
        efficiency: 50
      },
      activeAgents: {
        active: [],
        count: 0,
        limit: 2,
        coordinationSuccess: 50
      },
      project: {
        name: 'mega-minds',
        version: '2.1.0',
        techStack: ['JavaScript'],
        mission: 'AI Development System',
        phase: 'Fallback Mode'
      },
      performance: this.performanceMonitor.getCurrentMetrics(),
      system: {
        status: 'degraded',
        memory: { rss: 1000, heapUsed: 500, heapTotal: 1000 },
        uptime: 0
      }
    };
  }

  /**
   * Detect context changes for streaming updates
   * @param {string} sessionId - Session ID
   * @param {Object} newContext - New context to compare
   * @returns {boolean} True if changes detected
   */
  detectContextChanges(sessionId, newContext) {
    const lastContextKey = `last_${sessionId}`;
    const lastContext = this.contextCache.get(lastContextKey);
    
    if (!lastContext) {
      this.contextCache.set(lastContextKey, { context: newContext, timestamp: Date.now() });
      return true;
    }

    // Check for significant changes
    const changes = [
      newContext.memory.pressure !== lastContext.context.memory.pressure,
      newContext.activeAgents.count !== lastContext.context.activeAgents.count,
      newContext.system.status !== lastContext.context.system.status
    ];

    const hasChanges = changes.some(change => change);
    
    if (hasChanges) {
      this.contextCache.set(lastContextKey, { context: newContext, timestamp: Date.now() });
    }

    return hasChanges;
  }

  /**
   * Record agent activation for tracking
   * @param {string} agentName - Agent name
   * @param {string} sessionId - Session ID
   */
  async recordAgentActivation(agentName, sessionId) {
    // Placeholder for agent tracking system
    console.log(`Agent activated: ${agentName} in session ${sessionId}`);
  }

  /**
   * Cleanup resources and close connections
   */
  cleanup() {
    // Stop all streaming connections
    for (const [streamId, connection] of this.activeConnections) {
      clearInterval(connection.interval);
    }
    this.activeConnections.clear();

    // Clear caches
    this.contextCache.clear();

    console.log('MCP Server Integration cleaned up');
  }
}

module.exports = { MegaMindsProtocolServer };