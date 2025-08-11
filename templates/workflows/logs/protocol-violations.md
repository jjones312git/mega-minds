# Protocol Violations Log

## Overview

This file tracks all violations of the multi-agent workflow protocols including Task tool usage, handoff procedures, role boundaries, and quality gate compliance. This log is critical for maintaining system integrity and continuous improvement.

## ⚠️ VIOLATION REPORTING REQUIREMENTS ⚠️

**ALL violations MUST be logged immediately when detected**
**RESPONSE REQUIRED**: Within 15 minutes of detection
**RESOLUTION TRACKING**: Until fully corrected and preventive measures implemented

## Active Violation Tracking

### Template for New Violations

```markdown
## Violation #[Number] - [Date/Time]

### Violation Classification
**Type**: [Protocol/Boundary/Quality/Critical]
**Severity**: [Low/Medium/High/Critical]
**Category**: [Task Tool/Handoff/Role Boundary/Quality Gate]

### Incident Details
**Violating Agent**: @[agent-name]
**Detection Method**: [How violation was discovered]
**Detector**: [Who/what detected the violation]
**Rule Violated**: [Specific rule reference from documentation]

### Violation Description
**What Happened**: [Detailed description of the violation]
**Expected Behavior**: [What should have been done according to protocol]
**Impact**: [What was affected by the violation]
**Risk Level**: [Potential consequences if not addressed]

### Evidence
**Files/Code Affected**: [List of files or systems impacted]
**Screenshots**: [If applicable]
**Logs**: [Relevant log entries]
**Witnesses**: [Other agents that observed violation]

### Timeline
**Violation Occurred**: [YYYY-MM-DD HH:MM]
**Detection Time**: [YYYY-MM-DD HH:MM]
**Response Initiated**: [YYYY-MM-DD HH:MM]
**Work Stopped**: [YYYY-MM-DD HH:MM]
**Resolution Completed**: [YYYY-MM-DD HH:MM]

### Response Actions
**Immediate Actions**:
- [ ] Work stopped by violating agent
- [ ] Affected work reverted/corrected
- [ ] Proper handoff initiated
- [ ] Stakeholders notified

**Corrective Measures**:
- [Action 1]
- [Action 2]
- [Action 3]

### Resolution Status
**Current Status**: [Open/In Progress/Resolved/Under Review]
**Work Status**: [Stopped/Corrected/Re-handed-off]
**Quality Impact**: [None/Minor/Moderate/Severe]

### Prevention
**Root Cause**: [Why violation occurred]
**Process Updates**: [Documentation changes made]
**Training Needed**: [Knowledge gaps identified]
**System Improvements**: [Technical changes to prevent recurrence]

### Lessons Learned
**Key Insights**: [What was learned from this violation]
**Process Improvements**: [How to prevent similar violations]
**Documentation Updates**: [Files that need updating]
```

---

## Example Violation Entries

### Example 1: Task Tool Bypass Violation

```markdown
## Violation #001 - 2024-01-15 14:30

### Violation Classification
**Type**: Protocol
**Severity**: High
**Category**: Task Tool

### Incident Details
**Violating Agent**: @project-orchestrator-agent
**Detection Method**: File creation without Task tool record
**Detector**: @code-review-agent during routine audit
**Rule Violated**: "ALL agent work MUST use Task tool" (claude.md line 220)

### Violation Description
**What Happened**: Orchestrator directly created HTML and CSS files for landing page
**Expected Behavior**: Should have used Task tool to hand off to @frontend-development-agent
**Impact**: Frontend work done without proper specialist review and quality gates
**Risk Level**: High - Bypassed code review and testing protocols

### Evidence
**Files/Code Affected**: 
- /project/index.html
- /project/styles.css
**Screenshots**: N/A
**Logs**: No Task tool invocation found in logs for this work
**Witnesses**: @frontend-development-agent noticed unauthorized implementation

### Timeline
**Violation Occurred**: 2024-01-15 14:30
**Detection Time**: 2024-01-15 16:45
**Response Initiated**: 2024-01-15 16:47
**Work Stopped**: 2024-01-15 16:50
**Resolution Completed**: 2024-01-16 10:30

### Response Actions
**Immediate Actions**:
- [x] Work stopped by violating agent
- [x] HTML/CSS files reverted
- [x] Proper handoff initiated to @frontend-development-agent
- [x] Project timeline adjusted

**Corrective Measures**:
- Orchestrator re-read role boundaries documentation
- Implemented automated file creation monitoring
- Added violation to daily compliance review

### Resolution Status
**Current Status**: Resolved
**Work Status**: Re-handed-off and completed properly
**Quality Impact**: Minor - 2 day delay in project timeline

### Prevention
**Root Cause**: Orchestrator unclear on strict role boundaries for implementation work
**Process Updates**: Added more explicit MUST NOT language in claude.md
**Training Needed**: All agents need refresher on Task tool requirements
**System Improvements**: File creation alerts for boundary violations

### Lessons Learned
**Key Insights**: Role boundaries need more explicit enforcement mechanisms
**Process Improvements**: Daily compliance audits implemented
**Documentation Updates**: Enhanced orchestrator constraints in claude.md
```

