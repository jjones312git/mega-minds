# Mega-Minds 🤖

**Turn Claude Code into your personal AI development team!**

Mega-Minds gives you an intelligent AI development workflow system that coordinates specialized agents to build any software project. Just tell Claude Code what you want to build, and the system will intelligently select and coordinate the right agents for the job.

## What Does It Do? 🚀

Imagine having a whole team of expert programmers who:
- **Understand any programming language** (JavaScript, Python, Go, Java, Rust, etc.)
- **Work together perfectly** - they pass work between each other automatically
- **Never forget anything** - they remember your entire project
- **Check each other's work** - no bugs get through
- **Adapt to YOUR project** - works with React, Vue, Django, Rails, anything!

## Super Simple Setup 📦

### Step 1: Install Mega-Minds
```bash
npx mega-minds init
```
That's it! Just run this command in any folder and Mega-Minds will:
- ✅ Detect what kind of project you have (or help you start a new one)
- ✅ Set up all the AI assistants
- ✅ Create a smart CLAUDE.md file
- ✅ Be ready to code!

### Step 2: Open Claude Code
Open Claude Code in your project folder. It will automatically see Mega-Minds and show you exactly what to do next!

### Step 3: Start Building
Just tell Claude Code what you want to build:
```
"I want to build a simple to-do app with user accounts"
```

The AI team will take care of everything else! 🎉

## What AI Agents Are Available? 🤖

Mega-Minds includes an intelligent agent selection system with 7 specialized agents:

### Core Development Agents
- **🎯 Project Orchestrator Agent** - Coordinates project phases, manages workflow, and oversees team coordination
- **💻 Frontend Development Agent** - Builds user interfaces with React, Vue, Angular, and responsive design
- **⚙️ Backend Development Agent** - Creates server-side logic, APIs, database integrations, and backend services
- **🧪 Testing Agent** - Implements comprehensive testing strategies, quality assurance, and validation
- **📊 Monitoring Agent** - Sets up production monitoring, logging, and observability systems
- **🚀 DevOps Agent** - Handles deployment, CI/CD pipelines, infrastructure, and automation
- **🛡️ Security Agent** - Ensures application security, performs audits, and implements security measures

### 🧠 Intelligent Agent Selection
The system automatically analyzes your requests and selects the most appropriate agents based on:
- **Keyword matching** - Recognizes development patterns and terminology
- **Capability alignment** - Matches tasks to agent expertise areas
- **Project context** - Considers your project type and previous work
- **Learning from feedback** - Improves selection accuracy over time

**Goal: 90%+ agent selection accuracy with <2 second response time**

## Smart Features ✨

### 🧠 **Auto-Detects Your Project**
- New project? It helps you plan and build from scratch
- Existing project? It studies your code and continues where you left off
- Any programming language? It adapts instantly!

### 🔄 **Perfect Teamwork**
- Assistants automatically pass work to each other
- No confusion about who does what
- Everything stays organized

### 💾 **Never Forgets**
- Remembers your entire project forever
- Picks up exactly where you left off
- Saves important decisions and progress

### 🛡️ **Quality Control**
- Every piece of code gets reviewed
- Automatic testing of new features
- Security checks on everything

### ⚡ **NEW: Claude Code Enhanced Integration**
- **50% Faster Agent Activation** - Slash commands instead of verbose Task tool syntax
- **Real-Time Monitoring** - Live statusline shows system health and agent activity  
- **Intelligent Settings** - Auto-generated optimal Claude Code configuration
- **Security-First** - Input validation, XSS prevention, secure file permissions
- **Performance Optimized** - Smart caching, memory management, load balancing

## How Smart Is The Detection? 🔍

When you run `npx mega-minds init`, it automatically figures out:

- **New empty folder?** → "Let's plan your new project!"
- **Has some code files?** → "I'll study what you've built so far"
- **React project?** → Uses React-specific helpers
- **Python/Django?** → Switches to Python expertise
- **Multiple languages?** → Handles them all!

No setup needed - it just works! 🪄

## Example: Building a To-Do App 📝

Here's how the AI team would work together:

1. **You say:** "Build a to-do app with user accounts and sharing"

2. **Project Orchestrator** creates the plan:
   - User registration/login system
   - To-do list management
   - Sharing features
   - Nice-looking interface

3. **Database Designer** creates the data structure:
   - Users table
   - Tasks table
   - Sharing permissions

4. **Frontend Developer** builds the interface:
   - Login/signup forms
   - To-do list display
   - Add/edit/delete tasks

5. **Backend Developer** builds the server:
   - User authentication
   - Task API endpoints
   - Sharing logic

6. **Tester** checks everything works perfectly

7. **DevOps Expert** helps you deploy it to the internet

All automatically coordinated - you just watch it happen! 🎬

## Commands You Can Use 🛠️

### Basic Commands
```bash
# Set up Mega-Minds in any project
npx mega-minds init

# Check what AI assistants are working on
npx mega-minds agent-status

# Check memory and performance
npx mega-minds memory-status

# Clean up memory if needed
npx mega-minds memory-cleanup

# Save current development session
npx mega-minds save-session "description"

# Compress context for optimization
npx mega-minds compress-context
```

### Quality & Intelligence Commands
```bash
# Run automated quality gates
npx mega-minds run-quality-gates

# Check quality metrics
npx mega-minds quality-status

# Record feedback on agent performance (helps improve selection accuracy)
npx mega-minds record-feedback

# View agent selection metrics
npx mega-minds selection-metrics
```

### ⚡ Key Features

#### 🧠 **Intelligent Agent Selection**
Mega-Minds automatically selects the best agent for each task:
- Analyzes your request using advanced algorithms
- Considers project context and history
- Learns from feedback to improve accuracy
- Provides reasoning for agent recommendations

#### 🔄 **Seamless Handoff Management** 
- Agents coordinate automatically through the handoff system
- Track work progress and agent activity in real-time
- Quality gates ensure high-quality output at each stage
- Comprehensive session management and memory handling

#### 💾 **Memory Management**
- Automatic session saving and restoration
- Context compression to prevent memory issues
- Intelligent cleanup of unused data
- Session history for project continuity

#### 🛡️ **Quality Gates**
- Automated quality checks at each development stage
- Code review and security scanning
- Performance validation and optimization
- Comprehensive testing strategies

## Troubleshooting 🔧

**"It says I need Node.js"**
- Install Node.js from nodejs.org (it's free!)
- Then try `npx mega-minds init` again

**"Claude Code doesn't see Mega-Minds"**
- Make sure you ran `npx mega-minds init` in your project folder
- Close and reopen Claude Code
- Look for the CLAUDE.md file in your folder

**"The AI assistants seem confused"**
- Try `npx mega-minds memory-status` to check memory
- Save your work with `npx mega-minds save-session`
- Start a fresh conversation in Claude Code

## What You Need 📋

- **Computer:** Windows, Mac, or Linux
- **Node.js:** Free download from nodejs.org  
- **Claude Code:** The AI coding assistant
- **Internet:** For downloading and running

That's it! No complicated setup, no configuration files, no headaches.

## Why Mega-Minds? 💡

**Before Mega-Minds:**
- Ask Claude Code to build something complex
- It tries to do everything at once
- Gets confused, forgets things, makes mistakes
- You have to guide every step

**With Mega-Minds:**
- AI experts work together like a real team
- Each assistant is really good at their specialty  
- They coordinate automatically
- They remember everything
- You just describe what you want!

## License 📄

MIT License - Use it for anything, it's free! 🎉

---

**Ready to build something awesome? Just run `npx mega-minds init` and let your AI development team get to work!** 🚀