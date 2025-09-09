/**
 * Settings Optimizer for Mega-Minds Claude Code Integration
 * Generates optimal Claude Code settings based on project analysis
 * 
 * Features:
 * - Project-specific tool permissions
 * - Model selection optimization
 * - Security configuration
 * - Subagent configurations
 * - Performance tuning
 */

const fs = require('fs-extra');
const path = require('path');

class SettingsOptimizer {
  constructor(projectAnalyzer, config = {}) {
    this.projectAnalyzer = projectAnalyzer;
    this.config = {
      enableSecurityOptimization: true,
      enablePerformanceOptimization: true,
      enableHooks: true,
      defaultModel: 'sonnet',
      maxConcurrentSubagents: 2,
      ...config
    };
    
    // Security-first tool permissions
    this.toolPermissions = {
      // Core tools (always safe)
      core: ['Task', 'Read', 'Write', 'Edit', 'MultiEdit'],
      
      // File operations (project-dependent)
      fileOps: ['Glob', 'Grep'],
      
      // System operations (requires validation)
      system: ['Bash'],
      
      // Network operations (security review required)
      network: ['WebFetch', 'WebSearch'],
      
      // Development tools (context-dependent)
      development: ['TodoWrite', 'ExitPlanMode', 'NotebookEdit'],
      
      // IDE integrations (safe)
      ide: ['mcp__ide__getDiagnostics', 'mcp__ide__executeCode']
    };
  }

  /**
   * Generate optimal Claude settings for a project
   * @param {Object} projectAnalysis - Project analysis results
   * @param {string} projectPath - Project directory path
   * @returns {Promise<Object>} Optimized settings configuration
   */
  async generateOptimalSettings(projectAnalysis, projectPath) {
    try {
      const settings = {
        // Meta information
        $schema: 'https://schemas.anthropic.com/claude-code/settings.json',
        generatedBy: 'mega-minds-settings-optimizer',
        version: '2.1.0',
        generatedAt: new Date().toISOString(),
        projectType: projectAnalysis.projectType || 'unknown',
        
        // Core configuration
        model: this.selectOptimalModel(projectAnalysis),
        allowedTools: this.determineOptimalTools(projectAnalysis),
        permissions: await this.generateSecurePermissions(projectAnalysis),
        
        // Agent configuration
        subagents: this.generateSubagentConfigs(projectAnalysis),
        
        // Performance optimization
        ...await this.generatePerformanceSettings(projectAnalysis),
        
        // Security settings
        ...await this.generateSecuritySettings(projectAnalysis),
        
        // Integration settings
        ...await this.generateIntegrationSettings(projectPath),
        
        // Hooks configuration
        ...(this.config.enableHooks ? await this.generateHooksConfig() : {}),
      };
      
      // Validate settings before returning
      this.validateSettings(settings);
      
      console.log('✅ Generated optimal Claude settings');
      return settings;
      
    } catch (error) {
      console.error('❌ Failed to generate settings:', error.message);
      return this.generateFallbackSettings();
    }
  }

  /**
   * Select optimal model based on project complexity and requirements
   * @param {Object} projectAnalysis - Project analysis
   * @returns {string} Optimal model name
   */
  selectOptimalModel(projectAnalysis) {
    // Model selection based on project characteristics
    if (projectAnalysis.complexity === 'high' || 
        projectAnalysis.techStack?.languages?.length > 3) {
      return 'opus'; // Most capable for complex projects
    }
    
    if ((Array.isArray(projectAnalysis.techStack?.frameworks) && 
         (projectAnalysis.techStack.frameworks.includes('React') ||
          projectAnalysis.techStack.frameworks.includes('Vue'))) ||
        projectAnalysis.hasComplexArchitecture) {
      return 'sonnet'; // Good balance for medium complexity
    }
    
    // Default to sonnet for most use cases
    return this.config.defaultModel;
  }

