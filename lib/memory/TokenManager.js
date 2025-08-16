// lib/memory/TokenManager.js - Complete memory-optimized version
class TokenManager {
    constructor() {
        this.tokenLimit = 100000; // Reduced from 200000 for better memory management
        this.compressionThreshold = 60000; // Reduced from 160000 (60% threshold)
        this.emergencyThreshold = 80000; // Emergency compression at 80%
        this.maxHistoryLines = 20; // Limit historical data retention
        this.maxAgentStates = 5; // Limit agent state retention
    }

    countTokens(text) {
        // More accurate token counting for memory management
        return Math.ceil(text.length / 3.5); // Slightly more conservative than original /4
    }

    async manageContext(memories, newContent) {
        const totalContent = this.combineMemories(memories) + '\n' + newContent;
        const currentTokens = this.countTokens(totalContent);

        console.log(`📊 Current tokens: ${currentTokens}/${this.tokenLimit}`);

        if (currentTokens > this.emergencyThreshold) {
            console.log('🚨 Emergency compression - high memory usage detected');
            return await this.emergencyCompression(memories, newContent);
        } else if (currentTokens > this.compressionThreshold) {
            console.log('🗜️ Standard compression to manage memory...');
            return await this.compressContext(memories, newContent);
        }

        return {
            content: totalContent,
            tokenCount: currentTokens,
            compressed: false
        };
    }

    combineMemories(memories) {
        return [
            '# Claude Configuration\n' + (memories.claude || ''),
            '# Recent Work\n' + (memories.recentWork || ''),
            '# Architecture\n' + (memories.architecture || ''),
            '# Agent States\n' + JSON.stringify(memories.agentStates || {}, null, 2)
        ].join('\n\n');
    }

    // Emergency compression for high memory situations
    async emergencyCompression(memories, newContent) {
        console.log('⚠️ Applying emergency memory compression');

        // Keep only absolutely essential information
        let compressed = '# Project Configuration\n';

        // Extract only project name and type from claude config
        if (memories.claude) {
            const lines = memories.claude.split('\n');
            const projectLine = lines.find(l => l.includes('Project:'));
            const typeLine = lines.find(l => l.includes('Type:'));
            const commandLines = lines.filter(l => l.includes('mega-minds')).slice(0, 3);

            if (projectLine) compressed += projectLine + '\n';
            if (typeLine) compressed += typeLine + '\n';
            if (commandLines.length > 0) {
                compressed += '\n# Memory Commands\n' + commandLines.join('\n') + '\n';
            }
        }

        // Keep only current active work (last 5 lines)
        if (memories.recentWork) {
            const recentLines = memories.recentWork.split('\n')
                .filter(line =>
                    line.includes('✅') ||
                    line.includes('Current:') ||
                    line.includes('Active:') ||
                    line.includes('Working:')
                )
                .slice(-5);
            if (recentLines.length > 0) {
                compressed += '\n# Current Work\n' + recentLines.join('\n');
            }
        }

        // Keep only active agents, remove completed tasks and excessive detail
        if (memories.agentStates) {
            const activeOnly = {};
            for (const [agentName, state] of Object.entries(memories.agentStates)) {
                if (state.status === 'active') {
                    activeOnly[agentName] = {
                        status: state.status,
                        task: this.truncateString(state.task, 100),
                        progress: state.progress
                    };
                }
            }
            if (Object.keys(activeOnly).length > 0) {
                compressed += '\n# Active Agents\n' + JSON.stringify(activeOnly, null, 1);
            }
        }

        // Architecture - keep only key decisions
        if (memories.architecture) {
            const archLines = memories.architecture.split('\n')
                .filter(line =>
                    line.includes('# ') ||
                    line.includes('**Tech Stack**') ||
                    line.includes('**Database**') ||
                    line.includes('**Frontend**') ||
                    line.includes('**Backend**')
                )
                .slice(0, 8);
            if (archLines.length > 0) {
                compressed += '\n\n# Architecture Essentials\n' + archLines.join('\n');
            }
        }

        // Truncate new content if necessary
        const contentLimit = this.tokenLimit - this.countTokens(compressed) - 1000;
        const truncatedContent = this.truncateContent(newContent, contentLimit);
        compressed += '\n\n# Current Request\n' + truncatedContent;

        const finalTokens = this.countTokens(compressed);
        console.log(`✅ Emergency compressed to ${finalTokens} tokens`);

        return {
            content: compressed,
            tokenCount: finalTokens,
            compressed: true,
            emergency: true
        };
    }

