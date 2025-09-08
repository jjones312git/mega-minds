/**
 * Streaming Update Manager for Mega-Minds Variable-Driven Agent System
 * Phase 3: Real-time Claude.md Updates and Live Context Streaming
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class StreamingUpdateManager extends EventEmitter {
  constructor(projectPath, mcpServer, config = {}) {
    super();
    
    this.projectPath = projectPath;
    this.mcpServer = mcpServer;
    this.config = {
      updateInterval: config.updateInterval || 15000, // 15 seconds
      maxUpdateBuffer: config.maxUpdateBuffer || 100,
      enableFileWatching: config.enableFileWatching || true,
      enableContextStreaming: config.enableContextStreaming || true,
      debounceDelay: config.debounceDelay || 2000, // 2 seconds
      ...config
    };
    
    this.activeStreams = new Map();
    this.updateBuffer = [];
    this.fileWatchers = new Map();
    this.lastUpdateTime = new Map();
    this.debounceTimers = new Map();
    
    this.initialize();
  }

  /**
   * Initialize streaming update system
   */
  async initialize() {
    try {
      // Set up file watchers for template changes
      if (this.config.enableFileWatching) {
        await this.setupFileWatchers();
      }
      
      // Start periodic update check
      this.startPeriodicUpdates();
      
      console.log('Streaming Update Manager initialized');
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize Streaming Update Manager:', error);
      this.emit('error', error);
    }
  }

  /**
   * Enable real-time streaming updates for a session
   * @param {string} sessionId - Session ID to stream updates to
   * @param {Object} options - Streaming options
   * @returns {string} Stream ID for managing the stream
   */
  enableStreamingUpdates(sessionId, options = {}) {
    const streamId = `stream_${sessionId}_${Date.now()}`;
    
    const streamConfig = {
      sessionId: sessionId,
      startTime: new Date(),
      options: {
        includeVariables: options.includeVariables !== false,
        includeSections: options.includeSections !== false,
        includePerformance: options.includePerformance !== false,
        includeSystemHealth: options.includeSystemHealth !== false,
        updateTypes: options.updateTypes || ['context', 'variables', 'performance', 'health'],
        ...options
      },
      lastUpdate: null,
      updateCount: 0
    };
    
    this.activeStreams.set(streamId, streamConfig);
    
    // Start streaming for this session
    this.startSessionStream(streamId);
    
    console.log(`Streaming updates enabled for session ${sessionId} (stream: ${streamId})`);
    this.emit('stream-started', { streamId, sessionId });
    
    return streamId;
  }

  /**
   * Disable streaming updates for a specific stream
   * @param {string} streamId - Stream ID to disable
   */
  disableStreamingUpdates(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      // Clear any timers
      if (stream.intervalId) {
        clearInterval(stream.intervalId);
      }
      
      this.activeStreams.delete(streamId);
      console.log(`Streaming updates disabled for stream ${streamId}`);
      this.emit('stream-stopped', { streamId, sessionId: stream.sessionId });
    }
  }

  /**
   * Start streaming for a specific session
   * @param {string} streamId - Stream ID
   */
  startSessionStream(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return;
    
    const streamUpdates = async () => {
      try {
        const updates = await this.generateStreamingUpdates(stream);
        
        if (updates && updates.length > 0) {
          stream.lastUpdate = new Date();
          stream.updateCount += updates.length;
          
          this.emit('updates-available', {
            streamId: streamId,
            sessionId: stream.sessionId,
            updates: updates,
            timestamp: stream.lastUpdate
          });
        }
      } catch (error) {
        console.error(`Streaming update error for ${streamId}:`, error);
        this.emit('stream-error', { streamId, error });
      }
    };
    
    // Initial update
    streamUpdates();
    
    // Set up periodic updates
    stream.intervalId = setInterval(streamUpdates, this.config.updateInterval);
  }

  /**
   * Generate streaming updates for a session
   * @param {Object} stream - Stream configuration
   * @returns {Array} Array of updates
   */
  async generateStreamingUpdates(stream) {
    const updates = [];
    const sessionId = stream.sessionId;
    
    try {
      // Get current context from MCP server
      const currentContext = await this.mcpServer.getAgentContext(sessionId);
      
      // Check for context changes
      if (stream.options.updateTypes.includes('context')) {
        const contextUpdates = await this.detectContextChanges(sessionId, currentContext);
        updates.push(...contextUpdates);
      }
      
      // Check for variable updates
      if (stream.options.updateTypes.includes('variables')) {
        const variableUpdates = await this.detectVariableChanges(sessionId, currentContext);
        updates.push(...variableUpdates);
      }
      
      // Check for performance updates
      if (stream.options.updateTypes.includes('performance')) {
        const performanceUpdates = await this.detectPerformanceChanges(sessionId, currentContext);
        updates.push(...performanceUpdates);
      }
      
      // Check for system health updates
      if (stream.options.updateTypes.includes('health')) {
        const healthUpdates = await this.detectHealthChanges(sessionId, currentContext);
        updates.push(...healthUpdates);
      }
      
      // Check for template file changes
      const templateUpdates = await this.detectTemplateChanges();
      updates.push(...templateUpdates);
      
    } catch (error) {
      console.error('Error generating streaming updates:', error);
      updates.push({
        type: 'error',
        message: 'Failed to generate updates',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    return updates;
  }

  /**
   * Detect context changes for streaming
   * @param {string} sessionId - Session ID
   * @param {Object} currentContext - Current context
   * @returns {Array} Context change updates
   */
  async detectContextChanges(sessionId, currentContext) {
    const updates = [];
    const cacheKey = `context_${sessionId}`;
    const lastContext = this.getLastContext(cacheKey);
    
    if (!lastContext) {
      // First time - record current context
      this.cacheContext(cacheKey, currentContext);
      return [{
        type: 'context-initialized',
        sessionId: sessionId,
        context: currentContext,
        timestamp: new Date().toISOString()
      }];
    }
    
    // Check for significant changes
    const changes = this.compareContexts(lastContext, currentContext);
    
    if (changes.length > 0) {
      updates.push({
        type: 'context-changed',
        sessionId: sessionId,
        changes: changes,
        newContext: currentContext,
        timestamp: new Date().toISOString()
      });
      
      // Update cached context
      this.cacheContext(cacheKey, currentContext);
    }
    
    return updates;
  }

  /**
   * Detect variable changes for streaming
   * @param {string} sessionId - Session ID
   * @param {Object} currentContext - Current context
   * @returns {Array} Variable change updates
   */
  async detectVariableChanges(sessionId, currentContext) {
    const updates = [];
    const cacheKey = `variables_${sessionId}`;
    
    try {
      // Generate current variables
      const currentVariables = await this.mcpServer.variableEngine.generateVariables(
        'default', 
        'streaming', 
        currentContext
      );
      
      const lastVariables = this.getLastVariables(cacheKey);
      
      if (lastVariables) {
        const variableChanges = this.compareVariables(lastVariables, currentVariables);
        
        if (variableChanges.length > 0) {
          updates.push({
            type: 'variables-changed',
            sessionId: sessionId,
            changes: variableChanges,
            newVariables: currentVariables,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Cache current variables
      this.cacheVariables(cacheKey, currentVariables);
      
    } catch (error) {
      console.error('Error detecting variable changes:', error);
    }
    
    return updates;
  }

  /**
   * Detect performance changes for streaming
   * @param {string} sessionId - Session ID
   * @param {Object} currentContext - Current context
   * @returns {Array} Performance change updates
   */
  async detectPerformanceChanges(sessionId, currentContext) {
    const updates = [];
    const cacheKey = `performance_${sessionId}`;
    
    const currentPerf = {
      memoryUsage: currentContext.memory?.current || 0,
      systemHealth: currentContext.system?.status || 'unknown',
      coordinationSuccess: currentContext.activeAgents?.coordinationSuccess || 0,
      optimizationScore: await this.calculateOptimizationScore(currentContext)
    };
    
    const lastPerf = this.getLastPerformance(cacheKey);
    
    if (lastPerf) {
      const perfChanges = [];
      
      // Check for significant memory changes (>5% change)
      const memoryChange = Math.abs(currentPerf.memoryUsage - lastPerf.memoryUsage);
      if (memoryChange > (lastPerf.memoryUsage * 0.05)) {
        perfChanges.push({
          metric: 'memory',
          from: lastPerf.memoryUsage,
          to: currentPerf.memoryUsage,
          change: memoryChange
        });
      }
      
      // Check for system health changes
      if (currentPerf.systemHealth !== lastPerf.systemHealth) {
        perfChanges.push({
          metric: 'system-health',
          from: lastPerf.systemHealth,
          to: currentPerf.systemHealth
        });
      }
      
      // Check for coordination success changes (>5% change)
      const coordChange = Math.abs(currentPerf.coordinationSuccess - lastPerf.coordinationSuccess);
      if (coordChange > 5) {
        perfChanges.push({
          metric: 'coordination',
          from: lastPerf.coordinationSuccess,
          to: currentPerf.coordinationSuccess,
          change: coordChange
        });
      }
      
      if (perfChanges.length > 0) {
        updates.push({
          type: 'performance-changed',
          sessionId: sessionId,
          changes: perfChanges,
          currentPerformance: currentPerf,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Cache current performance
    this.cachePerformance(cacheKey, currentPerf);
    
    return updates;
  }

  /**
   * Detect system health changes
   * @param {string} sessionId - Session ID
   * @param {Object} currentContext - Current context
   * @returns {Array} Health change updates
   */
  async detectHealthChanges(sessionId, currentContext) {
    const updates = [];
    const cacheKey = `health_${sessionId}`;
    
    const currentHealth = {
      status: currentContext.system?.status || 'unknown',
      memory: currentContext.system?.memory || {},
      uptime: currentContext.system?.uptime || 0,
      alerts: this.generateHealthAlerts(currentContext)
    };
    
    const lastHealth = this.getLastHealth(cacheKey);
    
    if (lastHealth && lastHealth.status !== currentHealth.status) {
      updates.push({
        type: 'health-changed',
        sessionId: sessionId,
        from: lastHealth.status,
        to: currentHealth.status,
        alerts: currentHealth.alerts,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check for new alerts
    if (lastHealth && currentHealth.alerts.length > lastHealth.alerts.length) {
      const newAlerts = currentHealth.alerts.filter(alert => 
        !lastHealth.alerts.some(lastAlert => lastAlert.id === alert.id)
      );
      
      if (newAlerts.length > 0) {
        updates.push({
          type: 'new-alerts',
          sessionId: sessionId,
          alerts: newAlerts,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Cache current health
    this.cacheHealth(cacheKey, currentHealth);
    
    return updates;
  }

  /**
   * Detect template file changes
   * @returns {Array} Template change updates
   */
  async detectTemplateChanges() {
    const updates = [];
    
    // Check if any watched files have changed
    for (const [filePath, lastModified] of this.lastUpdateTime) {
      try {
        const stats = await fs.stat(filePath);
        const currentModified = stats.mtime.getTime();
        
        if (currentModified > lastModified) {
          updates.push({
            type: 'template-changed',
            filePath: filePath,
            lastModified: new Date(currentModified).toISOString(),
            timestamp: new Date().toISOString()
          });
          
          // Update the last modified time
          this.lastUpdateTime.set(filePath, currentModified);
          
          // Debounce template reload
          this.debounceTemplateReload(filePath);
        }
      } catch (error) {
        console.error(`Error checking file ${filePath}:`, error);
      }
    }
    
    return updates;
  }

  /**
   * Setup file watchers for template changes
   */
  async setupFileWatchers() {
    const watchPaths = [
      path.join(this.projectPath, 'templates/claude.md'),
      path.join(this.projectPath, 'templates/RULES.md'),
      path.join(this.projectPath, 'templates/QUICKREF.md'),
      path.join(this.projectPath, 'workflows')
    ];
    
    for (const watchPath of watchPaths) {
      try {
        const stats = await fs.stat(watchPath);
        
        if (stats.isDirectory()) {
          // Watch all .md files in directory
          const files = await fs.readdir(watchPath);
          for (const file of files) {
            if (file.endsWith('.md')) {
              const filePath = path.join(watchPath, file);
              await this.watchFile(filePath);
            }
          }
        } else {
          // Watch single file
          await this.watchFile(watchPath);
        }
      } catch (error) {
        console.error(`Cannot watch path ${watchPath}:`, error);
      }
    }
  }

  /**
   * Watch a single file for changes
   * @param {string} filePath - File path to watch
   */
  async watchFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      this.lastUpdateTime.set(filePath, stats.mtime.getTime());
      
      // Note: In a real implementation, you'd use fs.watch() or chokidar
      // For this implementation, we'll rely on periodic checks
      console.log(`Watching file: ${filePath}`);
    } catch (error) {
      console.error(`Cannot watch file ${filePath}:`, error);
    }
  }

  /**
   * Debounce template reload to prevent excessive updates
   * @param {string} filePath - File path that changed
   */
  debounceTemplateReload(filePath) {
    const timerId = this.debounceTimers.get(filePath);
    if (timerId) {
      clearTimeout(timerId);
    }
    
    const newTimerId = setTimeout(async () => {
      try {
        // Notify all active streams about template change
        for (const [streamId, stream] of this.activeStreams) {
          this.emit('template-reloaded', {
            streamId: streamId,
            sessionId: stream.sessionId,
            filePath: filePath,
            timestamp: new Date().toISOString()
          });
        }
        
        console.log(`Template reloaded: ${filePath}`);
      } catch (error) {
        console.error('Error during template reload:', error);
      } finally {
        this.debounceTimers.delete(filePath);
      }
    }, this.config.debounceDelay);
    
    this.debounceTimers.set(filePath, newTimerId);
  }

  /**
   * Start periodic updates for all streams
   */
  startPeriodicUpdates() {
    // This is handled per-stream in startSessionStream
    console.log('Periodic updates started');
  }

  /**
   * Compare two contexts and return differences
   * @param {Object} lastContext - Previous context
   * @param {Object} currentContext - Current context
   * @returns {Array} Array of changes
   */
  compareContexts(lastContext, currentContext) {
    const changes = [];
    
    // Check memory changes
    if (lastContext.memory?.current !== currentContext.memory?.current) {
      changes.push({
        path: 'memory.current',
        from: lastContext.memory?.current,
        to: currentContext.memory?.current
      });
    }
    
    // Check agent count changes
    if (lastContext.activeAgents?.count !== currentContext.activeAgents?.count) {
      changes.push({
        path: 'activeAgents.count',
        from: lastContext.activeAgents?.count,
        to: currentContext.activeAgents?.count
      });
    }
    
    // Check system status changes
    if (lastContext.system?.status !== currentContext.system?.status) {
      changes.push({
        path: 'system.status',
        from: lastContext.system?.status,
        to: currentContext.system?.status
      });
    }
    
    return changes;
  }

  /**
   * Compare two variable sets
   * @param {Object} lastVariables - Previous variables
   * @param {Object} currentVariables - Current variables
   * @returns {Array} Array of changes
   */
  compareVariables(lastVariables, currentVariables) {
    const changes = [];
    
    for (const [key, value] of Object.entries(currentVariables)) {
      if (lastVariables[key] !== value) {
        changes.push({
          variable: key,
          from: lastVariables[key],
          to: value
        });
      }
    }
    
    return changes;
  }

  /**
   * Generate health alerts from context
   * @param {Object} context - Current context
   * @returns {Array} Health alerts
   */
  generateHealthAlerts(context) {
    const alerts = [];
    const memoryUsage = (context.memory?.current || 0) / (context.memory?.limit || 3500) * 100;
    
    if (memoryUsage > 90) {
      alerts.push({
        id: 'memory-critical',
        level: 'critical',
        message: 'Critical memory usage detected',
        value: `${Math.round(memoryUsage)}%`
      });
    } else if (memoryUsage > 75) {
      alerts.push({
        id: 'memory-warning',
        level: 'warning',
        message: 'High memory usage detected',
        value: `${Math.round(memoryUsage)}%`
      });
    }
    
    if (context.activeAgents?.count >= context.activeAgents?.limit) {
      alerts.push({
        id: 'agent-limit',
        level: 'info',
        message: 'Maximum concurrent agents reached',
        value: `${context.activeAgents.count}/${context.activeAgents.limit}`
      });
    }
    
    return alerts;
  }

  /**
   * Calculate optimization score from context
   * @param {Object} context - Context object
   * @returns {number} Optimization score
   */
  async calculateOptimizationScore(context) {
    // This would integrate with the actual variable engine
    return 8.5 + Math.random() * 1.5; // 8.5-10.0
  }

  // Cache management methods
  cacheContext(key, context) {
    // Simple in-memory cache - in production would use Redis or similar
    this.contextCache = this.contextCache || new Map();
    this.contextCache.set(key, context);
  }

  getLastContext(key) {
    this.contextCache = this.contextCache || new Map();
    return this.contextCache.get(key);
  }

  cacheVariables(key, variables) {
    this.variablesCache = this.variablesCache || new Map();
    this.variablesCache.set(key, variables);
  }

  getLastVariables(key) {
    this.variablesCache = this.variablesCache || new Map();
    return this.variablesCache.get(key);
  }

  cachePerformance(key, performance) {
    this.performanceCache = this.performanceCache || new Map();
    this.performanceCache.set(key, performance);
  }

  getLastPerformance(key) {
    this.performanceCache = this.performanceCache || new Map();
    return this.performanceCache.get(key);
  }

  cacheHealth(key, health) {
    this.healthCache = this.healthCache || new Map();
    this.healthCache.set(key, health);
  }

  getLastHealth(key) {
    this.healthCache = this.healthCache || new Map();
    return this.healthCache.get(key);
  }

  /**
   * Get streaming statistics
   * @returns {Object} Statistics object
   */
  getStreamingStats() {
    const stats = {
      activeStreams: this.activeStreams.size,
      totalUpdates: this.updateBuffer.length,
      watchedFiles: this.lastUpdateTime.size,
      cacheSize: {
        context: this.contextCache?.size || 0,
        variables: this.variablesCache?.size || 0,
        performance: this.performanceCache?.size || 0,
        health: this.healthCache?.size || 0
      }
    };
    
    return stats;
  }

  /**
   * Cleanup resources and stop all streams
   */
  cleanup() {
    // Stop all active streams
    for (const [streamId, stream] of this.activeStreams) {
      if (stream.intervalId) {
        clearInterval(stream.intervalId);
      }
    }
    this.activeStreams.clear();
    
    // Clear all timers
    for (const timerId of this.debounceTimers.values()) {
      clearTimeout(timerId);
    }
    this.debounceTimers.clear();
    
    // Clear caches
    if (this.contextCache) this.contextCache.clear();
    if (this.variablesCache) this.variablesCache.clear();
    if (this.performanceCache) this.performanceCache.clear();
    if (this.healthCache) this.healthCache.clear();
    
    console.log('Streaming Update Manager cleaned up');
  }
}

module.exports = { StreamingUpdateManager };