  /**
   * Determine optimal tool permissions based on project needs
   * @param {Object} projectAnalysis - Project analysis
   * @returns {Array} List of allowed tools
   */
  determineOptimalTools(projectAnalysis) {
    const tools = [...this.toolPermissions.core];
    
    // Always include file operations for development
    tools.push(...this.toolPermissions.fileOps);
    
    // Add IDE tools if available
    tools.push(...this.toolPermissions.ide);
    
    // Add development tools
    tools.push(...this.toolPermissions.development);
    
    // Conditional tools based on project analysis
    if (this.projectNeedsBash(projectAnalysis)) {
      tools.push('Bash');
    }
    
    if (this.projectNeedsNetwork(projectAnalysis)) {
      tools.push('WebFetch');
      if (projectAnalysis.needsResearch) {
        tools.push('WebSearch');
      }
    }
    
    // Remove duplicates and return
    return [...new Set(tools)];
  }

  /**
   * Generate secure permissions configuration
   * @param {Object} projectAnalysis - Project analysis
   * @returns {Promise<Object>} Permissions configuration
   */
  async generateSecurePermissions(projectAnalysis) {
    const permissions = {
      file_write: true, // Required for development
      file_read: true,  // Always safe
      
      // Bash permissions based on project needs
      bash: this.projectNeedsBash(projectAnalysis),
      
      // Network permissions with restrictions
      web_fetch: this.projectNeedsNetwork(projectAnalysis),
      
      // Directory restrictions
      excluded_paths: await this.generateExcludedPaths(projectAnalysis),
      
      // File type restrictions
      allowed_extensions: this.getAllowedFileExtensions(projectAnalysis),
    };
    
    return permissions;
  }

  /**
   * Generate subagent configurations optimized for the project
   * @param {Object} projectAnalysis - Project analysis
   * @returns {Object} Subagent configurations
   */
  generateSubagentConfigs(projectAnalysis) {
    const configs = {};
    
    // Core agents with optimized settings
    const coreAgents = [
      'project-orchestrator-agent',
      'frontend-development-agent',
      'backend-development-agent',
      'testing-agent'
    ];
    
    coreAgents.forEach(agentName => {
      configs[agentName] = this.generateAgentConfig(agentName, projectAnalysis);
    });
    
    // Add specialized agents based on project needs
    if (projectAnalysis.hasDatabase) {
      configs['database-agent'] = this.generateAgentConfig('database-agent', projectAnalysis);
    }
    
    if (projectAnalysis.needsSecurity) {
      configs['security-testing-agent'] = this.generateAgentConfig('security-testing-agent', projectAnalysis);
    }
    
    if (projectAnalysis.hasAPI) {
      configs['api-design-agent'] = this.generateAgentConfig('api-design-agent', projectAnalysis);
    }
    
    return configs;
  }

  /**
   * Generate configuration for individual agent
   * @param {string} agentName - Agent name
   * @param {Object} projectAnalysis - Project analysis
   * @returns {Object} Agent configuration
   */
  generateAgentConfig(agentName, projectAnalysis) {
    const baseConfig = {
      model: this.selectAgentModel(agentName, projectAnalysis),
      tools: this.getAgentTools(agentName),
      max_turns: this.getAgentMaxTurns(agentName),
      permissions: this.getAgentPermissions(agentName, projectAnalysis)
    };
    
    return baseConfig;
  }

  /**
   * Generate performance optimization settings
   * @param {Object} projectAnalysis - Project analysis
   * @returns {Promise<Object>} Performance settings
   */
  async generatePerformanceSettings(projectAnalysis) {
    if (!this.config.enablePerformanceOptimization) {
      return {};
    }
    
    return {
      // Concurrent agent limits
      max_concurrent_subagents: this.config.maxConcurrentSubagents,
      
      // Memory optimization
      memory_management: {
        auto_compress: true,
        compression_threshold: 0.8,
        cleanup_interval: 30000
      },
      
      // Response optimization
      response_optimization: {
        streaming: true,
        compression: true,
        cache_responses: true
      }
    };
  }

