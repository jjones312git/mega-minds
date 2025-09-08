/**
 * Template Adapter for Mega-Minds Variable-Driven Agent System
 * Bridges Variable Engine with existing agent templates
 * Enhances templates with dynamic context and intelligent path resolution
 */

const { ContextualVariableEngine } = require('./variable-engine');
const { AgentSectionManager } = require('./section-manager');
const { ProjectContextAnalyzer } = require('./project-context-analyzer');
const { StackProfileManager } = require('./stack-profile-manager');
const fs = require('fs').promises;
const path = require('path');

class TemplateAdapter {
  constructor(projectPath, config = {}) {
    this.projectPath = projectPath;
    this.config = {
      enablePathResolution: config.enablePathResolution !== false,
      enableContextEnhancement: config.enableContextEnhancement !== false,
      enableStackDetection: config.enableStackDetection !== false,
      cacheTimeout: config.cacheTimeout || 60000, // 1 minute
      ...config
    };
    
    this.variableEngine = new ContextualVariableEngine(projectPath, config);
    this.sectionManager = new AgentSectionManager(projectPath, this.variableEngine);
    this.projectAnalyzer = new ProjectContextAnalyzer(projectPath, config);
    this.stackProfileManager = new StackProfileManager(config);
    this.adaptationCache = new Map();
    this.projectAnalysis = null; // Cached project analysis
    
    // Enhanced variables for agent templates
    this.templateVariables = {
      // Path resolution variables
      '{{RULES_PATH}}': 'templates/RULES.md',
      '{{QUICKREF_PATH}}': 'templates/QUICKREF.md', 
      '{{WORKFLOWS_PATH}}': 'workflows/',
      '{{EXAMPLES_PATH}}': 'workflows/examples.md',
      '{{BOUNDARIES_PATH}}': 'workflows/agent-boundaries.md',
      '{{COMMUNICATION_PROTOCOL}}': 'workflows/communication-protocol.md',
      '{{QUALITY_GATES_PATH}}': 'workflows/quality-gates.md',
      
      // Agent context variables
      '{{AGENT_WORKLOAD}}': 'moderate',
      '{{AGENT_PRIORITY}}': 'normal',
      '{{QUALITY_STATUS}}': 'pending',
      '{{DEPENDENCIES}}': 'none',
      '{{COORDINATION_MODE}}': 'collaborative',
      
      // System integration
      '{{CLI_AVAILABLE}}': true,
      '{{MCP_ENABLED}}': true,
      '{{STREAMING_ENABLED}}': true,
      '{{PERFORMANCE_MONITORING}}': true
    };
  }

  /**
   * Adapt an agent template with enhanced variables and dynamic content
   * @param {string} agentName - Name of agent template to adapt
   * @param {Object} sessionContext - Current session context
   * @param {Object} options - Adaptation options
   * @returns {string} Enhanced template content
   */
  async adaptAgentTemplate(agentName, sessionContext, options = {}) {
    try {
      const cacheKey = `${agentName}_${sessionContext.session?.id}_${options.stackProfile || 'auto'}`;
      
      // Check cache first
      if (this.adaptationCache.has(cacheKey) && !options.forceRefresh) {
        const cached = this.adaptationCache.get(cacheKey);
        if (!this.isCacheExpired(cached)) {
          console.log(`📋 Using cached template for ${agentName}`);
          return cached.content;
        }
      }

      console.log(`🔄 Adapting template for ${agentName} with stack detection...`);

      // Analyze project context if not cached or if forced refresh
      if (!this.projectAnalysis || options.forceRefresh) {
        this.projectAnalysis = await this.analyzeProjectContext(options);
      }

      // Load base template
      const baseTemplate = await this.loadAgentTemplate(agentName);
      
      // Generate stack-aware enhanced variables
      const enhancedVariables = await this.generateStackAwareVariables(
        agentName, 
        sessionContext, 
        this.projectAnalysis,
        options
      );
      
      // Apply template enhancements
      let adaptedTemplate = baseTemplate;
      
      if (this.config.enablePathResolution) {
        adaptedTemplate = this.resolveStaticPaths(adaptedTemplate, this.projectAnalysis.structure);
      }
      
      if (this.config.enableContextEnhancement) {
        adaptedTemplate = this.enhanceWithStackContext(adaptedTemplate, sessionContext, this.projectAnalysis);
      }
      
      // Apply variable substitution
      adaptedTemplate = this.applyVariableSubstitution(adaptedTemplate, enhancedVariables);
      
      // Add dynamic sections
      adaptedTemplate = await this.addStackAwareDynamicSections(adaptedTemplate, agentName, sessionContext, this.projectAnalysis);
      
      // Cache the result
      this.cacheAdaptedTemplate(cacheKey, adaptedTemplate);
      
      console.log(`✅ Template adapted for ${agentName} (${this.projectAnalysis.stackProfile?.name || 'Custom Stack'})`);
      return adaptedTemplate;
    } catch (error) {
      console.error(`Failed to adapt template for ${agentName}:`, error.message);
      return this.getFallbackTemplate(agentName, sessionContext);
    }
  }

