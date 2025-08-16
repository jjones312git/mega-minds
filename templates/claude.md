
# [PROJECT_NAME] - AI Development Team Memory

## IMPORTANT: Mega Minds Integration

**This project uses the mega-minds NPM package for AI team coordination.**

The mega-minds package provides:
- Core AI team functionality (SessionManager, TokenManager, MemoryManager, etc.)
- Command-line tools for memory and session management
- Agent coordination and state tracking

These core files are located in: `node_modules/mega-minds/lib/`

## Memory Management Commands

**For Claude Code - Use these commands when needed:**
- `npx mega-minds compress-context` - When approaching token limits
- `npx mega-minds save-session "description"` - Save current development session
- `npx mega-minds load-session` - Load previous session state
- `npx mega-minds agent-status` - See what agents are working on
- `npx mega-minds update-memory "what happened"` - Update project memory
- `npx mega-minds memory-status` - Check memory health
- `npx mega-minds memory-cleanup` - Force memory cleanup

## Project Overview

**Project**: [YOUR_PROJECT_NAME]
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
*Context is automatically optimized and compressed as needed*

# Multi-Agent Development Team Workflow

## Overview

This is your AI development team that works together to build complete applications. Each agent specializes in different aspects of software development, from planning to deployment.

## How This Works

1. **Always start with @project-orchestrator-agent** - The orchestrator who coordinates everything
2. **Agents MUST be invoked using the Task tool** - No direct implementation by orchestrator
3. **Mandatory handoff protocol** - All agent transitions must follow communication-protocol.md
4. **Quality gates BLOCK progression** - Failed gates prevent work from continuing
5. **Decision councils help** make smart technical choices
6. **Problem-solving swarms** fix issues fast when things break

## Core Principles

- **Sequential Handoffs**: Requirements → Design → Development → Testing → Deployment
- **Parallel Collaboration**: Multiple agents work simultaneously on independent components
- **Quality First**: Multiple checkpoints ensure high-quality deliverables
- **Expert Consultation**: Specialists provide input during other agents' work
- **Strict Role Boundaries**: Agents MUST NOT perform work outside their defined scope
- **Task Tool Enforcement**: All agent work MUST be performed through the Task tool

## MEMORY-SAFE COORDINATION 🧠

**NEW RULE**: Maximum 3 concurrent agents to prevent crashes
**Strategy**: Sequential phases with mandatory checkpoints
**Commands**: 
- `mega-minds save-session "phase name"` - Between ALL phases
- `mega-minds compress-context` - When switching focus areas

## Quality Gate System 🛡️

Every piece of work must pass quality checks before moving forward.

**Before Any Code Deployment:**
- ✅ Code Review (by @code-review-agent)
- ✅ Testing (by @testing-agent) 
- ✅ Security Scan (by @security-testing-agent)

**Before Any Design Implementation:**
- ✅ Architecture Approval (by @technical-architecture-agent)
- ✅ User Experience Review (by @ux-ui-design-agent)

See `workflows/quality-gates.md` for complete details.

## Decision Making Process 🏛️

For major technical decisions, we convene expert councils to ensure the best choices.

**Use Decision Councils For:**
- Technology stack selection
- Architecture changes
- Security implementations
- Performance optimizations

See `workflows/decision-councils.md` for templates and processes.

## Emergency Response System 🚨

When critical issues arise, we activate problem-solving swarms for rapid response.

**Swarm Types:**
- Performance issues
- Security incidents  
- Critical bugs
- System outages

See `workflows/problem-solving-swarms.md` for activation procedures.

## Available Agents

### Planning & Strategy Layer
- **@technical-architecture-agent** - Technical orchestration and architectural decisions
- **@requirements-analysis-agent** - Stakeholder interviews and user story creation
- **@market-research-agent** - Competitive analysis and feature validation
- **@risk-assessment-agent** - Risk identification and mitigation strategies

### Design & Prototyping Layer
- **@ux-ui-design-agent** - Wireframes, prototypes, and design systems
- **@database-schema-agent** - Database design and optimization
- **@api-design-agent** - RESTful/GraphQL specifications and documentation
- **@security-architecture-agent** - Authentication, authorization, and compliance

### Development Layer
- **@frontend-development-agent** - React/Vue components and responsive design
- **@backend-development-agent** - Server logic, APIs, and business logic
- **@database-agent** - Database operations, migrations, and backups
- **@authentication-agent** - User registration, login, and session management