  /**
   * Generate security-focused settings
   * @param {Object} projectAnalysis - Project analysis
   * @returns {Promise<Object>} Security settings
   */
  async generateSecuritySettings(projectAnalysis) {
    if (!this.config.enableSecurityOptimization) {
      return {};
    }
    
    return {
      security: {
        // Input validation
        validate_inputs: true,
        sanitize_commands: true,
        
        // File access controls
        restrict_sensitive_files: true,
        audit_file_access: true,
        
        // Command execution limits
        bash_timeout: 30000,
        command_whitelist: this.generateCommandWhitelist(projectAnalysis),
        
        // Network restrictions
        allowed_domains: this.getAllowedDomains(projectAnalysis),
        block_suspicious_urls: true
      }
    };
  }

  /**
   * Generate integration settings (statusline, hooks, etc.)
   * @param {string} projectPath - Project path
   * @returns {Promise<Object>} Integration settings
   */
  async generateIntegrationSettings(projectPath) {
    const statuslinePath = path.join('.claude', 'statusline.js');
    
    return {
      // Statusline integration
      statusline: statuslinePath,
      
      // Memory management
      memory_imports: [
        '@.claude/shared/knowledge.md',
        '@.claude/project-context.md'
      ],
      
      // Environment detection
      auto_detect: {
        git: true,
        package_managers: true,
        frameworks: true
      }
    };
  }

  /**
   * Generate hooks configuration for automation
   * @returns {Promise<Object>} Hooks configuration
   */
  async generateHooksConfig() {
    return {
      hooks: {
        // Tool use monitoring
        'PostToolUse': 'npx mega-minds record-tool-use',
        
        // Agent lifecycle
        'SubagentStart': 'npx mega-minds record-agent-start',
        'SubagentStop': 'npx mega-minds complete-handoff',
        
        // Session management  
        'SessionStart': 'npx mega-minds session-start',
        'Stop': 'npx mega-minds save-session-auto',
        
        // Quality gates
        'UserPromptSubmit': 'npx mega-minds trigger-quality-gates'
      }
    };
  }

  /**
   * Helper methods for project analysis
   */
  
  projectNeedsBash(projectAnalysis) {
    return (
      projectAnalysis.hasPackageJson ||
      projectAnalysis.hasGit ||
      projectAnalysis.needsBuild ||
      projectAnalysis.hasCLITools
    );
  }

  projectNeedsNetwork(projectAnalysis) {
    return (
      projectAnalysis.needsDocumentation ||
      projectAnalysis.hasAPI ||
      projectAnalysis.needsResearch
    );
  }

  async generateExcludedPaths(projectAnalysis) {
    const excludePaths = [
      'node_modules/**',
      '.git/**',
      '**/*.log',
      '**/.env*',
      '**/secrets/**',
      '**/.vscode/**',
      '**/.idea/**'
    ];
    
    // Add project-specific exclusions
    if (Array.isArray(projectAnalysis.techStack?.languages) && projectAnalysis.techStack.languages.includes('Python')) {
      excludePaths.push('**/__pycache__/**', '**/venv/**', '**/.pytest_cache/**');
    }
    
    if (Array.isArray(projectAnalysis.techStack?.languages) && projectAnalysis.techStack.languages.includes('Java')) {
      excludePaths.push('**/target/**', '**/.gradle/**');
    }
    
    return excludePaths;
  }

  getAllowedFileExtensions(projectAnalysis) {
    const baseExtensions = ['.md', '.txt', '.json', '.yaml', '.yml'];
    
    // Add extensions based on tech stack
    if (Array.isArray(projectAnalysis.techStack?.languages) && projectAnalysis.techStack.languages.includes('JavaScript')) {
      baseExtensions.push('.js', '.jsx', '.ts', '.tsx');
    }
    
    if (Array.isArray(projectAnalysis.techStack?.languages) && projectAnalysis.techStack.languages.includes('Python')) {
      baseExtensions.push('.py', '.pyx', '.pyi');
    }
    
    if (Array.isArray(projectAnalysis.techStack?.languages) && projectAnalysis.techStack.languages.includes('Java')) {
      baseExtensions.push('.java', '.kt');
    }
    
    return baseExtensions;
  }

