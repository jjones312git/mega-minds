# Mega-Minds User Guide

## Overview

Mega-minds transforms Claude Code into a complete AI development team with specialized agents for every aspect of software development - from planning to deployment.

## Core Concepts

### 🤖 AI Development Team
- **26 specialized agents** covering all development needs
- **Automatic coordination** between agents with handoff tracking
- **Quality gates** ensure high-quality output at every stage
- **Memory management** prevents crashes and preserves context

### 🔄 How It Works
1. **You make a request** in Claude Code
2. **Orchestrator agent** plans the work and assigns specialists
3. **Specialist agents** execute tasks with expert knowledge
4. **Quality gates** validate all work before proceeding
5. **Results delivered** with complete documentation

## Basic Usage

### Starting a New Project

**1. Make your request:**
```
"I want to build a task management app with user authentication, 
real-time collaboration, and mobile support."
```

**2. The AI team automatically:**
- Analyzes requirements with @requirements-analysis-agent
- Creates technical architecture with @technical-architecture-agent
- Designs UI/UX with @ux-ui-design-agent
- Builds backend with @backend-development-agent
- Creates frontend with @frontend-development-agent
- Tests everything with @testing-agent
- Deploys with @ci-cd-pipeline-agent

**3. You get a complete, production-ready application**

### Memory Management

Claude Code has memory limits. Mega-minds automatically manages this:

```bash
# Check memory status
npx mega-minds memory-status

# Save current session
npx mega-minds save-session "implemented user authentication"

# Compress context when needed
npx mega-minds compress-context

# Clean up memory
npx mega-minds memory-cleanup
```

### Monitoring Progress

```bash
# See what agents are working on
npx mega-minds agent-status

# View project statistics
npx mega-minds stats

# Check system health
npx mega-minds memory-status
```

## Command Reference

### Core Commands
```bash
npx mega-minds init                    # Initialize AI team
npx mega-minds verify                  # Verify installation
npx mega-minds agent-status            # See active agents
npx mega-minds stats                   # Project statistics
```

### Memory Management
```bash
npx mega-minds memory-status           # Check memory health
npx mega-minds memory-cleanup          # Force cleanup
npx mega-minds save-session "desc"     # Save development session
npx mega-minds load-session            # View latest session
npx mega-minds compress-context        # Optimize for Claude Code
```

### Quality Gates
```bash
npx mega-minds run-quality-gates       # Run quality checks
npx mega-minds quality-status          # View quality metrics
```

### Dashboard (Real-time monitoring)
```bash
npx mega-minds dashboard start         # Start web dashboard
npx mega-minds dashboard status        # Check dashboard status
npx mega-minds dashboard open          # Open in browser
```

## Enterprise Features

### Multi-Project Management

Manage multiple projects simultaneously:

```bash
# Enable multi-project mode
npx mega-minds enable-multi-project

# Add projects to registry
npx mega-minds project add /path/to/project --name="My App"

# List all projects
npx mega-minds project list

# Switch between projects
npx mega-minds project switch <project-id>

# Check project health
npx mega-minds project health <project-id>
```

### Team Collaboration

Enable team development with role-based permissions:

```bash
# Enable team collaboration
npx mega-minds enable-team-collaboration

# Add team members
npx mega-minds team add john-doe "John Doe" collaborator

# List team members
npx mega-minds team list

# Change user roles
npx mega-minds team role john-doe viewer

# View team activity
npx mega-minds team activity
```

**Available Roles:**
- **Owner**: Full access, can manage team and settings
- **Collaborator**: Can read, write, and collaborate on development
- **Viewer**: Read-only access, can view activity and progress

### Enterprise Monitoring

Advanced monitoring and analytics:

```bash
# Enable enterprise monitoring
npx mega-minds enable-monitoring

# View system metrics
npx mega-minds monitoring metrics

# Check monitoring status
npx mega-minds monitoring status

# View recent alerts
npx mega-minds monitoring alerts

# Generate analytics report
npx mega-minds monitoring report 7  # 7-day report
```

### Structured Logging

Enterprise-grade logging with audit trails:

```bash
# Enable structured logging
npx mega-minds enable-logging

# Check logging status
npx mega-minds logging status

# Set log level
npx mega-minds logging level warning

# Available levels: emergency, alert, critical, error, warning, notice, info, debug
```

## Agent Specializations

### Planning & Strategy
- **@project-orchestrator-agent**: Coordinates entire development process
- **@requirements-analysis-agent**: Gathers and analyzes requirements
- **@market-research-agent**: Competitive analysis and validation
- **@risk-assessment-agent**: Identifies and mitigates risks

### Design & Architecture
- **@technical-architecture-agent**: System design and technology decisions
- **@ux-ui-design-agent**: User interface and experience design
- **@database-schema-agent**: Database design and optimization
- **@api-design-agent**: API specifications and documentation
- **@security-architecture-agent**: Security planning and compliance

### Development
- **@frontend-development-agent**: React, Vue, Angular development
- **@backend-development-agent**: Server logic and API implementation
- **@database-agent**: Database operations and management
- **@authentication-agent**: User authentication and authorization

