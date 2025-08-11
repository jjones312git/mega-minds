// lib/utils/ContextCompressor.js
const fs = require('fs-extra');
const path = require('path');

/**
 * ContextCompressor - Intelligent context compression and summarization
 * Keeps essential project information while reducing token usage for Claude Code
 */
class ContextCompressor {
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.memoryPath = path.join(projectPath, '.mega-minds');
        this.compressionSettings = {
            tokenLimit: 200000,
            compressionThreshold: 160000, // 80% of limit
            aggressiveThreshold: 180000,   // 90% of limit
            preserveRatio: {
                permanent: 1.0,    // Never compress
                critical: 0.7,     // Compress to 70%
                important: 0.4,    // Compress to 40%
                historical: 0.1,   // Compress to 10%
                temporary: 0.05    // Aggressive compression
            }
        };
    }

    /**
     * Analyze content and determine if compression is needed
     */
    analyzeContent(content) {
        const tokenCount = this.estimateTokenCount(content);
        const compressionNeeded = tokenCount > this.compressionSettings.compressionThreshold;
        const aggressiveNeeded = tokenCount > this.compressionSettings.aggressiveThreshold;

        return {
            tokenCount,
            compressionNeeded,
            aggressiveNeeded,
            compressionRatio: compressionNeeded ?
                (aggressiveNeeded ? 0.6 : 0.8) : 1.0
        };
    }

    /**
     * Compress context intelligently based on content type and importance
     */
    async compressContext(contextData) {
        const analysis = this.analyzeContent(JSON.stringify(contextData));

        if (!analysis.compressionNeeded) {
            return {
                compressed: contextData,
                compressionApplied: false,
                originalTokens: analysis.tokenCount,
                compressedTokens: analysis.tokenCount,
                compressionRatio: 1.0
            };
        }

        console.log(`🗜️ Compressing context: ${analysis.tokenCount} tokens → target: ${Math.round(analysis.tokenCount * analysis.compressionRatio)}`);

        // Categorize content by importance
        const categorized = this.categorizeContent(contextData);

        // Apply compression strategies
        const compressed = {
            permanent: categorized.permanent, // Never compress
            critical: await this.compressCritical(categorized.critical, analysis.aggressiveNeeded),
            important: await this.compressImportant(categorized.important, analysis.aggressiveNeeded),
            historical: await this.compressHistorical(categorized.historical),
            summary: await this.generateContextSummary(contextData)
        };

        const compressedTokens = this.estimateTokenCount(JSON.stringify(compressed));

        return {
            compressed,
            compressionApplied: true,
            originalTokens: analysis.tokenCount,
            compressedTokens,
            compressionRatio: compressedTokens / analysis.tokenCount,
            compressionReport: this.generateCompressionReport(categorized, compressed)
        };
    }

    /**
     * Categorize content by importance level
     */
    categorizeContent(contextData) {
        const categorized = {
            permanent: {},
            critical: {},
            important: {},
            historical: {},
            temporary: {}
        };

        // Permanent content (never compress)
        if (contextData.project) {
            categorized.permanent.architecture = contextData.project.architecture;
            categorized.permanent.coreDecisions = contextData.project.coreDecisions;
            categorized.permanent.securityRequirements = contextData.project.securityRequirements;
            categorized.permanent.complianceRequirements = contextData.project.complianceRequirements;
        }

        // Critical content (light compression)
        if (contextData.session) {
            categorized.critical.currentSprint = contextData.session.currentSprint;
            categorized.critical.activeWork = contextData.session.activeWork;
            categorized.critical.recentHandoffs = this.getRecentItems(contextData.session.handoffs, 5);
            categorized.critical.blockers = contextData.session.blockers;
        }

        if (contextData.agents) {
            categorized.critical.activeAgents = contextData.agents.activeAgents;
            categorized.critical.pendingHandoffs = contextData.agents.handoffQueue;
        }

        // Important content (moderate compression)
        if (contextData.session) {
            categorized.important.recentDecisions = this.getRecentItems(contextData.session.decisions, 10);
            categorized.important.completedFeatures = this.getRecentItems(contextData.session.completedFeatures, 15);
            categorized.important.testResults = this.getRecentItems(contextData.session.testResults, 5);
        }

        // Historical content (aggressive compression)
        if (contextData.session) {
            categorized.historical.oldHandoffs = this.getOlderItems(contextData.session.handoffs, 5);
            categorized.historical.oldDecisions = this.getOlderItems(contextData.session.decisions, 10);
            categorized.historical.archivedFeatures = this.getOlderItems(contextData.session.completedFeatures, 15);
        }

        // Temporary content (most aggressive compression)
        if (contextData.debug) {
            categorized.temporary.debugLogs = contextData.debug.logs;
            categorized.temporary.explorationWork = contextData.debug.exploration;
            categorized.temporary.experimentalCode = contextData.debug.experimental;
        }

        return categorized;
    }

    /**
     * Compress critical content (preserve most detail)
     */
    async compressCritical(content, aggressive = false) {
        if (!content || Object.keys(content).length === 0) return content;

        const compressed = {};

        // Keep current sprint full detail
        if (content.currentSprint) {
            compressed.currentSprint = content.currentSprint;
        }

        // Compress recent handoffs but keep key information
        if (content.recentHandoffs) {
            compressed.recentHandoffs = content.recentHandoffs.map(handoff => ({
                from: handoff.from,
                to: handoff.to,
                task: this.summarizeText(handoff.task, aggressive ? 50 : 100),
                status: handoff.status,
                timestamp: handoff.timestamp,
                keyOutcomes: handoff.keyOutcomes || handoff.result?.summary
            }));
        }

        // Keep active work with light compression
        if (content.activeWork) {
            compressed.activeWork = this.compressActiveWork(content.activeWork, aggressive);
        }

        // Keep blockers - these are critical
        if (content.blockers) {
            compressed.blockers = content.blockers;
        }

        return compressed;
    }

    /**
     * Compress important content (moderate compression)
     */
    async compressImportant(content, aggressive = false) {
        if (!content || Object.keys(content).length === 0) return content;

        const compressed = {};

        // Compress recent decisions to key points
        if (content.recentDecisions) {
            compressed.recentDecisions = content.recentDecisions.map(decision => ({
                title: decision.title,
                decision: this.summarizeText(decision.decision, aggressive ? 30 : 60),
                rationale: this.summarizeText(decision.rationale, aggressive ? 20 : 40),
                date: decision.date,
                impact: decision.impact
            }));
        }

        // Compress completed features to outcomes
        if (content.completedFeatures) {
            compressed.completedFeatures = content.completedFeatures.map(feature => ({
                name: feature.name,
                summary: this.summarizeText(feature.description, aggressive ? 25 : 50),
                completedDate: feature.completedDate,
                keyComponents: feature.keyComponents?.slice(0, 3), // Top 3 components
                testsPassing: feature.testsPassing
            }));
        }

        // Compress test results to key metrics
        if (content.testResults) {
            compressed.testResults = content.testResults.map(result => ({
                type: result.type,
                status: result.status,
                coverage: result.coverage,
                criticalFailures: result.criticalFailures,
                date: result.date
            }));
        }

        return compressed;
    }

    /**
     * Compress historical content (aggressive compression)
     */
    async compressHistorical(content) {
        if (!content || Object.keys(content).length === 0) return {};

        const compressed = {};

        // Compress old handoffs to just outcomes
        if (content.oldHandoffs && content.oldHandoffs.length > 0) {
            compressed.historicalHandoffs = {
                count: content.oldHandoffs.length,
                timeRange: {
                    earliest: content.oldHandoffs[0]?.timestamp,
                    latest: content.oldHandoffs[content.oldHandoffs.length - 1]?.timestamp
                },
                keyOutcomes: content.oldHandoffs
                    .filter(h => h.keyOutcomes)
                    .map(h => h.keyOutcomes)
                    .slice(0, 5) // Top 5 historical outcomes
            };
        }

        // Compress old decisions to decision log
        if (content.oldDecisions && content.oldDecisions.length > 0) {
            compressed.decisionLog = content.oldDecisions.map(decision => ({
                title: decision.title,
                date: decision.date,
                outcome: this.summarizeText(decision.decision, 20)
            }));
        }

        // Compress archived features to feature list
        if (content.archivedFeatures && content.archivedFeatures.length > 0) {
            compressed.featureHistory = {
                totalFeatures: content.archivedFeatures.length,
                majorFeatures: content.archivedFeatures
                    .filter(f => f.importance === 'major')
                    .map(f => ({
                        name: f.name,
                        completedDate: f.completedDate
                    }))
            };
        }

        return compressed;
    }

    /**
     * Generate high-level context summary
     */
    async generateContextSummary(contextData) {
        const summary = {
            projectState: this.summarizeProjectState(contextData),
            development: this.summarizeDevelopmentProgress(contextData),
            teamStatus: this.summarizeTeamStatus(contextData),
            upcomingWork: this.summarizeUpcomingWork(contextData)
        };

        return summary;
    }

    /**
     * Compress active work details
     */
    compressActiveWork(activeWork, aggressive = false) {
        const compressed = {};

        for (const [workId, work] of Object.entries(activeWork)) {
            compressed[workId] = {
                title: work.title,
                status: work.status,
                assignedAgent: work.assignedAgent,
                progress: work.progress,
                keyTasks: work.tasks?.slice(0, aggressive ? 2 : 5), // Limit tasks
                blockedOn: work.blockedOn,
                estimatedCompletion: work.estimatedCompletion
            };

            // Remove detailed descriptions if aggressive
            if (!aggressive && work.description) {
                compressed[workId].description = this.summarizeText(work.description, 75);
            }
        }

        return compressed;
    }

    /**
     * Smart text summarization
     */
    summarizeText(text, maxWords = 50) {
        if (!text || typeof text !== 'string') return text;

        const words = text.trim().split(/\s+/);
        if (words.length <= maxWords) return text;

        // Keep first part and important keywords
        const summary = words.slice(0, maxWords).join(' ');
        return summary + '...';
    }

    /**
     * Get recent items from array
     */
    getRecentItems(items, count) {
        if (!Array.isArray(items)) return [];
        return items.slice(-count);
    }

    /**
     * Get older items from array  
     */
    getOlderItems(items, skipRecent) {
        if (!Array.isArray(items)) return [];
        return items.slice(0, -skipRecent);
    }

    /**
     * Estimate token count (rough approximation)
     */
    estimateTokenCount(text) {
        if (!text) return 0;
        // Rough estimate: ~4 characters per token
        return Math.ceil(text.length / 4);
    }

    /**
     * Generate compression report
     */
    generateCompressionReport(original, compressed) {
        const report = {
            compressionTargets: {},
            tokensReduced: 0,
            itemsPreserved: 0,
            itemsCompressed: 0
        };

        for (const category of ['permanent', 'critical', 'important', 'historical', 'temporary']) {
            const originalSize = this.estimateTokenCount(JSON.stringify(original[category] || {}));
            const compressedSize = this.estimateTokenCount(JSON.stringify(compressed[category] || {}));

            report.compressionTargets[category] = {
                originalTokens: originalSize,
                compressedTokens: compressedSize,
                reduction: originalSize > 0 ? (1 - compressedSize / originalSize) * 100 : 0
            };

            report.tokensReduced += originalSize - compressedSize;
        }

        return report;
    }

    // Summary helper methods
    summarizeProjectState(contextData) {
        return {
            phase: contextData.project?.currentPhase || 'development',
            architecture: contextData.project?.architecture?.type || 'unknown',
            lastMajorChange: contextData.project?.lastMajorChange,
            healthScore: this.calculateProjectHealth(contextData)
        };
    }

    summarizeDevelopmentProgress(contextData) {
        const completed = contextData.session?.completedFeatures?.length || 0;
        const inProgress = Object.keys(contextData.session?.activeWork || {}).length;

        return {
            featuresCompleted: completed,
            activeWork: inProgress,
            recentVelocity: this.calculateVelocity(contextData.session?.completedFeatures),
            blockers: contextData.session?.blockers?.length || 0
        };
    }

    summarizeTeamStatus(contextData) {
        const agents = contextData.agents || {};
        const active = Object.keys(agents.activeAgents || {}).length;
        const pending = agents.handoffQueue?.length || 0;

        return {
            activeAgents: active,
            pendingHandoffs: pending,
            teamEfficiency: this.calculateTeamEfficiency(agents)
        };
    }

    summarizeUpcomingWork(contextData) {
        return {
            nextSprint: contextData.session?.nextSprint || 'undefined',
            priorityTasks: contextData.session?.priorityTasks?.slice(0, 3) || [],
            pendingDecisions: contextData.session?.pendingDecisions?.length || 0
        };
    }

    calculateProjectHealth(contextData) {
        // Simple health calculation based on multiple factors
        let score = 100;

        const blockers = contextData.session?.blockers?.length || 0;
        const failingTests = contextData.session?.testResults?.filter(t => t.status === 'failed')?.length || 0;

        score -= blockers * 10;
        score -= failingTests * 5;

        return Math.max(0, Math.min(100, score));
    }

    calculateVelocity(completedFeatures) {
        if (!completedFeatures || completedFeatures.length < 2) return 0;

        // Calculate features completed per week over last month
        const now = new Date();
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const recentFeatures = completedFeatures.filter(f =>
            new Date(f.completedDate) > lastMonth
        );

        return Math.round((recentFeatures.length / 4) * 10) / 10; // Per week
    }

    calculateTeamEfficiency(agents) {
        const active = Object.keys(agents.activeAgents || {}).length;
        const total = 20; // Approximate total agents available

        return Math.round((active / total) * 100);
    }
}

module.exports = ContextCompressor;