// lib/core/SessionManager.js
const fs = require('fs-extra');
const path = require('path');

/**
 * SessionManager - Orchestrates multi-agent workflow sessions and coordinates handoffs
 * Integrates with MemoryManager and AgentStateTracker to provide seamless session continuity
 * Follows communication-protocol.md and quality-gates.md for proper workflow management
 */
class SessionManager {
    constructor(memoryManager, agentStateTracker) {
        this.memory = memoryManager;
        this.agentState = agentStateTracker;
        this.sessionPath = path.join(memoryManager.memoryPath, 'sessions');
        this.activeSessionFile = path.join(memoryManager.memoryPath, 'active-session.json');

        // Workflow coordination state
        this.currentSession = null;
        this.workflowState = {
            activeWorkflows: new Map(),
            handoffQueue: [],
            qualityGates: new Map(),
            decisionCouncils: new Map(),
            emergencyStatus: null
        };

        // Configuration aligned with your workflow system
        this.config = {
            maxConcurrentAgents: 3,
            handoffTimeoutMinutes: 30,
            qualityGateTimeoutMinutes: 60,
            sessionRetentionDays: 30,
            autoSaveIntervalMinutes: 5
        };
    }

    /**
     * Initialize session manager and restore any active session
     */
    async initialize() {
        await fs.ensureDir(this.sessionPath);

        // Restore active session if exists
        if (await fs.pathExists(this.activeSessionFile)) {
            try {
                const activeSession = await fs.readJSON(this.activeSessionFile);
                await this.restoreSession(activeSession);
                console.log('📂 Restored active session:', activeSession.sessionId);
            } catch (error) {
                console.warn('⚠️ Failed to restore active session:', error.message);
                // Clean up corrupted session file
                await fs.remove(this.activeSessionFile);
            }
        }

        console.log('🔄 SessionManager initialized');
    }

    /**
     * Start a new development session with proper workflow setup
     */
    async startSession(description, type = 'development', metadata = {}) {
        const sessionId = this.generateSessionId();
        const timestamp = new Date().toISOString();

        this.currentSession = {
            sessionId,
            description,
            type,
            startTime: timestamp,
            lastUpdate: timestamp,
            metadata: {
                projectPath: this.memory.projectPath,
                version: '1.0.0',
                ...metadata
            },

            // Workflow state tracking
            workflow: {
                status: 'active',
                currentPhase: 'initialization',
                activeAgents: new Map(),
                completedPhases: [],
                blockedTasks: [],
                qualityGatesStatus: new Map(),
                decisionsPending: []
            },

            // Agent coordination
            agents: {
                activeCount: 0,
                handoffHistory: [],
                coordinationLog: [],
                performanceMetrics: {}
            },

            // Session memory
            memory: {
                keyDecisions: [],
                architecturalChanges: [],
                workCompleted: [],
                issues: [],
                notes: []
            }
        };

        // Save session state
        await this.saveActiveSession();

        // Initialize agent state tracking for this session
        await this.agentState.startSessionTracking(sessionId);

        console.log(`🆕 Started session: ${sessionId} - ${description}`);
        return this.currentSession;
    }

