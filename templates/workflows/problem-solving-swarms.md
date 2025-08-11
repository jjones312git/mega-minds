# Problem-Solving Swarms System

## Overview

Problem-solving swarms are rapid-response teams of expert agents that activate when critical issues threaten system stability, security, or user experience. These swarms bring together the right expertise quickly to diagnose problems, implement fixes, and prevent future occurrences.

## Core Principles

1. **Speed Over Perfection** - Fast mitigation is better than perfect solutions that come too late
2. **All-Hands Response** - Critical issues get immediate attention from multiple experts
3. **Parallel Investigation** - Multiple agents investigate different aspects simultaneously
4. **Clear Communication** - Constant status updates and coordination
5. **Learning Focus** - Every incident becomes a learning opportunity

## When to Activate a Swarm

### Critical Issues (Immediate Activation)

**System Outages**:
- Application completely down or inaccessible
- Database connectivity failures
- Authentication system failures
- Payment processing failures

**Security Incidents**:
- Suspected data breaches
- Unauthorized access attempts
- DDoS attacks
- Malicious code deployment

**Performance Crises**:
- Response times >10x normal
- System resource exhaustion
- Database deadlocks or crashes
- CDN or infrastructure failures

**Data Integrity Issues**:
- Data corruption detected
- Backup system failures
- Accidental data deletion
- Migration failures

### High Priority Issues (Activate Within 1 Hour)

**Significant Performance Degradation**:
- Response times 3-5x normal
- Error rates >5% of requests
- User complaints about slowness
- Resource utilization >90%

**Partial Feature Outages**:
- Key features not working for subset of users
- Integration failures with external services
- Notification systems not working
- File upload/download failures

**Security Vulnerabilities**:
- High-severity security scan results
- Dependency vulnerabilities
- Configuration security issues
- Audit log anomalies

## Swarm Types and Composition

### 1. System Outage Swarm 🚨

**Purpose**: Restore system availability as quickly as possible
**Lead**: @infrastructure or @system-architect
**Core Team**:
- @infrastructure (Infrastructure diagnostics)
- @database-agent (Database health and connectivity)
- @monitoring-agent (Metrics, logs, and alerting)
- @backend-development (Application logic diagnostics)
- @system-architect (Coordination and decision-making)

**Optional Members** (based on symptoms):
- @frontend-development (If UI-related symptoms)
- @authentication-agent (If auth-related)
- @security-testing (If security suspected)

#### System Outage Activation Template

```markdown
🚨 SYSTEM OUTAGE SWARM ACTIVATED 🚨

**Incident ID**: [AUTO-GENERATED-ID]
**Activated By**: @[detecting-agent]
**Activation Time**: [YYYY-MM-DD HH:MM:SS UTC]
**Severity**: CRITICAL - System Down

**Issue Description**:
**What**: [Brief description of what's not working]
**Impact**: [Who/what is affected]
**Scope**: [Percentage of users/features affected]
**Started**: [When the issue was first detected]

**Initial Symptoms**:
- [Symptom 1 - e.g., "All API endpoints returning 500 errors"]
- [Symptom 2 - e.g., "Database connections timing out"]
- [Symptom 3 - e.g., "User reports: cannot log in"]

**SWARM ASSEMBLY - IMMEDIATE RESPONSE REQUIRED**

**@infrastructure** - PRIORITY 1:
- Check all server/container health status
- Verify network connectivity and load balancers
- Review resource utilization (CPU, memory, disk)
- Check deployment status and recent changes

**@database-agent** - PRIORITY 1:
- Verify database server status and connectivity
- Check for deadlocks, long-running queries
- Review connection pool status
- Assess backup/recovery options if needed

**@monitoring-agent** - PRIORITY 1:
- Provide all available metrics and error logs
- Set up enhanced monitoring for diagnosis
- Create incident dashboard for real-time tracking
- Establish communication channels for updates

**@backend-development** - PRIORITY 2:
- Review application logs for error patterns
- Check recent deployments or configuration changes
- Verify API endpoint functionality
- Assess business logic for potential issues

**@system-architect** - COORDINATION:
- Coordinate swarm response and decision-making
- Evaluate rollback options and risks
- Make go/no-go decisions on fix attempts
- Communicate with stakeholders

**IMMEDIATE OBJECTIVES**:
1. **Identify root cause** within 15 minutes
2. **Implement mitigation** within 30 minutes
3. **Restore basic functionality** within 60 minutes
4. **Full service restoration** within 2 hours

**STATUS UPDATES**: Required every 15 minutes from lead agents
**ESCALATION**: If not resolved in 1 hour, activate additional resources

**Communication Channel**: [Slack/Teams channel for real-time updates]
**Incident Commander**: @system-architect
```

