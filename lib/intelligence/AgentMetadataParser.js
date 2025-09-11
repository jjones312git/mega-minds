// lib/intelligence/AgentMetadataParser.js
// Parses agent template files to extract metadata and capabilities
// Implements NLP-like keyword extraction and capability inference

const fs = require('fs-extra');
const path = require('path');

/**
 * Parses agent template markdown files to extract:
 * - YAML frontmatter (name, description, tools)
 * - Keywords from description using pattern matching
 * - Capabilities derived from description and examples
 * - Expertise areas inferred from content analysis
 */
class AgentMetadataParser {
    constructor() {
        // Common technical keywords for capability detection
        this.technicalTerms = new Set([
            'react', 'vue', 'angular', 'nodejs', 'python', 'java', 'typescript', 'javascript',
            'html', 'css', 'sass', 'less', 'webpack', 'vite', 'rollup', 'babel',
            'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'sql',
            'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ansible',
            'jest', 'cypress', 'playwright', 'mocha', 'junit', 'selenium',
            'git', 'jenkins', 'gitlab', 'github', 'circleci', 'travis',
            'api', 'rest', 'graphql', 'grpc', 'websocket', 'oauth', 'jwt',
            'nginx', 'apache', 'redis', 'memcached', 'elasticsearch', 'kafka'
        ]);

        // Action verbs that indicate capabilities
        this.actionVerbs = new Set([
            'create', 'build', 'develop', 'implement', 'design', 'architect', 'deploy',
            'test', 'analyze', 'monitor', 'optimize', 'secure', 'authenticate',
            'validate', 'verify', 'review', 'manage', 'coordinate', 'orchestrate',
            'integrate', 'configure', 'setup', 'maintain', 'troubleshoot', 'debug'
        ]);

        // Domain-specific terms
        this.domainTerms = new Set([
            'frontend', 'backend', 'fullstack', 'database', 'devops', 'security',
            'testing', 'qa', 'ui', 'ux', 'mobile', 'web', 'api', 'microservice',
            'infrastructure', 'cloud', 'monitoring', 'analytics', 'machine-learning',
            'ai', 'blockchain', 'iot', 'real-time', 'distributed', 'scalable'
        ]);
    }

