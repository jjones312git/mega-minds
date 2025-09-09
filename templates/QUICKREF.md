# Mega-Minds Quick Reference

**🚀 Fast access to all mega-minds commands, workflows, and critical information**

---

## Essential Commands

### Memory Management (Critical for Stability)
| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npx mega-minds memory-status` | Check memory health | **Before agent activation** |
| `npx mega-minds save-session "desc"` | Save development session | **Between all phases** |
| `npx mega-minds compress-context` | Optimize memory usage | **Memory warnings appear** |
| `npx mega-minds memory-cleanup` | Force memory cleanup | **Emergency memory pressure** |

### Agent Coordination
| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npx mega-minds agent-status` | View active agents | **Monitor coordination** |
| `npx mega-minds record-agent-start` | Log agent activation | **Agent handoff tracking** |
| `npx mega-minds record-agent-complete` | Log agent completion | **Handoff completion** |
| `npx mega-minds update-memory "event"` | Update project memory | **Significant changes** |

### Quality Gates
| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npx mega-minds trigger-quality-gates` | Run quality checks | **Before code deployment** |
| `npx mega-minds run-quality-gates` | Execute full quality suite | **Pre-deployment validation** |
| `npx mega-minds quality-status` | Check quality metrics | **Quality assessment** |

### Session Management
| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npx mega-minds load-session` | View latest session | **Context restoration** |
| `npx mega-minds save-session-auto` | Auto-save with hooks | **Automated workflows** |
| `npx mega-minds stats` | Project statistics | **Progress monitoring** |

### Hooks & Automation
| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npx mega-minds setup-hooks` | Configure automated hooks | **Initial setup (terminal)** |
| `npx mega-minds hook-status` | Check hook status | **Verify automation** |
| `npx mega-minds preserve-context` | Smart context preservation | **Memory optimization** |

---

## Critical Workflows

### 🚀 Starting a New Project
```bash
1. npx mega-minds memory-status          # Check resources
2. Use Task tool → @project-orchestrator-agent
3. npx mega-minds save-session "project initialized"
```

### 🧠 Memory Management Protocol
```bash
# Before any major work:
npx mega-minds memory-status

# If memory >2GB:
npx mega-minds compress-context

# If memory >3.5GB:
npx mega-minds save-session "emergency save"
# Consider Claude Code restart
```

### 🤖 Agent Handoff Pattern
```markdown
<function_calls>
<invoke name="Task">
<parameter name="subagent_type">[actual-agent-name]</parameter>
<parameter name="description">Brief task description</parameter>
<parameter name="prompt">## Handoff to @[agent-name]

🤖 @[agent-name] ACTIVE

**Context**: Current situation
**Your Task**: Specific requirements
**Success Criteria**: Clear acceptance conditions
</parameter>
</invoke>
</function_calls>
```

**Examples**:
- `<parameter name="subagent_type">frontend-development-agent</parameter>`
- `<parameter name="subagent_type">backend-development-agent</parameter>`
- `<parameter name="subagent_type">database-schema-agent</parameter>`

### 🛡️ Quality Gate Workflow
```bash
# Before any deployment:
npx mega-minds run-quality-gates

# Check results:
npx mega-minds quality-status

