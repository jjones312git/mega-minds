# Agent Communication Protocol

## Overview

This document defines how agents communicate with each other, hand off work, and coordinate activities throughout the development process. Following this protocol ensures smooth collaboration and prevents work from falling through the cracks.

## Core Communication Principles

1. **Clear Handoffs** - Every work transfer includes complete context and requirements
2. **Explicit Status Updates** - Agents communicate progress and blockers proactively  
3. **Quality Gates** - No work proceeds without proper validation
4. **Escalation Paths** - Clear process for resolving conflicts and issues
5. **Documentation** - All decisions and changes are properly documented
6. **Visual Agent Identification** - All agent work MUST include activation markers
7. **Task Tool Enforcement** - All handoffs MUST use Task tool invocation
8. **Handoff Acknowledgment** - Receiving agent MUST confirm receipt and understanding

## ⚠️ MANDATORY VISUAL FORMATTING REQUIREMENTS ⚠️

### Agent Activation Markers

**EVERY agent handoff MUST begin with:**
```
🤖 @[agent-name] ACTIVE
```

**Example**:
```
🤖 @frontend-development-agent ACTIVE
Beginning work on task: Create responsive navigation component
```

### Agent Status Transitions

**When agent completes work:**
```
✅ @[agent-name] COMPLETED: [Brief description of completed work]
```

**When agent encounters blockers:**
```
⚠️ @[agent-name] BLOCKED: [Brief description of blocker]
```

**When agent hands off to another:**
```
🤖 @[agent-name] HANDOFF → @[next-agent]
```

### Task Tool Invocation Format

**MANDATORY**: All agent work must use this exact Task tool pattern:

```
<function_calls>
<invoke name="Task">
<parameter name="subagent_type">general-purpose</parameter>
<parameter name="description">[Brief 3-5 word task description]</parameter>
<parameter name="prompt">## Handoff to @[agent-name]

🤖 @[agent-name] ACTIVE

[Complete handoff template below...]
</parameter>
</invoke>
</function_calls>
```

**PROHIBITED PATTERNS**:
- ❌ Direct @agent-name mentions without Task tool
- ❌ Implementation work by orchestrator
- ❌ Skipping visual activation markers
- ❌ Incomplete handoff templates

## Agent-to-Agent Handoff Template

### Standard Handoff Format

When passing work to another agent, always use this structure:

```markdown
## Handoff to @[agent-name]

**Context**: [Brief summary of the current project state and how we got here]

**What I Completed**: 
- [Specific deliverable 1]
- [Specific deliverable 2]  
- [Links to files, documents, or code]

**Your Task**: [Clearly defined work to be completed]

**Requirements & Constraints**:
- [Specific requirement 1]
- [Specific requirement 2]
- [Any technical constraints or limitations]

**Success Criteria**: 
- [How to know the work is complete]
- [Quality standards to meet]
- [Acceptance criteria]

**Dependencies**: 
- [Any prerequisites or blockers]
- [Other agents this work depends on]
- [External requirements]

**Integration Points**:
- [How this connects to other system components]
- [APIs or interfaces to maintain]
- [Data contracts to follow]

**Timeline**: [Expected completion timeframe]

@[agent-name] [Additional specific instructions or context]
```

### Example Handoff

```markdown
## Handoff to @frontend-development

**Context**: We're building a task management SaaS app. The system architecture is defined, database schema is complete, and API specifications are approved.

**What I Completed**:
- System architecture design document
- Technology stack selection (Next.js, Supabase, TypeScript)
- Component architecture and file structure
- Integration patterns with Supabase Auth and Database

**Your Task**: Build the React components for the task management dashboard

**Requirements & Constraints**:
- Must use Next.js 14 with App Router
- Implement responsive design (mobile-first)
- Integrate with Supabase Auth for user sessions
- Follow the approved design system and UI mockups
- Use TypeScript with strict mode enabled
- Implement proper error handling and loading states

**Success Criteria**:
- Dashboard displays user's tasks in list and kanban views
- Users can create, edit, delete, and update task status
- Real-time updates when tasks change
- Mobile responsive and accessible (WCAG 2.1 AA)
- All components have TypeScript interfaces
- Error boundaries handle API failures gracefully

**Dependencies**:
- Database schema (completed by @database-agent)
- API endpoints (completed by @backend-development)
- Authentication system (completed by @authentication-agent)
- UI/UX designs (completed by @ux-ui-design)

**Integration Points**:
- Use Supabase client for real-time subscriptions
- Follow established API contracts for task CRUD operations
- Integrate with global state management patterns
- Maintain consistent styling with design system

**Timeline**: 5 business days

@frontend-development Please implement the task dashboard following the component architecture outlined in `/docs/frontend-architecture.md`. Pay special attention to the real-time synchronization requirements.
```

### ✅ MANDATORY HANDOFF ACKNOWLEDGMENT

**EVERY receiving agent MUST respond with:**

