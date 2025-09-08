# Mega-Minds Agent Reference Guide

This document provides comprehensive details about all available agents in the mega-minds multi-agent system. Each agent is a specialist designed to handle specific aspects of software development.

## Agent Invocation Standard

**Always use the Task tool format:**
```markdown
<function_calls>
<invoke name="Task">
<parameter name="subagent_type">general-purpose</parameter>
<parameter name="description">Brief task description</parameter>
<parameter name="prompt">## Handoff to @[agent-name]

🤖 @[agent-name] ACTIVE

**Context**: [Current situation]
**Your Task**: [Specific task description]
**Requirements**: [Detailed requirements]
**Success Criteria**: [Clear acceptance conditions]
</parameter>
</invoke>
</function_calls>
```

---

## Planning & Strategy Layer

### @project-orchestrator-agent
**Specialization**: Technical orchestration and architectural decisions  
**Primary Role**: Coordinates entire development process and manages agent workflows  
**Key Responsibilities**:
- Project planning and task breakdown
- Agent coordination and handoff management
- Timeline management and milestone tracking
- Conflict resolution and escalation
- Quality gate enforcement

**When to Use**: 
- Starting new projects
- Managing complex multi-agent workflows
- Coordinating cross-functional development
- Resolving agent boundary conflicts

**Constraints**:
- MUST NOT perform implementation work
- Limited to coordination activities only
- Cannot bypass agent handoff protocols

---

### @requirements-analysis-agent
**Specialization**: Stakeholder interviews and user story creation  
**Primary Role**: Analyzes project requirements and creates detailed specifications  
**Key Responsibilities**:
- Stakeholder requirement gathering
- User story creation and prioritization
- Acceptance criteria definition
- Requirement validation and verification
- Scope boundary definition

**When to Use**:
- Project discovery phase
- Feature specification needs
- Requirement clarification
- User story development
- Acceptance criteria creation

---

### @market-research-agent
**Specialization**: Competitive analysis and feature validation  
**Primary Role**: Provides market intelligence and competitive insights  
**Key Responsibilities**:
- Competitive landscape analysis
- Market trend identification
- Feature validation research
- User demographic analysis
- Pricing strategy insights

**When to Use**:
- New product development
- Feature prioritization decisions
- Market positioning
- Competitive analysis needs
- User research requirements

---

### @risk-assessment-agent
**Specialization**: Risk identification and mitigation strategies  
**Primary Role**: Identifies potential project risks and develops mitigation plans  
**Key Responsibilities**:
- Technical risk assessment
- Timeline risk analysis
- Resource risk evaluation
- Mitigation strategy development
- Risk monitoring and reporting

**When to Use**:
- Project planning phase
- Major architectural decisions
- Resource allocation planning
- Timeline estimation
- Critical path analysis

---

## Design & Prototyping Layer

### @ux-ui-design-agent
**Specialization**: Wireframes, prototypes, and design systems  
**Primary Role**: Creates user interface designs and user experience flows  
**Key Responsibilities**:
- User interface design
- User experience flow creation
- Wireframe and prototype development
- Design system establishment
- Accessibility compliance design

**When to Use**:
- UI/UX design needs
- User flow optimization
- Design system creation
- Prototype development
- Accessibility requirements

---

### @database-schema-agent
**Specialization**: Database design and optimization  
**Primary Role**: Designs efficient and scalable database structures  
**Key Responsibilities**:
- Database schema design
- Relationship modeling
- Performance optimization
- Migration planning
- Data integrity design

**When to Use**:
- Database design requirements
- Schema optimization needs
- Migration planning
- Performance tuning
- Data modeling

---

### @api-design-agent
**Specialization**: RESTful/GraphQL specifications and documentation  
**Primary Role**: Designs API interfaces and creates comprehensive documentation  
**Key Responsibilities**:
- API endpoint design
- Request/response modeling
- Authentication design
- API documentation
- Version management

