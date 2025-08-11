// lib/memory/TokenManager.js
class TokenManager {
    constructor() {
        this.tokenLimit = 200000; // Claude Sonnet 4 limit
        this.compressionThreshold = 160000; // 80% threshold
    }

    countTokens(text) {
        // Simple approximation: ~4 characters per token
        return Math.ceil(text.length / 4);
    }

    async manageContext(memories, newContent) {
        const totalContent = this.combineMemories(memories) + '\n' + newContent;
        const currentTokens = this.countTokens(totalContent);

        console.log(`📊 Current tokens: ${currentTokens}/${this.tokenLimit}`);

        if (currentTokens > this.compressionThreshold) {
            console.log('🗜️ Compressing context to fit token limits...');
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

    // Also update compressContext method to match:
    async compressContext(memories, newContent) {
        // Keep most important info
        let compressed = '# Claude Configuration (Essential)\n' + (memories.claude || '');

        // Add recent work summary  
        if (memories.recentWork) {
            const recentLines = memories.recentWork.split('\n').slice(0, 10); // Keep first 10 lines
            compressed += '\n\n# Recent Work Summary\n' + recentLines.join('\n');
        }

        // Keep active agent states
        if (memories.agentStates && Object.keys(memories.agentStates).length > 0) {
            compressed += '\n\n# Active Agents\n' + JSON.stringify(memories.agentStates, null, 2);
        }

        // Add new content
        compressed += '\n\n# Current Request\n' + newContent;

        const finalTokens = this.countTokens(compressed);
        console.log(`✅ Compressed to ${finalTokens} tokens`);

        return {
            content: compressed,
            tokenCount: finalTokens,
            compressed: true
        };
    }
}

module.exports = TokenManager;