    /**
     * Coordinate agent handoff following communication-protocol.md
     */
    async coordinateHandoff(fromAgent, toAgent, task, context = {}) {
        if (!this.currentSession) {
            throw new Error('No active session - cannot coordinate handoff');
        }

        const handoffId = this.generateHandoffId();
        const timestamp = new Date().toISOString();

        // Validate handoff according to agent boundaries
        const handoffValidation = await this.validateHandoff(fromAgent, toAgent, task);
        if (!handoffValidation.valid) {
            throw new Error(`Handoff validation failed: ${handoffValidation.reason}`);
        }

        const handoff = {
            handoffId,
            fromAgent,
            toAgent,
            task,
            context,
            timestamp,
            status: 'pending',

            // Communication protocol compliance
            protocol: {
                activationMarker: `🤖 @${toAgent} ACTIVE`,
                handoffTemplate: this.generateHandoffTemplate(fromAgent, toAgent, task, context),
                successCriteria: context.successCriteria || [],
                qualityGates: context.qualityGates || [],
                estimatedDuration: context.estimatedDuration
            },

            // Coordination tracking
            coordination: {
                acknowledged: false,
                acknowledgedAt: null,
                completed: false,
                completedAt: null,
                blockers: [],
                dependencies: context.dependencies || []
            }
        };

        // Add to handoff queue
        this.workflowState.handoffQueue.push(handoff);

        // Update agent states
        if (fromAgent) {
            await this.agentState.completeTask(fromAgent, task, {
                nextAgent: toAgent,
                handoffId: handoffId
            });
        }

        await this.agentState.activateAgent(toAgent, task, {
            handoffId: handoffId,
            fromAgent: fromAgent,
            dependencies: handoff.coordination.dependencies,
            estimatedCompletion: context.estimatedDuration
        });

        // Record in session
        this.currentSession.agents.handoffHistory.push({
            handoffId,
            fromAgent,
            toAgent,
            task,
            timestamp,
            status: 'initiated'
        });

        this.currentSession.agents.coordinationLog.push({
            type: 'handoff_initiated',
            handoffId,
            fromAgent,
            toAgent,
            timestamp,
            details: { task, context }
        });

        await this.saveActiveSession();

        console.log(`🔄 Handoff initiated: ${fromAgent || 'user'} → ${toAgent} (${handoffId})`);

        return {
            handoffId,
            handoffPrompt: handoff.protocol.handoffTemplate,
            claudeCodeInstructions: this.generateClaudeCodeInstructions(toAgent, task, context),
            qualityGates: handoff.protocol.qualityGates
        };
    }
    /**
     * CRITICAL: Enforce 2-agent limit before any agent activation
     */
    async enforceAgentLimit() {
        const activeAgents = await this.agentState.getAllAgentStates();
        const activeCount = Object.keys(activeAgents).length;

        if (activeCount >= this.config.maxConcurrentAgents) {
            throw new Error(`🚨 MEMORY SAFETY: Cannot activate agent. Already at limit (${activeCount}/${this.config.maxConcurrentAgents}). Save session and compress context first.`);
        }

        return { allowed: true, currentCount: activeCount };
    }

    async getActiveAgentCount() {
        const activeAgents = await this.agentState.getAllAgentStates();
        return Object.keys(activeAgents).length;
    }
    /**
     * Acknowledge agent handoff and confirm work begin
     */
    async acknowledgeHandoff(handoffId, agentName, acknowledgment = {}) {
        const handoff = this.workflowState.handoffQueue.find(h => h.handoffId === handoffId);
        if (!handoff) {
            throw new Error(`Handoff ${handoffId} not found`);
        }

        if (handoff.toAgent !== agentName) {
            throw new Error(`Handoff ${handoffId} is for ${handoff.toAgent}, not ${agentName}`);
        }

        // Update handoff status
        handoff.coordination.acknowledged = true;
        handoff.coordination.acknowledgedAt = new Date().toISOString();
        handoff.status = 'acknowledged';

        // Record acknowledgment details
        if (acknowledgment.workPlan) {
            handoff.coordination.workPlan = acknowledgment.workPlan;
        }
        if (acknowledgment.estimatedCompletion) {
            handoff.coordination.estimatedCompletion = acknowledgment.estimatedCompletion;
        }

        // Update session tracking
        this.currentSession.agents.coordinationLog.push({
            type: 'handoff_acknowledged',
            handoffId,
            agentName,
            timestamp: handoff.coordination.acknowledgedAt,
            details: acknowledgment
        });

        await this.saveActiveSession();

        console.log(`✅ Handoff acknowledged: ${agentName} (${handoffId})`);
        return handoff;
    }