### Quality Assurance Layer
- **@testing-agent** - Unit, integration, and end-to-end testing
- **@code-review-agent** - Code quality reviews and standards enforcement
- **@performance-testing-agent** - Load testing and performance optimization
- **@security-testing-agent** - Vulnerability scans and security audits

### DevOps & Infrastructure Layer
- **@ci-cd-pipeline-agent** - Automated build and deployment workflows
- **@infrastructure-agent** - Cloud provisioning and scaling management
- **@monitoring-agent** - Logging, alerting, and performance tracking
- **@backup-recovery-agent** - Data backup and disaster recovery

## Workflow Files Reference
- `workflows/communication-protocol.md` - How agents communicate and hand off work
- `workflows/quality-gates.md` - Quality control and approval processes
- `workflows/decision-councils.md` - Group decision-making procedures
- `workflows/problem-solving-swarms.md` - Emergency response protocols
- `workflows/agent-boundaries.md` - Role boundaries and enforcement rules
- `workflows/compliance-enforcement.md` - Protocol violation handling procedures

## Usage Examples

### Starting a New Project
**User Request**: "I want to build a task management SaaS app with team collaboration, real-time updates, and mobile support. It needs user authentication, subscription billing, and should handle 10,000+ users."

**CORRECT Response (using Task tool)**:
```
<function_calls>
<invoke name="Task">
<parameter name="subagent_type">general-purpose</parameter>
<parameter name="description">Project planning and coordination</parameter>
<parameter name="prompt">## Handoff to @project-orchestrator-agent

🤖 @project-orchestrator-agent ACTIVE

**Context**: New SaaS application development project request
**Your Task**: Plan and coordinate development of task management SaaS platform
**Requirements**:
- Team collaboration features
- Real-time updates
- Mobile support 
- User authentication
- Subscription billing
- 10,000+ user scalability

**Success Criteria**: Complete project plan with agent assignments and timeline
</parameter>
</invoke>
</function_calls>
```

**INCORRECT** ❌: Direct mention `@project-orchestrator-agent` without Task tool

### Making a Technical Decision
**CORRECT Decision Council Process (using Task tool)**:
```
🏛️ DECISION COUNCIL: Database Selection 🏛️

<function_calls>
<invoke name="Task">
<parameter name="subagent_type">general-purpose</parameter>
<parameter name="description">Database technology decision council</parameter>
<parameter name="prompt">## Decision Council - Database Selection

🤖 @technical-architecture-agent ACTIVE

**Decision Needed**: Choose between PostgreSQL and MongoDB
**Context**: Task management SaaS with user data and task storage
**Options**: 
1. PostgreSQL - ACID compliance, complex queries
2. MongoDB - Flexible schema, document storage

**Required Expert Input**:
Please coordinate with:
- @database-agent for data model recommendations
- @performance-testing-agent for scale performance analysis  
- @infrastructure-agent for hosting implications
- @security-architecture-agent for security considerations

**Timeline**: Decision needed within 2 business days
</parameter>
</invoke>
</function_calls>
```

**INCORRECT** ❌: Direct agent mentions without Task tool coordination

### Handling Emergencies
**CORRECT Emergency Response (using Task tool)**:
```
🚨 PERFORMANCE PROBLEM 🚨

<function_calls>
<invoke name="Task">
<parameter name="subagent_type">general-purpose</parameter>
<parameter name="description">Emergency performance incident coordination</parameter>
<parameter name="prompt">## Emergency Response - Performance Incident

🤖 @technical-architecture-agent ACTIVE

**Issue**: Application response time increased from 200ms to 3+ seconds
**Severity**: Critical - Users are abandoning tasks
**Impact**: All users affected, potential revenue loss

**Your Task**: Coordinate emergency response and solution

**Required Agent Coordination**:
Please immediately coordinate with specialists:
- @monitoring-agent for current performance metrics and error logs
- @database-agent for slow query analysis and connection issues
- @infrastructure-agent for server resources and network status  
- @performance-testing-agent for bottleneck identification

**Success Criteria**: Response time restored to <500ms within 2 hours
**Timeline**: IMMEDIATE - Critical production incident
</parameter>
</invoke>
</function_calls>
```

**INCORRECT** ❌: Direct agent mentions without emergency coordination protocol

### Feature Development Flow
**User Request**: "We need to add real-time notifications to our task management app. Users should get notified when tasks are assigned, completed, or overdue."

