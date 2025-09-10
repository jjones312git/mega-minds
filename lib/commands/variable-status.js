// lib/commands/variable-status.js
// Command: npx mega-minds variable-status
// Purpose: Display current Variable System status and values

const { ContextualVariableEngine } = require('../variable-engine');
const { TemplateAdapter } = require('../template-adapter');
const { PerformanceMonitor } = require('../performance-monitor');

/**
 * Shows comprehensive Variable System status
 * Displays current variables, performance metrics, and system health
 */
class VariableStatusCommand {
    constructor() {
        this.projectPath = process.cwd();
    }

    /**
     * Main execution function for variable status display
     * @param {Array} args - Command arguments
     * @returns {Promise<void>}
     */
    async run(args = []) {
        try {
            const showDetailed = args.includes('--detailed') || args.includes('-d');
            const showPerformance = args.includes('--performance') || args.includes('-p');
            const filterAgent = this.getArgValue(args, '--agent') || this.getArgValue(args, '-a');

            console.log('🔍 Variable System Status\n');

            // Initialize components
            const variableEngine = new ContextualVariableEngine(this.projectPath);
            const templateAdapter = new TemplateAdapter(this.projectPath);
            const performanceMonitor = new PerformanceMonitor();

            // Create mock session context for demonstration
            const mockContext = await this.createMockContext();

            // Generate and display variables
            await this.showVariableStatus(variableEngine, mockContext, showDetailed, filterAgent);

            // Show template adapter status
            await this.showTemplateAdapterStatus(templateAdapter, showDetailed);

            // Show performance metrics if requested
            if (showPerformance) {
                await this.showPerformanceMetrics(performanceMonitor);
            }

            // Show system integration status
            await this.showSystemIntegration();

            console.log('\n📋 Available Commands:');
            console.log('  npx mega-minds variable-status --detailed    # Detailed variable info');
            console.log('  npx mega-minds variable-status --performance # Include performance metrics');
            console.log('  npx mega-minds variable-status --agent NAME  # Filter for specific agent');
            console.log('  npx mega-minds performance-metrics          # Detailed performance data');
            console.log('  npx mega-minds cache-status                 # Cache statistics');

        } catch (error) {
            console.error('❌ Failed to get variable status:', error.message);
            console.log('\n💡 Try running: npx mega-minds variable-status --help');
            process.exit(1);
        }
    }

    /**
     * Display variable status information
     */
    async showVariableStatus(variableEngine, context, detailed, filterAgent) {
        console.log('📊 Variable Engine Status:');
        
        try {
            const agentName = filterAgent || 'project-orchestrator-agent';
            const variables = await variableEngine.generateVariables(agentName, 'full', context);
            
            console.log(`   Agent Context: ${agentName}`);
            console.log(`   Variables Generated: ${Object.keys(variables).length}`);
            console.log('');

            // Core variables
            console.log('🎯 Core Variables:');
            const coreVars = {
                'PROJECT_NAME': variables['{{PROJECT_NAME}}'],
                'SESSION_ID': variables['{{SESSION_ID}}'],
                'MEMORY_STATUS': variables['{{MEMORY_STATUS}}'],
                'ACTIVE_AGENT_COUNT': variables['{{ACTIVE_AGENT_COUNT}}'],
                'SYSTEM_HEALTH_STATUS': variables['{{SYSTEM_HEALTH_STATUS}}']
            };

            for (const [key, value] of Object.entries(coreVars)) {
                const status = this.getVariableStatus(value);
                console.log(`   ${key}: ${value} ${status}`);
            }

            // Performance variables
            console.log('\n⚡ Performance Variables:');
            const perfVars = {
                'OPTIMIZATION_SCORE': variables['{{OPTIMIZATION_SCORE}}'],
                'SECTION_LOAD_TIME': variables['{{SECTION_LOAD_TIME}}'],
                'CACHE_HIT_RATE': variables['{{CACHE_HIT_RATE}}'],
                'CONTEXT_USAGE': variables['{{CONTEXT_USAGE}}']
            };

            for (const [key, value] of Object.entries(perfVars)) {
                const status = this.getPerformanceStatus(key, value);
                console.log(`   ${key}: ${value} ${status}`);
            }

            // Show all variables if detailed
            if (detailed) {
                console.log('\n📋 All Variables:');
                const sortedVars = Object.keys(variables).sort();
                for (const key of sortedVars) {
                    const value = variables[key];
                    const truncated = this.truncateValue(value, 50);
                    console.log(`   ${key}: ${truncated}`);
                }
            }

        } catch (error) {
            console.log('   ❌ Error generating variables:', error.message);
        }
    }