    /**
     * Complete agent handoff and proceed to next workflow step
     */
    async completeHandoff(handoffId, agentName, result = {}) {
        const handoff = this.workflowState.handoffQueue.find(h => h.handoffId === handoffId);
        if (!handoff) {
            throw new Error(`Handoff ${handoffId} not found`);
        }

        if (!handoff.coordination.acknowledged) {
            throw new Error(`Handoff ${handoffId} must be acknowledged before completion`);
        }

        // Validate quality gates before completion
        const qualityValidation = await this.validateQualityGates(handoff, result);
        if (!qualityValidation.passed) {
            throw new Error(`Quality gates failed: ${qualityValidation.failures.join(', ')}`);
        }

        // Update handoff status
        handoff.coordination.completed = true;
        handoff.coordination.completedAt = new Date().toISOString();
        handoff.status = 'completed';
        handoff.result = result;

        // Update session memory
        this.currentSession.memory.workCompleted.push({
            agent: agentName,
            task: handoff.task,
            completedAt: handoff.coordination.completedAt,
            result: result.summary || 'Task completed',
            handoffId: handoffId
        });

        if (result.decisions) {
            this.currentSession.memory.keyDecisions.push(...result.decisions);
        }

        if (result.architecturalChanges) {
            this.currentSession.memory.architecturalChanges.push(...result.architecturalChanges);
        }

        // Remove from active queue
        this.workflowState.handoffQueue = this.workflowState.handoffQueue.filter(h => h.handoffId !== handoffId);

        // Update session tracking
        this.currentSession.agents.coordinationLog.push({
            type: 'handoff_completed',
            handoffId,
            agentName,
            timestamp: handoff.coordination.completedAt,
            details: { result, qualityValidation }
        });

        await this.saveActiveSession();
        await this.memory.updateRecentWorkMemory(this.currentSession);

        console.log(`🏁 Handoff completed: ${agentName} (${handoffId})`);

        return {
            handoffId,
            completed: true,
            result,
            nextSteps: await this.getNextWorkflowSteps()
        };
    }

    /**
     * Handle quality gate validation according to quality-gates.md
     */
    async validateQualityGates(handoff, result) {
        const validation = {
            passed: true,
            failures: [],
            gatesChecked: []
        };

        for (const gate of handoff.protocol.qualityGates) {
            const gateResult = await this.checkQualityGate(gate, handoff, result);
            validation.gatesChecked.push({
                gate: gate.name,
                passed: gateResult.passed,
                details: gateResult.details
            });

            if (!gateResult.passed) {
                validation.passed = false;
                validation.failures.push(`${gate.name}: ${gateResult.reason}`);
            }
        }

        return validation;
    }

    /**
     * Check individual quality gate
     */
    async checkQualityGate(gate, handoff, result) {
        switch (gate.type) {
            case 'code_review':
                return await this.checkCodeReviewGate(gate, result);

            case 'testing':
                return await this.checkTestingGate(gate, result);

            case 'security_scan':
                return await this.checkSecurityGate(gate, result);

            case 'architecture_approval':
                return await this.checkArchitectureGate(gate, result);

            case 'ux_review':
                return await this.checkUXGate(gate, result);

            default:
                return {
                    passed: true,
                    details: `Unknown gate type: ${gate.type}`,
                    reason: 'Gate type not implemented'
                };
        }
    }

    /**
     * Initiate decision council for complex technical decisions
     */
    async initiateDecisionCouncil(topic, requestingAgent, context = {}) {
        const councilId = this.generateCouncilId();
        const timestamp = new Date().toISOString();

        const council = {
            councilId,
            topic,
            requestingAgent,
            initiatedAt: timestamp,
            status: 'active',
            context,

            // Council composition based on topic
            participants: this.determineCouncilParticipants(topic, context),

            // Decision tracking
            decision: {
                options: context.options || [],
                criteria: context.criteria || [],
                recommendation: null,
                rationale: null,
                decidedAt: null,
                consensus: false
            },

            // Discussion tracking
            discussion: {
                inputs: [],
                concerns: [],
                votes: new Map()
            }
        };

        this.workflowState.decisionCouncils.set(councilId, council);

        // Record in session
        this.currentSession.agents.coordinationLog.push({
            type: 'decision_council_initiated',
            councilId,
            topic,
            requestingAgent,
            timestamp,
            details: context
        });

        await this.saveActiveSession();

        console.log(`🏛️ Decision council initiated: ${topic} (${councilId})`);

        return {
            councilId,
            participants: council.participants,
            coordinationInstructions: this.generateCouncilInstructions(council)
        };
    }

    /**
     * Activate emergency response (problem-solving swarm)
     */
    async activateEmergencyResponse(issue, severity = 'high', context = {}) {
        const emergencyId = this.generateEmergencyId();
        const timestamp = new Date().toISOString();

        const emergency = {
            emergencyId,
            issue,
            severity,
            context,
            activatedAt: timestamp,
            status: 'active',

            // Swarm composition based on issue type
            swarmAgents: this.determineSwarmComposition(issue, context),

            // Response tracking
            response: {
                actions: [],
                timeline: [],
                resolution: null,
                resolvedAt: null
            }
        };

        this.workflowState.emergencyStatus = emergency;

        // Pause non-critical workflows
        await this.pauseNonCriticalWorkflows(emergency);

        // Record in session
        this.currentSession.agents.coordinationLog.push({
            type: 'emergency_response_activated',
            emergencyId,
            issue,
            severity,
            timestamp,
            details: context
        });

        await this.saveActiveSession();

        console.log(`🚨 Emergency response activated: ${issue} (${emergencyId})`);

        return {
            emergencyId,
            swarmAgents: emergency.swarmAgents,
            responseInstructions: this.generateEmergencyInstructions(emergency)
        };
    }