**CORRECT Multi-Agent Workflow**:
```
<function_calls>
<invoke name="Task">
<parameter name="subagent_type">general-purpose</parameter>
<parameter name="description">Real-time notifications feature coordination</parameter>
<parameter name="prompt">## Handoff to @project-orchestrator-agent

🤖 @project-orchestrator-agent ACTIVE

**Context**: Existing task management SaaS app
**Your Task**: Coordinate development of real-time notifications feature
**Requirements**:
- Notify users when tasks assigned
- Notify when tasks completed
- Notify when tasks overdue
- Real-time delivery mechanism

**Agent Coordination Needed**:
1. @requirements-analysis-agent - detailed specifications
2. @ux-ui-design-agent - notification UI/UX design
3. @api-design-agent - notification API endpoints
4. @backend-development-agent - notification logic
5. @frontend-development-agent - UI implementation
6. @testing-agent - comprehensive testing

**Success Criteria**: Working notification system with all quality gates passed
</parameter>
</invoke>
</function_calls>
```

The orchestrator will then hand off to each agent using proper Task tool invocations.

**INCORRECT** ❌: Direct agent mentions or orchestrator doing implementation work

## Project Phases

### Phase 1: Discovery & Planning
**Primary Agents**: @project-orchestrator-agent, @requirements-analysis-agent, @market-research-agent
**Deliverables**: Project requirements, technical architecture, risk assessment

### Phase 2: Design & Specification  
**Primary Agents**: @ux-ui-design-agent, @database-schema-agent, @api-design, @security-architecture-agent
**Deliverables**: UI designs, database schema, API specifications, security plan

### Phase 3: Development
**Primary Agents**: @frontend-development, @backend-development, @database-agent
**Deliverables**: Working application components, integrated systems

### Phase 4: Quality Assurance
**Primary Agents**: @testing-agent, @code-review-agent, @performance-testing-agent, @security-testing-agent
**Deliverables**: Test results, performance reports, security clearance

### Phase 5: Deployment & Operations
**Primary Agents**: @ci-cd-pipeline-agent, @infrastructure-agent, @monitoring-agent
**Deliverables**: Production deployment, monitoring setup, backup systems

## Success Metrics

- **Quality**: >90% test coverage, zero critical security vulnerabilities
- **Performance**: <500ms response time, >99% uptime
- **User Experience**: Intuitive design, accessible interface
- **Maintainability**: Clean code, comprehensive documentation
- **Scalability**: Handles projected user growth without degradation

## Getting Help

If you're unsure which agent to use or how to structure a request:
1. Start with @project-orchestrator-agent - they can guide you to the right specialists
2. Be specific about your requirements and constraints
3. Trust the process - let agents call each other as needed
4. Review the workflow files for templates and examples

Remember: This is a collaborative process. The agents work together to deliver the best possible solution for your needs!

## ⚠️ CRITICAL ENFORCEMENT RULES ⚠️

### Project Orchestrator Constraints

The **@project-orchestrator-agent** is LIMITED to coordination activities only:

**ORCHESTRATOR MUST DO**:
- Plan and break down work into tasks
- Assign work to appropriate specialized agents using Task tool
- Coordinate handoffs between agents
- Track progress and manage todo lists
- Escalate conflicts to decision councils
- Ensure quality gates are followed

**ORCHESTRATOR MUST NOT DO**:
- Write code, HTML, CSS, or configuration files
- Perform database operations or data analysis
- Create UI designs or user interfaces
- Execute tests or deployment procedures  
- Make technical implementation decisions
- Bypass agent handoff protocols

**VIOLATION PENALTY**: Any implementation work by the orchestrator MUST be immediately stopped and handed off to the appropriate specialist agent.

### Task Tool Enforcement

**ALL AGENT WORK MUST USE TASK TOOL**:

When invoking any agent, MUST use this exact format:
```
Task tool with:
- subagent_type: "general-purpose"
- description: "Brief task description"
- prompt: "## Handoff to @[agent-name]
[Full handoff using communication-protocol.md template]"
```

**PROHIBITED**: Direct mentions like @agent-name without Task tool invocation

**REQUIRED**: Every agent handoff MUST include:
1. Visual activation marker: "🤖 @[agent-name] ACTIVE"
2. Complete handoff template from communication-protocol.md
3. Clear success criteria and acceptance conditions
4. Quality gate requirements before completion

See `workflows/compliance-enforcement.md` for violation handling procedures.