### 2. Performance Crisis Swarm ⚡

**Purpose**: Diagnose and resolve critical performance issues
**Lead**: @performance-testing
**Core Team**:
- @performance-testing (Performance analysis and benchmarking)
- @database-agent (Database query optimization)
- @infrastructure (Resource scaling and optimization)
- @monitoring-agent (Metrics collection and analysis)
- @backend-development (Code optimization)

**Optional Members**:
- @frontend-development (If UI performance issues)
- @system-architect (For architectural changes)

#### Performance Crisis Activation Template

```markdown
⚡ PERFORMANCE CRISIS SWARM ACTIVATED ⚡

**Incident ID**: [AUTO-GENERATED-ID]
**Activated By**: @[detecting-agent]
**Activation Time**: [YYYY-MM-DD HH:MM:SS UTC]
**Severity**: HIGH - Performance Degradation

**Performance Impact**:
**Current Response Times**: [e.g., "95th percentile: 8 seconds (normal: 200ms)"]
**Error Rate**: [e.g., "12% of requests failing (normal: <1%)"]
**Affected Users**: [e.g., "All users experiencing slowness"]
**Business Impact**: [e.g., "User abandonment rate increased 300%"]

**Performance Baseline vs Current**:
| Metric | Normal | Current | Degradation |
|--------|--------|---------|-------------|
| Response Time (95th) | 200ms | 8000ms | 40x worse |
| Throughput | 1000 req/s | 50 req/s | 95% reduction |
| Error Rate | <1% | 12% | 12x increase |
| CPU Usage | 30% | 95% | Resource exhausted |

**SWARM ASSEMBLY - PERFORMANCE INVESTIGATION**

**@performance-testing** - LEAD INVESTIGATOR:
- Identify performance bottlenecks using APM tools
- Run diagnostic performance tests
- Compare current metrics to baseline
- Prioritize optimization opportunities

**@database-agent** - DATABASE ANALYSIS:
- Identify slow queries and database bottlenecks
- Check connection pool status and utilization
- Review recent schema changes or data growth
- Analyze query execution plans

**@infrastructure** - RESOURCE ANALYSIS:
- Review server resource utilization patterns
- Check for infrastructure bottlenecks
- Assess auto-scaling behavior
- Evaluate CDN and caching effectiveness

**@monitoring-agent** - METRICS & INSIGHTS:
- Provide detailed performance metrics breakdown
- Correlate performance issues with system events
- Set up enhanced monitoring for root cause analysis
- Track user behavior and abandonment patterns

**@backend-development** - CODE ANALYSIS:
- Review recent code changes for performance impact
- Identify CPU-intensive operations or memory leaks
- Check for inefficient algorithms or data processing
- Analyze API endpoint performance individually

**INVESTIGATION PRIORITIES**:
1. **Identify primary bottleneck** (database vs application vs infrastructure)
2. **Quick wins** - Immediate optimizations with high impact
3. **Resource scaling** - Temporary fixes to restore performance
4. **Long-term fixes** - Permanent solutions to prevent recurrence

**TARGET RESOLUTION**:
- **Immediate relief** (50% improvement) within 30 minutes
- **Acceptable performance** (within 2x normal) within 2 hours
- **Full optimization** within 24 hours

**STATUS UPDATES**: Every 30 minutes from @performance-testing
```

### 3. Security Incident Swarm 🔒

**Purpose**: Contain and resolve security threats or breaches
**Lead**: @security-architecture
**Core Team**:
- @security-architecture (Incident response coordination)
- @security-testing (Threat analysis and containment)
- @infrastructure (System isolation and hardening)
- @authentication-agent (Access control verification)
- @database-agent (Data integrity verification)

**Optional Members**:
- @monitoring-agent (Enhanced logging and tracking)
- @system-architect (System-wide impact assessment)

#### Security Incident Activation Template