### Quality Assurance
- **@testing-agent**: Comprehensive testing strategies
- **@code-review-agent**: Code quality and standards
- **@performance-testing-agent**: Load testing and optimization
- **@security-testing-agent**: Security scanning and audits

### DevOps & Operations
- **@ci-cd-pipeline-agent**: Automated deployment workflows
- **@infrastructure-agent**: Cloud infrastructure and scaling
- **@monitoring-agent**: System monitoring and alerting
- **@backup-recovery-agent**: Backup strategies and disaster recovery

## Best Practices

### 1. Clear Requirements
```
Good: "Build a React e-commerce site with Stripe payments, user accounts, 
       product catalog, shopping cart, and admin dashboard"

Avoid: "Make me a website"
```

### 2. Save Sessions Regularly
```bash
# Save after major milestones
npx mega-minds save-session "completed user authentication system"
npx mega-minds save-session "finished product catalog with search"
npx mega-minds save-session "deployed to production successfully"
```

### 3. Monitor Memory
```bash
# Check before starting large tasks
npx mega-minds memory-status

# Clean up if memory gets high
npx mega-minds memory-cleanup
```

### 4. Use Quality Gates
Let the AI team run quality checks:
```bash
npx mega-minds run-quality-gates
```
Don't skip quality validation - it prevents bugs and security issues.

### 5. Trust the Process
- Let agents coordinate among themselves
- The orchestrator knows which specialists to call
- Each agent has deep expertise in their domain
- Quality gates ensure everything works together

## Workflow Examples

### Building a Web Application

**Request**: "Create a blog platform with user authentication, post creation, comments, and admin moderation"

**Automatic Workflow**:
1. **Planning**: Requirements analysis and technical architecture
2. **Design**: UI/UX design, database schema, API design
3. **Development**: Backend API, frontend interface, database setup
4. **Quality**: Testing, code review, security scanning
5. **Deployment**: CI/CD pipeline, infrastructure setup, monitoring

### Adding a Feature

**Request**: "Add email notifications when users receive comments on their posts"

**Automatic Workflow**:
1. **Analysis**: Feature requirements and impact assessment
2. **Design**: Email templates, notification preferences UI
3. **Development**: Email service integration, notification logic
4. **Testing**: Email delivery testing, user preference testing
5. **Deployment**: Feature flag rollout, monitoring setup

### Fixing Issues

**Request**: "The site is loading slowly, especially the dashboard page"

**Automatic Workflow**:
1. **Diagnosis**: Performance analysis and bottleneck identification
2. **Investigation**: Database query analysis, frontend optimization
3. **Solutions**: Code optimization, caching implementation
4. **Testing**: Load testing, performance validation
5. **Monitoring**: Performance tracking setup

## Troubleshooting

### Common Issues

**Agents Not Responding**:
```bash
npx mega-minds agent-status     # Check agent state
npx mega-minds memory-cleanup   # Clean up memory
```

**Memory Warnings**:
```bash
npx mega-minds save-session "current progress"
npx mega-minds compress-context
```

**Quality Gates Failing**:
```bash
npx mega-minds quality-status   # See what's failing
# Address the specific issues shown
npx mega-minds run-quality-gates --fix  # Auto-fix if possible
```

**Project Corruption**:
```bash
# Reset to clean state
rm -rf .mega-minds/
npx mega-minds init
```

### Getting Help

1. **Check status**: `npx mega-minds agent-status`
2. **Review logs**: Check `.mega-minds/logs/` directory
3. **Reset if needed**: Delete `.mega-minds/` and reinitialize
4. **Enterprise support**: Use `npx mega-minds enterprise` for advanced features
5. **Report bugs**: [GitHub Issues](https://github.com/jjones312git/mega-minds/issues)

## Advanced Configuration

### Customizing Agent Behavior

Edit `.claude/claude.md` to customize:
- Project-specific requirements
- Preferred technologies and frameworks
- Code style and conventions
- Quality gate thresholds

### Hooks Integration

Automate workflows with Claude Code hooks:
```bash
# Setup automated workflows (run in regular terminal)
npx mega-minds setup-hooks

# Check hook status (works in Claude Code)
npx mega-minds hook-status
```

### Enterprise Deployment

For organizations:
1. Enable team collaboration for multi-user projects
2. Set up enterprise monitoring for production systems
3. Configure structured logging for compliance
4. Use multi-project management for portfolio oversight

## Limits and Considerations

- **Memory**: Claude Code has 4GB memory limit - save sessions regularly
- **Complexity**: Very large projects may need to be broken into phases
- **Internet**: Some agents may need internet access for research
- **Tokens**: Long conversations may hit token limits - use context compression

## Support

- **Documentation**: This guide and inline help
- **Community**: GitHub Discussions
- **Issues**: GitHub Issues for bugs
- **Enterprise**: Contact for enterprise support and training

---

**Ready to build amazing software with your AI development team!** 🚀