// lib/core/AIDevTeam.js
const MemoryManager = require('../memory/MemoryManager');
const TokenManager = require('../memory/TokenManager');
const AgentDispatcher = require('./AgentDispatcher');
const AgentStateTracker = require('../memory/AgentStateTracker');
const SessionManager = require('./SessionManager');
const path = require('path');

class AIDevTeam {
    constructor(projectPath = process.cwd()) {
        this.projectPath = projectPath;
        this.memory = new MemoryManager(projectPath);
        this.tokens = new TokenManager();
        this.agentState = new AgentStateTracker(projectPath);
        this.dispatcher = new AgentDispatcher(this.memory, this.agentState);
        this.sessions = new SessionManager(this.memory, this.agentState);

        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        console.log('🧠 Initializing AI Development Team...');

        await this.memory.initialize();
        await this.agentState.initialize();
        await this.sessions.initialize();  // Initialize SessionManager

        // Load previous session if it exists
        const lastSession = await this.memory.loadLatestSession();
        if (lastSession) {
            console.log('📂 Resuming from previous session...');
            await this.agentState.restoreFromSession(lastSession);
        }

        this.initialized = true;
        console.log('✅ AI Development Team ready!');
    }

    async handleRequest(userRequest) {
        await this.initialize();

        console.log(`\n🎯 Processing request: "${userRequest}"`);

        // 1. Analyze and route the request
        const plan = await this.dispatcher.routeRequest(userRequest);
        console.log(`📋 Execution plan: ${plan.type} (${plan.estimatedSteps} steps)`);

        // 2. Check token limits and manage context
        const context = await this.loadProjectContext();
        const optimizedContext = await this.tokens.manageContext(context, userRequest);

        if (optimizedContext.compressed) {
            console.log('🗜️ Context compressed to fit token limits');
        }

        // 3. Execute the plan
        const result = await this.executePlan(plan, optimizedContext);

        // 4. Update memory and save session
        await this.updateProjectMemory(result);

        return result;
    }

    async loadProjectContext() {
        const claudeContent = await fs.readFile(this.memory.claudeFile, 'utf8').catch(() => '');
        const recentWork = await fs.readFile(
            path.join(this.memory.memoryFilesPath, 'recent-work.md'), 'utf8'
        ).catch(() => '');
        const architecture = await fs.readFile(
            path.join(this.memory.memoryFilesPath, 'architecture.md'), 'utf8'
        ).catch(() => '');

        // Transform to match TokenManager expectations
        return {
            project: claudeContent + '\n\n' + architecture, // Combine for project context
            session: {
                recentWork: recentWork,
                timestamp: new Date().toISOString()
            },
            agents: await this.agentState.getAllAgentStates()
        };
    }

    async executePlan(plan, context) {
        const execution = {
            plan: plan,
            startTime: new Date().toISOString(),
            steps: [],
            agentWork: {},
            decisions: [],
            result: null
        };

        try {
            if (plan.type === 'single-agent') {
                execution.result = await this.executeSingleAgent(plan, context, execution);
            } else {
                execution.result = await this.executeMultiAgent(plan, context, execution);
            }

            execution.status = 'completed';
            execution.endTime = new Date().toISOString();

        } catch (error) {
            execution.status = 'failed';
            execution.error = error.message;
            execution.endTime = new Date().toISOString();
            console.error('❌ Execution failed:', error.message);
        }

        return execution;
    }

    async executeSingleAgent(plan, context, execution) {
        const agentName = plan.agents[0];
        console.log(`🤖 Executing with ${agentName} agent`);

        // Update agent state
        await this.dispatcher.updateAgentState(agentName, plan.request, 'active');

        // Generate the handoff prompt for Claude Code
        const handoffPrompt = this.generateHandoffPrompt(agentName, plan, context);

        execution.steps.push({
            agent: agentName,
            action: 'primary_execution',
            prompt: handoffPrompt,
            timestamp: new Date().toISOString()
        });

        execution.agentWork[agentName] = {
            status: 'active',
            task: plan.request,
            handoffPrompt: handoffPrompt
        };

        return {
            type: 'single-agent',
            primaryAgent: agentName,
            handoffPrompt: handoffPrompt,
            instructions: this.generateClaudeCodeInstructions(agentName, plan),
            context: context
        };
    }

    async executeMultiAgent(plan, context, execution) {
        console.log(`🔄 Multi-agent execution: ${plan.agents.join(' → ')}`);

        const workflow = [];

        for (let i = 0; i < plan.agents.length; i++) {
            const agentName = plan.agents[i];
            const isLast = i === plan.agents.length - 1;
            const nextAgent = isLast ? null : plan.agents[i + 1];

            // Update agent state
            await this.dispatcher.updateAgentState(agentName, plan.request, 'queued');

            const handoffPrompt = this.generateHandoffPrompt(agentName, plan, context, nextAgent);

            workflow.push({
                step: i + 1,
                agent: agentName,
                handoffPrompt: handoffPrompt,
                nextAgent: nextAgent
            });

            execution.steps.push({
                agent: agentName,
                action: 'multi_agent_step',
                step: i + 1,
                prompt: handoffPrompt,
                timestamp: new Date().toISOString()
            });

            execution.agentWork[agentName] = {
                status: 'queued',
                task: plan.request,
                step: i + 1,
                handoffPrompt: handoffPrompt
            };
        }

        return {
            type: 'multi-agent',
            workflow: workflow,
            instructions: this.generateMultiAgentInstructions(plan),
            context: context
        };
    }