  generateCommandWhitelist(projectAnalysis) {
    const whitelist = [
      'npm', 'yarn', 'pnpm',
      'git',
      'ls', 'cat', 'grep', 'find',
      'mkdir', 'cp', 'mv'
    ];
    
    // Add project-specific commands
    if (Array.isArray(projectAnalysis.techStack?.languages) && projectAnalysis.techStack.languages.includes('Python')) {
      whitelist.push('python', 'pip', 'pytest');
    }
    
    if (Array.isArray(projectAnalysis.techStack?.languages) && projectAnalysis.techStack.languages.includes('Java')) {
      whitelist.push('java', 'javac', 'gradle', 'mvn');
    }
    
    return whitelist;
  }

  getAllowedDomains(projectAnalysis) {
    return [
      'docs.anthropic.com',
      'github.com',
      'stackoverflow.com',
      'developer.mozilla.org',
      'npmjs.com'
    ];
  }

  selectAgentModel(agentName, projectAnalysis) {
    // Specialized model selection per agent
    if (agentName === 'project-orchestrator-agent') {
      return 'opus'; // Needs highest capability
    }
    
    if (agentName.includes('testing') || agentName.includes('security')) {
      return 'sonnet'; // Good for analysis tasks
    }
    
    return 'sonnet'; // Default
  }

  getAgentTools(agentName) {
    const baseTools = ['Task', 'Read', 'Write', 'Edit'];
    
    if (agentName.includes('frontend') || agentName.includes('backend')) {
      baseTools.push('Bash', 'Glob', 'Grep');
    }
    
    if (agentName.includes('testing')) {
      baseTools.push('Bash', 'mcp__ide__executeCode');
    }
    
    return baseTools;
  }

  getAgentMaxTurns(agentName) {
    if (agentName === 'project-orchestrator-agent') {
      return 10; // Needs more turns for coordination
    }
    
    return 5; // Standard limit
  }

  getAgentPermissions(agentName, projectAnalysis) {
    return {
      file_write: true,
      bash: this.projectNeedsBash(projectAnalysis) && !agentName.includes('review')
    };
  }

  /**
   * Validation and fallback methods
   */
  
  validateSettings(settings) {
    if (!settings.model) {
      throw new Error('Model selection is required');
    }
    
    if (!Array.isArray(settings.allowedTools) || settings.allowedTools.length === 0) {
      throw new Error('At least one tool must be allowed');
    }
    
    if (settings.max_concurrent_subagents > 3) {
      console.warn('⚠️  High concurrent subagent limit may affect performance');
    }
  }

  generateFallbackSettings() {
    return {
      model: 'sonnet',
      allowedTools: ['Task', 'Read', 'Write', 'Edit', 'Bash'],
      permissions: {
        file_write: true,
        bash: true
      },
      subagents: {
        'project-orchestrator-agent': {
          model: 'sonnet',
          tools: ['Task', 'Read', 'Write']
        }
      }
    };
  }

  /**
   * Save settings to file with proper formatting
   * @param {Object} settings - Settings object
   * @param {string} filePath - Target file path
   * @returns {Promise<void>}
   */
  async saveSettings(settings, filePath) {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, settings, { 
      spaces: 2,
      mode: 0o644
    });
    
    console.log(`✅ Settings saved to ${filePath}`);
  }

  /**
   * Get optimizer statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      version: '2.1.0',
      optimizerName: 'SettingsOptimizer',
      features: [
        'Project-specific optimization',
        'Security-first configuration',
        'Performance tuning',
        'Tool permission management',
        'Subagent optimization'
      ],
      supportedModels: ['opus', 'sonnet', 'haiku'],
      toolCategories: Object.keys(this.toolPermissions)
    };
  }
}

module.exports = { SettingsOptimizer };