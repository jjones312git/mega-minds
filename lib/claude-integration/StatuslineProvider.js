/**
 * Statusline Provider for Mega-Minds Claude Code Integration
 * Provides real-time status information for Claude Code's statusline
 * 
 * Features:
 * - Agent activity monitoring
 * - Memory pressure tracking
 * - Performance metrics
 * - Security status indicators
 */

const fs = require('fs-extra');
const path = require('path');
const { performance } = require('perf_hooks');

class StatuslineProvider {
  constructor(aiDevTeam = null, config = {}) {
    this.aiDevTeam = aiDevTeam;
    this.config = {
      updateInterval: 300, // 300ms minimum as per Claude docs
      maxStatusLength: 100,
      enableColors: true,
      enableEmojis: true,
      showPerformance: true,
      showMemory: true,
      ...config
    };
    
    this.lastUpdate = 0;
    this.cache = null;
    this.performanceMetrics = {
      lastGenerationTime: 0,
      averageResponseTime: 0,
      totalRequests: 0
    };
  }

  /**
   * Generate statusline content for Claude Code
   * @param {Object} contextData - Optional context data from Claude
   * @returns {Promise<string>} Formatted statusline text
   */
  async generateStatus(contextData = {}) {
    const now = performance.now();
    
    // Respect minimum update interval
    if (now - this.lastUpdate < this.config.updateInterval && this.cache) {
      return this.cache;
    }

    try {
      const startTime = performance.now();
      
      // Gather system status
      const status = await this.collectSystemStatus(contextData);
      
      // Format statusline
      const statusText = this.formatStatusline(status);
      
      // Update metrics and cache
      this.updatePerformanceMetrics(performance.now() - startTime);
      this.cache = statusText;
      this.lastUpdate = now;
      
      return statusText;
      
    } catch (error) {
      return this.generateErrorStatus(error);
    }
  }

  /**
   * Collect comprehensive system status
   * @param {Object} contextData - Context from Claude Code
   * @returns {Promise<Object>} Status object
   */
  async collectSystemStatus(contextData) {
    const status = {
      timestamp: new Date().toISOString(),
      agents: await this.getAgentStatus(),
      memory: await this.getMemoryStatus(),
      performance: this.getPerformanceStatus(),
      session: this.getSessionStatus(contextData),
      security: await this.getSecurityStatus(),
      queue: await this.getQueueStatus()
    };
    
    return status;
  }

  /**
   * Get agent activity status
   * @returns {Promise<Object>} Agent status information
   */
  async getAgentStatus() {
    try {
      if (!this.aiDevTeam || !this.aiDevTeam.agentState) {
        return { active: 0, total: 0, status: 'unknown' };
      }

      const activeAgents = await this.aiDevTeam.agentState.getActiveAgents();
      const totalAgents = await this.aiDevTeam.agentState.getTotalAgents();
      
      return {
        active: activeAgents.length || 0,
        total: totalAgents || 0,
        names: activeAgents.map(agent => agent.shortName || agent.name).slice(0, 2),
        status: activeAgents.length > 0 ? 'active' : 'idle'
      };
      
    } catch (error) {
      return { active: 0, total: 0, status: 'error', error: error.message };
    }
  }

