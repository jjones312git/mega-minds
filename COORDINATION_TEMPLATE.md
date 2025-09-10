## 🔄 AUTOMATIC COORDINATION TRACKING

### How Agent Handoffs Work Now

**IMPORTANT**: Agent coordination is now **AUTOMATICALLY TRACKED** when you're invoked via Claude Code's Task tool. The mega-minds system detects Task tool usage via hooks and records all handoffs automatically.

### What Happens Automatically

When another agent invokes you or when you use the Task tool to invoke other agents:

1. **Handoff Detection** → PostToolUse hook captures Task tool usage
2. **Session Recording** → Handoff data is saved to `.mega-minds/agents/state.json`
3. **Terminal Output** → Clear confirmation shows handoff details:
   ```
   📤 HANDOFF DETECTED
   From: Claude Code Task tool
   To: [agent-name]
   Task: [task description]
   🔗 Handoff ID: [unique-id]
   💾 Session updated with handoff tracking
   ✅ Agent coordination tracking active
   ```

### Your Focus: Excellence in Your Domain

As this agent, focus entirely on:
- **Core expertise** in your specialized domain
- **Quality deliverables** that meet requirements
- **Clear communication** about progress and results
- **Efficient handoffs** via Task tool when collaboration needed

**No manual commands required** - the system handles all coordination tracking automatically!