    /**
     * Display template adapter status
     */
    async showTemplateAdapterStatus(templateAdapter, detailed) {
        console.log('\n🔗 Template Adapter Status:');
        
        try {
            const stats = templateAdapter.getAdapterStats();
            
            console.log(`   Cache Size: ${stats.cacheSize} templates`);
            console.log(`   Path Resolution: ${stats.pathResolutionEnabled ? '✅ Enabled' : '❌ Disabled'}`);
            console.log(`   Context Enhancement: ${stats.contextEnhancementEnabled ? '✅ Enabled' : '❌ Disabled'}`);
            console.log(`   Template Variables: ${stats.templateVariableCount} available`);

            if (detailed) {
                console.log(`   Cache Timeout: ${stats.cacheTimeout}ms`);
                
                // Test template adaptation
                console.log('\n🧪 Template Adaptation Test:');
                const validation = await templateAdapter.validateEnhancedTemplate('project-orchestrator-agent');
                console.log(`   Variables: ${validation.hasVariables ? '✅ Working' : '❌ Failed'}`);
                console.log(`   Dynamic Sections: ${validation.hasDynamicSections ? '✅ Working' : '❌ Failed'}`);
                console.log(`   Path Resolution: ${validation.hasPathResolution ? '✅ Working' : '❌ Failed'}`);
                
                if (validation.errors.length > 0) {
                    console.log('   Errors:');
                    validation.errors.forEach(error => console.log(`     - ${error}`));
                }
            }

        } catch (error) {
            console.log('   ❌ Error getting adapter status:', error.message);
        }
    }

    /**
     * Display performance metrics
     */
    async showPerformanceMetrics(performanceMonitor) {
        console.log('\n📈 Performance Metrics:');
        
        try {
            const metrics = performanceMonitor.getCurrentMetrics();
            
            console.log(`   Average Load Time: ${metrics.averageLoadTime.toFixed(2)}ms`);
            console.log(`   Cache Hit Rate: ${metrics.cacheHitRate.toFixed(1)}%`);
            console.log(`   Operations Completed: ${metrics.operationsCompleted}`);
            console.log(`   Error Rate: ${metrics.errorRate.toFixed(2)}%`);
            console.log(`   Optimization Score: ${metrics.optimizationScore}/10`);
            
            // Performance status
            const loadTimeStatus = metrics.averageLoadTime < 100 ? '✅ Good' : '⚠️ Slow';
            const cacheStatus = metrics.cacheHitRate > 80 ? '✅ Good' : '⚠️ Poor';
            const errorStatus = metrics.errorRate < 5 ? '✅ Good' : '❌ High';
            
            console.log(`   Performance Status: Load ${loadTimeStatus}, Cache ${cacheStatus}, Errors ${errorStatus}`);

        } catch (error) {
            console.log('   ❌ Error getting performance metrics:', error.message);
        }
    }