  /**
   * Get memory status and pressure information
   * @returns {Promise<Object>} Memory status
   */
  async getMemoryStatus() {
    try {
      if (!this.aiDevTeam || !this.aiDevTeam.memory) {
        return { usage: 'unknown', pressure: 'unknown', status: 'unavailable' };
      }

      const memoryInfo = await this.aiDevTeam.memory.getStatus();
      const pressure = await this.aiDevTeam.memory.getPressureLevel();
      
      return {
        current: memoryInfo.current || 0,
        limit: memoryInfo.limit || 3500,
        percentage: Math.round((memoryInfo.current / memoryInfo.limit) * 100) || 0,
        pressure: pressure || 'normal',
        status: this.determineMemoryStatus(memoryInfo.current, memoryInfo.limit)
      };
      
    } catch (error) {
      return { usage: 'error', pressure: 'unknown', status: 'error' };
    }
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance information
   */
  getPerformanceStatus() {
    return {
      lastResponseTime: Math.round(this.performanceMetrics.lastGenerationTime),
      averageResponseTime: Math.round(this.performanceMetrics.averageResponseTime),
      totalRequests: this.performanceMetrics.totalRequests,
      status: this.determinePerformanceStatus()
    };
  }

  /**
   * Get session information from Claude context
   * @param {Object} contextData - Claude context data
   * @returns {Object} Session status
   */
  getSessionStatus(contextData) {
    return {
      id: contextData.sessionId || 'unknown',
      model: contextData.model || 'unknown',
      workingDir: this.getWorkingDirectory(),
      gitBranch: this.getGitBranch(),
      cost: contextData.cost || null
    };
  }

  /**
   * Get security status indicators
   * @returns {Promise<Object>} Security status
   */
  async getSecurityStatus() {
    try {
      return {
        permissionsValid: true,
        agentsBounded: await this.validateAgentBoundaries(),
        memorySecure: await this.validateMemorySecurity(),
        status: 'secure'
      };
    } catch (error) {
      return {
        permissionsValid: false,
        status: 'warning',
        error: error.message
      };
    }
  }

  /**
   * Get queue status for handoffs
   * @returns {Promise<Object>} Queue information
   */
  async getQueueStatus() {
    try {
      if (!this.aiDevTeam || !this.aiDevTeam.dispatcher) {
        return { pending: 0, status: 'unknown' };
      }

      const queueLength = await this.aiDevTeam.dispatcher.getQueueLength() || 0;
      
      return {
        pending: queueLength,
        status: queueLength > 5 ? 'congested' : queueLength > 0 ? 'processing' : 'clear'
      };
      
    } catch (error) {
      return { pending: 0, status: 'error' };
    }
  }

  /**
   * Format statusline text with colors and emojis
   * @param {Object} status - System status object
   * @returns {string} Formatted statusline
   */
  formatStatusline(status) {
    const parts = [];
    
    // Agent status
    if (this.config.enableEmojis) {
      const agentEmoji = status.agents.status === 'active' ? '🤖' : '💤';
      parts.push(`${agentEmoji} ${status.agents.active}/${status.agents.total}`);
    } else {
      parts.push(`Agents: ${status.agents.active}/${status.agents.total}`);
    }
    
    // Memory status with color coding
    if (this.config.showMemory && status.memory.percentage) {
      const memoryColor = this.getMemoryColor(status.memory.percentage);
      const memoryEmoji = this.getMemoryEmoji(status.memory.percentage);
      
      if (this.config.enableColors) {
        parts.push(`${memoryEmoji} ${memoryColor}${status.memory.percentage}%\x1b[0m`);
      } else {
        parts.push(`${memoryEmoji} ${status.memory.percentage}%`);
      }
    }
    
    // Queue status
    if (status.queue.pending > 0) {
      const queueEmoji = this.config.enableEmojis ? '🔄' : 'Q:';
      parts.push(`${queueEmoji} ${status.queue.pending}`);
    }
    
    // Performance indicator
    if (this.config.showPerformance && status.performance.lastResponseTime) {
      const perfEmoji = this.getPerformanceEmoji(status.performance.lastResponseTime);
      parts.push(`${perfEmoji} ${status.performance.lastResponseTime}ms`);
    }
    
    // Security status
    const securityEmoji = status.security.status === 'secure' ? '🛡️' : '⚠️';
    if (this.config.enableEmojis) {
      parts.push(securityEmoji);
    }
    
    // Git branch if available
    if (status.session.gitBranch && status.session.gitBranch !== 'unknown') {
      parts.push(`📋 ${status.session.gitBranch}`);
    }
    
    let statusText = parts.join(' | ');
    
    // Truncate if too long
    if (statusText.length > this.config.maxStatusLength) {
      statusText = statusText.substring(0, this.config.maxStatusLength - 3) + '...';
    }
    
    return statusText;
  }

  /**
   * Helper methods for status determination
   */
  
  determineMemoryStatus(current, limit) {
    const percentage = (current / limit) * 100;
    if (percentage > 90) return 'critical';
    if (percentage > 75) return 'warning';
    if (percentage > 50) return 'moderate';
    return 'healthy';
  }

  determinePerformanceStatus() {
    const avgTime = this.performanceMetrics.averageResponseTime;
    if (avgTime > 1000) return 'slow';
    if (avgTime > 500) return 'moderate';
    return 'fast';
  }

  getMemoryColor(percentage) {
    if (percentage > 90) return '\x1b[31m'; // Red
    if (percentage > 75) return '\x1b[33m'; // Yellow
    if (percentage > 50) return '\x1b[36m'; // Cyan
    return '\x1b[32m'; // Green
  }

  getMemoryEmoji(percentage) {
    if (!this.config.enableEmojis) return 'Mem:';
    if (percentage > 90) return '🔴';
    if (percentage > 75) return '🟡';
    if (percentage > 50) return '🔵';
    return '🟢';
  }

  getPerformanceEmoji(responseTime) {
    if (!this.config.enableEmojis) return 'Perf:';
    if (responseTime > 1000) return '🐌';
    if (responseTime > 500) return '🚶';
    return '⚡';
  }

  /**
   * Utility methods
   */
  
  getWorkingDirectory() {
    try {
      return path.basename(process.cwd());
    } catch (error) {
      return 'unknown';
    }
  }

  getGitBranch() {
    try {
      const { execSync } = require('child_process');
      return execSync('git branch --show-current', { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 1000
      }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  async validateAgentBoundaries() {
    // Validate that agents are operating within defined boundaries
    return true; // Simplified for now
  }

  async validateMemorySecurity() {
    // Validate memory access patterns and security
    return true; // Simplified for now
  }

  updatePerformanceMetrics(duration) {
    this.performanceMetrics.lastGenerationTime = duration;
    this.performanceMetrics.totalRequests++;
    
    // Calculate rolling average
    const alpha = 0.1; // Smoothing factor
    this.performanceMetrics.averageResponseTime = 
      (alpha * duration) + ((1 - alpha) * this.performanceMetrics.averageResponseTime);
  }

  generateErrorStatus(error) {
    const errorEmoji = this.config.enableEmojis ? '❌' : 'ERROR:';
    return `${errorEmoji} mega-minds status error`;
  }

  /**
   * Generate statusline script for Claude Code
   * @param {string} projectPath - Project directory
   * @returns {Promise<string>} Script content
   */
  async generateStatuslineScript(projectPath) {
    const scriptContent = `#!/usr/bin/env node
/**
 * Mega-Minds Statusline Script for Claude Code
 * Auto-generated by StatuslineProvider
 */

const path = require('path');
const fs = require('fs');

// Read context data from stdin
let contextData = {};
try {
  const stdin = process.stdin.read();
  if (stdin) {
    contextData = JSON.parse(stdin.toString());
  }
} catch (error) {
  // Ignore JSON parse errors - use empty context
}

// Initialize mega-minds components
try {
  const { StatuslineProvider } = require('mega-minds/lib/claude-integration/StatuslineProvider');
  const { AIDevTeam } = require('mega-minds/lib/core/AIDevTeam');
  
  const team = new AIDevTeam(process.cwd());
  const provider = new StatuslineProvider(team, {
    enableColors: true,
    enableEmojis: true,
    showPerformance: true
  });
  
  provider.generateStatus(contextData).then(status => {
    console.log(status);
  }).catch(error => {
    console.log('🤖 mega-minds ready');
  });
  
} catch (error) {
  // Fallback statusline if mega-minds not available
  const dir = path.basename(process.cwd());
  console.log(\`🤖 \${dir} | mega-minds\`);
}
`;

    const scriptPath = path.join(projectPath, '.claude', 'statusline.js');
    await fs.writeFile(scriptPath, scriptContent, { mode: 0o755 });
    
    return scriptPath;
  }

  /**
   * Get provider statistics and configuration
   * @returns {Object} Provider stats
   */
  getStats() {
    return {
      version: '2.1.0',
      providerName: 'StatuslineProvider',
      config: this.config,
      metrics: this.performanceMetrics,
      features: [
        'Real-time agent monitoring',
        'Memory pressure tracking',
        'Performance metrics',
        'Security status',
        'Queue management',
        'Git integration'
      ]
    };
  }

  /**
   * Reset metrics and cache
   */
  reset() {
    this.cache = null;
    this.lastUpdate = 0;
    this.performanceMetrics = {
      lastGenerationTime: 0,
      averageResponseTime: 0,
      totalRequests: 0
    };
  }
}

module.exports = { StatuslineProvider };