    generateHandoffPrompt(agentName, plan, context, nextAgent = null) {
        const agentTemplate = this.getAgentTemplate(agentName);

        let prompt = `## Handoff to @${agentName}-agent

🤖 @${agentName}-agent ACTIVE

**Context**: ${this.generateContextSummary(context)}

**Your Task**: ${plan.request}

**Agent Specialization**: ${agentTemplate.expertise}

**Success Criteria**:
- Complete the requested work within your specialization
- Follow the established coding standards and architecture
- Document any decisions or changes made
- Prepare clear handoff information if other agents need to continue

**Requirements & Constraints**:
- Follow the project's established patterns and conventions
- Ensure all work passes quality gates before completion
- Update project memory with any architectural decisions

**Integration Points**:
- Coordinate with other agents as needed
- Maintain consistency with existing project structure
- Follow the communication protocols for agent handoffs`;

        if (nextAgent) {
            prompt += `

**Next Agent**: After completing your work, hand off to @${nextAgent}-agent with:
- Summary of work completed
- Any decisions or changes made
- Context needed for ${nextAgent} to continue
- Clear success criteria for the next phase`;
        }

        prompt += `

**Timeline**: Please complete this work efficiently while maintaining quality standards.

@${agentName}-agent - You are now active and responsible for this task.`;

        return prompt;
    }

    generateClaudeCodeInstructions(agentName, plan) {
        return `**Claude Code Instructions:**

You are now working with the @${agentName}-agent specialization.

**Your current task**: ${plan.request}

**How to proceed**:
1. Review the agent's specialization and capabilities
2. Use the handoff prompt above as your working context
3. Execute the task according to the agent's expertise
4. When complete, update the project memory using:
   \`mega-minds update-memory "description of what was completed"\`

**Available commands**:
- \`mega-minds agent-status\` - Check current agent states
- \`mega-minds save-session "description"\` - Save your work session
- \`mega-minds compress-context\` - If approaching token limits

**Quality reminders**:
- Follow the project's coding standards
- Document important decisions
- Test your implementations
- Update relevant documentation`;
    }

    generateMultiAgentInstructions(plan) {
        return `**Multi-Agent Workflow Instructions:**

This request requires coordination between multiple agents: ${plan.agents.join(' → ')}

**Recommended approach**:
1. Start with the first agent in the workflow
2. Complete each agent's work fully before moving to the next
3. Use proper handoff protocols between agents
4. Maintain context and decision continuity

**Workflow steps**:
${plan.workflow.map((step, i) => `${i + 1}. ${step}`).join('\n')}

**Commands to help coordination**:
- \`mega-minds agent-status\` - See workflow progress
- \`mega-minds save-session "step description"\` - Save progress at each step
- \`mega-minds update-memory "decision or change"\` - Document important decisions

**Quality checkpoints**:
- Ensure each agent's work aligns with the overall goal
- Validate handoffs contain all necessary context
- Confirm the final result meets all requirements`;
    }

    generateContextSummary(context) {
        // Create a concise summary of the current project context
        const lines = context.claude.split('\n').slice(0, 10);
        return lines.join('\n').substring(0, 500) + '...';
    }

    getAgentTemplate(agentName) {
        // This would load from your existing agent templates
        // For now, return basic info
        return {
            expertise: `${agentName} development and implementation`
        };
    }

    async updateProjectMemory(result) {
        // Update recent work memory with the execution result
        const sessionData = {
            description: `Executed: ${result.plan.request}`,
            work: {
                completed: [`${result.plan.request} (${result.status})`]
            },
            agentStates: result.agentWork,
            decisions: result.decisions || [],
            nextSteps: result.plan.type === 'multi-agent' ?
                ['Continue with multi-agent workflow'] :
                ['Task completed, ready for next request']
        };

        await this.memory.saveSession(sessionData);
    }

    // CLI Commands
    async compressContext() {
        console.log('🗜️ Compressing project context...');
        const context = await this.loadProjectContext();
        const compressed = await this.tokens.forceCompress(context);
        console.log(`✅ Context compressed: ${compressed.originalTokens} → ${compressed.compressedTokens} tokens`);
        return compressed;
    }

    async saveSession(description) {
        const agentStates = await this.agentState.getAllAgentStates();
        const sessionData = {
            description: description,
            agentStates: agentStates,
            timestamp: new Date().toISOString()
        };

        return await this.memory.saveSession(sessionData);
    }

    async getAgentStatus() {
        const states = await this.agentState.getAllAgentStates();
        const stats = await this.memory.getMemoryStats();

        return {
            agentStates: states,
            memoryStats: stats,
            projectPath: this.projectPath
        };
    }

    async updateMemory(description) {
        console.log(`📝 Updating project memory: ${description}`);
        // This would update the appropriate memory files based on the description
        // Could be architecture decisions, completed work, etc.
        return description;
    }
}

module.exports = AIDevTeam;