# Mega-Minds 🤖

**Turn Claude Code into your personal AI development team!**

Mega-Minds gives you 31+ specialized AI coding assistants that work together to build any software project. Just tell them what you want to build, and they'll handle everything from planning to deployment.

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

## What AI Assistants Do You Get? 🤖

### Planning Team
- **Project Orchestrator** - The team leader who coordinates everyone
- **Requirements Analyst** - Figures out exactly what you need
- **Risk Assessor** - Spots potential problems early

### Design Team  
- **UI/UX Designer** - Makes your app look amazing
- **Database Designer** - Organizes your data perfectly
- **Security Architect** - Keeps your app safe from hackers

### Coding Team
- **Frontend Developer** - Builds the part users see
- **Backend Developer** - Builds the server and logic
- **Database Expert** - Sets up databases and queries
- **Authentication Expert** - Handles user login/signup

### Testing Team
- **Quality Assurance Tester** - Tests everything thoroughly  
- **Code Reviewer** - Checks all code for mistakes
- **Performance Tester** - Makes sure your app is fast
- **Security Tester** - Finds security vulnerabilities

### DevOps Team
- **CI/CD Pipeline Expert** - Sets up automatic deployments
- **Infrastructure Expert** - Manages servers and hosting
- **Monitoring Expert** - Watches your app in production
- **Backup Expert** - Protects your data

### Business Team
- **Analytics Expert** - Tracks user behavior and metrics
- **Customer Support** - Helps with support features
- **Marketing Automation** - Sets up email and marketing tools

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

# See your project's tech stack info
npx mega-minds variable-status

# Check memory and performance
npx mega-minds memory-status
```

### ⚡ NEW: Claude Code Integration Features

#### Quick Slash Commands (Use directly in Claude Code)

**Agent Activation (All 31+ agents available as slash commands):**
```bash
# Planning Team
/orchestrator         # Project coordination and management  
/requirements        # Requirements analysis and planning
/technical-arch      # System architecture design
/risk-assessment     # Risk analysis and mitigation

# Development Team  
/frontend            # Frontend/UI development
/backend             # Backend/API development
/database            # Database design and optimization
/authentication      # User authentication systems

# Quality Assurance
/testing             # Comprehensive testing and QA
/code-review         # Code quality and standards review
/security-testing    # Security analysis and testing
/performance-testing # Performance optimization

# DevOps & Infrastructure
/ci-cd              # CI/CD pipeline setup
/infrastructure     # Cloud infrastructure management
/monitoring         # System monitoring and logging
/backup-recovery    # Data backup and recovery

# Business Operations
/analytics          # User analytics and BI
/customer-support   # Support system development
/marketing-automation # Marketing campaigns

# SaaS Features
/multi-tenancy      # Multi-tenant architecture
/subscription       # Billing and subscription management
/onboarding         # User onboarding flows

# Utility Commands
/mega-status        # Show system status
/handoff           # Secure agent handoff  
/memory-check      # Memory health check
```

*And many more! All agents automatically get slash commands.*

#### Real-Time Statusline
Automatically displays at bottom of Claude Code:
- 🤖 Active agents count
- 💾 Memory usage and pressure
- 🔄 Handoff queue status
- ⚡ Performance metrics
- 🛡️ Security status

#### Auto-Generated Settings
- ✅ Optimal Claude Code settings per project
- ✅ Security-first tool permissions
- ✅ Project-specific configurations
- ✅ Performance optimizations

### Save Your Progress
```bash
# Save your current work
npx mega-minds save-session "finished user login"

# Load previous work
npx mega-minds load-session
```

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