```markdown
🔒 SECURITY INCIDENT SWARM ACTIVATED 🔒

**Incident ID**: [AUTO-GENERATED-ID]
**Activated By**: @[detecting-agent]
**Activation Time**: [YYYY-MM-DD HH:MM:SS UTC]
**Severity**: CRITICAL - Security Breach Suspected

**Security Incident Details**:
**Incident Type**: [Data Breach / Unauthorized Access / DDoS / Malware / Other]
**Detection Method**: [Automated Alert / User Report / Security Scan / Other]
**Suspected Impact**: [What data/systems may be compromised]
**Attack Vector**: [How the breach may have occurred - if known]

**Initial Evidence**:
- [Evidence 1 - e.g., "Unusual login attempts from foreign IPs"]
- [Evidence 2 - e.g., "Database queries accessing sensitive data"]
- [Evidence 3 - e.g., "Unexpected data export activity"]

**IMMEDIATE CONTAINMENT REQUIRED**

**@security-architecture** - INCIDENT COMMANDER:
- Coordinate incident response according to security playbook
- Make containment and communication decisions
- Assess legal and compliance reporting requirements
- Interface with external security resources if needed

**@security-testing** - THREAT ANALYSIS:
- Analyze attack patterns and indicators of compromise
- Identify affected systems and data
- Assess ongoing threat presence
- Document forensic evidence

**@infrastructure** - SYSTEM CONTAINMENT:
- Isolate affected systems to prevent spread
- Review access logs and network traffic
- Implement emergency access controls
- Prepare for potential system shutdown if needed

**@authentication-agent** - ACCESS CONTROL:
- Review all active user sessions and tokens
- Identify any unauthorized or suspicious accounts
- Implement emergency authentication restrictions
- Audit recent permission changes

**@database-agent** - DATA INTEGRITY:
- Assess data integrity and identify any unauthorized changes
- Review database access logs for suspicious activity
- Implement additional data access controls
- Prepare for potential data restoration if needed

**CONTAINMENT PRIORITIES**:
1. **Stop ongoing attack** - Immediate containment within 15 minutes
2. **Assess scope** - Understand what was accessed within 1 hour
3. **Preserve evidence** - Forensic data collection within 2 hours
4. **Implement fixes** - Close security gaps within 4 hours

**COMPLIANCE REQUIREMENTS**:
- [ ] GDPR breach notification (72 hours if EU data affected)
- [ ] Industry-specific reporting requirements
- [ ] Customer notification requirements
- [ ] Law enforcement notification (if required)

**COMMUNICATION RESTRICTIONS**:
⚠️ **CONFIDENTIAL** - Limit communication to incident response team only
⚠️ **NO PUBLIC STATEMENTS** without legal/PR approval
⚠️ **DOCUMENT EVERYTHING** for potential legal/audit requirements

**STATUS UPDATES**: Every 30 minutes to @system-architect (CONFIDENTIAL)
```

### 4. Data Integrity Swarm 💾

**Purpose**: Address data corruption, loss, or integrity issues
**Lead**: @database-agent
**Core Team**:
- @database-agent (Database restoration and integrity verification)
- @backup-recovery-agent (Backup assessment and restoration)
- @infrastructure (Storage system diagnostics)
- @monitoring-agent (Data consistency monitoring)
- @system-architect (Business impact assessment)

#### Data Integrity Activation Template

```markdown
💾 DATA INTEGRITY SWARM ACTIVATED 💾

**Incident ID**: [AUTO-GENERATED-ID]
**Activated By**: @[detecting-agent]
**Activation Time**: [YYYY-MM-DD HH:MM:SS UTC]
**Severity**: HIGH - Data Integrity Issue

**Data Issue Description**:
**Affected Data**: [Which tables/datasets are affected]
**Issue Type**: [Corruption / Loss / Inconsistency / Unauthorized Changes]
**Scope**: [Number of records, time range, user impact]
**Discovery Method**: [How the issue was detected]

**Initial Assessment**:
**Data Volume Affected**: [e.g., "10,000 user records"]
**Time Range**: [e.g., "Data from last 24 hours affected"]
**Business Impact**: [e.g., "Users cannot access their saved work"]
**Integrity Level**: [e.g., "Partial corruption - some fields recoverable"]

**SWARM ASSEMBLY - DATA RECOVERY RESPONSE**

**@database-agent** - LEAD RECOVERY:
- Assess extent of data corruption or loss
- Identify root cause of integrity issue
- Evaluate data recovery options
- Coordinate recovery strategy

**@backup-recovery-agent** - BACKUP ASSESSMENT:
- Verify backup integrity and availability
- Identify most recent clean backup
- Calculate recovery time objectives
- Prepare restoration procedures

**@infrastructure** - STORAGE DIAGNOSTICS:
- Check storage system health and integrity
- Review recent hardware or system changes
- Assess disk space and performance issues
- Verify data replication status

**@monitoring-agent** - IMPACT TRACKING:
- Monitor affected user accounts and processes
- Track data consistency across systems
- Set up alerts for additional integrity issues
- Document timeline of events

**@system-architect** - BUSINESS COORDINATION:
- Assess business impact and user communication needs
- Coordinate with stakeholders on recovery priorities
- Make decisions on system availability during recovery
- Plan for preventing similar future issues

**RECOVERY PRIORITIES**:
1. **Prevent further data loss** - Immediate system stabilization
2. **Assess recovery options** - Backup analysis within 30 minutes
3. **Begin data restoration** - Start recovery process within 1 hour
4. **Verify data integrity** - Validate restored data within 4 hours

**RECOVERY STRATEGY OPTIONS**:
- [ ] **Point-in-time recovery** from backup
- [ ] **Partial data reconstruction** from logs
- [ ] **Manual data recovery** from external sources
- [ ] **Accept data loss** and implement preventive measures

**USER COMMUNICATION**: @system-architect to coordinate messaging
**ESTIMATED RECOVERY TIME**: [TBD after initial assessment]
```