**When to Use**:
- API specification needs
- Integration planning
- Documentation requirements
- Authentication design
- API versioning

---

### @security-architecture-agent
**Specialization**: Authentication, authorization, and compliance  
**Primary Role**: Designs secure systems and ensures compliance  
**Key Responsibilities**:
- Security architecture design
- Authentication system design
- Authorization model creation
- Compliance requirement analysis
- Security audit preparation

**When to Use**:
- Security design requirements
- Compliance needs
- Authentication planning
- Authorization modeling
- Security audits

---

## Development Layer

### @frontend-development-agent
**Specialization**: React/Vue components and responsive design  
**Primary Role**: Implements user-facing application components  
**Key Responsibilities**:
- Frontend component development
- Responsive design implementation
- State management integration
- Performance optimization
- Cross-browser compatibility

**When to Use**:
- UI component development
- Frontend feature implementation
- Responsive design needs
- State management
- Performance optimization

---

### @backend-development-agent
**Specialization**: Server logic, APIs, and business logic  
**Primary Role**: Implements server-side application logic and APIs  
**Key Responsibilities**:
- API endpoint implementation
- Business logic development
- Database integration
- Third-party service integration
- Performance optimization

**When to Use**:
- API implementation
- Business logic development
- Database operations
- Service integrations
- Backend optimization

---

### @database-agent
**Specialization**: Database operations, migrations, and backups  
**Primary Role**: Manages database operations and maintenance  
**Key Responsibilities**:
- Database operation implementation
- Migration script creation
- Backup strategy implementation
- Query optimization
- Database maintenance

**When to Use**:
- Database operations
- Migration needs
- Backup implementation
- Query optimization
- Database maintenance

---

### @authentication-agent
**Specialization**: User registration, login, and session management  
**Primary Role**: Implements user authentication and authorization systems  
**Key Responsibilities**:
- Authentication system implementation
- User registration workflows
- Session management
- Password security
- Multi-factor authentication

**When to Use**:
- Authentication implementation
- User management systems
- Session handling
- Security feature development
- Access control implementation

---

## Quality Assurance Layer

### @testing-agent
**Specialization**: Unit, integration, and end-to-end testing  
**Primary Role**: Creates and executes comprehensive testing strategies  
**Key Responsibilities**:
- Test strategy development
- Test case creation and execution
- Test automation
- Performance testing
- Test reporting

**When to Use**:
- Testing strategy development
- Test case creation
- Test automation needs
- Quality validation
- Test reporting

---

### @code-review-agent
**Specialization**: Code quality reviews and standards enforcement  
**Primary Role**: Reviews code for quality, standards, and best practices  
**Key Responsibilities**:
- Code quality assessment
- Standards compliance review
- Best practice enforcement
- Security vulnerability identification
- Performance analysis

**When to Use**:
- Code review requirements
- Quality assurance
- Standards enforcement
- Security reviews
- Performance analysis

---

### @performance-testing-agent
**Specialization**: Load testing and performance optimization  
**Primary Role**: Tests application performance and identifies bottlenecks  
**Key Responsibilities**:
- Load testing execution
- Performance bottleneck identification
- Optimization recommendations
- Scalability testing
- Performance monitoring

**When to Use**:
- Performance testing needs
- Load testing requirements
- Optimization identification
- Scalability validation
- Performance monitoring

---

### @security-testing-agent
**Specialization**: Vulnerability scans and security audits  
**Primary Role**: Identifies and validates security vulnerabilities  
**Key Responsibilities**:
- Security vulnerability scanning
- Penetration testing
- Security audit execution
- Compliance validation
- Security report generation

**When to Use**:
- Security testing needs
- Vulnerability assessment
- Security audits
- Compliance validation
- Security reporting

---

## DevOps & Infrastructure Layer

