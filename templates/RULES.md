# Mega-Minds Critical Enforcement Rules

**⚠️ MANDATORY COMPLIANCE - VIOLATION PENALTIES APPLY ⚠️**

This document contains critical rules that MUST be followed for proper mega-minds operation. Violations of these rules will result in immediate corrective action and may cause system failures.

---

## Core System Rules

### Rule 1: Memory Safety Protocol 🧠
**ABSOLUTE MAXIMUM**: 2 concurrent agents (including orchestrator)  
**RATIONALE**: Prevents Claude Code memory crashes and ensures stable operation  
**ENFORCEMENT**: Automatic rejection of agent activation requests when limit exceeded  

**Required Actions**:
- Check memory before activating agents: `npx mega-minds memory-status`
- Save sessions between major phases: `npx mega-minds save-session "description"`
- Compress context when approaching limits: `npx mega-minds compress-context`

**VIOLATION PENALTY**: System will automatically deactivate agents to maintain stability

---

### Rule 2: Task Tool Enforcement 🔧
**MANDATORY**: ALL agent work MUST use Task tool  
**PROHIBITED**: Direct agent mentions like `@agent-name` without Task tool invocation  
**RATIONALE**: Ensures proper agent coordination and state tracking  

**Required Format**:
```markdown
<function_calls>
<invoke name="Task">
<parameter name="subagent_type">general-purpose</parameter>
<parameter name="description">Brief task description</parameter>
<parameter name="prompt">## Handoff to @[agent-name]
[Complete handoff using communication-protocol.md template]
</parameter>
</invoke>
</function_calls>
```

**Required Elements in Every Handoff**:
1. Visual activation marker: `🤖 @[agent-name] ACTIVE`
2. Complete handoff template from communication-protocol.md
3. Clear success criteria and acceptance conditions
4. Quality gate requirements before completion

**VIOLATION PENALTY**: Direct mentions will be ignored; proper Task tool invocation required

---

### Rule 3: Project Orchestrator Constraints 🎯
**CRITICAL LIMITATION**: The @project-orchestrator-agent is LIMITED to coordination activities ONLY

#### Orchestrator MUST DO:
✅ Plan and break down work into tasks  
✅ Assign work to appropriate specialized agents using Task tool  
✅ Coordinate handoffs between agents  
✅ Track progress and manage todo lists  
✅ Escalate conflicts to decision councils  
✅ Ensure quality gates are followed  

#### Orchestrator MUST NOT DO:
❌ Write code, HTML, CSS, or configuration files  
❌ Perform database operations or data analysis  
❌ Create UI designs or user interfaces  
❌ Execute tests or deployment procedures  
❌ Make technical implementation decisions  
❌ Bypass agent handoff protocols  

**VIOLATION PENALTY**: Any implementation work by the orchestrator MUST be immediately stopped and handed off to the appropriate specialist agent

---

### Rule 4: Quality Gate Compliance 🛡️
**MANDATORY**: Every piece of work must pass quality checks before progression  
**BLOCKING BEHAVIOR**: Failed gates prevent work from continuing  
**RATIONALE**: Ensures professional-grade output and prevents defects  

**Before Any Code Deployment**:
- ✅ Code Review (by @code-review-agent)
- ✅ Testing (by @testing-agent)
- ✅ Security Scan (by @security-testing-agent)

**Before Any Design Implementation**:
- ✅ Architecture Approval (by @technical-architecture-agent)
- ✅ User Experience Review (by @ux-ui-design-agent)

**VIOLATION PENALTY**: Work progression blocked until all quality gates pass

---

### Rule 5: Agent Role Boundaries 🚧
**STRICT ENFORCEMENT**: Agents MUST NOT perform work outside their defined scope  
**RATIONALE**: Prevents role confusion and ensures expert-level output  
**REFERENCE**: See `workflows/agent-boundaries.md` for detailed boundaries  

**Example Violations**:
- Frontend agent performing database operations
- Testing agent writing production code
- Design agent implementing security features

**VIOLATION PENALTY**: Work must be transferred to appropriate specialist agent

---

## Communication Protocol Rules