## Swarm Activation Process

### Step 1: Issue Detection and Initial Assessment

Any agent can activate a swarm by posting the appropriate activation template. The detecting agent should:

1. **Classify the issue severity** (Critical/High/Medium)
2. **Choose appropriate swarm type** based on issue characteristics
3. **Post activation template** with all available information
4. **Tag required swarm members** for immediate attention
5. **Set up communication channels** for coordination

### Step 2: Rapid Response Phase (0-30 minutes)

**Immediate Actions**:
- All tagged agents acknowledge receipt within 5 minutes
- Lead agent takes command and coordinates response
- Parallel investigation begins across all specialties
- Initial status update provided within 15 minutes
- Quick wins and immediate mitigations implemented

### Step 3: Investigation and Diagnosis (30 minutes - 2 hours)

**Systematic Analysis**:
- Each agent provides detailed analysis from their specialty
- Root cause identification becomes primary focus
- Potential solutions evaluated and prioritized
- Resource requirements for fixes assessed
- Implementation plans developed

### Step 4: Resolution Implementation (2-24 hours)

**Coordinated Fix Deployment**:
- Lead agent coordinates fix implementation
- Changes deployed using established change management
- Progress monitored in real-time by monitoring agent
- Rollback plans activated if fixes don't work
- Stakeholder communication maintained throughout

### Step 5: Post-Incident Review (Within 48 hours)

**Learning and Improvement**:
- Incident timeline documentation
- Root cause analysis completion
- Prevention strategy development
- Process improvement identification
- Knowledge sharing with broader team

## Swarm Communication Protocols

### Status Update Template

Every swarm member should provide regular status updates:

```markdown
## Swarm Status Update - @[agent-name] - [Timestamp]

**Incident**: [Incident ID]
**Agent Role**: [My specialty/responsibility in this swarm]
**Status**: 🔍 Investigating / 🔧 Implementing Fix / ✅ Resolved / ❌ Blocked

**Progress Since Last Update**:
- [Completed action 1]
- [Completed action 2]
- [Discovery/finding]

**Current Focus**:
[What I'm working on right now]

**Findings**:
- [Key discovery 1]
- [Key discovery 2]
- [Ruling out: what's NOT the cause]

**Next Actions** (next 30 minutes):
- [Planned action 1]
- [Planned action 2]

**Assistance Needed**:
- @[agent-name]: [Specific request]
- Resource needed: [What I need to proceed]

**Blockers**:
[Anything preventing progress]

**ETA to Resolution** (from my specialty): [Time estimate]
**Confidence Level**: [High/Medium/Low]
```

### Decision Points Template

When swarms need to make critical decisions quickly:

```markdown
🚨 SWARM DECISION POINT 🚨

**Decision Required**: [What needs to be decided]
**Timeline**: Decision needed by [Time] 
**Options**:

**Option A**: [Approach 1]
- Pros: [Benefits]
- Cons: [Risks/Drawbacks]
- Time to implement: [Duration]
- Confidence: [High/Medium/Low]

**Option B**: [Approach 2] 
- Pros: [Benefits]
- Cons: [Risks/Drawbacks]
- Time to implement: [Duration]
- Confidence: [High/Medium/Low]

**Expert Votes**:
- @[agent-1]: [Option preference and brief reasoning]
- @[agent-2]: [Option preference and brief reasoning]
- @[agent-3]: [Option preference and brief reasoning]

**Lead Decision**: @[swarm-lead] - [Final choice and rationale]
**Implementation**: Starting immediately with [chosen option]
```