# If failures - fix issues and repeat
```

---

## Agent Quick Selection

### By Development Phase
| Phase | Primary Agents |
|-------|----------------|
| **Planning** | `@project-orchestrator-agent` `@requirements-analysis-agent` |
| **Design** | `@ux-ui-design-agent` `@database-schema-agent` `@api-design-agent` |
| **Development** | `@frontend-development-agent` `@backend-development-agent` |
| **Quality** | `@testing-agent` `@code-review-agent` `@security-testing-agent` |
| **Deployment** | `@ci-cd-pipeline-agent` `@infrastructure-agent` |

### By Problem Type
| Problem | Agent |
|---------|-------|
| **Requirements unclear** | `@requirements-analysis-agent` |
| **Technical architecture** | `@technical-architecture-agent` |
| **Database design** | `@database-schema-agent` |
| **API specification** | `@api-design-agent` |
| **Security concerns** | `@security-architecture-agent` |
| **Performance issues** | `@performance-testing-agent` |
| **Infrastructure problems** | `@infrastructure-agent` |
| **Deployment failures** | `@ci-cd-pipeline-agent` |

---

## Critical Limits & Thresholds

### System Limits
- **Max Concurrent Agents**: 2 (including orchestrator)
- **Memory Threshold**: <3.5GB before emergency protocols
- **Session Save Frequency**: After each major milestone
- **Quality Gate Compliance**: 100% required for deployment

### Performance Targets
- **Agent Activation**: <200ms response time
- **Memory Check**: <500ms execution
- **Context Compression**: <30 seconds completion
- **Quality Gates**: <5 minutes for basic validation

---

## Emergency Procedures

### 🚨 Memory Crisis
```bash
# Immediate actions:
npx mega-minds save-session "EMERGENCY_SAVE_$(date)"
npx mega-minds compress-context
# Reduce to 1 active agent
# Consider Claude Code restart if critical
```

### 🔧 Agent Failure
```bash
# Check status:
npx mega-minds agent-status

# Reset if needed:
# 1. Document the failure
# 2. Re-initiate handoff with fresh context
# 3. Check templates/RULES.md for escalation procedures
```

### 🛡️ Quality Gate Failures
```bash
# Check specific failures:
npx mega-minds quality-status

# Address issues systematically:
# 1. Fix identified problems
# 2. Re-run specific failed gates
# 3. Full validation before continuing
```

---

## File Navigation Map

### Core Documentation
- **templates/RULES.md** - Critical enforcement rules and violations
- **workflows/examples.md** - Complete usage examples and patterns
- **workflows/agent-reference.md** - Detailed agent descriptions
- **templates/claude.md** - Main system configuration

### Workflow References
- **workflows/communication-protocol.md** - Agent handoff templates
- **workflows/quality-gates.md** - Quality control procedures
- **workflows/decision-councils.md** - Technical decision processes
- **workflows/agent-boundaries.md** - Agent role limitations

### Technical Documentation
- **VARIABLE-DRIVEN-AGENT-SYSTEM-PRD.md** - Next evolution roadmap
- **CLAUDE-MD-OPTIMIZATION-REPORT.md** - Optimization analysis
- **IMPLEMENTATION_PLAN.md** - Technical implementation roadmap

---

## Troubleshooting Quick Fixes

| Problem | Quick Solution |
|---------|---------------|
| **Agent not responding** | Check Task tool usage; verify memory status |
| **Memory warnings** | Run compress-context; save session; reduce agents |
| **Quality gates failing** | Check quality-status; fix issues; retry |
| **Handoff errors** | Verify communication-protocol.md compliance |
| **Role boundary violations** | Check agent-boundaries.md; reassign to correct agent |
| **System performance issues** | Memory cleanup; reduce concurrent operations |

---

## Hook Setup (One-Time Configuration)

### Initial Setup (Run in regular terminal, not Claude Code)
```bash
cd your-project-directory
npx mega-minds setup-hooks
# Follow interactive prompts to enable desired automations
```

### Automated Features (When hooks enabled)
- **Quality Gates**: Auto-run after Edit/Write operations
- **Session Auto-Save**: Save when agents complete work
- **Context Preservation**: Smart memory cleanup
- **Desktop Notifications**: Real-time development alerts

---

## Performance Optimization Tips

### Memory Efficiency
1. Monitor memory before agent activation
2. Save sessions frequently to prevent loss
3. Use context compression proactively
4. Limit concurrent agents strictly

### Coordination Efficiency
1. Always start with orchestrator agent
2. Use proper Task tool invocation format
3. Provide clear success criteria
4. Follow sequential phase workflow

### Quality Assurance
1. Run quality gates before deployment
2. Address failures systematically
3. Maintain test coverage standards
4. Follow security scanning protocols

---

**🎯 Remember: When in doubt, check templates/RULES.md for critical requirements and ../workflows/examples.md for detailed patterns!**

*Last Updated: January 2025 | Version: 2.1.0*