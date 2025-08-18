// lib/commands/run-quality-gates.js
// CLI command for running automated quality gates
// PRD Requirement: Automated Quality Gates with CLI integration

const QualityGateManager = require('../quality/QualityGateManager');

/**
 * Run quality gates via CLI
 * Command: mega-minds run-quality-gates [options]
 */
async function runQualityGates(options = {}) {
    const projectPath = process.cwd();
    const qualityManager = new QualityGateManager(projectPath);
    
    try {
        console.log('🛡️ Starting automated quality gates...');
        
        // Parse CLI options
        const gateOptions = {
            gates: options.gates ? options.gates.split(',') : undefined,
            dryRun: options.dryRun || false,
            fix: options.fix || false,
            verbose: options.verbose || false
        };
        
        // Run quality gates
        const result = await qualityManager.runQualityGates(gateOptions);
        
        // Exit with appropriate code
        if (result.overall.passed) {
            console.log('✅ All quality gates passed!');
            process.exit(0);
        } else {
            console.error('❌ Quality gates failed');
            
            // Show summary of failures
            if (result.overall.blockers.length > 0) {
                console.error('\n🚫 Blocking issues:');
                result.overall.blockers.forEach(blocker => {
                    console.error(`   • ${blocker.message}`);
                });
            }
            
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Quality gates execution failed:', error.message);
        process.exit(1);
    }
}

/**
 * Get quality gate status
 */
async function getQualityStatus() {
    const projectPath = process.cwd();
    const qualityManager = new QualityGateManager(projectPath);
    
    try {
        const metrics = await qualityManager.getQualityMetrics();
        
        console.log('\n📊 Quality Gate Status:');
        console.log('========================');
        console.log(`Total runs: ${metrics.totalRuns}`);
        console.log(`Recent average score: ${metrics.averageScore}/100`);
        console.log(`Pass rate: ${metrics.passRate}% (target: 85%)`);
        console.log(`Average duration: ${Math.round(metrics.averageDuration/1000)}s (target: 30s)`);
        
        if (metrics.lastRun) {
            console.log(`Last run: ${new Date(metrics.lastRun).toLocaleString()}`);
        }
        
        console.log(`\nPRD Compliance: ${metrics.prdCompliance.status.toUpperCase()}`);
        console.log(`   ✓ Pass rate target: ${metrics.prdCompliance.meetsPassRate ? '✅' : '❌'}`);
        console.log(`   ✓ Response time target: ${metrics.prdCompliance.meetsResponseTime ? '✅' : '❌'}`);
        
        if (metrics.prdCompliance.status === 'needs-improvement') {
            console.log('\n⚠️ Quality gates need improvement to meet PRD targets');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Could not get quality status:', error.message);
        process.exit(1);
    }
}

module.exports = {
    runQualityGates,
    getQualityStatus
};