    /**
     * Display system integration status
     */
    async showSystemIntegration() {
        console.log('\n🔧 System Integration:');
        
        try {
            // Check for MCP integration
            const mcpExists = require('fs').existsSync(require('path').join(this.projectPath, 'lib/mcp-server-integration.js'));
            console.log(`   MCP Server: ${mcpExists ? '✅ Available' : '❌ Missing'}`);
            
            // Check for streaming updates
            const streamingExists = require('fs').existsSync(require('path').join(this.projectPath, 'lib/streaming-update-manager.js'));
            console.log(`   Streaming Updates: ${streamingExists ? '✅ Available' : '❌ Missing'}`);
            
            // Check for A/B testing
            const abTestingExists = require('fs').existsSync(require('path').join(this.projectPath, 'lib/ab-testing-framework.js'));
            console.log(`   A/B Testing: ${abTestingExists ? '✅ Available' : '❌ Missing'}`);
            
            // Check for template files
            const templatesExist = require('fs').existsSync(require('path').join(this.projectPath, 'templates/claude.md'));
            console.log(`   Template System: ${templatesExist ? '✅ Available' : '❌ Missing'}`);
            
            console.log(`   Variable Engine: ✅ Active`);
            console.log(`   Template Adapter: ✅ Active`);

        } catch (error) {
            console.log('   ❌ Error checking system integration:', error.message);
        }
    }

    // Helper methods
    async createMockContext() {
        return {
            session: {
                id: `session-${Date.now()}`,
                startTime: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development'
            },
            memory: {
                current: 1500,
                limit: 3500,
                pressure: 'normal',
                efficiency: 92
            },
            activeAgents: {
                active: ['project-orchestrator-agent'],
                count: 1,
                limit: 2,
                coordinationSuccess: 97
            },
            project: {
                name: 'mega-minds',
                version: '2.1.0',
                techStack: ['JavaScript', 'Node.js', 'AI Development'],
                mission: 'AI-powered development team coordination',
                phase: 'Variable-Driven Enhancement'
            },
            performance: {
                systemHealth: 'healthy',
                optimizationScore: 8.5
            },
            system: {
                status: 'healthy',
                memory: { rss: 1500, heapUsed: 800, heapTotal: 1200 },
                uptime: 3600
            }
        };
    }

    getVariableStatus(value) {
        if (value === null || value === undefined) return '❌';
        if (value === 'unknown' || value === 'fallback') return '⚠️';
        return '✅';
    }

    getPerformanceStatus(key, value) {
        const thresholds = {
            'OPTIMIZATION_SCORE': { good: 8, poor: 6 },
            'SECTION_LOAD_TIME': { good: 100, poor: 500 },
            'CACHE_HIT_RATE': { good: 80, poor: 50 },
            'CONTEXT_USAGE': { good: 70, poor: 90 }
        };

        const threshold = thresholds[key];
        if (!threshold) return '';

        const numValue = parseFloat(value);
        if (isNaN(numValue)) return '';

        if (key === 'SECTION_LOAD_TIME' || key === 'CONTEXT_USAGE') {
            // Lower is better
            if (numValue <= threshold.good) return '✅';
            if (numValue <= threshold.poor) return '⚠️';
            return '❌';
        } else {
            // Higher is better
            if (numValue >= threshold.good) return '✅';
            if (numValue >= threshold.poor) return '⚠️';
            return '❌';
        }
    }

    truncateValue(value, maxLength) {
        const str = String(value);
        return str.length <= maxLength ? str : str.substring(0, maxLength) + '...';
    }

    getArgValue(args, flag) {
        const index = args.indexOf(flag);
        return index !== -1 && index < args.length - 1 ? args[index + 1] : null;
    }

    /**
     * Show help information
     */
    static showHelp() {
        console.log('🔍 Variable Status Command');
        console.log('');
        console.log('Usage:');
        console.log('  npx mega-minds variable-status [options]');
        console.log('');
        console.log('Options:');
        console.log('  --detailed, -d      Show all variables with values');
        console.log('  --performance, -p   Include performance metrics');
        console.log('  --agent, -a NAME    Filter for specific agent');
        console.log('  --help, -h          Show this help message');
        console.log('');
        console.log('Examples:');
        console.log('  npx mega-minds variable-status');
        console.log('  npx mega-minds variable-status --detailed');
        console.log('  npx mega-minds variable-status --agent frontend-development-agent');
    }
}

// Export function for CLI integration
function variableStatus(args) {
    if (args.includes('--help') || args.includes('-h')) {
        VariableStatusCommand.showHelp();
        return;
    }
    
    const command = new VariableStatusCommand();
    return command.run(args);
}

module.exports = { VariableStatusCommand, variableStatus };