// lib/commands/performance-metrics.js
// Command: npx mega-minds performance-metrics
// Purpose: Display detailed Variable System performance metrics and optimization data

const { PerformanceMonitor } = require('../performance-monitor');
const { ContextualVariableEngine } = require('../variable-engine');
const { TemplateAdapter } = require('../template-adapter');

/**
 * Shows detailed performance metrics for the Variable System
 * Includes load times, cache statistics, optimization scores, and recommendations
 */
class PerformanceMetricsCommand {
    constructor() {
        this.projectPath = process.cwd();
    }

    /**
     * Main execution function for performance metrics display
     * @param {Array} args - Command arguments
     * @returns {Promise<void>}
     */
    async run(args = []) {
        try {
            const showHistory = args.includes('--history') || args.includes('-h');
            const showRecommendations = args.includes('--recommendations') || args.includes('-r');
            const exportData = args.includes('--export') || args.includes('-e');

            console.log('📊 Variable System Performance Metrics\n');

            // Initialize components
            const performanceMonitor = new PerformanceMonitor();
            const variableEngine = new ContextualVariableEngine(this.projectPath);
            const templateAdapter = new TemplateAdapter(this.projectPath);

            // Show current performance snapshot
            await this.showPerformanceSnapshot(performanceMonitor);

            // Show component-specific metrics
            await this.showComponentMetrics(variableEngine, templateAdapter);

            // Show system benchmarks
            await this.showSystemBenchmarks();

            // Show performance history if requested
            if (showHistory) {
                await this.showPerformanceHistory(performanceMonitor);
            }

            // Show optimization recommendations if requested
            if (showRecommendations) {
                await this.showOptimizationRecommendations(performanceMonitor);
            }

            // Export data if requested
            if (exportData) {
                await this.exportPerformanceData(performanceMonitor);
            }

            console.log('\n📋 Available Options:');
            console.log('  npx mega-minds performance-metrics --history         # Show performance history');
            console.log('  npx mega-minds performance-metrics --recommendations # Get optimization tips');
            console.log('  npx mega-minds performance-metrics --export          # Export metrics data');

        } catch (error) {
            console.error('❌ Failed to get performance metrics:', error.message);
            console.log('\n💡 Try running: npx mega-minds performance-metrics --help');
            process.exit(1);
        }
    }

    /**
     * Display current performance snapshot
     */
    async showPerformanceSnapshot(performanceMonitor) {
        console.log('⚡ Current Performance Snapshot:');
        
        try {
            const metrics = performanceMonitor.getCurrentMetrics();
            const timestamp = new Date().toISOString();
            
            // Key performance indicators
            console.log(`   Timestamp: ${timestamp}`);
            console.log(`   System Status: ${this.getSystemStatus(metrics)} ${this.getStatusIcon(metrics)}`);
            console.log('');
            
            // Load time metrics
            console.log('🚀 Load Time Metrics:');
            console.log(`   Average Load Time: ${metrics.averageLoadTime.toFixed(2)}ms ${this.getLoadTimeStatus(metrics.averageLoadTime)}`);
            console.log(`   Fastest Load: ${metrics.fastestLoad?.toFixed(2) || 'N/A'}ms`);
            console.log(`   Slowest Load: ${metrics.slowestLoad?.toFixed(2) || 'N/A'}ms`);
            console.log(`   Target: <100ms | Status: ${metrics.averageLoadTime < 100 ? '✅ Meeting target' : '⚠️ Above target'}`);
            
            // Cache performance
            console.log('\n💾 Cache Performance:');
            console.log(`   Hit Rate: ${metrics.cacheHitRate.toFixed(1)}% ${this.getCacheStatus(metrics.cacheHitRate)}`);
            console.log(`   Cache Hits: ${metrics.cacheHits}`);
            console.log(`   Cache Misses: ${metrics.cacheMisses}`);
            console.log(`   Cache Efficiency: ${this.getCacheEfficiency(metrics.cacheHitRate)}`);
            
            // Operations metrics
            console.log('\n📈 Operations Metrics:');
            console.log(`   Total Operations: ${metrics.operationsCompleted}`);
            console.log(`   Success Rate: ${(100 - metrics.errorRate).toFixed(1)}% ${this.getSuccessStatus(metrics.errorRate)}`);
            console.log(`   Error Rate: ${metrics.errorRate.toFixed(2)}% ${this.getErrorStatus(metrics.errorRate)}`);
            console.log(`   Operations/Second: ${metrics.operationsPerSecond?.toFixed(2) || 'N/A'}`);
            
            // Overall optimization score
            console.log('\n🎯 Optimization Score:');
            console.log(`   Current Score: ${metrics.optimizationScore}/10 ${this.getOptimizationStatus(metrics.optimizationScore)}`);
            console.log(`   Performance Grade: ${this.getPerformanceGrade(metrics.optimizationScore)}`);

        } catch (error) {
            console.log('   ❌ Error getting performance snapshot:', error.message);
        }
    }