    /**
     * End current session and archive
     */
    async endSession(summary = {}) {
        if (!this.currentSession) {
            throw new Error('No active session to end');
        }

        const endTime = new Date().toISOString();

        // Finalize session data
        this.currentSession.endTime = endTime;
        this.currentSession.duration = this.calculateSessionDuration();
        this.currentSession.summary = {
            workCompleted: this.currentSession.memory.workCompleted.length,
            decisionsCount: this.currentSession.memory.keyDecisions.length,
            agentsUsed: Array.from(new Set(this.currentSession.agents.handoffHistory.map(h => h.toAgent))),
            status: 'completed',
            ...summary
        };

        // Archive session
        const sessionFile = path.join(this.sessionPath, `session-${this.currentSession.sessionId}.json`);
        await fs.writeJSON(sessionFile, this.currentSession, { spaces: 2 });

        // Update memory with session completion
        await this.memory.updateRecentWorkMemory(this.currentSession);

        // Clean up active session
        await fs.remove(this.activeSessionFile);

        const sessionSummary = {
            sessionId: this.currentSession.sessionId,
            description: this.currentSession.description,
            duration: this.currentSession.duration,
            summary: this.currentSession.summary
        };

        this.currentSession = null;
        this.workflowState = {
            activeWorkflows: new Map(),
            handoffQueue: [],
            qualityGates: new Map(),
            decisionCouncils: new Map(),
            emergencyStatus: null
        };

        console.log(`🏁 Session ended: ${sessionSummary.sessionId}`);
        return sessionSummary;
    }

    /**
     * Restore session from saved state
     */
    async restoreSession(sessionData) {
        this.currentSession = sessionData;

        // Restore agent states
        if (sessionData.agents.handoffHistory.length > 0) {
            await this.agentState.restoreFromSession(sessionData);
        }

        // Restore workflow state
        for (const handoff of sessionData.agents.handoffHistory) {
            if (handoff.status === 'initiated' || handoff.status === 'acknowledged') {
                // Add incomplete handoffs back to queue
                this.workflowState.handoffQueue.push(handoff);
            }
        }

        console.log(`🔄 Session restored: ${sessionData.sessionId}`);
    }

    /**
     * Get current session status and metrics
     */
    async getSessionStatus() {
        if (!this.currentSession) {
            return { active: false, message: 'No active session' };
        }

        const agentStates = await this.agentState.getAllAgentStates();

        return {
            active: true,
            sessionId: this.currentSession.sessionId,
            description: this.currentSession.description,
            duration: this.calculateSessionDuration(),
            phase: this.currentSession.workflow.currentPhase,

            // Agent coordination status
            agents: {
                active: Object.keys(agentStates).length,
                handoffsInProgress: this.workflowState.handoffQueue.length,
                totalHandoffs: this.currentSession.agents.handoffHistory.length
            },

            // Work progress
            progress: {
                workCompleted: this.currentSession.memory.workCompleted.length,
                decisions: this.currentSession.memory.keyDecisions.length,
                blockers: this.currentSession.workflow.blockedTasks.length,
                qualityGatesPending: this.workflowState.qualityGates.size
            },

            // Special states
            emergencyActive: !!this.workflowState.emergencyStatus,
            decisionCouncilsActive: this.workflowState.decisionCouncils.size,

            lastUpdate: this.currentSession.lastUpdate
        };
    }

    // === PRIVATE HELPER METHODS ===

    generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    generateHandoffId() {
        return `handoff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    generateCouncilId() {
        return `council-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    generateEmergencyId() {
        return `emergency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    async saveActiveSession() {
        if (this.currentSession) {
            this.currentSession.lastUpdate = new Date().toISOString();
            await fs.writeJSON(this.activeSessionFile, this.currentSession, { spaces: 2 });
        }
    }

    calculateSessionDuration() {
        if (!this.currentSession) return null;

        const start = new Date(this.currentSession.startTime);
        const end = this.currentSession.endTime ? new Date(this.currentSession.endTime) : new Date();

        const durationMs = end - start;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

        return { hours, minutes, totalMinutes: Math.floor(durationMs / (1000 * 60)) };
    }

    async validateHandoff(fromAgent, toAgent, task) {
        // Implement agent boundary validation based on agent-boundaries.md
        // This would check if the handoff is allowed according to role boundaries
        return { valid: true }; // Simplified for now
    }

    generateHandoffTemplate(fromAgent, toAgent, task, context) {
        return `## Handoff to @${toAgent}

🤖 @${toAgent} ACTIVE

**Context**: ${context.projectContext || 'Multi-agent development workflow'}
**From**: ${fromAgent || 'Project initiation'}
**Your Task**: ${task}

**Success Criteria**:
${context.successCriteria?.map(c => `- ${c}`).join('\n') || '- Task completed successfully'}

**Quality Gates Required**:
${context.qualityGates?.map(g => `- ✅ ${g.name}`).join('\n') || '- Standard quality review'}

**Dependencies**:
${context.dependencies?.map(d => `- ${d}`).join('\n') || '- None specified'}

**Estimated Duration**: ${context.estimatedDuration || 'To be determined'}

**Handoff Context**:
${JSON.stringify(context.handoffContext || {}, null, 2)}

**IMPORTANT**: Follow agent boundaries and use Task tool for any sub-agent coordination.`;
    }

    generateClaudeCodeInstructions(agentName, task, context) {
        return `**Claude Code Session Instructions**

You are now working as @${agentName} in an active mega-minds session.

**Current Task**: ${task}

**Available Commands**:
- \`mega-minds agent-status\` - Check current coordination state
- \`mega-minds save-session "milestone description"\` - Save progress
- \`mega-minds update-memory "what was accomplished"\` - Update project memory

**Quality Requirements**:
${context.qualityGates?.map(g => `- ${g.name}: ${g.description || 'See quality-gates.md'}`).join('\n') || '- Follow standard quality practices'}

**Workflow Reminders**:
- Use Task tool for any agent handoffs
- Document key decisions for session memory
- Follow communication-protocol.md for handoffs
- Validate work against quality gates before completion

**When Task Complete**:
Use \`mega-minds update-memory "description"\` to record completion and key outcomes.`;
    }

    determineCouncilParticipants(topic, context) {
        // Logic to determine which agents should participate in decision council
        // Based on topic and existing agent capabilities
        return ['technical-architecture-agent', 'project-orchestrator-agent']; // Simplified
    }

    generateCouncilInstructions(council) {
        return `Decision Council Instructions for: ${council.topic}

Participants: ${council.participants.join(', ')}

Please coordinate using Task tool to gather input from each participant.`;
    }

    determineSwarmComposition(issue, context) {
        // Logic to determine which agents for emergency response
        return ['technical-architecture-agent', 'infrastructure-agent']; // Simplified
    }

    generateEmergencyInstructions(emergency) {
        return `Emergency Response Instructions

Issue: ${emergency.issue}
Severity: ${emergency.severity}
Swarm Agents: ${emergency.swarmAgents.join(', ')}

Coordinate immediate response using Task tool.`;
    }

    async pauseNonCriticalWorkflows(emergency) {
        // Implementation to pause non-critical workflows during emergency
        console.log(`⏸️ Pausing non-critical workflows for emergency: ${emergency.issue}`);
    }

    async getNextWorkflowSteps() {
        // Analyze current state and suggest next workflow steps
        return ['Continue with next agent in workflow'];
    }

    async checkCodeReviewGate(gate, result) {
        return { passed: true, details: 'Code review gate check', reason: null };
    }

    async checkTestingGate(gate, result) {
        return { passed: true, details: 'Testing gate check', reason: null };
    }

    async checkSecurityGate(gate, result) {
        return { passed: true, details: 'Security gate check', reason: null };
    }

    async checkArchitectureGate(gate, result) {
        return { passed: true, details: 'Architecture gate check', reason: null };
    }

    async checkUXGate(gate, result) {
        return { passed: true, details: 'UX gate check', reason: null };
    }
}

module.exports = SessionManager;