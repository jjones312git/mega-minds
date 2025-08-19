const fs = require('fs-extra');
const path = require('path');

/**
 * Complete a handoff - marks the handoff as completed and updates agent status
 */
async function completeHandoff(handoffId, completionSummary = '') {
    const projectPath = process.cwd();
    const stateDir = path.join(projectPath, '.mega-minds', 'state');
    const handoffQueuePath = path.join(stateDir, 'handoff-queue.json');
    
    try {
        // Ensure state directory exists
        await fs.ensureDir(stateDir);
        
        // Load current handoff queue
        let handoffQueue = { handoffs: [] };
        if (await fs.pathExists(handoffQueuePath)) {
            handoffQueue = await fs.readJson(handoffQueuePath);
        }
        
        // Find the handoff by ID
        const handoff = handoffQueue.handoffs.find(h => h.id === handoffId);
        if (!handoff) {
            console.error(`❌ Handoff with ID "${handoffId}" not found`);
            return false;
        }
        
        // Check if handoff is in the correct status to be completed
        if (handoff.status !== 'acknowledged' && handoff.status !== 'in-progress') {
            console.error(`❌ Handoff "${handoffId}" cannot be completed (current status: ${handoff.status})`);
            return false;
        }
        
        // Update handoff status
        handoff.status = 'completed';
        handoff.workStarted = true;
        handoff.completionTime = new Date().toISOString();
        handoff.completionSummary = completionSummary;
        
        // Calculate completion time if acknowledged
        if (handoff.acknowledgmentTime) {
            const ackTime = new Date(handoff.acknowledgmentTime);
            const compTime = new Date(handoff.completionTime);
            handoff.workDurationMs = compTime.getTime() - ackTime.getTime();
        }
        
        // Update queue statistics
        const completedCount = handoffQueue.handoffs.filter(h => h.status === 'completed').length;
        const totalCount = handoffQueue.handoffs.length;
        handoffQueue.completedCount = completedCount;
        handoffQueue.timestamp = new Date().toISOString();
        
        // Calculate average completion time
        const completedHandoffs = handoffQueue.handoffs.filter(h => h.workDurationMs);
        if (completedHandoffs.length > 0) {
            const totalDuration = completedHandoffs.reduce((sum, h) => sum + h.workDurationMs, 0);
            handoffQueue.averageCompletionTime = totalDuration / completedHandoffs.length;
        }
        
        // Save updated queue
        await fs.writeJson(handoffQueuePath, handoffQueue, { spaces: 2 });
        
        console.log(`✅ Handoff completed: ${handoff.fromAgent} → ${handoff.toAgent}`);
        console.log(`📋 Task: ${handoff.taskDescription}`);
        if (completionSummary) {
            console.log(`📝 Summary: ${completionSummary}`);
        }
        console.log(`⏰ Completed at: ${handoff.completionTime}`);
        
        if (handoff.workDurationMs) {
            const durationMinutes = Math.round(handoff.workDurationMs / 60000);
            console.log(`⏱️ Work duration: ${durationMinutes} minutes`);
        }
        
        // Update active agents status to show work completion
        const activeAgentsPath = path.join(stateDir, 'active-agents.json');
        if (await fs.pathExists(activeAgentsPath)) {
            const activeAgents = await fs.readJson(activeAgentsPath);
            
            if (activeAgents[handoff.toAgent]) {
                activeAgents[handoff.toAgent].status = 'completed';
                activeAgents[handoff.toAgent].lastUpdate = new Date().toISOString();
                activeAgents[handoff.toAgent].completionSummary = completionSummary;
                
                await fs.writeJson(activeAgentsPath, activeAgents, { spaces: 2 });
                console.log(`🏁 Updated ${handoff.toAgent} status to "completed"`);
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error completing handoff:', error.message);
        return false;
    }
}

module.exports = { completeHandoff };