    /**
     * Display component-specific metrics
     */
    async showComponentMetrics(variableEngine, templateAdapter) {
        console.log('\n🧩 Component Metrics:');
        
        try {
            // Variable Engine metrics
            console.log('   Variable Engine:');
            console.log(`     Cache Size: Active variables cached`);
            console.log(`     Generation Speed: <50ms target`);
            console.log(`     Variable Coverage: 27 core variables`);
            
            // Template Adapter metrics
            const adapterStats = templateAdapter.getAdapterStats();
            console.log('   Template Adapter:');
            console.log(`     Cache Size: ${adapterStats.cacheSize} templates`);
            console.log(`     Cache Timeout: ${adapterStats.cacheTimeout}ms`);
            console.log(`     Template Variables: ${adapterStats.templateVariableCount}`);
            console.log(`     Path Resolution: ${adapterStats.pathResolutionEnabled ? '✅ Enabled' : '❌ Disabled'}`);
            
            // Memory usage
            console.log('   Memory Usage:');
            const memUsage = process.memoryUsage();
            console.log(`     Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
            console.log(`     Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
            console.log(`     RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
            console.log(`     Memory Efficiency: ${this.getMemoryEfficiency(memUsage)}`);

        } catch (error) {
            console.log('   ❌ Error getting component metrics:', error.message);
        }
    }

    /**
     * Display system benchmarks
     */
    async showSystemBenchmarks() {
        console.log('\n🏁 System Benchmarks:');
        
        try {
            const start = performance.now();
            
            // Benchmark variable generation
            const variableEngine = new ContextualVariableEngine(this.projectPath);
            const mockContext = await this.createMockContext();
            
            const varStart = performance.now();
            await variableEngine.generateVariables('project-orchestrator-agent', 'full', mockContext);
            const varTime = performance.now() - varStart;
            
            // Benchmark template adaptation
            const templateAdapter = new TemplateAdapter(this.projectPath);
            const adapterStart = performance.now();
            await templateAdapter.adaptAgentTemplate('project-orchestrator-agent', mockContext);
            const adapterTime = performance.now() - adapterStart;
            
            const totalTime = performance.now() - start;
            
            console.log(`   Variable Generation: ${varTime.toFixed(2)}ms ${this.getBenchmarkStatus(varTime, 50)}`);
            console.log(`   Template Adaptation: ${adapterTime.toFixed(2)}ms ${this.getBenchmarkStatus(adapterTime, 100)}`);
            console.log(`   Total Processing: ${totalTime.toFixed(2)}ms ${this.getBenchmarkStatus(totalTime, 200)}`);
            
            // Performance classification
            const classification = this.classifyPerformance(totalTime);
            console.log(`   Performance Class: ${classification}`);

        } catch (error) {
            console.log('   ❌ Error running benchmarks:', error.message);
        }
    }

    /**
     * Display performance history
     */
    async showPerformanceHistory(performanceMonitor) {
        console.log('\n📊 Performance History:');
        
        try {
            const history = performanceMonitor.getPerformanceHistory();
            
            if (history.length === 0) {
                console.log('   No performance history available');
                return;
            }
            
            console.log(`   Data Points: ${history.length}`);
            console.log(`   Time Range: ${history[0].timestamp} → ${history[history.length - 1].timestamp}`);
            
            // Calculate trends
            const loadTrend = this.calculateTrend(history.map(h => h.loadTime));
            const cacheTrend = this.calculateTrend(history.map(h => h.cacheHitRate));
            
            console.log('\n   Trends:');
            console.log(`     Load Time: ${loadTrend} ${this.getTrendIcon(loadTrend)}`);
            console.log(`     Cache Hit Rate: ${cacheTrend} ${this.getTrendIcon(cacheTrend)}`);
            
            // Show recent performance points
            console.log('\n   Recent Performance:');
            const recent = history.slice(-5);
            recent.forEach((point, index) => {
                const time = new Date(point.timestamp).toLocaleTimeString();
                console.log(`     ${time}: ${point.loadTime.toFixed(2)}ms, ${point.cacheHitRate.toFixed(1)}% cache`);
            });

        } catch (error) {
            console.log('   ❌ Error getting performance history:', error.message);
        }
    }

    /**
     * Display optimization recommendations
     */
    async showOptimizationRecommendations(performanceMonitor) {
        console.log('\n💡 Optimization Recommendations:');
        
        try {
            const metrics = performanceMonitor.getCurrentMetrics();
            const recommendations = [];
            
            // Load time recommendations
            if (metrics.averageLoadTime > 100) {
                recommendations.push({
                    priority: 'High',
                    area: 'Load Time',
                    issue: `Average load time ${metrics.averageLoadTime.toFixed(2)}ms exceeds target`,
                    solution: 'Consider increasing cache timeout or optimizing variable generation'
                });
            }
            
            // Cache recommendations
            if (metrics.cacheHitRate < 80) {
                recommendations.push({
                    priority: 'Medium',
                    area: 'Cache Performance',
                    issue: `Cache hit rate ${metrics.cacheHitRate.toFixed(1)}% below optimal`,
                    solution: 'Review cache invalidation strategy and increase cache timeout'
                });
            }
            
            // Error rate recommendations
            if (metrics.errorRate > 5) {
                recommendations.push({
                    priority: 'High',
                    area: 'Error Rate',
                    issue: `Error rate ${metrics.errorRate.toFixed(2)}% above acceptable threshold`,
                    solution: 'Review error logs and implement additional error handling'
                });
            }
            
            // Memory recommendations
            const memUsage = process.memoryUsage();
            if (memUsage.heapUsed / memUsage.heapTotal > 0.8) {
                recommendations.push({
                    priority: 'Medium',
                    area: 'Memory Usage',
                    issue: 'High memory usage detected',
                    solution: 'Consider reducing cache size or implementing garbage collection'
                });
            }
            
            if (recommendations.length === 0) {
                console.log('   ✅ No optimization recommendations - system performing well!');
            } else {
                recommendations.forEach((rec, index) => {
                    console.log(`\n   ${index + 1}. ${rec.area} (${rec.priority} Priority)`);
                    console.log(`      Issue: ${rec.issue}`);
                    console.log(`      Solution: ${rec.solution}`);
                });
            }

        } catch (error) {
            console.log('   ❌ Error generating recommendations:', error.message);
        }
    }

    /**
     * Export performance data
     */
    async exportPerformanceData(performanceMonitor) {
        console.log('\n📤 Exporting Performance Data:');
        
        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            const data = {
                timestamp: new Date().toISOString(),
                metrics: performanceMonitor.getCurrentMetrics(),
                history: performanceMonitor.getPerformanceHistory(),
                systemInfo: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    memory: process.memoryUsage(),
                    uptime: process.uptime()
                }
            };
            
            const filename = `performance-metrics-${Date.now()}.json`;
            const filepath = path.join(this.projectPath, filename);
            
            await fs.writeFile(filepath, JSON.stringify(data, null, 2));
            console.log(`   ✅ Data exported to: ${filename}`);
            console.log(`   Size: ${JSON.stringify(data).length} bytes`);

        } catch (error) {
            console.log('   ❌ Error exporting data:', error.message);
        }
    }

    // Helper methods
    async createMockContext() {
        return {
            session: { id: `benchmark-${Date.now()}` },
            memory: { pressure: 'normal' },
            activeAgents: { count: 1 },
            project: { name: 'mega-minds' }
        };
    }

    getSystemStatus(metrics) {
        if (metrics.errorRate > 10) return 'Degraded';
        if (metrics.averageLoadTime > 200 || metrics.cacheHitRate < 50) return 'Warning';
        return 'Healthy';
    }

    getStatusIcon(metrics) {
        const status = this.getSystemStatus(metrics);
        return status === 'Healthy' ? '✅' : status === 'Warning' ? '⚠️' : '❌';
    }

    getLoadTimeStatus(time) {
        if (time < 50) return '🚀 Excellent';
        if (time < 100) return '✅ Good';
        if (time < 200) return '⚠️ Slow';
        return '❌ Poor';
    }

    getCacheStatus(rate) {
        if (rate >= 90) return '🚀 Excellent';
        if (rate >= 80) return '✅ Good';
        if (rate >= 60) return '⚠️ Poor';
        return '❌ Critical';
    }

    getCacheEfficiency(rate) {
        if (rate >= 90) return 'Excellent';
        if (rate >= 80) return 'Good';
        if (rate >= 60) return 'Fair';
        return 'Poor';
    }

    getSuccessStatus(errorRate) {
        return errorRate < 5 ? '✅' : errorRate < 10 ? '⚠️' : '❌';
    }

    getErrorStatus(errorRate) {
        return errorRate < 1 ? '✅ Low' : errorRate < 5 ? '⚠️ Moderate' : '❌ High';
    }

    getOptimizationStatus(score) {
        if (score >= 9) return '🚀 Excellent';
        if (score >= 8) return '✅ Good';
        if (score >= 6) return '⚠️ Fair';
        return '❌ Needs Work';
    }

    getPerformanceGrade(score) {
        if (score >= 9) return 'A+';
        if (score >= 8) return 'A';
        if (score >= 7) return 'B+';
        if (score >= 6) return 'B';
        if (score >= 5) return 'C';
        return 'D';
    }

    getMemoryEfficiency(memUsage) {
        const efficiency = memUsage.heapUsed / memUsage.heapTotal;
        if (efficiency < 0.6) return '✅ Efficient';
        if (efficiency < 0.8) return '⚠️ Moderate';
        return '❌ High Usage';
    }

    getBenchmarkStatus(time, target) {
        if (time < target * 0.7) return '🚀 Excellent';
        if (time < target) return '✅ Good';
        if (time < target * 1.5) return '⚠️ Slow';
        return '❌ Poor';
    }

    classifyPerformance(totalTime) {
        if (totalTime < 100) return '🚀 High Performance';
        if (totalTime < 200) return '✅ Standard Performance';
        if (totalTime < 500) return '⚠️ Moderate Performance';
        return '❌ Low Performance';
    }

    calculateTrend(values) {
        if (values.length < 2) return 'Insufficient data';
        const recent = values.slice(-5);
        const earlier = values.slice(-10, -5);
        if (earlier.length === 0) return 'Insufficient data';
        
        const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
        const earlierAvg = earlier.reduce((a, b) => a + b) / earlier.length;
        
        if (recentAvg > earlierAvg * 1.05) return 'Improving';
        if (recentAvg < earlierAvg * 0.95) return 'Declining';
        return 'Stable';
    }

    getTrendIcon(trend) {
        return trend === 'Improving' ? '📈' : trend === 'Declining' ? '📉' : '📊';
    }

    /**
     * Show help information
     */
    static showHelp() {
        console.log('📊 Performance Metrics Command');
        console.log('');
        console.log('Usage:');
        console.log('  npx mega-minds performance-metrics [options]');
        console.log('');
        console.log('Options:');
        console.log('  --history, -h           Show performance history and trends');
        console.log('  --recommendations, -r   Show optimization recommendations');
        console.log('  --export, -e           Export metrics data to JSON file');
        console.log('  --help                 Show this help message');
        console.log('');
        console.log('Examples:');
        console.log('  npx mega-minds performance-metrics');
        console.log('  npx mega-minds performance-metrics --history --recommendations');
        console.log('  npx mega-minds performance-metrics --export');
    }
}

// Export function for CLI integration
function performanceMetrics(args) {
    if (args.includes('--help')) {
        PerformanceMetricsCommand.showHelp();
        return;
    }
    
    const command = new PerformanceMetricsCommand();
    return command.run(args);
}

module.exports = { PerformanceMetricsCommand, performanceMetrics };