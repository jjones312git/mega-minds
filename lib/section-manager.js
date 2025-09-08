/**
 * Agent Section Manager for Mega-Minds Variable-Driven Agent System
 * Handles template loading and section-specific content generation
 */

const fs = require('fs').promises;
const path = require('path');

class TemplateLoader {
  constructor(templatePath) {
    this.templatePath = templatePath;
    this.templateCache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
  }

  /**
   * Load and cache template content
   * @param {string} templateName - Template file name
   * @returns {string} Template content
   */
  async loadTemplate(templateName) {
    const cacheKey = templateName;
    
    // Check cache first
    if (this.templateCache.has(cacheKey)) {
      const cached = this.templateCache.get(cacheKey);
      if (!this.isCacheExpired(cached)) {
        return cached.content;
      }
    }

    try {
      const filePath = path.join(this.templatePath, templateName);
      const content = await fs.readFile(filePath, 'utf8');
      
      // Cache the content
      this.templateCache.set(cacheKey, {
        content: content,
        timestamp: Date.now()
      });
      
      return content;
    } catch (error) {
      console.error(`Failed to load template ${templateName}:`, error.message);
      throw new Error(`Template ${templateName} not found or unreadable`);
    }
  }

  /**
   * Load Claude.md template
   * @returns {string} Claude.md template content
   */
  async loadClaudeTemplate() {
    return await this.loadTemplate('claude.md');
  }

  /**
   * Load specific agent template
   * @param {string} agentName - Agent name
   * @returns {string} Agent template content
   */
  async loadAgentTemplate(agentName) {
    const templateName = `${agentName}.md`;
    
    try {
      // First try direct load from templates root
      return await this.loadTemplate(templateName);
    } catch (error) {
      // Search in subdirectories
      try {
        const templatePath = await this.findTemplateInSubdirectories(templateName);
        if (templatePath) {
          const content = await fs.readFile(templatePath, 'utf8');
          // Cache the content
          this.templateCache.set(templateName, {
            content: content,
            timestamp: Date.now()
          });
          return content;
        }
      } catch (subdirError) {
        // Continue to fallback
      }
      
      // Fallback to generic agent template
      console.warn(`Agent-specific template not found for ${agentName}, using generic template`);
      try {
        return await this.loadTemplate('generic-agent.md');
      } catch (genericError) {
        // Return a basic fallback template
        return this.createFallbackTemplate(agentName);
      }
    }
  }

  /**
   * Load sections from agent template
   * @param {string} agentName - Agent name
   * @param {Array} sectionList - List of sections to load
   * @param {Object} variables - Variables for substitution
   * @returns {string} Combined section content
   */
  async loadSections(agentName, sectionList, variables = {}) {
    if (sectionList.includes('all-sections')) {
      // Load entire agent template
      const template = await this.loadAgentTemplate(agentName);
      return this.substituteVariables(template, variables);
    }

    // Load specific sections
    const template = await this.loadAgentTemplate(agentName);
    const sections = this.extractSections(template, sectionList);
    return this.substituteVariables(sections, variables);
  }

  /**
   * Extract specific sections from template
   * @param {string} template - Full template content
   * @param {Array} sectionList - Sections to extract
   * @returns {string} Extracted sections
   */
  extractSections(template, sectionList) {
    const sectionMap = {
      'handoff-protocol': this.extractSection(template, '## Handoff Protocol', '##'),
      'proactive-triggers': this.extractSection(template, '## Proactive Usage Triggers', '##'),
      'core-expertise': this.extractSection(template, '## Primary Responsibilities', '##'),
      'technical-patterns': this.extractSection(template, '## Technical Patterns', '##'),
      'role-boundaries': this.extractSection(template, '## Role Boundaries', '##'),
      'quality-gates': this.extractSection(template, '## Quality Gates', '##')
    };

    let extractedContent = '';
    for (const section of sectionList) {
      if (sectionMap[section]) {
        extractedContent += sectionMap[section] + '\n\n';
      }
    }

    return extractedContent.trim() || template; // Return full template if no sections found
  }

  /**
   * Extract a specific section from markdown content
   * @param {string} content - Full content
   * @param {string} startMarker - Section start marker
   * @param {string} endMarker - Section end marker
   * @returns {string} Extracted section
   */
  extractSection(content, startMarker, endMarker) {
    const lines = content.split('\n');
    let inSection = false;
    let sectionContent = [];
    
    for (const line of lines) {
      if (line.startsWith(startMarker)) {
        inSection = true;
        sectionContent.push(line);
        continue;
      }
      
      if (inSection) {
        if (line.startsWith(endMarker) && line !== startMarker) {
          break; // End of section
        }
        sectionContent.push(line);
      }
    }
    
    return sectionContent.join('\n');
  }