  /**
   * Generate enhanced variables combining Variable Engine with template-specific vars
   * @param {string} agentName - Agent name
   * @param {Object} sessionContext - Session context
   * @param {Object} options - Generation options
   * @returns {Object} Enhanced variables object
   */
  async generateEnhancedVariables(agentName, sessionContext, options) {
    // Get base variables from Variable Engine
    const baseVariables = await this.variableEngine.generateVariables(
      agentName, 
      'full', 
      sessionContext
    );
    
    // Generate template-specific variables
    const templateVars = await this.generateTemplateVariables(agentName, sessionContext);
    
    // Generate dynamic path variables
    const pathVars = this.generatePathVariables();
    
    // Generate agent-specific context
    const agentVars = await this.generateAgentContextVariables(agentName, sessionContext);
    
    // Combine all variables with precedence
    return {
      ...this.templateVariables, // Base template variables
      ...pathVars,              // Dynamic paths
      ...baseVariables,         // Variable Engine variables
      ...templateVars,          // Template-specific
      ...agentVars,            // Agent context
      ...options.customVariables // User overrides
    };
  }

  /**
   * Analyze project context using ProjectContextAnalyzer
   * @param {Object} options - Analysis options
   * @returns {Object} Project analysis result
   */
  async analyzeProjectContext(options = {}) {
    try {
      console.log('🔍 Analyzing project context and tech stack...');
      
      const analysis = await this.projectAnalyzer.analyzeProject({
        enableDeepAnalysis: options.enableDeepAnalysis !== false,
        customProfile: options.stackProfile
      });

      console.log(`📊 Stack detected: ${analysis.stackProfile?.name || 'Custom'} (${analysis.techStack.confidence} confidence)`);
      
      return analysis;
    } catch (error) {
      console.error('Project analysis failed:', error.message);
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Generate stack-aware variables using project analysis
   * @param {string} agentName - Agent name
   * @param {Object} sessionContext - Session context
   * @param {Object} projectAnalysis - Project analysis result
   * @param {Object} options - Generation options
   * @returns {Object} Stack-aware variables
   */
  async generateStackAwareVariables(agentName, sessionContext, projectAnalysis, options = {}) {
    // Start with base template variables
    const baseVariables = await this.generateEnhancedVariables(agentName, sessionContext, options);
    
    // Get stack-specific variables from project analysis
    const stackVariables = projectAnalysis.variables || {};
    
    // Generate agent-specific specializations
    const agentSpecializations = this.generateAgentSpecializations(agentName, projectAnalysis);
    
    // Combine all variables with proper precedence
    const combinedVariables = {
      ...baseVariables,           // Base template variables
      ...stackVariables,          // Stack profile variables (override base)
      ...agentSpecializations,    // Agent-specific variables
      ...options.customVariables  // User overrides (highest priority)
    };

    // Add analysis metadata
    combinedVariables['{{STACK_PROFILE}}'] = projectAnalysis.stackProfile?.name || 'Custom Stack';
    combinedVariables['{{STACK_CONFIDENCE}}'] = projectAnalysis.techStack.confidence;
    combinedVariables['{{ANALYSIS_TIMESTAMP}}'] = projectAnalysis.analyzedAt;

    return combinedVariables;
  }

  /**
   * Generate agent-specific specializations based on tech stack
   * @param {string} agentName - Agent name
   * @param {Object} projectAnalysis - Project analysis
   * @returns {Object} Agent specialization variables
   */
  generateAgentSpecializations(agentName, projectAnalysis) {
    const specializations = {};
    const stackProfile = projectAnalysis.stackProfile;
    const techStack = projectAnalysis.techStack;

    // Get predefined specializations from stack profile
    if (stackProfile?.agentSpecializations?.[agentName]) {
      specializations['{{AGENT_SPECIALIZATION}}'] = stackProfile.agentSpecializations[agentName];
    } else {
      // Generate dynamic specializations based on detected tech stack
      specializations['{{AGENT_SPECIALIZATION}}'] = this.generateDynamicSpecialization(agentName, techStack);
    }

    // Add tech-specific patterns and best practices
    if (agentName === 'frontend-development-agent') {
      specializations['{{FRONTEND_PATTERNS}}'] = this.getFrontendPatterns(techStack);
      specializations['{{FRONTEND_TOOLS}}'] = this.getFrontendTools(techStack);
    } else if (agentName === 'backend-development-agent') {
      specializations['{{BACKEND_PATTERNS}}'] = this.getBackendPatterns(techStack);
      specializations['{{API_PATTERNS}}'] = this.getApiPatterns(techStack);
    } else if (agentName === 'testing-agent') {
      specializations['{{TESTING_STRATEGIES}}'] = this.getTestingStrategies(techStack);
      specializations['{{TESTING_TOOLS}}'] = this.getTestingTools(techStack);
    }

    return specializations;
  }

  /**
   * Enhanced path resolution with project structure awareness
   * @param {string} template - Template content
   * @param {Object} projectStructure - Project structure information
   * @returns {string} Template with resolved paths
   */
  resolveStaticPaths(template, projectStructure = {}) {
    const pathReplacements = {
      // Dynamic path replacement based on project structure
      'templates/RULES.md': projectStructure.directories?.config ? 
        `${projectStructure.directories.config}/RULES.md` : '{{RULES_PATH}}',
      'templates/QUICKREF.md': '{{QUICKREF_PATH}}',
      'workflows/examples.md': '{{EXAMPLES_PATH}}',
      'workflows/agent-boundaries.md': '{{BOUNDARIES_PATH}}',
      'workflows/communication-protocol.md': '{{COMMUNICATION_PROTOCOL}}',
      'workflows/quality-gates.md': '{{QUALITY_GATES_PATH}}',
      '../workflows/': '{{WORKFLOWS_PATH}}',
      'templates/workflows/': '{{WORKFLOWS_PATH}}',
      
      // Project structure specific
      'components/': '{{COMPONENTS_DIR}}/',
      'src/components/': '{{COMPONENTS_DIR}}/',
      'lib/': '{{UTILS_DIR}}/',
      'utils/': '{{UTILS_DIR}}/',
      'pages/': '{{FRONTEND_DIR}}/',
      'app/': '{{FRONTEND_DIR}}/'
    };
    
    let resolved = template;
    for (const [staticPath, variable] of Object.entries(pathReplacements)) {
      const regex = new RegExp(this.escapeRegExp(staticPath), 'g');
      resolved = resolved.replace(regex, variable);
    }
    
    return resolved;
  }

  /**
   * Enhanced context enhancement with stack awareness
   * @param {string} template - Base template
   * @param {Object} sessionContext - Session context
   * @param {Object} projectAnalysis - Project analysis
   * @returns {string} Enhanced template
   */
  enhanceWithStackContext(template, sessionContext, projectAnalysis) {
    // Add stack-specific context section if not present
    if (!template.includes('## Tech Stack Context')) {
      const stackContextSection = this.generateStackContextSection(projectAnalysis);
      
      // Insert after main context section or before last section
      const contextIndex = template.indexOf('## Current Context');
      if (contextIndex > 0) {
        const nextSectionIndex = template.indexOf('##', contextIndex + 1);
        if (nextSectionIndex > 0) {
          template = template.slice(0, nextSectionIndex) + 
                    stackContextSection + '\n\n' + 
                    template.slice(nextSectionIndex);
        } else {
          template += '\n\n' + stackContextSection;
        }
      } else {
        // Original context enhancement
        template = this.enhanceWithContext(template, sessionContext);
        template += '\n\n' + stackContextSection;
      }
    }
    
    return template;
  }

  /**
   * Generate stack-specific context section
   * @param {Object} projectAnalysis - Project analysis
   * @returns {string} Stack context section
   */
  generateStackContextSection(projectAnalysis) {
    const techStack = projectAnalysis.techStack;
    const stackProfile = projectAnalysis.stackProfile;
    
    return `## 🏗️ Tech Stack Context
**Stack Profile**: {{STACK_PROFILE}} ({{STACK_CONFIDENCE}} confidence)  
**Primary Language**: {{LANGUAGE_PRIMARY}}  
**Frontend**: {{FRONTEND_FRAMEWORK}} ${techStack.frameworks.frontendVersion || ''}  
**Backend**: {{BACKEND_FRAMEWORK}} ${techStack.frameworks.backendVersion || ''}  
**Database**: {{DATABASE_TYPE}} via {{DATABASE_SERVICE}}  
**Build Tool**: {{BUILD_TOOL}}  
**Testing**: {{TESTING_FRAMEWORK}} + {{E2E_FRAMEWORK}}  

**Project Structure**: {{PROJECT_TYPE}}  
**File Extensions**: {{FILE_EXTENSION}} (primary)  
**Package Manager**: ${this.detectPackageManager(projectAnalysis)}  

**Agent Specialization**: {{AGENT_SPECIALIZATION}}`;
  }

  /**
   * Add stack-aware dynamic sections
   * @param {string} template - Base template
   * @param {string} agentName - Agent name
   * @param {Object} sessionContext - Session context
   * @param {Object} projectAnalysis - Project analysis
   * @returns {string} Template with dynamic sections
   */
  async addStackAwareDynamicSections(template, agentName, sessionContext, projectAnalysis) {
    // Add stack-specific best practices section
    if (!template.includes('## Stack-Specific Patterns')) {
      const patternsSection = await this.generateStackPatternsSection(agentName, projectAnalysis);
      template += '\n\n' + patternsSection;
    }
    
    // Add integration recommendations
    if (!template.includes('## Integration Recommendations')) {
      const integrationSection = this.generateIntegrationRecommendations(agentName, projectAnalysis);
      template += '\n\n' + integrationSection;
    }
    
    // Original dynamic sections
    template = await this.addDynamicSections(template, agentName, sessionContext);
    
    return template;
  }

  /**
   * Generate dynamic path variables based on project structure
   * @returns {Object} Path variables
   */
  generatePathVariables() {
    const baseDir = this.projectPath;
    
    return {
      '{{RULES_PATH}}': this.resolvePath('templates/RULES.md'),
      '{{QUICKREF_PATH}}': this.resolvePath('templates/QUICKREF.md'),
      '{{WORKFLOWS_PATH}}': this.resolvePath('workflows/'),
      '{{EXAMPLES_PATH}}': this.resolvePath('workflows/examples.md'),
      '{{BOUNDARIES_PATH}}': this.resolvePath('workflows/agent-boundaries.md'),
      '{{COMMUNICATION_PROTOCOL}}': this.resolvePath('workflows/communication-protocol.md'),
      '{{QUALITY_GATES_PATH}}': this.resolvePath('workflows/quality-gates.md'),
      '{{TEMPLATE_DIR}}': this.resolvePath('templates/'),
      '{{LIB_DIR}}': this.resolvePath('lib/'),
      '{{PROJECT_ROOT}}': baseDir
    };
  }

  /**
   * Generate agent-specific context variables
   * @param {string} agentName - Agent name
   * @param {Object} sessionContext - Session context
   * @returns {Object} Agent context variables
   */
  async generateAgentContextVariables(agentName, sessionContext) {
    const agentType = this.determineAgentType(agentName);
    const workload = await this.calculateAgentWorkload(agentName, sessionContext);
    const qualityStatus = await this.getQualityStatus(agentName, sessionContext);
    
    return {
      '{{AGENT_TYPE}}': agentType,
      '{{AGENT_WORKLOAD}}': workload,
      '{{AGENT_PRIORITY}}': this.determineAgentPriority(agentName, sessionContext),
      '{{QUALITY_STATUS}}': qualityStatus,
      '{{DEPENDENCIES}}': await this.getAgentDependencies(agentName),
      '{{COORDINATION_MODE}}': this.getCoordinationMode(sessionContext),
      '{{SPECIALIZATION}}': this.getAgentSpecialization(agentName),
      '{{RECOMMENDED_HANDOFFS}}': await this.getRecommendedHandoffs(agentName)
    };
  }

  /**
   * Generate template-specific variables
   * @param {string} agentName - Agent name
   * @param {Object} sessionContext - Session context
   * @returns {Object} Template variables
   */
  async generateTemplateVariables(agentName, sessionContext) {
    return {
      '{{TEMPLATE_VERSION}}': '2.1.0',
      '{{ADAPTATION_TIME}}': new Date().toISOString(),
      '{{CONTEXT_ID}}': sessionContext.session?.id || 'unknown',
      '{{VARIABLE_ENGINE_VERSION}}': '2.1.0',
      '{{MCP_STATUS}}': 'active',
      '{{CACHE_STATUS}}': 'enabled'
    };
  }

  /**
   * Replace static file paths with dynamic variables
   * @param {string} template - Template content
   * @returns {string} Template with resolved paths
   */
  resolveStaticPaths(template) {
    const pathReplacements = {
      'templates/RULES.md': '{{RULES_PATH}}',
      'templates/QUICKREF.md': '{{QUICKREF_PATH}}',
      'workflows/examples.md': '{{EXAMPLES_PATH}}',
      'workflows/agent-boundaries.md': '{{BOUNDARIES_PATH}}',
      'workflows/communication-protocol.md': '{{COMMUNICATION_PROTOCOL}}',
      'workflows/quality-gates.md': '{{QUALITY_GATES_PATH}}',
      '../workflows/': '{{WORKFLOWS_PATH}}',
      'templates/workflows/': '{{WORKFLOWS_PATH}}'
    };
    
    let resolved = template;
    for (const [staticPath, variable] of Object.entries(pathReplacements)) {
      const regex = new RegExp(this.escapeRegExp(staticPath), 'g');
      resolved = resolved.replace(regex, variable);
    }
    
    return resolved;
  }

  /**
   * Enhance template with contextual information
   * @param {string} template - Base template
   * @param {Object} sessionContext - Session context
   * @returns {string} Enhanced template
   */
  enhanceWithContext(template, sessionContext) {
    // Add dynamic context section if not present
    if (!template.includes('## Current Context')) {
      const contextSection = this.generateContextSection(sessionContext);
      
      // Insert before the last section (usually "Example Workflow")
      const lastSectionIndex = template.lastIndexOf('## ');
      if (lastSectionIndex > 0) {
        template = template.slice(0, lastSectionIndex) + 
                  contextSection + '\n\n' + 
                  template.slice(lastSectionIndex);
      } else {
        template += '\n\n' + contextSection;
      }
    }
    
    return template;
  }

  /**
   * Generate dynamic context section
   * @param {Object} sessionContext - Session context
   * @returns {string} Context section content
   */
  generateContextSection(sessionContext) {
    return `## 📊 Current Context
**Session**: {{SESSION_ID}}  
**Memory Status**: {{MEMORY_STATUS}} ({{MEMORY_PRESSURE_LEVEL}})  
**Active Agents**: {{ACTIVE_AGENT_COUNT}}/{{CONCURRENT_LIMIT}}  
**System Health**: {{SYSTEM_HEALTH_STATUS}}  
**Quality Status**: {{QUALITY_STATUS}}  
**Agent Workload**: {{AGENT_WORKLOAD}}  
**Coordination**: {{COORDINATION_MODE}} mode

**Performance**:
- Load Time: {{SECTION_LOAD_TIME}}ms
- Cache Hit Rate: {{CACHE_HIT_RATE}}%
- Optimization Score: {{OPTIMIZATION_SCORE}}/10`;
  }

  /**
   * Apply variable substitution to template
   * @param {string} template - Template content
   * @param {Object} variables - Variables to substitute
   * @returns {string} Template with variables substituted
   */
  applyVariableSubstitution(template, variables) {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(this.escapeRegExp(key), 'g');
      result = result.replace(regex, this.formatVariableValue(value));
    }
    
    return result;
  }

  /**
   * Add dynamic sections to template
   * @param {string} template - Base template
   * @param {string} agentName - Agent name
   * @param {Object} sessionContext - Session context
   * @returns {string} Template with dynamic sections
   */
  async addDynamicSections(template, agentName, sessionContext) {
    // Add performance monitoring section if not present
    if (!template.includes('## Performance Monitoring')) {
      const perfSection = await this.generatePerformanceSection(agentName, sessionContext);
      template += '\n\n' + perfSection;
    }
    
    // Add integration status section
    if (!template.includes('## System Integration')) {
      const integrationSection = this.generateIntegrationSection();
      template += '\n\n' + integrationSection;
    }
    
    return template;
  }

  /**
   * Generate performance monitoring section
   * @param {string} agentName - Agent name
   * @param {Object} sessionContext - Session context
   * @returns {string} Performance section
   */
  async generatePerformanceSection(agentName, sessionContext) {
    return `## 📊 Performance Monitoring
**Template Adaptation**: {{ADAPTATION_TIME}}  
**Variable Engine**: {{VARIABLE_ENGINE_VERSION}}  
**MCP Status**: {{MCP_STATUS}}  
**Cache**: {{CACHE_STATUS}}  

**Real-Time Metrics**:
- Context Generation: <50ms target
- Section Loading: <100ms target  
- Memory Efficiency: {{CONTEXT_USAGE}}%
- Agent Coordination: {{COORDINATION_SUCCESS_RATE}}%`;
  }

  /**
   * Generate integration status section
   * @returns {string} Integration section
   */
  generateIntegrationSection() {
    return `## 🔗 System Integration Status
**CLI Integration**: {{CLI_AVAILABLE}}  
**MCP Protocol**: {{MCP_ENABLED}}  
**Streaming Updates**: {{STREAMING_ENABLED}}  
**Performance Monitor**: {{PERFORMANCE_MONITORING}}  

**Available Commands**:
- \`npx mega-minds variable-status\` - Check variable state
- \`npx mega-minds performance-metrics\` - View performance data
- \`npx mega-minds cache-status\` - Cache statistics`;
  }

  // Helper methods
  async loadAgentTemplate(agentName) {
    return await this.sectionManager.templateLoader.loadAgentTemplate(agentName);
  }

  resolvePath(relativePath) {
    return path.join(this.projectPath, relativePath);
  }

  determineAgentType(agentName) {
    const typeMap = {
      'project-orchestrator': 'coordination',
      'frontend-development': 'implementation',
      'backend-development': 'implementation', 
      'database': 'infrastructure',
      'testing': 'validation',
      'security': 'validation',
      'devops': 'infrastructure'
    };
    
    for (const [key, type] of Object.entries(typeMap)) {
      if (agentName.includes(key)) {
        return type;
      }
    }
    
    return 'specialized';
  }

  async calculateAgentWorkload(agentName, sessionContext) {
    const activeAgents = sessionContext.activeAgents?.count || 0;
    const memoryPressure = sessionContext.memory?.pressure || 'normal';
    
    if (memoryPressure === 'critical') return 'light';
    if (activeAgents >= 2) return 'shared';
    return 'moderate';
  }

  determineAgentPriority(agentName, sessionContext) {
    if (agentName.includes('orchestrator')) return 'high';
    if (agentName.includes('security') || agentName.includes('testing')) return 'high';
    return 'normal';
  }

  async getQualityStatus(agentName, sessionContext) {
    // This would integrate with actual quality gates
    return 'monitoring';
  }

  async getAgentDependencies(agentName) {
    const dependencyMap = {
      'frontend-development-agent': 'backend-development-agent',
      'testing-agent': 'implementation-complete',
      'security-testing-agent': 'testing-agent',
      'deployment-agent': 'all-validation-complete'
    };
    
    return dependencyMap[agentName] || 'none';
  }

  getCoordinationMode(sessionContext) {
    const activeCount = sessionContext.activeAgents?.count || 0;
    return activeCount > 1 ? 'collaborative' : 'focused';
  }

  getAgentSpecialization(agentName) {
    const specializations = {
      'project-orchestrator': 'Multi-agent coordination and project management',
      'frontend-development': 'User interface and client-side development',
      'backend-development': 'Server-side logic and API development',
      'database': 'Data modeling and database optimization',
      'testing': 'Quality assurance and automated testing',
      'security': 'Security analysis and vulnerability assessment'
    };
    
    for (const [key, spec] of Object.entries(specializations)) {
      if (agentName.includes(key)) {
        return spec;
      }
    }
    
    return 'Domain-specific development tasks';
  }

  async getRecommendedHandoffs(agentName) {
    const handoffMap = {
      'project-orchestrator-agent': 'requirements → architecture → implementation',
      'requirements-analysis-agent': 'technical-architecture-agent',
      'frontend-development-agent': 'testing-agent → security-testing-agent',
      'backend-development-agent': 'database-agent → testing-agent',
      'testing-agent': 'security-testing-agent → deployment-agent'
    };
    
    return handoffMap[agentName] || 'project-orchestrator-agent';
  }

  formatVariableValue(value) {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  cacheAdaptedTemplate(key, content) {
    this.adaptationCache.set(key, {
      content: content,
      timestamp: Date.now()
    });
    
    // Cleanup old entries
    if (this.adaptationCache.size > 50) {
      const oldestKey = this.adaptationCache.keys().next().value;
      this.adaptationCache.delete(oldestKey);
    }
  }

  isCacheExpired(cached) {
    return (Date.now() - cached.timestamp) > this.config.cacheTimeout;
  }

  getFallbackTemplate(agentName, sessionContext) {
    return `## ${agentName}

**Status**: Fallback mode - enhanced template unavailable

**Basic Coordination**:
- Use Task tool for all agent interactions
- Follow standard handoff protocols
- Check memory status before activation

**Session Context**: {{SESSION_ID}}
**Memory Status**: {{MEMORY_STATUS}}

*Enhanced template features degraded - using basic functionality*`;
  }

  /**
   * Validate enhanced template
   * @param {string} agentName - Agent name
   * @returns {Object} Validation results
   */
  async validateEnhancedTemplate(agentName) {
    const validation = {
      hasVariables: false,
      hasDynamicSections: false,
      hasPathResolution: false,
      errors: []
    };

    try {
      const template = await this.adaptAgentTemplate(agentName, {
        session: { id: 'validation-test' },
        memory: { pressure: 'normal' },
        activeAgents: { count: 1 }
      });

      validation.hasVariables = template.includes('{{') && template.includes('}}');
      validation.hasDynamicSections = template.includes('## Current Context');
      validation.hasPathResolution = template.includes('{{RULES_PATH}}');
      
    } catch (error) {
      validation.errors.push(`Validation error: ${error.message}`);
    }

    return validation;
  }

  /**
   * Get adaptation statistics
   * @returns {Object} Adapter statistics
   */
  getAdapterStats() {
    return {
      cacheSize: this.adaptationCache.size,
      cacheTimeout: this.config.cacheTimeout,
      pathResolutionEnabled: this.config.enablePathResolution,
      contextEnhancementEnabled: this.config.enableContextEnhancement,
      templateVariableCount: Object.keys(this.templateVariables).length
    };
  }

  // Helper methods for stack-aware functionality
  
  /**
   * Generate dynamic specialization for agent based on tech stack
   * @param {string} agentName - Agent name
   * @param {Object} techStack - Technology stack
   * @returns {string} Dynamic specialization description
   */
  generateDynamicSpecialization(agentName, techStack) {
    const language = techStack.languages[0] || 'JavaScript';
    const frontend = techStack.frameworks.frontend || 'React';
    const backend = techStack.frameworks.backend || 'Express';
    
    const specializationMap = {
      'frontend-development-agent': `${frontend} development with ${language}, modern component patterns and best practices`,
      'backend-development-agent': `${backend} server development with ${language}, API design and business logic`,
      'database-agent': `${techStack.databases[0] || 'PostgreSQL'} database design, optimization and integration`,
      'testing-agent': `${techStack.frameworks.testing || 'Jest'} testing strategies and quality assurance`,
      'project-orchestrator-agent': `Multi-agent coordination for ${frontend}/${backend} stack development`
    };
    
    return specializationMap[agentName] || `${language} development with modern practices and patterns`;
  }

  /**
   * Get frontend patterns for tech stack
   * @param {Object} techStack - Technology stack
   * @returns {string} Frontend patterns description
   */
  getFrontendPatterns(techStack) {
    const frontend = techStack.frameworks.frontend || 'React';
    
    const patternMap = {
      'React': 'Hooks, Context API, component composition, custom hooks',
      'Vue': 'Composition API, composables, reactive patterns, template refs',
      'Angular': 'Services, dependency injection, RxJS, component lifecycle',
      'Svelte': 'Stores, reactivity, component communication, actions'
    };
    
    return patternMap[frontend] || 'Modern component patterns and state management';
  }

  /**
   * Get frontend tools for tech stack
   * @param {Object} techStack - Technology stack  
   * @returns {string} Frontend tools description
   */
  getFrontendTools(techStack) {
    const tools = [];
    
    if (techStack.frameworks.css) tools.push(techStack.frameworks.css);
    if (techStack.frameworks.stateManagement) tools.push(techStack.frameworks.stateManagement);
    if (techStack.frameworks.buildTool) tools.push(techStack.frameworks.buildTool);
    if (techStack.frameworks.testing) tools.push(techStack.frameworks.testing);
    
    return tools.length > 0 ? tools.join(', ') : 'Modern frontend toolchain';
  }

  /**
   * Get backend patterns for tech stack
   * @param {Object} techStack - Technology stack
   * @returns {string} Backend patterns description
   */
  getBackendPatterns(techStack) {
    const backend = techStack.frameworks.backend || 'Express';
    
    const patternMap = {
      'Express': 'Middleware, routing, error handling, async/await patterns',
      'Django': 'Models, views, templates, ORM patterns, middleware',
      'FastAPI': 'Async/await, dependency injection, Pydantic models, automatic docs',
      'Spring Boot': 'Dependency injection, annotations, Spring Data, REST controllers',
      'Next.js': 'API routes, server actions, middleware, edge functions'
    };
    
    return patternMap[backend] || 'Modern server-side architecture patterns';
  }

  /**
   * Get API patterns for tech stack
   * @param {Object} techStack - Technology stack
   * @returns {string} API patterns description
   */
  getApiPatterns(techStack) {
    const backend = techStack.frameworks.backend || 'Express';
    
    if (backend.includes('GraphQL')) return 'GraphQL schemas, resolvers, subscriptions';
    if (backend === 'FastAPI') return 'OpenAPI/Swagger, async endpoints, dependency injection';
    if (backend === 'Django') return 'Django REST Framework, serializers, viewsets';
    
    return 'RESTful APIs, proper HTTP semantics, error handling';
  }

  /**
   * Get testing strategies for tech stack
   * @param {Object} techStack - Technology stack
   * @returns {string} Testing strategies description
   */
  getTestingStrategies(techStack) {
    const testing = techStack.frameworks.testing || 'Jest';
    const e2e = techStack.frameworks.e2e || 'Playwright';
    
    return `${testing} unit testing, ${e2e} E2E testing, test-driven development`;
  }

  /**
   * Get testing tools for tech stack
   * @param {Object} techStack - Technology stack
   * @returns {string} Testing tools description
   */
  getTestingTools(techStack) {
    const tools = [];
    
    if (techStack.frameworks.testing) tools.push(techStack.frameworks.testing);
    if (techStack.frameworks.e2e) tools.push(techStack.frameworks.e2e);
    if (techStack.languages.includes('TypeScript')) tools.push('TypeScript testing utilities');
    
    return tools.length > 0 ? tools.join(', ') : 'Modern testing framework';
  }

  /**
   * Generate stack-specific patterns section
   * @param {string} agentName - Agent name
   * @param {Object} projectAnalysis - Project analysis
   * @returns {string} Stack patterns section
   */
  async generateStackPatternsSection(agentName, projectAnalysis) {
    const techStack = projectAnalysis.techStack;
    const language = techStack.languages[0] || 'JavaScript';
    
    return `## 🏗️ Stack-Specific Patterns & Best Practices

**${language} Best Practices:**
- Follow ${language} coding standards and conventions
- Use modern language features and patterns
- Implement proper error handling and logging

**Framework Patterns:**
{{FRONTEND_PATTERNS}}
{{BACKEND_PATTERNS}}
{{TESTING_STRATEGIES}}

**Architecture Guidelines:**
- Follow {{PROJECT_TYPE}} project structure
- Use {{FILE_EXTENSION}} file extensions consistently
- Organize code in {{COMPONENTS_DIR}}, {{UTILS_DIR}}, {{TESTS_DIR}}

**Performance Considerations:**
- Optimize for {{BUILD_TOOL}} build process
- Follow {{FRONTEND_FRAMEWORK}} performance patterns
- Implement caching strategies appropriate for {{BACKEND_FRAMEWORK}}`;
  }

  /**
   * Generate integration recommendations
   * @param {string} agentName - Agent name
   * @param {Object} projectAnalysis - Project analysis
   * @returns {string} Integration recommendations section
   */
  generateIntegrationRecommendations(agentName, projectAnalysis) {
    const stackProfile = projectAnalysis.stackProfile;
    const techStack = projectAnalysis.techStack;
    
    return `## 🔗 Integration Recommendations

**Recommended Agent Handoffs:**
{{HANDOFF_PATTERN}}

**Stack Integration Points:**
- **Frontend ↔ Backend**: ${this.getIntegrationPattern(techStack)}
- **Database Integration**: Use {{ORM_TOOL}} for data layer
- **Testing Integration**: {{TESTING_FRAMEWORK}} + {{E2E_FRAMEWORK}} pipeline
- **Deployment**: Optimize for {{DEPLOYMENT_TARGET}} platform

**Quality Gates:**
- Maintain {{TEST_COVERAGE_MIN}}% minimum test coverage
- Ensure {{CRITICAL_COVERAGE}}% coverage for business logic
- Follow {{ACCESSIBILITY_LEVEL}} accessibility standards
- Meet performance budget: {{PERFORMANCE_BUDGET}}`;
  }

  /**
   * Get integration pattern for tech stack
   * @param {Object} techStack - Technology stack
   * @returns {string} Integration pattern description
   */
  getIntegrationPattern(techStack) {
    const frontend = techStack.frameworks.frontend;
    const backend = techStack.frameworks.backend;
    
    if (frontend === 'React' && backend === 'Next.js') return 'Next.js API routes with React components';
    if (frontend === 'Vue' && backend === 'Nuxt') return 'Nuxt server API with Vue components';
    if (backend === 'Django') return 'Django REST API with SPA frontend';
    if (backend === 'FastAPI') return 'FastAPI with async endpoints';
    
    return 'RESTful API with modern SPA frontend';
  }

  /**
   * Detect package manager from project analysis
   * @param {Object} projectAnalysis - Project analysis
   * @returns {string} Package manager name
   */
  detectPackageManager(projectAnalysis) {
    // This would check for yarn.lock, pnpm-lock.yaml, etc.
    return 'npm'; // Default fallback
  }

  /**
   * Get fallback analysis for error cases
   * @returns {Object} Fallback analysis
   */
  getFallbackAnalysis() {
    return {
      techStack: {
        languages: ['JavaScript'],
        frameworks: { frontend: 'React', backend: 'Express' },
        databases: ['PostgreSQL'],
        confidence: 'low'
      },
      structure: { type: 'unknown', directories: {} },
      variables: {
        '{{LANGUAGE_PRIMARY}}': 'JavaScript',
        '{{FRONTEND_FRAMEWORK}}': 'React',
        '{{BACKEND_FRAMEWORK}}': 'Express',
        '{{STACK_PROFILE}}': 'Fallback Stack'
      },
      stackProfile: {
        name: 'Fallback Stack',
        variables: {}
      }
    };
  }

  /**
   * Get project context summary for CLI display
   * @returns {Object} Project context summary
   */
  async getProjectSummary() {
    try {
      if (!this.projectAnalysis) {
        this.projectAnalysis = await this.analyzeProjectContext();
      }
      
      return {
        projectName: this.projectAnalysis.metadata?.name,
        stackProfile: this.projectAnalysis.stackProfile?.name || 'Custom Stack',
        primaryLanguage: this.projectAnalysis.techStack.languages[0],
        confidence: this.projectAnalysis.techStack.confidence,
        variableCount: Object.keys(this.projectAnalysis.variables || {}).length,
        lastAnalyzed: this.projectAnalysis.analyzedAt
      };
    } catch (error) {
      return {
        error: error.message,
        status: 'analysis-failed'
      };
    }
  }

  /**
   * Force refresh of project analysis
   * @returns {Object} Fresh project analysis
   */
  async refreshProjectAnalysis() {
    this.projectAnalysis = null;
    this.clearCache();
    return await this.analyzeProjectContext({ forceRefresh: true });
  }

  /**
   * Clear adaptation cache
   */
  clearCache() {
    this.adaptationCache.clear();
    this.sectionManager.clearCache();
    this.projectAnalysis = null; // Clear cached analysis
  }
}

module.exports = { TemplateAdapter };