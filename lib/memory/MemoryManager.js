// lib/memory/MemoryManager.js
const fs = require('fs-extra');
const path = require('path');

class MemoryManager {
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.memoryPath = path.join(projectPath, '.mega-minds');
        this.claudeFile = path.join(projectPath, '.claude', 'claude.md');
        this.sessionsPath = path.join(this.memoryPath, 'sessions');
        this.memoryFilesPath = path.join(this.memoryPath, 'memory');
    }

    async initialize() {
        // Ensure all memory directories exist
        await fs.ensureDir(this.memoryPath);
        await fs.ensureDir(this.sessionsPath);
        await fs.ensureDir(this.memoryFilesPath);
        await fs.ensureDir(path.join(this.memoryPath, 'agents'));

        // Initialize memory files if they don't exist
        await this.initializeMemoryFiles();
    }

    async initializeMemoryFiles() {
        const projectName = path.basename(this.projectPath);

        // Architecture memory
        const architectureFile = path.join(this.memoryFilesPath, 'architecture.md');
        if (!await fs.pathExists(architectureFile)) {
            await fs.writeFile(architectureFile, this.generateArchitectureMemory(projectName));
        }

        // Recent work memory
        const recentWorkFile = path.join(this.memoryFilesPath, 'recent-work.md');
        if (!await fs.pathExists(recentWorkFile)) {
            await fs.writeFile(recentWorkFile, this.generateRecentWorkMemory());
        }

        // Active context
        const activeContextFile = path.join(this.memoryPath, 'agents', 'active-context.md');
        if (!await fs.pathExists(activeContextFile)) {
            await fs.writeFile(activeContextFile, this.generateActiveContextMemory());
        }
    }

    generateClaudeMemoryFile(projectName) {
        return `# ${projectName} - AI Development Team Memory

@import .mega-minds/memory/architecture.md
@import .mega-minds/memory/recent-work.md
@import .mega-minds/agents/active-context.md

## Memory Management Commands

**For Claude Code - Use these commands when needed:**
- \`mega-minds compress-context\` - When approaching token limits
- \`mega-minds save-session "description"\` - Save current development session
- \`mega-minds load-session\` - Load previous session state
- \`mega-minds agent-status\` - See what agents are working on
- \`mega-minds update-memory "what happened"\` - Update project memory

## Project Overview

**Project**: ${projectName}
**Type**: [Web Application/API/Mobile App/etc.]
**Tech Stack**: [To be determined by technical architecture agent]

## Development Guidelines

- **Quality First**: All code must pass quality gates before proceeding
- **Documentation**: Document all decisions and architecture changes
- **Testing**: Comprehensive test coverage for all features
- **Security**: Follow security best practices throughout development

## Current Development Status

**Active Sprint**: Project initialization
**Next Milestone**: [To be determined]

---
*This file is managed by mega-minds AI development team*
*Context is automatically optimized and compressed as needed*`;
    }

    generateArchitectureMemory(projectName) {
        return `# Architecture Memory - ${projectName}

## Technology Decisions
*Track all major technology and architecture decisions here*

### Decision Log
| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| ${new Date().toISOString().split('T')[0]} | Project initialized with mega-minds | AI development team setup | Project Setup |

## System Architecture
*This section will be updated as architecture is defined*

### Core Components
- [ ] Frontend application
- [ ] Backend API
- [ ] Database layer
- [ ] Authentication system

### Technology Stack
**Frontend**: [To be decided]
**Backend**: [To be decided]  
**Database**: [To be decided]
**Authentication**: [To be decided]

## API Design
*API endpoints and contracts will be documented here*

## Database Schema
*Database design and relationships will be documented here*

## Security Architecture
*Security policies and implementations will be documented here*

---
*This file maintains core architectural decisions and never gets compressed*`;
    }

    generateRecentWorkMemory() {
        return `# Recent Work Memory

## Current Session
**Started**: ${new Date().toISOString()}
**Focus**: Project initialization and setup

## Completed Tasks
*Recently completed development tasks*

### Today
- ✅ Project initialized with mega-minds AI development team
- ✅ Memory management system activated

## In Progress
*Current development work*

### Active Tasks
- 🔄 Awaiting first development request

## Upcoming Work
*Planned development tasks*

### Next Tasks
- [ ] Define project requirements
- [ ] Choose technology stack
- [ ] Set up development environment

## Notes
*Important notes and reminders from recent work*

---
*This file tracks recent development activity and gets compressed when old*`;
    }

    generateActiveContextMemory() {
        return `# Active Agent Context

## Currently Active Agents
*No agents currently active*

## Agent States
\`\`\`json
{
  "lastUpdated": "${new Date().toISOString()}",
  "activeAgents": {},
  "queuedTasks": [],
  "blockers": []
}
\`\`\`

## Current Handoffs
*No active handoffs*

## Pending Decisions
*No pending decisions*

---
*This file tracks real-time agent activity and coordination*`;
    }

    async saveSession(sessionData) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const sessionFile = path.join(this.sessionsPath, `session-${timestamp}.json`);

        const session = {
            timestamp: new Date().toISOString(),
            description: sessionData.description || 'Development session',
            work: sessionData.work || {},
            agentStates: sessionData.agentStates || {},
            decisions: sessionData.decisions || [],
            nextSteps: sessionData.nextSteps || []
        };

        await fs.writeFile(sessionFile, JSON.stringify(session, null, 2));

        // Update recent work memory
        await this.updateRecentWorkMemory(session);

        console.log(`💾 Session saved: ${sessionFile}`);
        return sessionFile;
    }

    async loadLatestSession() {
        const sessions = await this.listSessions();
        if (sessions.length === 0) {
            return null;
        }

        const latestSession = sessions[sessions.length - 1];
        const sessionData = await fs.readJSON(latestSession);

        console.log(`📂 Loaded session from: ${path.basename(latestSession)}`);
        return sessionData;
    }

    async listSessions() {
        if (!await fs.pathExists(this.sessionsPath)) {
            return [];
        }

        const files = await fs.readdir(this.sessionsPath);
        return files
            .filter(file => file.startsWith('session-') && file.endsWith('.json'))
            .map(file => path.join(this.sessionsPath, file))
            .sort();
    }

    async updateRecentWorkMemory(session) {
        const recentWorkFile = path.join(this.memoryFilesPath, 'recent-work.md');

        let content = `# Recent Work Memory

## Latest Session: ${session.description}
**Completed**: ${session.timestamp}

### Work Completed
${session.work.completed ? session.work.completed.map(item => `- ✅ ${item}`).join('\n') : '- No completed work recorded'}

### Decisions Made
${session.decisions.length ? session.decisions.map(decision => `- 📋 ${decision}`).join('\n') : '- No decisions recorded'}

### Next Steps
${session.nextSteps.length ? session.nextSteps.map(step => `- 🔄 ${step}`).join('\n') : '- No next steps defined'}

## Agent Activity
${Object.keys(session.agentStates).length ?
                Object.entries(session.agentStates).map(([agent, state]) =>
                    `- **${agent}**: ${state.status || 'unknown status'}`
                ).join('\n') : '- No agent activity recorded'}

---
*Updated: ${new Date().toISOString()}*`;

        await fs.writeFile(recentWorkFile, content);
    }

    async updateArchitectureDecision(decision) {
        const architectureFile = path.join(this.memoryFilesPath, 'architecture.md');
        let content = await fs.readFile(architectureFile, 'utf8');

        const date = new Date().toISOString().split('T')[0];
        const newRow = `| ${date} | ${decision.title} | ${decision.rationale} | ${decision.decidedBy} |`;

        // Insert the new decision into the decision log table
        content = content.replace(
            /(\| Date \| Decision \| Rationale \| Decided By \|\n\|------|----------|-----------|------------\|)/,
            `$1\n${newRow}`
        );

        await fs.writeFile(architectureFile, content);
        console.log(`📐 Architecture decision recorded: ${decision.title}`);
    }

    async getMemoryStats() {
        const sessions = await this.listSessions();
        const memoryFiles = await fs.readdir(this.memoryFilesPath);

        return {
            totalSessions: sessions.length,
            memoryFiles: memoryFiles.length,
            lastSession: sessions.length > 0 ? path.basename(sessions[sessions.length - 1]) : null,
            projectAge: sessions.length > 0 ?
                Math.floor((Date.now() - fs.statSync(sessions[0]).birthtime) / (1000 * 60 * 60 * 24)) : 0
        };
    }
}

module.exports = MemoryManager;