    /**
     * Parse an agent template file
     * @param {string} filePath - Path to the agent template file
     * @returns {Object} Parsed agent data
     */
    async parseAgentTemplate(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const metadata = this.extractYamlFrontmatter(content);
            
            if (!metadata.name) {
                throw new Error('Agent name not found in frontmatter');
            }

            // Extract and process capabilities
            const description = metadata.description || '';
            const keywords = this.extractKeywords(description, content);
            const capabilities = this.extractCapabilities(description, content);
            const expertiseAreas = this.extractExpertiseAreas(description, content);
            const conflictPrevention = this.detectConflictPrevention(metadata.name, description);

            // Ensure agent name includes -agent suffix for consistency
            const agentName = metadata.name.endsWith('-agent') ? metadata.name : metadata.name + '-agent';
            
            return {
                name: agentName,
                description: this.cleanDescription(description),
                keywords: Array.from(keywords),
                capabilities: Array.from(capabilities),
                expertiseAreas: Array.from(expertiseAreas),
                conflictPrevention: conflictPrevention,
                tools: metadata.tools ? metadata.tools.split(', ').map(t => t.trim()) : [],
                color: metadata.color || 'blue',
                priority: this.inferPriority(metadata.name, description),
                examples: this.extractExamples(content)
            };

        } catch (error) {
            throw new Error(`Failed to parse agent template ${filePath}: ${error.message}`);
        }
    }

    /**
     * Extract YAML frontmatter from markdown content
     * @param {string} content - Full markdown content
     * @returns {Object} Parsed frontmatter
     */
    extractYamlFrontmatter(content) {
        const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
        if (!yamlMatch) {
            throw new Error('No YAML frontmatter found');
        }

        const yamlContent = yamlMatch[1];
        const metadata = {};

        // Simple YAML parser for our specific use case
        const lines = yamlContent.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const colonIndex = trimmed.indexOf(':');
                if (colonIndex > 0) {
                    const key = trimmed.substring(0, colonIndex).trim();
                    const value = trimmed.substring(colonIndex + 1).trim();
                    metadata[key] = value;
                }
            }
        }

        return metadata;
    }

    /**
     * Extract keywords from description using pattern matching
     * @param {string} description - Agent description
     * @param {string} content - Full content for context
     * @returns {Set} Set of keywords
     */
    extractKeywords(description, content) {
        const keywords = new Set();
        const text = (description + ' ' + content).toLowerCase();
        
        // Extract technical terms
        for (const term of this.technicalTerms) {
            if (text.includes(term)) {
                keywords.add(term);
            }
        }

        // Extract action verbs
        for (const verb of this.actionVerbs) {
            if (text.includes(verb)) {
                keywords.add(verb);
            }
        }

        // Extract domain terms
        for (const domain of this.domainTerms) {
            if (text.includes(domain)) {
                keywords.add(domain);
            }
        }

        // Extract custom keywords from patterns
        this.extractPatternKeywords(text, keywords);
        
        return keywords;
    }

    /**
     * Extract pattern-based keywords
     * @param {string} text - Text to analyze
     * @param {Set} keywords - Keywords set to add to
     */
    extractPatternKeywords(text, keywords) {
        // Extract quoted technical terms
        const quotedTerms = text.match(/"([^"]+)"/g);
        if (quotedTerms) {
            quotedTerms.forEach(quoted => {
                const term = quoted.replace(/"/g, '').toLowerCase();
                if (term.length > 2 && term.length < 20) {
                    keywords.add(term);
                }
            });
        }

        // Extract compound terms with hyphens
        const hyphenatedTerms = text.match(/\b[a-z]+-[a-z]+(-[a-z]+)?\b/g);
        if (hyphenatedTerms) {
            hyphenatedTerms.forEach(term => keywords.add(term));
        }

        // Extract file extensions and formats
        const extensions = text.match(/\.(js|ts|jsx|tsx|py|java|go|rs|php|rb|cs|cpp|c|h)\b/g);
        if (extensions) {
            extensions.forEach(ext => keywords.add(ext.substring(1)));
        }

        // Extract framework patterns
        const frameworkPatterns = [
            /\b(react|vue|angular|svelte|next|nuxt|express|fastify|django|flask|spring|rails)\b/g
        ];
        
        frameworkPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => keywords.add(match));
            }
        });
    }

    /**
     * Extract capabilities from description and content
     * @param {string} description - Agent description
     * @param {string} content - Full content
     * @returns {Set} Set of capabilities
     */
    extractCapabilities(description, content) {
        const capabilities = new Set();
        const text = (description + ' ' + content).toLowerCase();

        // Map keywords to capabilities
        const capabilityMappings = {
            'react': 'react-development',
            'vue': 'vue-development', 
            'angular': 'angular-development',
            'node': 'nodejs-development',
            'python': 'python-development',
            'api': 'api-development',
            'database': 'database-management',
            'test': 'testing-automation',
            'deploy': 'deployment-automation',
            'monitor': 'system-monitoring',
            'security': 'security-analysis',
            'ui': 'user-interface-design',
            'ux': 'user-experience-design',
            'devops': 'devops-automation',
            'ci': 'continuous-integration',
            'cd': 'continuous-deployment',
            'docker': 'containerization',
            'kubernetes': 'container-orchestration',
            'aws': 'cloud-infrastructure',
            'performance': 'performance-optimization',
            'authentication': 'authentication-systems',
            'authorization': 'authorization-systems'
        };

        // Add capabilities based on keywords
        for (const [keyword, capability] of Object.entries(capabilityMappings)) {
            if (text.includes(keyword)) {
                capabilities.add(capability);
            }
        }

        // Infer capabilities from agent name
        this.inferCapabilitiesFromName(description, capabilities);

        return capabilities;
    }

    /**
     * Infer capabilities from agent name and description patterns
     * @param {string} description - Agent description
     * @param {Set} capabilities - Capabilities set to add to
     */
    inferCapabilitiesFromName(description, capabilities) {
        const text = description.toLowerCase();

        if (text.includes('frontend') || text.includes('ui')) {
            capabilities.add('frontend-development');
            capabilities.add('user-interface-design');
        }
        
        if (text.includes('backend') || text.includes('server')) {
            capabilities.add('backend-development');
            capabilities.add('server-architecture');
        }
        
        if (text.includes('test') || text.includes('qa')) {
            capabilities.add('testing-strategies');
            capabilities.add('quality-assurance');
        }
        
        if (text.includes('deploy') || text.includes('devops')) {
            capabilities.add('deployment-automation');
            capabilities.add('infrastructure-management');
        }
    }

    /**
     * Extract expertise areas from content analysis
     * @param {string} description - Agent description
     * @param {string} content - Full content
     * @returns {Set} Set of expertise areas
     */
    extractExpertiseAreas(description, content) {
        const expertiseAreas = new Set();
        const text = (description + ' ' + content).toLowerCase();

        // Define expertise patterns
        const expertisePatterns = {
            'project-management': ['coordinate', 'manage', 'orchestrate', 'plan', 'organize'],
            'frontend-architecture': ['component', 'responsive', 'user interface', 'react', 'vue'],
            'backend-architecture': ['api', 'server', 'database', 'microservice', 'rest'],
            'testing-strategy': ['test', 'qa', 'quality', 'verify', 'validate'],
            'security-auditing': ['security', 'vulnerability', 'audit', 'secure', 'encryption'],
            'performance-analysis': ['performance', 'optimize', 'monitor', 'metrics', 'profiling'],
            'infrastructure-management': ['infrastructure', 'deploy', 'cloud', 'devops', 'automation'],
            'user-experience': ['ux', 'user experience', 'usability', 'design', 'interface'],
            'data-management': ['database', 'data', 'storage', 'query', 'schema'],
            'system-monitoring': ['monitor', 'logging', 'observability', 'metrics', 'alerting']
        };

        // Match patterns to expertise areas
        for (const [area, patterns] of Object.entries(expertisePatterns)) {
            if (patterns.some(pattern => text.includes(pattern))) {
                expertiseAreas.add(area);
            }
        }

        return expertiseAreas;
    }

    /**
     * Detect conflict prevention based on agent type
     * @param {string} name - Agent name
     * @param {string} description - Agent description
     * @returns {Array} Array of conflicting agents
     */
    detectConflictPrevention(name, description) {
        const conflicts = [];
        const text = description.toLowerCase();

        // Define conflict rules
        if (text.includes('frontend') || text.includes('ui')) {
            conflicts.push('backend-development-agent');
        }
        
        if (text.includes('backend') || text.includes('server')) {
            conflicts.push('frontend-development-agent');
        }
        
        if (text.includes('testing') && text.includes('monitor')) {
            // Testing and monitoring can conflict in scope
        }

        return conflicts;
    }

    /**
     * Infer agent priority based on name and description
     * @param {string} name - Agent name
     * @param {string} description - Agent description
     * @returns {number} Priority (1-5, lower is higher priority)
     */
    inferPriority(name, description) {
        const text = (name + ' ' + description).toLowerCase();

        if (text.includes('orchestrator') || text.includes('coordinator')) {
            return 1; // Highest priority
        } else if (text.includes('frontend') || text.includes('backend')) {
            return 2; // High priority for core development
        } else if (text.includes('test') || text.includes('security')) {
            return 3; // Medium-high priority for quality
        } else if (text.includes('deploy') || text.includes('monitor')) {
            return 4; // Medium priority for operations
        } else {
            return 5; // Lower priority for specialized tasks
        }
    }

    /**
     * Extract example use cases from content
     * @param {string} content - Full content
     * @returns {Array} Array of examples
     */
    extractExamples(content) {
        const examples = [];
        
        // Extract examples from markdown patterns
        const exampleMatches = content.match(/(?:Examples?:|Example\s+use\s+cases?:)([\s\S]*?)(?=\n##|\n---|\ntools:|$)/gi);
        
        if (exampleMatches) {
            exampleMatches.forEach(match => {
                const lines = match.split('\n');
                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                        examples.push(trimmed.substring(1).trim());
                    }
                });
            });
        }

        return examples.slice(0, 5); // Limit to 5 examples
    }

    /**
     * Clean description text for better processing
     * @param {string} description - Raw description
     * @returns {string} Cleaned description
     */
    cleanDescription(description) {
        return description
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 500); // Limit length for performance
    }
}

module.exports = AgentMetadataParser;