```markdown
## Handoff Acknowledged - @[agent-name]

✅ **Handoff Received**: [Timestamp]
✅ **Requirements Understood**: [Confirm key requirements]
✅ **Success Criteria Clear**: [Confirm understanding]
✅ **Dependencies Verified**: [Confirm all dependencies are met]

**My Understanding**:
- [Key requirement 1 as I understand it]
- [Key requirement 2 as I understand it]
- [Any assumptions I'm making]

**Questions/Clarifications**:
- [Any unclear items that need clarification]

**Estimated Timeline**: [My estimate for completion]

🤖 @[agent-name] ACTIVE - Beginning work now.
```

**BLOCKING RULE**: No agent may begin work until acknowledgment is provided and any clarifications are resolved.

## Status Update Protocol

### Daily Status Format

Agents should provide status updates using this format:

```markdown
## Daily Status - @[agent-name] - [Date]

**Current Focus**: [Main work item being tackled today]

**Completed Yesterday**:
- [Specific accomplishment 1]
- [Specific accomplishment 2]

**Today's Goals**:
- [Planned work item 1]
- [Planned work item 2]

**Blockers/Issues**:
- [Any impediments preventing progress]
- [Dependencies waiting on other agents]

**Next Handoff**: @[next-agent] - [Expected timing]

**Quality Status**: 
- Tests: [Pass/Fail/In Progress]
- Code Review: [Needed/Complete/N/A]
- Documentation: [Current/Needs Update]
```

### Milestone Status Format

For major milestones, use this expanded format:

```markdown
## Milestone Status - [Milestone Name] - [Date]

**Overall Progress**: [X% Complete]

**Completed Deliverables**:
- ✅ [Deliverable 1] - Completed [Date] by @[agent]
- ✅ [Deliverable 2] - Completed [Date] by @[agent]

**In Progress**:
- 🔄 [Deliverable 3] - @[agent] - [Expected completion]
- 🔄 [Deliverable 4] - @[agent] - [Expected completion]

**Upcoming Work**:
- 📋 [Deliverable 5] - @[agent] - [Start date]
- 📋 [Deliverable 6] - @[agent] - [Start date]

**Blockers & Risks**:
- ⚠️ [Risk description] - Impact: [High/Medium/Low] - Mitigation: [Plan]

**Quality Metrics**:
- Test Coverage: [X%]
- Code Quality Score: [Rating]
- Performance Benchmarks: [Status]
- Security Scan: [Pass/Fail/Pending]

**Next Major Milestone**: [Name] - [Target Date]
```

## Conflict Resolution Protocol

### When Agents Disagree

1. **Direct Discussion**: Agents attempt to resolve through technical discussion
2. **Document Positions**: Each agent clearly states their recommendation and rationale
3. **Escalate to System Architect**: If no resolution within 4 hours
4. **Architecture Decision**: System Architect makes binding technical decision
5. **Document Decision**: Record in ADR format for future reference

### Escalation Template

```markdown
## Technical Conflict Escalation

**Issue**: [Brief description of the disagreement]

**Agents Involved**: @[agent1], @[agent2], @[agent3]

**Positions**:

**@[agent1] Recommendation**:
- [Their proposed solution]
- [Rationale and benefits]
- [Potential risks or drawbacks they acknowledge]

**@[agent2] Recommendation**:
- [Their proposed solution]
- [Rationale and benefits]
- [Potential risks or drawbacks they acknowledge]

**Decision Needed By**: [Timeline for resolution]

**Impact**: [What happens if this isn't resolved quickly]

@system-architect Please provide architectural guidance and final decision.
```

## Quality Gate Communication

### Before Quality Gate Review

The responsible agent must announce quality gate readiness:

```markdown
## Quality Gate Review Request

**Component**: [What was built/changed]
**Agent**: @[responsible-agent]

**Self-Assessment**:
- Code Complete: ✅/❌
- Unit Tests: ✅/❌ - [Coverage %]
- Integration Tests: ✅/❌
- Documentation: ✅/❌
- Performance Check: ✅/❌

**Review Requests**:
@code-review Please review code quality and standards compliance
@testing Please validate test coverage and run full test suite  
@security-testing Please scan for vulnerabilities
@performance-testing Please check performance impact

**Artifacts Available**:
- Code Location: [GitHub branch/folder]
- Test Results: [Link to test reports]
- Documentation: [Link to updated docs]
- Performance Data: [Link to metrics]

**Deployment Target**: [Staging/Production]
**Timeline**: [When deployment is needed]
```

### Quality Gate Results

Each reviewing agent provides results in this format:

```markdown
## Quality Gate Results - @[reviewing-agent]

**Component Reviewed**: [Name]
**Review Type**: [Code Review/Testing/Security/Performance]
**Status**: ✅ PASS / ❌ FAIL / ⚠️ CONDITIONAL PASS

**Findings**:
- [Finding 1] - Severity: [Critical/High/Medium/Low]
- [Finding 2] - Severity: [Critical/High/Medium/Low]

**Required Actions** (if not PASS):
- [ ] [Action item 1] - Priority: [High/Medium/Low]
- [ ] [Action item 2] - Priority: [High/Medium/Low]

**Recommendations** (optional improvements):
- [Suggestion 1]
- [Suggestion 2]

**Approval Status**: 
- ✅ Approved for deployment
- ❌ Must fix issues before deployment  
- ⚠️ Approved with conditions: [conditions]

**Re-review Needed**: Yes/No - [If yes, what triggers re-review]
```