  /**
   * Substitute variables in template content
   * @param {string} content - Template content
   * @param {Object} variables - Variables to substitute
   * @returns {string} Content with variables substituted
   */
  substituteVariables(content, variables) {
    let result = content;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(this.escapeRegExp(key), 'g');
      result = result.replace(regex, this.formatValue(value));
    }
    
    return result;
  }

  /**
   * Escape special regex characters
   * @param {string} string - String to escape
   * @returns {string} Escaped string
   */
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Format variable value for substitution
   * @param {*} value - Value to format
   * @returns {string} Formatted value
   */
  formatValue(value) {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value || '');
  }

  /**
   * Check if cached item is expired
   * @param {Object} cached - Cached item
   * @returns {boolean} True if expired
   */
  isCacheExpired(cached) {
    return (Date.now() - cached.timestamp) > this.cacheTimeout;
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.templateCache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.templateCache.size,
      maxAge: this.cacheTimeout,
      entries: Array.from(this.templateCache.keys())
    };
  }

  /**
   * Find template file in subdirectories
   * @param {string} templateName - Template filename to find
   * @returns {string|null} Full path to template or null if not found
   */
  async findTemplateInSubdirectories(templateName) {
    const subdirs = ['planning', 'development', 'devops', 'businessops', 'maintenance', 'prototyping', 'qa', 'saas'];
    
    for (const subdir of subdirs) {
      const fullPath = path.join(this.templatePath, subdir, templateName);
      try {
        await fs.access(fullPath);
        return fullPath;
      } catch {
        continue;
      }
    }
    return null;
  }

  /**
   * Create a basic fallback template when no template is found
   * @param {string} agentName - Agent name
   * @returns {string} Basic template content
   */
  createFallbackTemplate(agentName) {
    return `---
name: ${agentName}
description: Fallback template for ${agentName}
tools: Bash, Edit, Read, Write
color: gray
---

# ${agentName.charAt(0).toUpperCase() + agentName.slice(1)} Agent

This is a fallback template for ${agentName}. The specific template file could not be found.

## Capabilities
- Basic file operations
- Task coordination
- Variable substitution

## Variables Available
{{PROJECT_NAME}}: {{PROJECT_NAME}}
{{TECH_STACK}}: {{TECH_STACK}}
{{CURRENT_PHASE}}: {{CURRENT_PHASE}}
`;
  }
}

class AgentSectionManager {
  constructor(templatePath, variableEngine) {
    this.templatePath = templatePath;
    this.variableEngine = variableEngine;
    this.sectionCache = new Map();
    
    // Default template paths - prefer templates subdirectory
    this.paths = {
      templates: path.join(templatePath, 'templates'),
      agents: path.join(templatePath, 'templates'),
      workflows: path.join(templatePath, 'workflows')
    };
    
    // Initialize template loader with correct template path
    this.templateLoader = new TemplateLoader(this.paths.templates);
  }

  /**
   * Load specific agent template sections with variable injection
   * @param {string} agentName - Agent name
   * @param {string} sectionType - Section type to load
   * @param {Object} context - Session context
   * @returns {string} Rendered section content
   */
  async loadAgentSection(agentName, sectionType, context) {
    const cacheKey = `${agentName}_${sectionType}_${context.session?.id}`;
    
    // Check cache first
    if (this.sectionCache.has(cacheKey)) {
      const cached = this.sectionCache.get(cacheKey);
      if (!this.isSectionCacheExpired(cached)) {
        return cached.content;
      }
    }

    try {
      // Section type mapping
      const sections = {
        'coordination': ['handoff-protocol', 'proactive-triggers'],
        'expertise': ['core-expertise', 'technical-patterns'], 
        'boundaries': ['role-boundaries', 'quality-gates'],
        'full': ['all-sections']
      };
      
      const sectionList = sections[sectionType] || ['all-sections'];
      
      // Generate variables if we have a variable engine
      let variables = {};
      if (this.variableEngine) {
        variables = await this.variableEngine.generateSectionVariables(sectionType, context);
      }
      
      // Load sections with variable injection
      const content = await this.templateLoader.loadSections(agentName, sectionList, variables);
      
      // Cache the result
      this.sectionCache.set(cacheKey, {
        content: content,
        timestamp: Date.now()
      });
      
      return content;
    } catch (error) {
      console.error(`Failed to load agent section for ${agentName}:`, error.message);
      
      // Return fallback content
      return this.getFallbackAgentSection(agentName, sectionType);
    }
  }

  /**
   * Parse claude.md template and inject variables
   * @param {Object} variables - Variables to inject
   * @returns {string} Rendered claude.md content
   */
  async renderClaudeTemplate(variables) {
    try {
      const template = await this.templateLoader.loadClaudeTemplate();
      return this.injectVariables(template, variables);
    } catch (error) {
      console.error('Failed to render Claude template:', error.message);
      return this.getFallbackClaudeContent(variables);
    }
  }