### @ci-cd-pipeline-agent
**Specialization**: Automated build and deployment workflows  
**Primary Role**: Creates and manages continuous integration/deployment pipelines  
**Key Responsibilities**:
- CI/CD pipeline design
- Build automation
- Deployment automation
- Pipeline optimization
- Release management

**When to Use**:
- CI/CD setup requirements
- Build automation needs
- Deployment automation
- Pipeline optimization
- Release management

---

### @infrastructure-agent
**Specialization**: Cloud provisioning and scaling management  
**Primary Role**: Manages cloud infrastructure and scaling strategies  
**Key Responsibilities**:
- Infrastructure provisioning
- Auto-scaling configuration
- Resource optimization
- Cost management
- Disaster recovery planning

**When to Use**:
- Infrastructure setup
- Scaling requirements
- Resource optimization
- Cost management
- Disaster recovery

---

### @monitoring-agent
**Specialization**: Logging, alerting, and performance tracking  
**Primary Role**: Implements monitoring, logging, and alerting systems  
**Key Responsibilities**:
- Monitoring system setup
- Log aggregation
- Alert configuration
- Performance tracking
- System health monitoring

**When to Use**:
- Monitoring setup needs
- Logging requirements
- Alert configuration
- Performance tracking
- System health monitoring

---

### @backup-recovery-agent
**Specialization**: Data backup and disaster recovery  
**Primary Role**: Implements backup strategies and disaster recovery plans  
**Key Responsibilities**:
- Backup strategy design
- Recovery procedure development
- Disaster recovery planning
- Backup testing
- Recovery validation

**When to Use**:
- Backup strategy needs
- Disaster recovery planning
- Recovery testing
- Backup implementation
- Recovery validation

---

## Agent Selection Guidelines

### Quick Selection Guide

**Project Start**: @project-orchestrator-agent  
**Requirements**: @requirements-analysis-agent  
**Market Analysis**: @market-research-agent  
**Risk Analysis**: @risk-assessment-agent  
**UI/UX Design**: @ux-ui-design-agent  
**Database Design**: @database-schema-agent  
**API Design**: @api-design-agent  
**Security Planning**: @security-architecture-agent  
**Frontend Work**: @frontend-development-agent  
**Backend Work**: @backend-development-agent  
**Database Operations**: @database-agent  
**Authentication**: @authentication-agent  
**Testing**: @testing-agent  
**Code Review**: @code-review-agent  
**Performance Testing**: @performance-testing-agent  
**Security Testing**: @security-testing-agent  
**CI/CD**: @ci-cd-pipeline-agent  
**Infrastructure**: @infrastructure-agent  
**Monitoring**: @monitoring-agent  
**Backup/Recovery**: @backup-recovery-agent  

### Decision Tree

```
Project Phase → Agent Layer → Specific Agent
    ↓              ↓              ↓
Planning → Strategy → Orchestrator/Requirements/Market/Risk
    ↓              ↓              ↓
Design → Prototyping → UX-UI/Database-Schema/API/Security-Arch
    ↓              ↓              ↓
Development → Implementation → Frontend/Backend/Database/Auth
    ↓              ↓              ↓
Quality → Testing → Testing/Code-Review/Performance/Security
    ↓              ↓              ↓
Operations → Infrastructure → CI-CD/Infrastructure/Monitoring/Backup
```

---

## Agent Coordination Best Practices

### Memory Management
- **Maximum 2 concurrent agents** (including orchestrator)
- Save sessions between agent handoffs
- Monitor memory status before activating agents

### Quality Gates
- All agents must pass relevant quality gates
- Code review required before deployment
- Security testing mandatory for production

### Communication
- Always use complete handoff templates
- Include clear success criteria
- Provide necessary context for decisions

### Troubleshooting
- Check agent boundaries for role conflicts
- Verify Task tool usage for invocations
- Monitor handoff logs for coordination issues

---

*For detailed usage examples, see workflows/examples.md*  
*For critical rules and constraints, see templates/RULES.md*  
*For command references, see templates/QUICKREF.md*