## Swarm Success Metrics

### Response Time Metrics

**Time to Acknowledgment**: All swarm members acknowledge within 5 minutes
**Time to Initial Assessment**: First status update within 15 minutes  
**Time to Mitigation**: Temporary fix implemented within 1 hour
**Time to Resolution**: Issue fully resolved based on severity:
- Critical: <4 hours
- High: <24 hours  
- Medium: <72 hours

### Quality Metrics

**Resolution Effectiveness**: Percentage of issues resolved without recurrence
**Customer Impact**: Reduction in user complaints during incident response
**System Stability**: Mean time between failures improvement
**Process Improvement**: Number of preventive measures implemented post-incident

### Learning Metrics

**Knowledge Transfer**: Documentation quality and completeness
**Process Refinement**: Number of process improvements identified and implemented
**Prevention Success**: Reduction in similar incident types over time
**Team Capability**: Cross-training and skill development outcomes

## Post-Swarm Procedures

### Immediate Post-Resolution (Within 2 hours)

```markdown
## Swarm Resolution Summary

**Incident ID**: [ID]
**Resolution Time**: [YYYY-MM-DD HH:MM:SS UTC]
**Total Duration**: [X hours Y minutes]
**Lead Agent**: @[swarm-lead]

**Final Status**: ✅ RESOLVED

**Root Cause**: [Brief description of what caused the issue]

**Resolution Approach**: [How the issue was fixed]

**Immediate Actions Completed**:
- [Action 1] - Completed by @[agent] at [time]
- [Action 2] - Completed by @[agent] at [time]
- [Action 3] - Completed by @[agent] at [time]

**System Status**: [Current health and any ongoing monitoring]

**User Impact Resolution**: [How users are now affected - should be minimal/none]

**Outstanding Actions**:
- [ ] [Action 1] - Due: [date] - Assigned: @[agent]
- [ ] [Action 2] - Due: [date] - Assigned: @[agent]

**Post-Incident Review**: Scheduled for [date/time] with [attendees]
```

### Post-Incident Review Template (Within 48 hours)

```markdown
# Post-Incident Review: [Incident ID] - [Date]

## Incident Summary
**Duration**: [Start] to [End] ([total duration])
**Impact**: [Description of user/business impact]
**Swarm Type**: [Type of swarm activated]
**Resolution**: [Brief description of how it was resolved]

## Timeline of Events
| Time | Event | Agent | Action/Discovery |
|------|-------|-------|------------------|
| [Time] | [Event] | @[agent] | [Description] |
| [Time] | [Event] | @[agent] | [Description] |

## What Went Well
- [Positive aspect 1]
- [Positive aspect 2]
- [Positive aspect 3]

## What Could Be Improved
- [Improvement area 1] - Impact: [High/Medium/Low]
- [Improvement area 2] - Impact: [High/Medium/Low]
- [Improvement area 3] - Impact: [High/Medium/Low]

## Root Cause Analysis
**Primary Cause**: [Main factor that led to the incident]
**Contributing Factors**: [Other factors that made it worse or harder to detect]
**Prevention Analysis**: [How this could have been prevented]

## Action Items
### Immediate (Next 1 week)
- [ ] [Action 1] - Assigned: @[agent] - Due: [date]
- [ ] [Action 2] - Assigned: @[agent] - Due: [date]

### Short-term (Next 1 month)  
- [ ] [Action 1] - Assigned: @[agent] - Due: [date]
- [ ] [Action 2] - Assigned: @[agent] - Due: [date]

### Long-term (Next quarter)
- [ ] [Action 1] - Assigned: @[agent] - Due: [date]

## Prevention Strategy
**Detection Improvements**: [How to catch similar issues earlier]
**Monitoring Enhancements**: [New alerts or dashboards needed]
**Process Changes**: [Updates to procedures or workflows]
**Technical Improvements**: [System changes to prevent recurrence]

## Knowledge Sharing
**Documentation Updates**: [What docs need updating]
**Training Needs**: [Skills or knowledge gaps identified]  
**Runbook Updates**: [Emergency procedures to update]
**Tool Improvements**: [Better tools or automation needed]

## Success Metrics for Prevention
- [Metric 1]: [How to measure if prevention is working]
- [Metric 2]: [Measurement approach]
- [Review Date]: [When to check if prevention measures are effective]
```

Remember: The goal of problem-solving swarms is not just to fix immediate issues, but to build a more resilient system and more capable team through rapid response, systematic investigation, and continuous learning from every incident.