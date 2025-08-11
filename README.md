# MegaMinds - AI Development Team Framework

A multi-agent workflow system that orchestrates specialized AI agents to work together as a cohesive development team. MegaMinds transforms Claude Code into a collaborative AI development environment where different agents handle specific aspects of software development - from planning and architecture to implementation and deployment.

## Overview

MegaMinds creates an intelligent development ecosystem where:
- **Specialized AI agents** work on their areas of expertise (frontend, backend, database, testing, etc.)
- **Smart coordination** ensures agents collaborate effectively and hand off work seamlessly
- **Quality gates** enforce high standards before any code progresses
- **Memory management** maintains context across long development sessions
- **Decision councils** bring together expert agents for critical technical choices

## Key Features

### 🤖 40+ Specialized Agents
- **Planning & Strategy**: Project orchestration, requirements analysis, risk assessment
- **Design & Architecture**: UX/UI design, database schemas, API design, security architecture
- **Development**: Frontend, backend, database, authentication implementations
- **Quality Assurance**: Testing, code review, performance analysis, security auditing
- **DevOps**: CI/CD pipelines, infrastructure, monitoring, backup/recovery
- **Business Operations**: Analytics, customer support, marketing automation
- **SaaS Features**: Multi-tenancy, subscription management, onboarding flows

### 🧠 Intelligent Memory System
- Automatic context compression when approaching token limits
- Session save/restore for long-running projects
- Architecture documentation that evolves with your project
- Agent state tracking across handoffs

### 🛡️ Quality-First Development
- Mandatory code reviews before deployment
- Comprehensive testing requirements
- Security scanning at every stage
- Performance benchmarking and optimization

### 🏛️ Smart Decision Making
- Decision councils for technology choices
- Expert consultation during development
- Problem-solving swarms for critical issues
- Clear escalation paths for blockers

## Installation

### Prerequisites
- Node.js 14.0 or higher
- npm or yarn package manager
- Claude Code (for AI agent execution)

### Global Installation (Recommended)

```bash
npm install -g mega-minds
```

Or with yarn:

```bash
yarn global add mega-minds
```

### Local Installation

```bash
npm install mega-minds
```

## Getting Started

### 1. Initialize MegaMinds in Your Project

Navigate to your project directory and run:

```bash
mega-minds init
```

This will:
- Create a `.mega-minds/` directory for memory and state management
- Generate a `CLAUDE.md` file that Claude Code will automatically read
- Set up agent templates and workflow configurations
- Initialize the memory management system

### 2. Start Claude Code

Open Claude Code in your project directory. It will automatically read the `CLAUDE.md` file and have access to all MegaMinds capabilities.

### 3. Begin Development

Start with a high-level request to Claude Code:

```
"I want to build a task management SaaS application with user authentication, 
team collaboration, real-time updates, and subscription billing."
```

The AI development team will:
1. Analyze your requirements
2. Create a technical architecture
3. Design the user interface
4. Implement features systematically
5. Test everything thoroughly
6. Set up deployment infrastructure

## Available Commands

### Project Management
- `mega-minds init` - Initialize MegaMinds in your project
- `mega-minds agent-status` - View current agent activities
- `mega-minds save-session "description"` - Save current development state
- `mega-minds load-session` - Restore previous session
- `mega-minds compress-context` - Optimize memory when approaching limits

### Memory Management
- `mega-minds update-memory "what happened"` - Update project documentation
- `mega-minds clear-memory` - Reset memory (use with caution)

## How It Works

### Agent Coordination Flow

1. **Request Analysis**: Your request is analyzed to determine which agents are needed
2. **Planning Phase**: The project orchestrator creates an execution plan
3. **Parallel Execution**: Multiple agents work simultaneously on independent tasks
4. **Quality Gates**: All work passes through review before progressing
5. **Integration**: Components are integrated with proper testing
6. **Deployment**: Final deployment with monitoring and backup systems

### Memory Management

MegaMinds maintains intelligent memory across sessions:
- **Architecture Documentation**: Technical decisions and system design
- **Recent Work Log**: What was accomplished in recent sessions
- **Active Context**: Current focus areas and pending tasks
- **Agent State**: Which agents are working on what

### Quality Enforcement

Every piece of work must pass quality checks:
- Code review by specialized review agents
- Automated testing at unit, integration, and e2e levels
- Security scanning for vulnerabilities
- Performance testing for scalability

## Example Workflows

### Building a New Feature
```
User: "Add a commenting system to the blog posts"
```
MegaMinds will coordinate:
- Requirements analysis for comment features
- Database schema design for comments
- API endpoint creation
- Frontend UI implementation
- Real-time update system
- Moderation capabilities
- Testing and deployment

### Technical Decision Making
```
User: "Should we use PostgreSQL or MongoDB for our application?"
```
MegaMinds will convene a decision council with:
- Database architecture agent
- Performance testing agent
- Infrastructure agent
- Security architecture agent

### Emergency Response
```
User: "The application is running slowly in production"
```
MegaMinds activates a problem-solving swarm:
- Monitoring agent checks metrics
- Database agent analyzes queries
- Performance agent identifies bottlenecks
- Infrastructure agent reviews resources

## Project Structure

After initialization, your project will have:

```
your-project/
├── .mega-minds/
│   ├── memory/
│   │   ├── architecture.md      # System design documentation
│   │   ├── recent-work.md       # Recent development log
│   │   └── sessions/            # Saved session states
│   ├── agents/
│   │   └── active-context.md    # Current agent activities
│   └── logs/
│       └── handoffs.log         # Agent coordination log
├── CLAUDE.md                     # Main interface for Claude Code
└── [your project files]
```

## Best Practices

1. **Start with Clear Requirements**: The more specific your initial request, the better the results
2. **Trust the Process**: Let agents hand off work naturally rather than micromanaging
3. **Save Sessions Regularly**: Use `mega-minds save-session` before major changes
4. **Monitor Token Usage**: Use `compress-context` when Claude Code mentions token limits
5. **Review Agent Decisions**: Check the decision logs to understand technical choices

## Troubleshooting

### Common Issues

**"Token limit approaching"**
- Run `mega-minds compress-context` to optimize memory
- Save current session and start fresh if needed

**"Agent handoff failed"**
- Check `.mega-minds/logs/handoffs.log` for details
- Ensure all quality gates are passing
- Restart the specific agent task

**"Memory not persisting"**
- Verify `.mega-minds/` directory exists
- Check file permissions
- Run `mega-minds init` again if needed

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests to improve MegaMinds.

## License

MIT License - see LICENSE file for details

## Author

Jesse Jones

## Acknowledgments

Built to enhance Claude Code's capabilities for complex software development projects. Special thanks to the AI development community for inspiration and feedback.

---

**Note**: MegaMinds requires Claude Code to function as it provides the AI agent execution environment. The framework orchestrates how Claude Code approaches complex development tasks but does not replace the need for Claude Code itself.