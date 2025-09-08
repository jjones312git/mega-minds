/**
 * Performance Monitor for Mega-Minds Variable-Driven Agent System
 * Tracks system performance, metrics, and optimization scores
 */

class PerformanceMonitor {
  constructor(config = {}) {
    this.config = {
      maxHistorySize: config.maxHistorySize || 1000,
      sampleWindow: config.sampleWindow || 60000, // 1 minute
      alertThresholds: {
        loadTime: config.alertThresholds?.loadTime || 1000, // 1 second
        memoryUsage: config.alertThresholds?.memoryUsage || 80, // 80%
        errorRate: config.alertThresholds?.errorRate || 5 // 5%
      },
      ...config
    };

    // Core metrics storage
    this.metrics = {
      loadTimes: [],
      cacheHits: 0,
      cacheMisses: 0,
      errors: [],
      operations: [],
      systemHealth: {
        status: 'healthy',
        lastCheck: Date.now()
      },
      optimizationScore: 8.5
    };

    // Performance tracking
    this.activeTimers = new Map();
    this.metricHistory = new Map();
    this.alerts = [];

    // Initialize
    this.startTime = Date.now();
    this.lastCleanup = Date.now();
  }

  /**
   * Start timing an operation
   * @param {string} operationId - Unique identifier for the operation
   * @returns {string} Timer ID for ending the operation
   */
  startTiming(operationId = null) {
    const timerId = operationId || `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.activeTimers.set(timerId, {
      startTime: performance.now(),
      realStartTime: Date.now(),
      operationId: operationId || 'unknown'
    });

    return timerId;
  }

  /**
   * End timing and record the operation
   * @param {string} operation - Operation name for categorization
   * @param {string} timerId - Timer ID from startTiming (optional)
   * @returns {number} Duration in milliseconds
   */
  endTiming(operation, timerId = null) {
    let timer;
    
    if (timerId && this.activeTimers.has(timerId)) {
      timer = this.activeTimers.get(timerId);
      this.activeTimers.delete(timerId);
    } else {
      // Find the most recent timer if no ID provided
      const timers = Array.from(this.activeTimers.entries());
      if (timers.length > 0) {
        const [id, timerData] = timers[timers.length - 1];
        timer = timerData;
        this.activeTimers.delete(id);
      }
    }

    if (!timer) {
      console.warn('No active timer found for operation:', operation);
      return 0;
    }

    const duration = performance.now() - timer.startTime;
    
    // Record the metric
    this.recordMetric(operation, duration, {
      timestamp: Date.now(),
      operationId: timer.operationId
    });

    return duration;
  }

  /**
   * Record a performance metric
   * @param {string} operation - Operation name
   * @param {number} value - Metric value
   * @param {Object} metadata - Additional metadata
   */
  recordMetric(operation, value, metadata = {}) {
    const metric = {
      operation: operation,
      value: value,
      timestamp: Date.now(),
      metadata: metadata
    };

    // Store in appropriate category
    switch (operation) {
      case 'section-load':
      case 'template-load':
      case 'variable-generation':
      case 'agent-invocation':
        this.metrics.loadTimes.push(metric);
        break;
      case 'cache-hit':
        this.metrics.cacheHits++;
        break;
      case 'cache-miss':
        this.metrics.cacheMisses++;
        break;
      case 'error':
        this.metrics.errors.push(metric);
        break;
      default:
        this.metrics.operations.push(metric);
    }

    // Store in history for trend analysis
    if (!this.metricHistory.has(operation)) {
      this.metricHistory.set(operation, []);
    }
    this.metricHistory.get(operation).push(metric);

    // Check for alerts
    this.checkForAlerts(operation, value, metric);

    // Cleanup old data periodically
    if (Date.now() - this.lastCleanup > 300000) { // 5 minutes
      this.cleanup();
    }
  }

  /**
   * Get current metrics snapshot
   * @returns {Object} Current metrics
   */
  getCurrentMetrics() {
    return {
      loadTimes: this.getLoadTimeStats(),
      cacheHitRate: this.getCacheHitRate(),
      errorRate: this.getErrorRate(),
      systemHealth: this.metrics.systemHealth,
      optimizationScore: this.metrics.optimizationScore,
      uptime: this.getUptime(),
      alerts: this.getActiveAlerts(),
      timestamp: Date.now()
    };
  }

  /**
   * Get load time statistics
   * @returns {Object} Load time stats
   */
  getLoadTimeStats() {
    if (this.metrics.loadTimes.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        recent: 0,
        count: 0
      };
    }

    const times = this.metrics.loadTimes.map(m => m.value);
    const recentTimes = this.getRecentMetrics('loadTimes', 60000).map(m => m.value); // Last minute

    return {
      average: this.average(times),
      min: Math.min(...times),
      max: Math.max(...times),
      recent: recentTimes.length > 0 ? this.average(recentTimes) : 0,
      count: times.length,
      p95: this.percentile(times, 95),
      p99: this.percentile(times, 99)
    };
  }

  /**
   * Get cache hit rate
   * @returns {number} Cache hit rate as percentage
   */
  getCacheHitRate() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? Math.round((this.metrics.cacheHits / total) * 100 * 100) / 100 : 0;
  }

  /**
   * Get error rate
   * @returns {number} Error rate as percentage
   */
  getErrorRate() {
    const totalOperations = this.metrics.loadTimes.length + this.metrics.operations.length;
    const errorCount = this.metrics.errors.length;
    return totalOperations > 0 ? Math.round((errorCount / totalOperations) * 100 * 100) / 100 : 0;
  }

  /**
   * Get system uptime
   * @returns {number} Uptime in milliseconds
   */
  getUptime() {
    return Date.now() - this.startTime;
  }

  /**
   * Get last recorded load time
   * @returns {number} Last load time in ms
   */
  getLastLoadTime() {
    if (this.metrics.loadTimes.length === 0) {
      return 50; // Default estimation
    }
    
    const lastMetric = this.metrics.loadTimes[this.metrics.loadTimes.length - 1];
    return Math.round(lastMetric.value);
  }

  /**
   * Update system health status
   * @param {string} status - Health status ('healthy', 'degraded', 'critical')
   * @param {string} reason - Reason for status change
   */
  updateSystemHealth(status, reason = null) {
    this.metrics.systemHealth = {
      status: status,
      reason: reason,
      lastCheck: Date.now(),
      previousStatus: this.metrics.systemHealth.status
    };

    // Log significant changes
    if (status !== this.metrics.systemHealth.previousStatus) {
      console.log(`System health changed: ${this.metrics.systemHealth.previousStatus} → ${status}${reason ? ` (${reason})` : ''}`);
    }
  }

  /**
   * Calculate and update optimization score
   * @param {Object} factors - Factors affecting optimization
   * @returns {number} New optimization score
   */
  calculateOptimizationScore(factors = {}) {
    let score = this.metrics.optimizationScore;
    
    // Adjust based on performance metrics
    const loadStats = this.getLoadTimeStats();
    const cacheHitRate = this.getCacheHitRate();
    const errorRate = this.getErrorRate();

    // Load time factor (-2 to +1)
    if (loadStats.average < 100) score += 0.5;
    else if (loadStats.average < 200) score += 0.2;
    else if (loadStats.average > 1000) score -= 0.8;
    else if (loadStats.average > 500) score -= 0.4;

    // Cache hit rate factor (-1 to +1)
    if (cacheHitRate > 90) score += 0.3;
    else if (cacheHitRate > 80) score += 0.1;
    else if (cacheHitRate < 50) score -= 0.5;

    // Error rate factor (-2 to +0.5)
    if (errorRate === 0) score += 0.2;
    else if (errorRate < 1) score += 0.1;
    else if (errorRate > 10) score -= 1.0;
    else if (errorRate > 5) score -= 0.5;

    // External factors
    if (factors.memoryUsage) {
      if (factors.memoryUsage < 50) score += 0.2;
      else if (factors.memoryUsage > 90) score -= 1.0;
      else if (factors.memoryUsage > 75) score -= 0.3;
    }

    if (factors.coordinationSuccess) {
      if (factors.coordinationSuccess > 95) score += 0.3;
      else if (factors.coordinationSuccess < 80) score -= 0.5;
    }

    // Keep score in bounds
    score = Math.max(1, Math.min(10, score));
    
    // Smooth changes
    this.metrics.optimizationScore = Math.round((this.metrics.optimizationScore * 0.8 + score * 0.2) * 10) / 10;
    
    return this.metrics.optimizationScore;
  }

  /**
   * Check for performance alerts
   * @param {string} operation - Operation name
   * @param {number} value - Metric value
   * @param {Object} metric - Full metric object
   */
  checkForAlerts(operation, value, metric) {
    const alerts = [];

    // Load time alerts
    if (['section-load', 'template-load', 'variable-generation'].includes(operation)) {
      if (value > this.config.alertThresholds.loadTime) {
        alerts.push({
          type: 'performance',
          severity: value > this.config.alertThresholds.loadTime * 2 ? 'critical' : 'warning',
          message: `Slow ${operation}: ${Math.round(value)}ms`,
          operation: operation,
          value: value,
          threshold: this.config.alertThresholds.loadTime,
          timestamp: metric.timestamp
        });
      }
    }

    // Error rate alerts
    const errorRate = this.getErrorRate();
    if (errorRate > this.config.alertThresholds.errorRate) {
      alerts.push({
        type: 'error-rate',
        severity: errorRate > this.config.alertThresholds.errorRate * 2 ? 'critical' : 'warning',
        message: `High error rate: ${errorRate}%`,
        value: errorRate,
        threshold: this.config.alertThresholds.errorRate,
        timestamp: Date.now()
      });
    }

    // Add alerts
    for (const alert of alerts) {
      this.addAlert(alert);
    }
  }

  /**
   * Add a performance alert
   * @param {Object} alert - Alert object
   */
  addAlert(alert) {
    // Avoid duplicate alerts
    const exists = this.alerts.some(existing => 
      existing.type === alert.type && 
      existing.operation === alert.operation &&
      (Date.now() - existing.timestamp) < 60000 // Same alert within 1 minute
    );

    if (!exists) {
      alert.id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      this.alerts.push(alert);
      
      // Log critical alerts
      if (alert.severity === 'critical') {
        console.warn(`🚨 Critical Performance Alert: ${alert.message}`);
      }
    }
  }

  /**
   * Get active alerts
   * @param {number} maxAge - Maximum age of alerts in ms (default: 5 minutes)
   * @returns {Array} Active alerts
   */
  getActiveAlerts(maxAge = 300000) {
    const now = Date.now();
    return this.alerts.filter(alert => (now - alert.timestamp) < maxAge);
  }

  /**
   * Clear alerts
   * @param {string} type - Alert type to clear (optional)
   */
  clearAlerts(type = null) {
    if (type) {
      this.alerts = this.alerts.filter(alert => alert.type !== type);
    } else {
      this.alerts = [];
    }
  }

  /**
   * Get recent metrics for a category
   * @param {string} category - Metric category
   * @param {number} timeWindow - Time window in ms
   * @returns {Array} Recent metrics
   */
  getRecentMetrics(category, timeWindow) {
    const now = Date.now();
    const metrics = this.metricHistory.get(category) || [];
    return metrics.filter(metric => (now - metric.timestamp) < timeWindow);
  }

  /**
   * Get performance trends
   * @param {string} operation - Operation to analyze
   * @param {number} timeWindow - Time window in ms
   * @returns {Object} Trend analysis
   */
  getTrend(operation, timeWindow = 3600000) { // 1 hour default
    const metrics = this.getRecentMetrics(operation, timeWindow);
    
    if (metrics.length < 2) {
      return { trend: 'insufficient-data', change: 0 };
    }

    const values = metrics.map(m => m.value);
    const midpoint = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, midpoint);
    const secondHalf = values.slice(midpoint);

    const firstAvg = this.average(firstHalf);
    const secondAvg = this.average(secondHalf);
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    let trend = 'stable';
    if (Math.abs(change) > 20) {
      trend = change > 0 ? 'deteriorating' : 'improving';
    } else if (Math.abs(change) > 10) {
      trend = change > 0 ? 'slightly-worse' : 'slightly-better';
    }

    return { trend, change: Math.round(change * 100) / 100 };
  }

  /**
   * Generate performance report
   * @returns {Object} Comprehensive performance report
   */
  generateReport() {
    const now = Date.now();
    const loadStats = this.getLoadTimeStats();
    
    return {
      timestamp: now,
      uptime: this.getUptime(),
      summary: {
        optimizationScore: this.metrics.optimizationScore,
        systemHealth: this.metrics.systemHealth.status,
        cacheHitRate: this.getCacheHitRate(),
        errorRate: this.getErrorRate()
      },
      performance: {
        loadTimes: loadStats,
        trends: {
          loadTime: this.getTrend('section-load'),
          cachePerformance: this.getTrend('cache-hit'),
          errors: this.getTrend('error')
        }
      },
      metrics: {
        totalOperations: this.metrics.loadTimes.length + this.metrics.operations.length,
        cacheHits: this.metrics.cacheHits,
        cacheMisses: this.metrics.cacheMisses,
        errors: this.metrics.errors.length
      },
      alerts: {
        active: this.getActiveAlerts(),
        total: this.alerts.length
      }
    };
  }

  /**
   * Cleanup old metrics to prevent memory leaks
   */
  cleanup() {
    const maxAge = 3600000; // 1 hour
    const now = Date.now();

    // Clean up load times
    this.metrics.loadTimes = this.metrics.loadTimes.filter(m => (now - m.timestamp) < maxAge);
    
    // Clean up errors
    this.metrics.errors = this.metrics.errors.filter(m => (now - m.timestamp) < maxAge);
    
    // Clean up operations
    this.metrics.operations = this.metrics.operations.filter(m => (now - m.timestamp) < maxAge);
    
    // Clean up alerts
    this.alerts = this.alerts.filter(a => (now - a.timestamp) < 300000); // 5 minutes
    
    // Clean up metric history
    for (const [key, history] of this.metricHistory) {
      const filtered = history.filter(m => (now - m.timestamp) < maxAge);
      if (filtered.length === 0) {
        this.metricHistory.delete(key);
      } else {
        this.metricHistory.set(key, filtered.slice(-this.config.maxHistorySize));
      }
    }

    this.lastCleanup = now;
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      loadTimes: [],
      cacheHits: 0,
      cacheMisses: 0,
      errors: [],
      operations: [],
      systemHealth: {
        status: 'healthy',
        lastCheck: Date.now()
      },
      optimizationScore: 8.5
    };
    
    this.activeTimers.clear();
    this.metricHistory.clear();
    this.alerts = [];
    this.startTime = Date.now();
  }

  /**
   * Export metrics for external analysis
   * @returns {Object} Exportable metrics data
   */
  exportMetrics() {
    return {
      config: this.config,
      metrics: this.metrics,
      history: Object.fromEntries(this.metricHistory),
      alerts: this.alerts,
      uptime: this.getUptime(),
      exportedAt: Date.now()
    };
  }

  // Utility methods
  average(values) {
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  percentile(values, p) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get monitor statistics
   * @returns {Object} Monitor statistics
   */
  getStats() {
    return {
      activeTimers: this.activeTimers.size,
      metricCategories: Array.from(this.metricHistory.keys()),
      totalMetrics: Array.from(this.metricHistory.values()).reduce((sum, arr) => sum + arr.length, 0),
      alerts: this.alerts.length,
      uptime: this.getUptime(),
      optimizationScore: this.metrics.optimizationScore
    };
  }
}

module.exports = { PerformanceMonitor };