### Example 2: Quality Gate Bypass Violation

```markdown
## Violation #002 - 2024-01-18 11:15

### Violation Classification
**Type**: Quality
**Severity**: Critical
**Category**: Quality Gate

### Incident Details
**Violating Agent**: @ci-cd-pipeline-agent
**Detection Method**: Automated security scan post-deployment
**Detector**: @security-testing-agent monitoring system
**Rule Violated**: "Code with failed reviews CANNOT be deployed" (quality-gates.md line 20)

### Violation Description
**What Happened**: Code deployed to production without passing security review
**Expected Behavior**: Deployment should be blocked until security gate passes
**Impact**: Potential security vulnerability exposed in production
**Risk Level**: Critical - Live security exposure

### Evidence
**Files/Code Affected**: Authentication module with potential SQL injection vulnerability
**Screenshots**: Security scan results showing High severity finding
**Logs**: Deployment logs show bypass of security gate
**Witnesses**: @monitoring-agent detected unusual database query patterns

### Timeline
**Violation Occurred**: 2024-01-18 11:15
**Detection Time**: 2024-01-18 11:22
**Response Initiated**: 2024-01-18 11:23
**Work Stopped**: 2024-01-18 11:24 (immediate rollback)
**Resolution Completed**: 2024-01-18 18:30

### Response Actions
**Immediate Actions**:
- [x] Emergency rollback to previous version
- [x] Security incident response protocol activated
- [x] All related systems locked down
- [x] Security team notified immediately

**Corrective Measures**:
- Fixed SQL injection vulnerability
- Enhanced quality gate enforcement in CI/CD pipeline
- Added additional security checks
- Implemented mandatory security review approval

### Resolution Status
**Current Status**: Resolved
**Work Status**: Vulnerability patched and properly reviewed
**Quality Impact**: Severe - Production incident and emergency rollback

### Prevention
**Root Cause**: CI/CD pipeline configuration allowed quality gate override
**Process Updates**: Removed override capability for critical security gates
**Training Needed**: All deployment agents on security gate importance
**System Improvements**: Automated blocking for failed security scans

### Lessons Learned
**Key Insights**: Quality gates need technical enforcement, not just process enforcement
**Process Improvements**: No-override policy for critical security gates
**Documentation Updates**: Enhanced blocking rules in quality-gates.md
```

---

## Violation Categories and Response Times

### Severity Levels and Response Requirements

**Critical Violations** (Production impact, security risks)
- **Response Time**: Immediate (within 5 minutes)
- **Actions**: Emergency stop, rollback, incident response
- **Authority**: @technical-architecture-agent + security team

**High Violations** (Major process bypass, role boundary violations)
- **Response Time**: 15 minutes
- **Actions**: Stop work, revert changes, proper handoff
- **Authority**: Any enforcement agent

**Medium Violations** (Protocol deviations, incomplete handoffs)
- **Response Time**: 1 hour
- **Actions**: Correct process, complete missing steps
- **Authority**: Peer agents

**Low Violations** (Documentation gaps, minor format issues)
- **Response Time**: End of day
- **Actions**: Update documentation, process correction
- **Authority**: Any agent

## Recurring Violation Patterns

### Common Issues Tracking
```markdown
## Weekly Pattern Analysis - Week of [Date]

**Most Common Violations**:
1. [Violation type] - [Count] occurrences
2. [Violation type] - [Count] occurrences
3. [Violation type] - [Count] occurrences

**Agents with Most Violations**:
1. @[agent-name] - [Count] violations
2. @[agent-name] - [Count] violations

**Root Causes Identified**:
- [Root cause 1]
- [Root cause 2]

**System Improvements Needed**:
- [Technical improvement 1]
- [Process improvement 1]

**Training Required**:
- [Training topic 1] for [agents]
- [Training topic 2] for [agents]
```

## Usage Instructions

1. **Immediate Logging**: Report violation as soon as detected
2. **Evidence Collection**: Gather all relevant information and files
3. **Response Execution**: Follow severity-appropriate response protocol
4. **Resolution Tracking**: Monitor until fully corrected
5. **Pattern Analysis**: Weekly review for recurring issues
6. **Prevention Updates**: Implement system/process improvements

This violation tracking system ensures rapid response to protocol breaches and continuous improvement of the multi-agent workflow system.