    // Improved regular compression
    async compressContext(memories, newContent) {
        let compressed = '# Essential Configuration\n';

        // Keep core project info
        if (memories.claude) {
            const importantLines = memories.claude.split('\n')
                .filter(line =>
                    line.includes('Project:') ||
                    line.includes('Type:') ||
                    line.includes('Tech Stack:') ||
                    line.includes('mega-minds') ||
                    line.includes('Memory Management') ||
                    line.includes('Development Guidelines')
                ).slice(0, 12);
            compressed += importantLines.join('\n');
        }

        // Keep recent work summary (last 15 lines, prioritize recent)
        if (memories.recentWork) {
            const allLines = memories.recentWork.split('\n');
            const recentLines = allLines.slice(-this.maxHistoryLines);
            // Also grab any lines with status indicators
            const statusLines = allLines.filter(line =>
                line.includes('✅') ||
                line.includes('🔄') ||
                line.includes('❌') ||
                line.includes('Current Sprint') ||
                line.includes('Next Milestone')
            ).slice(-10);

            const combinedLines = [...new Set([...statusLines, ...recentLines])]; // Remove duplicates
            compressed += '\n\n# Recent Work\n' + combinedLines.join('\n');
        }

        // Keep architecture essentials - focus on tech decisions
        if (memories.architecture) {
            const archLines = memories.architecture.split('\n')
                .filter(line =>
                    line.includes('#') ||
                    line.includes('Technology:') ||
                    line.includes('Database:') ||
                    line.includes('Frontend:') ||
                    line.includes('Backend:') ||
                    line.includes('**Tech Stack**') ||
                    line.includes('Decision Log')
                ).slice(0, 15);
            if (archLines.length > 0) {
                compressed += '\n\n# Architecture\n' + archLines.join('\n');
            }
        }

        // Keep active agent states only - compressed format
        if (memories.agentStates) {
            const relevantAgents = {};
            let agentCount = 0;

            for (const [agentName, state] of Object.entries(memories.agentStates)) {
                if (state.status === 'active' && agentCount < this.maxAgentStates) {
                    relevantAgents[agentName] = {
                        status: state.status,
                        task: this.truncateString(state.task, 150),
                        progress: state.progress,
                        startTime: state.startTime
                    };
                    agentCount++;
                }
            }

            if (Object.keys(relevantAgents).length > 0) {
                compressed += '\n\n# Active Agents\n' + JSON.stringify(relevantAgents, null, 1);
            }
        }

        compressed += '\n\n# Current Request\n' + newContent;

        const finalTokens = this.countTokens(compressed);
        console.log(`✅ Compressed to ${finalTokens} tokens`);

        return {
            content: compressed,
            tokenCount: finalTokens,
            compressed: true
        };
    }

    // Utility methods for content management
    truncateContent(content, maxTokens) {
        const maxChars = maxTokens * 3.5;
        if (content.length <= maxChars) return content;

        // Try to truncate at word boundaries
        const truncated = content.substring(0, maxChars);
        const lastSpace = truncated.lastIndexOf(' ');
        const finalContent = lastSpace > maxChars * 0.8 ?
            truncated.substring(0, lastSpace) :
            truncated;

        return finalContent + '\n\n[Content truncated for memory management]';
    }

    truncateString(str, maxLength) {
        if (!str || str.length <= maxLength) return str;
        return str.substring(0, maxLength - 3) + '...';
    }

    // Memory health check method
    getMemoryHealth(memories, newContent) {
        const totalContent = this.combineMemories(memories) + '\n' + newContent;
        const currentTokens = this.countTokens(totalContent);

        const health = {
            tokenCount: currentTokens,
            tokenLimit: this.tokenLimit,
            utilizationPercent: Math.round((currentTokens / this.tokenLimit) * 100),
            compressionNeeded: currentTokens > this.compressionThreshold,
            emergencyNeeded: currentTokens > this.emergencyThreshold,
            status: 'healthy'
        };

        if (health.emergencyNeeded) {
            health.status = 'critical';
        } else if (health.compressionNeeded) {
            health.status = 'warning';
        } else if (health.utilizationPercent > 50) {
            health.status = 'moderate';
        }

        return health;
    }
}

module.exports = TokenManager;