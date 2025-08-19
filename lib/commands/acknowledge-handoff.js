const fs = require('fs-extra');
const path = require('path');

/**
 * Acknowledge a handoff - confirms that the receiving agent has received and understood the task
 */
async function acknowledgeHandoff(handoffId, acknowledgmentMessage = '') {
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
        
        // Check if handoff is in the correct status to be acknowledged
        if (handoff.status !== 'initiated') {
            console.error(`❌ Handoff "${handoffId}" cannot be acknowledged (current status: ${handoff.status})`);
            return false;
        }
        
        // Update handoff status
        handoff.status = 'acknowledged';
        handoff.acknowledged = true;
        handoff.acknowledgmentTime = new Date().toISOString();
        handoff.acknowledgmentMessage = acknowledgmentMessage;
        
        // Update queue statistics
        const acknowledgedCount = handoffQueue.handoffs.filter(h => h.acknowledged).length;
        const totalCount = handoffQueue.handoffs.length;
        handoffQueue.acknowledgedCount = acknowledgedCount;
        handoffQueue.acknowledgmentRate = totalCount > 0 ? (acknowledgedCount / totalCount) * 100 : 0;
        handoffQueue.timestamp = new Date().toISOString();
        
        // Save updated queue
        await fs.writeJson(handoffQueuePath, handoffQueue, { spaces: 2 });
        
        console.log(`✅ Handoff acknowledged: ${handoff.fromAgent} → ${handoff.toAgent}`);
        console.log(`📋 Task: ${handoff.taskDescription}`);
        if (acknowledgmentMessage) {
            console.log(`💬 Message: ${acknowledgmentMessage}`);
        }
        console.log(`⏰ Acknowledged at: ${handoff.acknowledgmentTime}`);
        
        // Update active agents status to show work has started
        const activeAgentsPath = path.join(stateDir, 'active-agents.json');
        if (await fs.pathExists(activeAgentsPath)) {
            const activeAgents = await fs.readJson(activeAgentsPath);
            
            if (activeAgents[handoff.toAgent]) {
                activeAgents[handoff.toAgent].status = 'working';
                activeAgents[handoff.toAgent].lastUpdate = new Date().toISOString();
                activeAgents[handoff.toAgent].handoffId = handoffId;
                
                await fs.writeJson(activeAgentsPath, activeAgents, { spaces: 2 });
                console.log(`🔄 Updated ${handoff.toAgent} status to "working"`);
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error acknowledging handoff:', error.message);
        return false;
    }
}

module.exports = { acknowledgeHandoff };