### Rule 6: Mandatory Handoff Protocol 📋
**REQUIREMENT**: All agent transitions must follow communication-protocol.md templates  
**COMPONENTS**:
- Proper context transfer
- Clear task definition
- Success criteria specification
- Quality gate requirements

**VIOLATION PENALTY**: Handoff rejection until proper protocol followed

---

### Rule 7: Sequential Phase Management ⏭️
**STRATEGY**: Sequential phases with mandatory checkpoints  
**REQUIRED FLOW**: Requirements → Design → Development → Testing → Deployment  
**CHECKPOINTS**: Session saves required between ALL phases  

**VIOLATION PENALTY**: Phase progression blocked until checkpoint completed

---

## Emergency Protocols

### Rule 8: Memory Crisis Response 🚨
**TRIGGER CONDITIONS**:
- Memory usage >3.5GB
- Multiple memory warnings
- Claude Code performance degradation

**IMMEDIATE ACTIONS**:
1. Save current session immediately
2. Compress context aggressively
3. Reduce concurrent agents to 1
4. Consider Claude Code restart if critical

**AUTHORITY**: Any agent can trigger emergency protocol when memory critical

---

### Rule 9: Agent Failure Recovery 🔄
**FAILURE CONDITIONS**:
- Agent non-responsiveness >5 minutes
- Repeated handoff failures
- Quality gate failures >3 attempts

**RECOVERY PROCEDURE**:
1. Log failure details
2. Reset agent state
3. Re-initiate handoff with fresh context
4. Escalate to orchestrator if pattern continues

---

### Rule 10: System Override Authority 🔓
**OVERRIDE CONDITIONS**:
- Critical production issues
- Emergency bug fixes
- System stability threats

**AUTHORIZED PERSONNEL**:
- Project orchestrator agent
- System administrators
- Emergency response teams

**PROCEDURE**:
1. Document override reason
2. Implement minimum viable fix
3. Return to normal protocols ASAP
4. Post-incident review required

---

## Compliance Monitoring

### Violation Detection 🕵️
- Automated monitoring of agent behavior
- Real-time rule compliance checking
- Violation logging and reporting
- Pattern analysis for repeat violations

### Enforcement Actions ⚖️
**Level 1 - Warning**: Rule reminder and guidance  
**Level 2 - Correction**: Forced compliance with proper procedure  
**Level 3 - Blocking**: Prevention of non-compliant actions  
**Level 4 - Reset**: Agent state reset and handoff restart  

### Escalation Path 📈
1. Automated compliance system
2. Project orchestrator agent
3. System administrators
4. Emergency response protocols

---

## Rule Update Process 🔄

### Version Control
- All rule changes tracked with semantic versioning
- Change log maintained with rationale
- Backward compatibility considerations
- Migration guides for major changes

### Approval Process
- Technical review required for all changes
- Impact assessment on existing workflows
- Testing with representative scenarios
- Staged rollout with monitoring

### Communication
- Rule changes communicated to all agents
- Training updates for complex changes
- Documentation updates across all files
- User notification for critical changes

---

## Quick Reference Card 🎯

### Critical Commands
```bash
npx mega-minds memory-status     # Check before agent activation
npx mega-minds save-session      # Required between phases  
npx mega-minds compress-context  # When memory warnings appear
npx mega-minds agent-status      # Monitor concurrent agents
```

### Critical Limits
- **Max Concurrent Agents**: 2 (including orchestrator)
- **Memory Threshold**: <3.5GB before emergency protocols
- **Handoff Timeout**: 5 minutes before failure escalation
- **Quality Gate Retries**: 3 attempts before escalation

### Emergency Contacts
- **System Issues**: Check `workflows/compliance-enforcement.md`
- **Rule Violations**: See violation handling procedures
- **Technical Support**: Contact system administrators
- **Critical Failures**: Activate emergency response protocols

---

*Last Updated: January 2025*  
*Version: 2.1.0*  
*Next Review: After major system updates*  
*Authority: Mega-Minds Development Team*

**⚠️ REMEMBER: These rules exist to ensure system stability, quality output, and successful project completion. When in doubt, follow the rules strictly rather than taking shortcuts. ⚠️**