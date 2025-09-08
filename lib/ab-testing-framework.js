/**
 * A/B Testing Framework for Mega-Minds Variable-Driven Agent System
 * Phase 3: Advanced Integration - Performance Optimization Validation
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ABTestingFramework {
  constructor(projectPath, config = {}) {
    this.projectPath = projectPath;
    this.config = {
      testDuration: config.testDuration || 86400000, // 24 hours in ms
      sampleSize: config.sampleSize || 100,
      significanceLevel: config.significanceLevel || 0.05,
      enableAutoRollout: config.enableAutoRollout || true,
      testDataPath: config.testDataPath || path.join(projectPath, '.mega-minds/ab-tests'),
      ...config
    };
    
    this.activeTests = new Map();
    this.testResults = new Map();
    this.participantGroups = new Map();
    
    this.initialize();
  }

  /**
   * Initialize A/B testing framework
   */
  async initialize() {
    try {
      // Ensure test data directory exists
      await fs.mkdir(this.config.testDataPath, { recursive: true });
      
      // Load existing tests
      await this.loadExistingTests();
      
      console.log('A/B Testing Framework initialized');
    } catch (error) {
      console.error('Failed to initialize A/B Testing Framework:', error);
    }
  }

  /**
   * Create a new A/B test for claude.md variations
   * @param {Object} testConfig - Test configuration
   * @returns {string} Test ID
   */
  async createClaudeStructureTest(testConfig) {
    const testId = this.generateTestId('claude-structure');
    
    const test = {
      id: testId,
      name: testConfig.name || 'Claude.md Structure Test',
      type: 'claude-structure',
      status: 'active',
      created: new Date().toISOString(),
      duration: testConfig.duration || this.config.testDuration,
      
      // Test variants
      variants: {
        control: {
          name: 'Current Optimized Structure',
          description: 'Current optimized claude.md structure',
          claudeConfig: testConfig.variants.control,
          weight: 50
        },
        treatment: {
          name: testConfig.variants.treatment.name || 'Alternative Structure',
          description: testConfig.variants.treatment.description,
          claudeConfig: testConfig.variants.treatment.claudeConfig,
          weight: 50
        }
      },
      
      // Metrics to track
      metrics: {
        primary: testConfig.metrics?.primary || 'agent-coordination-success',
        secondary: testConfig.metrics?.secondary || [
          'token-usage-efficiency',
          'load-time-performance', 
          'memory-usage',
          'user-satisfaction'
        ]
      },
      
      // Test configuration
      sampleSize: testConfig.sampleSize || this.config.sampleSize,
      significanceLevel: testConfig.significanceLevel || this.config.significanceLevel,
      
      // Results tracking
      results: {
        control: { participants: 0, metrics: {} },
        treatment: { participants: 0, metrics: {} }
      },
      
      // Test state
      endTime: new Date(Date.now() + (testConfig.duration || this.config.testDuration)).toISOString(),
      autoRollout: testConfig.autoRollout !== false
    };
    
    this.activeTests.set(testId, test);
    await this.persistTest(test);
    
    console.log(`A/B test created: ${testId} - ${test.name}`);
    return testId;
  }

  /**
   * Assign session to test variant
   * @param {string} sessionId - Session ID
   * @param {string} testId - Test ID (optional, uses active tests if not provided)
   * @returns {Object} Variant assignment
   */
  assignToVariant(sessionId, testId = null) {
    // Get active claude structure test
    const activeTest = testId ? 
      this.activeTests.get(testId) : 
      this.getActiveClaudeTest();
    
    if (!activeTest) {
      return { variant: 'control', test: null, reason: 'no-active-test' };
    }
    
    // Check if session already assigned
    const existingAssignment = this.participantGroups.get(sessionId);
    if (existingAssignment && existingAssignment.testId === activeTest.id) {
      return {
        variant: existingAssignment.variant,
        test: activeTest.id,
        reason: 'existing-assignment',
        assignedAt: existingAssignment.assignedAt
      };
    }
    
    // Determine variant using consistent hashing
    const variant = this.hashSessionToVariant(sessionId, activeTest);
    
    // Record assignment
    const assignment = {
      sessionId: sessionId,
      testId: activeTest.id,
      variant: variant,
      assignedAt: new Date().toISOString()
    };
    
    this.participantGroups.set(sessionId, assignment);
    activeTest.results[variant].participants++;
    
    return {
      variant: variant,
      test: activeTest.id,
      reason: 'new-assignment',
      assignedAt: assignment.assignedAt
    };
  }

  /**
   * Get claude.md configuration for session
   * @param {string} sessionId - Session ID
   * @param {Object} context - Session context
   * @returns {Object} Claude configuration for variant
   */
  async getClaudeConfigForSession(sessionId, context) {
    const assignment = this.assignToVariant(sessionId);
    const test = this.activeTests.get(assignment.test);
    
    if (!test) {
      // Return default configuration
      return this.getDefaultClaudeConfig(context);
    }
    
    const variant = test.variants[assignment.variant];
    
    // Track session start
    this.recordSessionStart(sessionId, assignment.test, assignment.variant);
    
    return {
      ...variant.claudeConfig,
      _abTest: {
        testId: assignment.test,
        variant: assignment.variant,
        assignedAt: assignment.assignedAt
      }
    };
  }

  /**
   * Record test metric
   * @param {string} sessionId - Session ID
   * @param {string} metric - Metric name
   * @param {number} value - Metric value
   * @param {Object} metadata - Additional metadata
   */
  recordMetric(sessionId, metric, value, metadata = {}) {
    const assignment = this.participantGroups.get(sessionId);
    if (!assignment) return;
    
    const test = this.activeTests.get(assignment.testId);
    if (!test) return;
    
    // Initialize metric tracking if needed
    if (!test.results[assignment.variant].metrics[metric]) {
      test.results[assignment.variant].metrics[metric] = [];
    }
    
    // Record metric
    test.results[assignment.variant].metrics[metric].push({
      value: value,
      timestamp: new Date().toISOString(),
      sessionId: sessionId,
      metadata: metadata
    });
    
    // Check if test should conclude
    this.checkTestCompletion(assignment.testId);
  }

  /**
   * Record session metrics for A/B test
   * @param {string} sessionId - Session ID  
   * @param {Object} metrics - Session metrics
   */
  recordSessionMetrics(sessionId, metrics) {
    const assignment = this.participantGroups.get(sessionId);
    if (!assignment) return;
    
    // Record each metric
    Object.entries(metrics).forEach(([metric, value]) => {
      this.recordMetric(sessionId, metric, value, {
        sessionId: sessionId,
        recordedAt: new Date().toISOString()
      });
    });
  }

  /**
   * Get test results and analysis
   * @param {string} testId - Test ID
   * @returns {Object} Test analysis results
   */
  analyzeTest(testId) {
    const test = this.activeTests.get(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }
    
    const analysis = {
      testId: testId,
      testName: test.name,
      status: test.status,
      duration: this.calculateTestDuration(test),
      
      participants: {
        control: test.results.control.participants,
        treatment: test.results.treatment.participants,
        total: test.results.control.participants + test.results.treatment.participants
      },
      
      metrics: {},
      
      conclusions: [],
      recommendations: []
    };
    
    // Analyze each metric
    Object.keys(test.results.control.metrics).forEach(metric => {
      const controlValues = test.results.control.metrics[metric] || [];
      const treatmentValues = test.results.treatment.metrics[metric] || [];
      
      if (controlValues.length === 0 && treatmentValues.length === 0) return;
      
      const metricAnalysis = this.analyzeMetric(
        metric, 
        controlValues.map(m => m.value), 
        treatmentValues.map(m => m.value)
      );
      
      analysis.metrics[metric] = metricAnalysis;
      
      // Generate conclusions
      if (metricAnalysis.significant) {
        const winner = metricAnalysis.treatmentBetter ? 'treatment' : 'control';
        const improvement = Math.abs(metricAnalysis.percentChange);
        
        analysis.conclusions.push({
          metric: metric,
          winner: winner,
          improvement: `${improvement.toFixed(2)}%`,
          confidence: `${((1 - test.significanceLevel) * 100).toFixed(0)}%`
        });
      }
    });
    
    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis, test);
    
    return analysis;
  }

  /**
   * Automatically roll out winning variant if configured
   * @param {string} testId - Test ID
   */
  async autoRollout(testId) {
    const test = this.activeTests.get(testId);
    if (!test || !test.autoRollout) return;
    
    const analysis = this.analyzeTest(testId);
    
    // Check if we have a clear winner
    const primaryMetric = analysis.metrics[test.metrics.primary];
    if (!primaryMetric || !primaryMetric.significant) return;
    
    const winningVariant = primaryMetric.treatmentBetter ? 'treatment' : 'control';
    
    if (winningVariant === 'treatment') {
      console.log(`Auto-rolling out treatment variant for test ${testId}`);
      
      // Update default claude.md configuration
      await this.rolloutVariant(testId, 'treatment');
      
      // Mark test as completed
      test.status = 'completed';
      test.completedAt = new Date().toISOString();
      test.rolloutVariant = 'treatment';
      
      await this.persistTest(test);
    }
  }

  /**
   * Roll out a specific variant as the new default
   * @param {string} testId - Test ID
   * @param {string} variant - Variant to roll out
   */
  async rolloutVariant(testId, variant) {
    const test = this.activeTests.get(testId);
    if (!test) return;
    
    const variantConfig = test.variants[variant];
    
    // Update the main claude.md file with winning variant
    const claudePath = path.join(this.projectPath, 'templates/claude.md');
    const newContent = variantConfig.claudeConfig.content || variantConfig.claudeConfig;
    
    // Backup current version
    const backupPath = path.join(this.projectPath, 'templates/claude.md.backup');
    try {
      const currentContent = await fs.readFile(claudePath, 'utf8');
      await fs.writeFile(backupPath, currentContent, 'utf8');
    } catch (error) {
      console.error('Failed to backup current claude.md:', error);
    }
    
    // Write new version
    try {
      await fs.writeFile(claudePath, newContent, 'utf8');
      console.log(`Rolled out ${variant} variant to templates/claude.md`);
    } catch (error) {
      console.error('Failed to roll out variant:', error);
    }
  }

  /**
   * Get default claude.md configuration
   * @param {Object} context - Session context
   * @returns {Object} Default configuration
   */
  getDefaultClaudeConfig(context) {
    // Return current optimized structure as default
    return {
      structure: 'optimized',
      sections: ['core-rules', 'project-context', 'commands', 'documentation'],
      variables: true,
      sectionMarkers: true,
      performanceMonitoring: true
    };
  }

  /**
   * Hash session ID to variant consistently
   * @param {string} sessionId - Session ID
   * @param {Object} test - Test configuration
   * @returns {string} Variant name
   */
  hashSessionToVariant(sessionId, test) {
    const hash = crypto.createHash('md5').update(sessionId + test.id).digest('hex');
    const hashValue = parseInt(hash.substring(0, 8), 16);
    
    const controlWeight = test.variants.control.weight || 50;
    const threshold = (controlWeight / 100) * 0xffffffff;
    
    return hashValue < threshold ? 'control' : 'treatment';
  }

  /**
   * Get currently active claude structure test
   * @returns {Object|null} Active test or null
   */
  getActiveClaudeTest() {
    for (const test of this.activeTests.values()) {
      if (test.type === 'claude-structure' && test.status === 'active') {
        return test;
      }
    }
    return null;
  }

  /**
   * Check if test should be completed
   * @param {string} testId - Test ID
   */
  checkTestCompletion(testId) {
    const test = this.activeTests.get(testId);
    if (!test || test.status !== 'active') return;
    
    const now = new Date();
    const endTime = new Date(test.endTime);
    
    // Check time-based completion
    if (now >= endTime) {
      this.completeTest(testId, 'time-expired');
      return;
    }
    
    // Check sample size completion
    const totalParticipants = test.results.control.participants + test.results.treatment.participants;
    if (totalParticipants >= test.sampleSize) {
      this.completeTest(testId, 'sample-size-reached');
      return;
    }
    
    // Check for early statistical significance (if enough samples)
    if (totalParticipants >= Math.min(50, test.sampleSize * 0.5)) {
      const analysis = this.analyzeTest(testId);
      const primaryMetric = analysis.metrics[test.metrics.primary];
      
      if (primaryMetric && primaryMetric.significant && primaryMetric.confidenceLevel > 0.99) {
        this.completeTest(testId, 'early-significance');
      }
    }
  }

  /**
   * Complete a test
   * @param {string} testId - Test ID
   * @param {string} reason - Completion reason
   */
  async completeTest(testId, reason) {
    const test = this.activeTests.get(testId);
    if (!test) return;
    
    test.status = 'completed';
    test.completedAt = new Date().toISOString();
    test.completionReason = reason;
    
    console.log(`Test ${testId} completed: ${reason}`);
    
    // Auto-rollout if configured
    if (test.autoRollout) {
      await this.autoRollout(testId);
    }
    
    await this.persistTest(test);
  }

  /**
   * Analyze a specific metric between control and treatment
   * @param {string} metricName - Metric name
   * @param {Array} controlValues - Control group values
   * @param {Array} treatmentValues - Treatment group values
   * @returns {Object} Metric analysis
   */
  analyzeMetric(metricName, controlValues, treatmentValues) {
    if (controlValues.length === 0 || treatmentValues.length === 0) {
      return {
        metric: metricName,
        controlMean: controlValues.length > 0 ? this.mean(controlValues) : 0,
        treatmentMean: treatmentValues.length > 0 ? this.mean(treatmentValues) : 0,
        significant: false,
        reason: 'insufficient-data'
      };
    }
    
    const controlMean = this.mean(controlValues);
    const treatmentMean = this.mean(treatmentValues);
    const controlStd = this.standardDeviation(controlValues);
    const treatmentStd = this.standardDeviation(treatmentValues);
    
    // Perform t-test
    const tTestResult = this.tTest(
      controlValues, treatmentValues,
      controlMean, treatmentMean,
      controlStd, treatmentStd
    );
    
    const percentChange = ((treatmentMean - controlMean) / controlMean) * 100;
    
    return {
      metric: metricName,
      controlMean: controlMean,
      treatmentMean: treatmentMean,
      percentChange: percentChange,
      treatmentBetter: this.isTreatmentBetter(metricName, treatmentMean, controlMean),
      significant: tTestResult.significant,
      pValue: tTestResult.pValue,
      confidenceLevel: 1 - tTestResult.pValue,
      tStatistic: tTestResult.tStatistic,
      sampleSizes: {
        control: controlValues.length,
        treatment: treatmentValues.length
      }
    };
  }

  /**
   * Determine if treatment is better based on metric type
   * @param {string} metricName - Metric name
   * @param {number} treatmentValue - Treatment value
   * @param {number} controlValue - Control value
   * @returns {boolean} True if treatment is better
   */
  isTreatmentBetter(metricName, treatmentValue, controlValue) {
    // Metrics where higher is better
    const higherIsBetter = [
      'agent-coordination-success',
      'user-satisfaction',
      'task-completion-rate',
      'cache-hit-rate'
    ];
    
    // Metrics where lower is better
    const lowerIsBetter = [
      'token-usage',
      'load-time-performance',
      'memory-usage',
      'error-rate'
    ];
    
    if (higherIsBetter.includes(metricName)) {
      return treatmentValue > controlValue;
    } else if (lowerIsBetter.includes(metricName)) {
      return treatmentValue < controlValue;
    }
    
    // Default: assume higher is better
    return treatmentValue > controlValue;
  }

  /**
   * Generate recommendations based on test analysis
   * @param {Object} analysis - Test analysis
   * @param {Object} test - Test configuration
   * @returns {Array} Recommendations
   */
  generateRecommendations(analysis, test) {
    const recommendations = [];
    
    // Primary metric recommendations
    const primaryMetric = analysis.metrics[test.metrics.primary];
    if (primaryMetric && primaryMetric.significant) {
      const winner = primaryMetric.treatmentBetter ? 'treatment' : 'control';
      const improvement = Math.abs(primaryMetric.percentChange);
      
      recommendations.push({
        type: 'rollout',
        priority: 'high',
        message: `Roll out ${winner} variant - ${improvement.toFixed(2)}% improvement in ${test.metrics.primary}`,
        confidence: primaryMetric.confidenceLevel
      });
    } else if (primaryMetric) {
      recommendations.push({
        type: 'continue',
        priority: 'medium', 
        message: `Continue test - primary metric not yet significant (p=${primaryMetric.pValue.toFixed(4)})`,
        confidence: primaryMetric.confidenceLevel
      });
    }
    
    // Secondary metric insights
    test.metrics.secondary.forEach(metric => {
      const metricAnalysis = analysis.metrics[metric];
      if (metricAnalysis && metricAnalysis.significant) {
        const winner = metricAnalysis.treatmentBetter ? 'treatment' : 'control';
        const improvement = Math.abs(metricAnalysis.percentChange);
        
        recommendations.push({
          type: 'insight',
          priority: 'low',
          message: `Secondary benefit: ${improvement.toFixed(2)}% improvement in ${metric} with ${winner} variant`
        });
      }
    });
    
    // Sample size recommendations
    if (analysis.participants.total < test.sampleSize * 0.5) {
      recommendations.push({
        type: 'data-collection',
        priority: 'medium',
        message: `Increase sample size - only ${analysis.participants.total}/${test.sampleSize} participants collected`
      });
    }
    
    return recommendations;
  }

  /**
   * Statistical helper methods
   */
  mean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  standardDeviation(values) {
    const avg = this.mean(values);
    const squareDiffs = values.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  tTest(control, treatment, controlMean, treatmentMean, controlStd, treatmentStd) {
    const n1 = control.length;
    const n2 = treatment.length;
    
    // Pooled standard error
    const pooledStd = Math.sqrt(
      ((n1 - 1) * controlStd * controlStd + (n2 - 1) * treatmentStd * treatmentStd) / 
      (n1 + n2 - 2)
    );
    
    const standardError = pooledStd * Math.sqrt(1/n1 + 1/n2);
    const tStatistic = (treatmentMean - controlMean) / standardError;
    const degreesOfFreedom = n1 + n2 - 2;
    
    // Approximate p-value (simplified)
    const pValue = this.approximatePValue(Math.abs(tStatistic), degreesOfFreedom);
    
    return {
      tStatistic: tStatistic,
      pValue: pValue,
      significant: pValue < this.config.significanceLevel
    };
  }

  approximatePValue(tStat, df) {
    // Simplified p-value approximation for t-test
    // In production, use a proper statistical library
    if (tStat > 2.576) return 0.01;  // 99% confidence
    if (tStat > 1.96) return 0.05;   // 95% confidence
    if (tStat > 1.645) return 0.1;   // 90% confidence
    return 0.2; // Low confidence
  }

  /**
   * Utility methods
   */
  generateTestId(type) {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  calculateTestDuration(test) {
    const start = new Date(test.created);
    const end = test.completedAt ? new Date(test.completedAt) : new Date();
    return Math.round((end - start) / 1000 / 60); // minutes
  }

  recordSessionStart(sessionId, testId, variant) {
    this.recordMetric(sessionId, 'session-start', 1, {
      testId: testId,
      variant: variant,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Persistence methods
   */
  async persistTest(test) {
    const testFile = path.join(this.config.testDataPath, `${test.id}.json`);
    await fs.writeFile(testFile, JSON.stringify(test, null, 2), 'utf8');
  }

  async loadExistingTests() {
    try {
      const files = await fs.readdir(this.config.testDataPath);
      const testFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of testFiles) {
        const testPath = path.join(this.config.testDataPath, file);
        const testData = JSON.parse(await fs.readFile(testPath, 'utf8'));
        this.activeTests.set(testData.id, testData);
        
        // Reload participant assignments
        Object.values(testData.results).forEach(variant => {
          // Participants would be reloaded from persistent storage in production
        });
      }
      
      console.log(`Loaded ${testFiles.length} existing tests`);
    } catch (error) {
      console.error('Error loading existing tests:', error);
    }
  }

  /**
   * Public API methods
   */
  getActiveTests() {
    return Array.from(this.activeTests.values()).filter(test => test.status === 'active');
  }

  getTestStats() {
    const stats = {
      activeTests: 0,
      completedTests: 0,
      totalParticipants: 0,
      significantResults: 0
    };
    
    for (const test of this.activeTests.values()) {
      if (test.status === 'active') {
        stats.activeTests++;
      } else if (test.status === 'completed') {
        stats.completedTests++;
        
        const analysis = this.analyzeTest(test.id);
        stats.totalParticipants += analysis.participants.total;
        
        if (Object.values(analysis.metrics).some(m => m.significant)) {
          stats.significantResults++;
        }
      }
    }
    
    return stats;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.activeTests.clear();
    this.testResults.clear();
    this.participantGroups.clear();
    console.log('A/B Testing Framework cleaned up');
  }
}

module.exports = { ABTestingFramework };