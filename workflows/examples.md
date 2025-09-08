# Mega-Minds Workflow Examples

This document provides comprehensive usage examples for mega-minds multi-agent coordination. These examples demonstrate proper Task tool usage, agent handoff protocols, and workflow patterns.

## Quick Reference

- **Always Use**: Task tool for all agent invocations
- **Never Do**: Direct agent mentions without Task tool
- **Required**: Visual activation marker `🤖 @[agent-name] ACTIVE`
- **Mandatory**: Complete handoff template from communication-protocol.md

---

## Starting a New Project

### Scenario
**User Request**: "I want to build a task management SaaS app with team collaboration, real-time updates, and mobile support. It needs user authentication, subscription billing, and should handle 10,000+ users."

### Correct Implementation ✅

```markdown
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

### Incorrect Implementation ❌
Direct mention `@project-orchestrator-agent` without Task tool

---

## Making Technical Decisions

### Scenario
Need to choose between PostgreSQL and MongoDB for data storage

### Correct Decision Council Process ✅

```markdown
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

### Incorrect Implementation ❌
Direct agent mentions without Task tool coordination

---

## Handling Emergency Situations

### Scenario
Application performance has degraded significantly

### Correct Emergency Response ✅

```markdown
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

### Incorrect Implementation ❌
Direct agent mentions without emergency coordination protocol

---

## Feature Development Workflow

### Scenario
**User Request**: "We need to add real-time notifications to our task management app. Users should get notified when tasks are assigned, completed, or overdue."

### Correct Multi-Agent Workflow ✅

```markdown
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

**Note**: The orchestrator will then hand off to each agent using proper Task tool invocations.

### Incorrect Implementation ❌
- Direct agent mentions without Task tool
- Orchestrator doing implementation work instead of coordination

---

## Development Phase Workflows

### Phase 1: Discovery & Planning
**Primary Agents**: @project-orchestrator-agent, @requirements-analysis-agent, @market-research-agent  
**Deliverables**: Project requirements, technical architecture, risk assessment

**Example Handoff Pattern**:
```markdown
<function_calls>
<invoke name="Task">
<parameter name="subagent_type">general-purpose</parameter>
<parameter name="description">Requirements analysis coordination</parameter>
<parameter name="prompt">## Handoff to @requirements-analysis-agent

🤖 @requirements-analysis-agent ACTIVE

**Context**: New project discovery phase
**Your Task**: Analyze and document detailed requirements
**Input**: Initial project concept and high-level requirements
**Success Criteria**: Complete requirements document with user stories
</parameter>
</invoke>
</function_calls>
```

### Phase 2: Design & Specification  
**Primary Agents**: @ux-ui-design-agent, @database-schema-agent, @api-design-agent, @security-architecture-agent  
**Deliverables**: UI designs, database schema, API specifications, security plan

### Phase 3: Development
**Primary Agents**: @frontend-development-agent, @backend-development-agent, @database-agent  
**Deliverables**: Working application components, integrated systems

### Phase 4: Quality Assurance
**Primary Agents**: @testing-agent, @code-review-agent, @performance-testing-agent, @security-testing-agent  
**Deliverables**: Test results, performance reports, security clearance

### Phase 5: Deployment & Operations
**Primary Agents**: @ci-cd-pipeline-agent, @infrastructure-agent, @monitoring-agent  
**Deliverables**: Production deployment, monitoring setup, backup systems

---

## Common Workflow Patterns

### 1. Sequential Handoff Pattern
Use when tasks must be completed in order:
```
Requirements → Architecture → Design → Development → Testing → Deployment
```

### 2. Parallel Collaboration Pattern
Use when multiple agents can work simultaneously:
```
Frontend Development ∥ Backend Development ∥ Database Setup
```

### 3. Expert Consultation Pattern
Use when specialists need to provide input during other agents' work:
```
Primary Agent + Consulting Agents → Integrated Solution
```

### 4. Decision Council Pattern
Use for major technical decisions requiring multiple expert opinions:
```
Technical Question → Council Formation → Expert Analysis → Decision
```

### 5. Problem-Solving Swarm Pattern
Use for critical issues requiring immediate multi-agent response:
```
Issue Detection → Swarm Activation → Parallel Investigation → Solution Implementation
```

---

## Best Practices Summary

### ✅ Do This
- Always start with @project-orchestrator-agent
- Use Task tool for all agent invocations
- Include visual activation markers
- Follow communication-protocol.md templates
- Save sessions between major phases
- Run quality gates before progression
- Coordinate handoffs explicitly

### ❌ Avoid This
- Direct agent mentions without Task tool
- Orchestrator performing implementation work
- Skipping quality gate validations
- Missing handoff acknowledgments
- Bypassing agent role boundaries
- Ignoring memory management warnings

### 🚨 Critical Rules
- Maximum 2 concurrent agents (memory safety)
- All agents must use Task tool invocation
- Quality gates block progression until passed
- Save sessions before memory-intensive operations

---

## Troubleshooting Common Issues

### Agent Not Responding
1. Check memory status: `npx mega-minds memory-status`
2. Verify Task tool usage (not direct mention)
3. Confirm handoff template completeness

### Quality Gates Failing
1. Review specific failure in workflows/quality-gates.md
2. Address issues before continuing
3. Re-run gates after fixes

### Memory Warnings
1. Save current session: `npx mega-minds save-session "description"`
2. Compress context: `npx mega-minds compress-context`
3. Reduce concurrent agents if needed

### Coordination Errors
1. Verify agent boundaries in workflows/agent-boundaries.md
2. Check communication protocol compliance
3. Review handoff logs for issues

---

*For additional help, see:*
- *workflows/agent-reference.md - Complete agent descriptions*
- *templates/workflows/quality-gates.md - Quality control details*
- *templates/workflows/communication-protocol.md - Handoff templates*
- *templates/RULES.md - Critical enforcement rules*