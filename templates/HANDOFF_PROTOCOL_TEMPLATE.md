# Standard Handoff Protocol Template for All Agents

## 🔄 MANDATORY HANDOFF PROTOCOL - MEGA-MINDS 2.0

### When Starting Your Work
**ALWAYS** run this command when you begin any task:
```bash
npx mega-minds record-agent-start "{{AGENT-NAME}}" "{{task-description}}"
```

### While Working
Update your progress periodically (especially at key milestones):
```bash
npx mega-minds update-agent-status "{{AGENT-NAME}}" "{{current-activity}}" "{{percentage}}"
```

### When Handing Off to Another Agent
**ALWAYS** run this when you need to pass work to another agent:
```bash
npx mega-minds record-handoff "{{AGENT-NAME}}" "{{target-agent}}" "{{task-description}}"
```

### When Completing Your Work
**ALWAYS** run this when you finish your tasks:
```bash
npx mega-minds record-agent-complete "{{AGENT-NAME}}" "{{completion-summary}}" "{{next-agent-if-any}}"
```

### Example Workflow for {{AGENT-NAME}}
```bash
# Starting work
npx mega-minds record-agent-start "{{AGENT-NAME}}" "{{EXAMPLE-TASK}}"

# Updating progress at 50%
npx mega-minds update-agent-status "{{AGENT-NAME}}" "{{EXAMPLE-PROGRESS}}" "50"

# Completing work and handing off
npx mega-minds record-agent-complete "{{AGENT-NAME}}" "{{EXAMPLE-COMPLETION}}" "{{NEXT-AGENT}}"
```

**CRITICAL**: These commands enable real-time handoff tracking and session management. Without them, the mega-minds system cannot track agent coordination!