  /**
   * Perform variable substitution in template content
   * @param {string} template - Template content
   * @param {Object} variables - Variables to substitute
   * @returns {string} Rendered content with variables substituted
   */
  injectVariables(template, variables) {
    let rendered = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
      rendered = rendered.replace(regex, this.formatVariableValue(value));
    }
    
    return rendered;
  }

  /**
   * Format variable value for template injection
   * @param {*} value - Value to format
   * @returns {string} Formatted value
   */
  formatVariableValue(value) {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    if (typeof value === 'object') {
      // For complex objects, stringify with formatting
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  }

  /**
   * Get fallback agent section when loading fails
   * @param {string} agentName - Agent name
   * @param {string} sectionType - Section type
   * @returns {string} Fallback content
   */
  getFallbackAgentSection(agentName, sectionType) {
    const fallbackSections = {
      coordination: `## ${agentName} Coordination\n\nUse Task tool for all agent interactions.\n\nHandoff Protocol: Standard agent coordination via Task tool.`,
      expertise: `## ${agentName} Expertise\n\nSpecialized agent for specific domain tasks.\n\nCore responsibilities defined by agent type.`,
      boundaries: `## ${agentName} Boundaries\n\nRole boundaries: Operate within defined scope.\n\nQuality gates: Follow standard validation procedures.`,
      full: `## ${agentName}\n\nGeneral-purpose agent with standard capabilities.\n\nUse Task tool for coordination.\nFollow quality gates and boundaries.`
    };

    return fallbackSections[sectionType] || fallbackSections.full;
  }

  /**
   * Get fallback Claude.md content when template loading fails
   * @param {Object} variables - Available variables
   * @returns {string} Fallback Claude.md content
   */
  getFallbackClaudeContent(variables) {
    const projectName = variables['{{PROJECT_NAME}}'] || 'Mega-Minds AI Development System';
    const sessionId = variables['{{SESSION_ID}}'] || 'unknown';
    
    return `# ${projectName}
    
## 🎯 Mission
Intelligent AI agent coordination for accelerated software development

## 🚀 Quick Start
- **Always start**: \`@project-orchestrator-agent\` via Task tool
- **Check memory**: \`npx mega-minds memory-status\` before agent activation
- **Need help**: See templates/QUICKREF.md for commands

## ⚠️ CRITICAL RULES
- **Maximum 2 concurrent agents** (memory safety protocol)
- **ALL agents via Task tool** (no direct invocation permitted)  
- **Quality gates mandatory**
- **Save between phases**: \`npx mega-minds save-session "description"\`

## 📊 Current Session
- **Session ID**: ${sessionId}
- **Status**: Fallback mode - template system degraded

---
*Mega-minds fallback mode active*`;
  }

  /**
   * Check if section cache is expired
   * @param {Object} cached - Cached item
   * @returns {boolean} True if expired
   */
  isSectionCacheExpired(cached) {
    return (Date.now() - cached.timestamp) > 30000; // 30 second cache
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.sectionCache.clear();
    this.templateLoader.clearCache();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      sectionCache: {
        size: this.sectionCache.size,
        entries: Array.from(this.sectionCache.keys())
      },
      templateCache: this.templateLoader.getCacheStats()
    };
  }

  /**
   * Validate template structure
   * @param {string} agentName - Agent to validate
   * @returns {Object} Validation results
   */
  async validateAgentTemplate(agentName) {
    const validation = {
      exists: false,
      sections: {
        handoffProtocol: false,
        proactiveTriggers: false,
        coreExpertise: false,
        roleBoundaries: false
      },
      errors: []
    };

    try {
      const template = await this.templateLoader.loadAgentTemplate(agentName);
      validation.exists = true;

      // Check for required sections
      validation.sections.handoffProtocol = template.includes('## Handoff Protocol');
      validation.sections.proactiveTriggers = template.includes('## Proactive Usage Triggers');
      validation.sections.coreExpertise = template.includes('## Primary Responsibilities');
      validation.sections.roleBoundaries = template.includes('## Role Boundaries');

    } catch (error) {
      validation.errors.push(`Template not found: ${error.message}`);
    }

    return validation;
  }

  /**
   * List available agent templates
   * @returns {Array} List of available agent names
   */
  async listAvailableAgents() {
    try {
      const files = await fs.readdir(this.paths.agents);
      return files
        .filter(file => file.endsWith('-agent.md'))
        .map(file => file.replace('.md', ''));
    } catch (error) {
      console.error('Failed to list agent templates:', error.message);
      return [];
    }
  }

  /**
   * Get section manager statistics
   * @returns {Object} Manager statistics
   */
  getStats() {
    return {
      cacheStats: this.getCacheStats(),
      templatePath: this.templatePath,
      hasVariableEngine: !!this.variableEngine
    };
  }
}

module.exports = { AgentSectionManager, TemplateLoader };