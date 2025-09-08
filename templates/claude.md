# {{PROJECT_NAME}} - Mega-Minds AI Development System v2.1
*Version: {{CLAUDE_MD_VERSION}} | Updated: {{LAST_UPDATE}} | Optimization: {{OPTIMIZATION_SCORE}}*  
*Change Log: {{CHANGE_LOG_URL}} | Build: {{BUILD_NUMBER}} | Environment: {{ENVIRONMENT}}*

<!-- SECTION: core-rules -->
## 🎯 Mission
{{PROJECT_MISSION}}

<!-- SECTION: quick-start -->
## 🚀 Quick Start
- **Always start**: `@project-orchestrator-agent` via Task tool
- **Check memory**: `npx mega-minds memory-status` before agent activation
- **Need help**: See `../workflows/examples.md` for complete workflows

<!-- SECTION: critical-rules -->
## ⚠️ CRITICAL RULES (Details: templates/RULES.md)
- **Maximum 2 concurrent agents** (memory safety protocol)
- **ALL agents via Task tool** (no direct invocation permitted)  
- **Quality gates mandatory** (see templates/workflows/quality-gates.md)
- **Save between phases**: `npx mega-minds save-session "description"`

<!-- SECTION: project-context -->
## 📊 Project Context
- **Tech Stack**: {{TECH_STACK}}
- **Current Phase**: {{CURRENT_PHASE}}
- **Memory Status**: {{MEMORY_STATUS}} ({{MEMORY_PRESSURE_LEVEL}})  
- **Active Agents**: {{ACTIVE_AGENT_COUNT}}/2 ({{CONCURRENT_LIMIT}})
- **Session ID**: {{SESSION_ID}}
- **Workflow Phase**: {{WORKFLOW_PHASE}}

<!-- SECTION: commands -->
## ⚡ Essential Commands
| Action | Command | When |
|--------|---------|------|
| Memory Check | `npx mega-minds memory-status` | Before agent activation |
| Save Session | `npx mega-minds save-session "desc"` | After milestones |
| Compress Context | `npx mega-minds compress-context` | Memory warnings |
| Agent Status | `npx mega-minds agent-status` | Check coordination |

*Full command reference: templates/QUICKREF.md*

<!-- SECTION: integration -->
## 🔗 Mega-Minds Integration

**This project uses the mega-minds NPM package for AI team coordination.**

Core functionality: SessionManager, TokenManager, MemoryManager, AgentStateTracker
Location: `node_modules/mega-minds/lib/`

### Hooks (Optional Automation)
**Setup once in regular terminal**: `npx mega-minds setup-hooks`
**Status check**: `npx mega-minds hook-status`

Automated features: Quality gates, session auto-save, context preservation

<!-- SECTION: documentation -->
## 📚 Documentation
- **Examples**: `../workflows/examples.md` - Complete usage scenarios
- **Agents**: `../workflows/agent-reference.md` - Full agent catalog
- **Rules**: `templates/RULES.md` - Critical enforcement details  
- **Commands**: `templates/QUICKREF.md` - Fast command reference
- **Workflows**: `../workflows/` - Communication protocols & quality gates

<!-- SECTION: workflow-core -->
## 🔄 Core Workflow
1. **Start**: `@project-orchestrator-agent` coordinates everything
2. **Task Tool**: All agent work through Task tool (never direct mentions)
3. **Handoffs**: Follow templates/workflows/communication-protocol.md templates
4. **Quality Gates**: Block progression until passed
5. **Memory Safe**: Max 2 agents, save sessions frequently

<!-- SECTION: dynamic-context -->
## 🔄 Current Session Context
{{DYNAMIC_CONTEXT}}

<!-- SECTION: performance-monitoring -->
## 📊 Performance Monitor
**System Health**: {{SYSTEM_HEALTH_STATUS}}  
**Load Time**: {{SECTION_LOAD_TIME}}ms (Target: <100ms)  
**Memory Efficiency**: {{CONTEXT_USAGE}}% context usage  
**Agent Coordination**: {{COORDINATION_SUCCESS_RATE}}% success rate  

<!-- SECTION: success-metrics -->
## 📈 Success Standards
- **Quality**: >90% test coverage, zero critical vulnerabilities
- **Performance**: <500ms response, >99% uptime  
- **Memory**: <3GB usage, stable concurrent agents
- **Coordination**: >95% successful handoffs

---
*Managed by mega-minds AI development team | Auto-optimized for performance*

<!-- PERFORMANCE METRICS:
Token Count Target: <1000 tokens (Current: {{TOKEN_COUNT}})
Load Time Target: <100ms (Current: {{SECTION_LOAD_TIME}}ms)
Context Usage: <3% of total (Current: {{CONTEXT_USAGE}}%)
Update Frequency: Real-time via MCP (Last: {{LAST_REFRESH}})
Optimization Score: {{OPTIMIZATION_SCORE}}/10
Cache Hit Rate: {{CACHE_HIT_RATE}}%
-->