## Emergency Communication Protocol

### Issue Detection and Alerting

When any agent detects a critical issue:

```markdown
🚨 CRITICAL ISSUE ALERT 🚨

**Detected By**: @[agent-name]
**Issue**: [Brief description]
**Severity**: Critical/High/Medium/Low
**Impact**: [What is affected]
**Status**: [Active/Mitigated/Resolved]

**Immediate Actions Taken**:
- [Action 1]
- [Action 2]

**Expert Assistance Needed**:
@[expert-agent-1] [What they should check/do]
@[expert-agent-2] [What they should check/do]

**System Architect**: @system-architect - Please coordinate response

**Updates**: [This section updated as situation evolves]
```

### Issue Resolution Updates

As the emergency progresses, provide regular updates:

```markdown
🚨 ISSUE UPDATE - [Timestamp]

**Status**: [In Progress/Mitigated/Resolved]

**New Findings**:
- [Discovery 1]
- [Discovery 2]

**Actions Completed**:
- ✅ [Action 1] - @[agent] - [Time]
- ✅ [Action 2] - @[agent] - [Time]

**Next Actions**:
- 🔄 [Action 3] - @[agent] - ETA: [Time]
- 📋 [Action 4] - @[agent] - ETA: [Time]

**Impact Update**: [Current impact status]
```

## Documentation Requirements

### Decision Documentation (ADR Format)

All major technical decisions must be documented:

```markdown
# ADR-[Number]: [Decision Title]

**Status**: [Proposed/Accepted/Deprecated/Superseded]
**Date**: [YYYY-MM-DD]  
**Deciders**: @[system-architect], @[agent1], @[agent2]

## Context

[Describe the situation that necessitated this decision]

## Decision

[State the decision that was made]

## Rationale

[Explain why this decision was made, including:]
- [Benefit 1]
- [Benefit 2]
- [Trade-offs considered]

## Consequences

**Positive**:
- [Positive outcome 1]
- [Positive outcome 2]

**Negative/Risks**:
- [Risk 1 and mitigation]
- [Risk 2 and mitigation]

**Neutral**:
- [Impact that's neither positive nor negative]

## Implementation Notes

[Any specific guidance for implementing this decision]

## Review Date

[When this decision should be re-evaluated, if applicable]
```

### Integration Specification Format

For component integrations:

```markdown
# Integration Specification: [Component A] ↔ [Component B]

**Agents Responsible**: @[agent1], @[agent2]
**Last Updated**: [Date]

## Overview

[Brief description of what these components do together]

## Interface Contract

**Data Exchange Format**:
```json
{
  "exampleField": "string",
  "requiredData": "value"
}
```

**API Endpoints** (if applicable):
- `POST /api/endpoint` - [Description]
- `GET /api/endpoint/:id` - [Description]

**Events** (if applicable):
- `EventName` - [When triggered, what data included]

## Error Handling

**Expected Errors**:
- [Error condition 1] - Response: [How to handle]
- [Error condition 2] - Response: [How to handle]

**Fallback Behavior**:
[What happens when integration fails]

## Testing Strategy

**Integration Tests Required**:
- [Test scenario 1]
- [Test scenario 2]

**Test Data**:
[Sample data for testing this integration]

## Performance Requirements

- Response time: [< X ms]
- Throughput: [X requests/second]
- Error rate: [< X%]

## Monitoring

**Metrics to Track**:
- [Metric 1]
- [Metric 2]

**Alerting Thresholds**:
- [Alert condition] - Severity: [Level]
```

## Communication Best Practices

### Do's
- ✅ **Be Specific**: Provide concrete details and examples
- ✅ **Include Context**: Explain why decisions were made  
- ✅ **Document Everything**: Record decisions and changes
- ✅ **Proactive Updates**: Communicate status before asked
- ✅ **Clear Handoffs**: Include all necessary information
- ✅ **Acknowledge Receipt**: Confirm you received and understand requests

### Don'ts
- ❌ **Don't Assume**: Always provide complete context
- ❌ **Don't Skip Steps**: Follow the communication templates
- ❌ **Don't Work in Isolation**: Keep other agents informed
- ❌ **Don't Ignore Blockers**: Escalate issues promptly
- ❌ **Don't Make Unilateral Changes**: Coordinate with affected agents
- ❌ **Don't Leave Handoffs Incomplete**: Ensure recipient acknowledges and understands

## File Organization

Store communication artifacts in:

```
project-root/
├── .claude/
│   └── communications/
│       ├── handoffs/
│       │   ├── [from-agent]_to_[to-agent]_[timestamp].md
│       │   └── daily-status/
│       │       └── [date]_status_updates.md
│       ├── decisions/
│       │   └── ADR-[number]-[title].md
│       ├── escalations/
│       │   └── [issue-id]_conflict_resolution.md
│       └── integrations/
│           └── [component-a]_[component-b]_spec.md
```

This communication protocol ensures that all agents work together effectively, maintain high quality standards, and deliver successful projects through clear, structured collaboration.