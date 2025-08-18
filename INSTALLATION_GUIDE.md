# Mega-Minds Installation Guide

## Quick Start (2 minutes)

### 1. Install mega-minds
```bash
npm install mega-minds --save
```

### 2. Initialize in your project
```bash
npx mega-minds init
```

### 3. Start Claude Code
Open Claude Code in your project directory - it will automatically read `CLAUDE.md` and activate the AI development team.

## System Requirements

- **Node.js**: 14.0.0 or higher
- **npm**: 6.0.0 or higher
- **Operating System**: Windows, macOS, or Linux
- **Memory**: 4GB RAM recommended
- **Disk Space**: 100MB for package and logs

## Installation Options

### Option 1: NPM Package (Recommended)
```bash
# Install as project dependency
npm install mega-minds --save

# Or install globally
npm install -g mega-minds
```

### Option 2: Development Installation
```bash
# Clone repository
git clone https://github.com/jjones312git/mega-minds.git
cd mega-minds

# Install dependencies
npm install

# Link for global usage
npm link
```

## Verification

Verify installation is working:
```bash
npx mega-minds verify
```

Expected output:
```
✅ mega-minds installation verified
✅ All core components accessible
✅ Agent templates loaded successfully
```

## Directory Structure After Installation

```
your-project/
├── .claude/              # Claude Code configuration
│   ├── agents/          # AI agent templates
│   ├── workflows/       # Communication protocols & quality gates
│   └── claude.md        # Main AI team configuration
├── .mega-minds/         # AI team state and memory (created during use)
│   ├── memory/          # Session and context storage
│   ├── state/           # Real-time agent coordination
│   ├── sessions/        # Development session history
│   └── quality/         # Quality gate reports
└── node_modules/
    └── mega-minds/      # Package installation
```

## Configuration

### Basic Configuration (Automatic)
The `npx mega-minds init` command automatically configures:
- Agent templates and workflows
- Memory management settings
- Quality gates and validation rules
- Claude Code integration

### Advanced Configuration (Optional)

Edit `CLAUDE.md` to customize:
- Project-specific requirements
- Agent behavior preferences
- Quality gate thresholds
- Memory management settings

## Troubleshooting

### Common Issues

**Permission Errors**:
```bash
sudo npm install -g mega-minds
```

**Node Version Issues**:
```bash
node --version  # Should be 14.0.0+
npm install -g n
n stable
```

**Package Not Found**:
```bash
npm cache clean --force
npm install mega-minds --save
```

**Memory Issues**:
```bash
npx mega-minds memory-status
npx mega-minds memory-cleanup
```

### Getting Help

1. **Check installation**: `npx mega-minds verify`
2. **View logs**: Check `.mega-minds/logs/` directory
3. **Reset configuration**: Delete `.mega-minds/` and run `npx mega-minds init`
4. **Report issues**: [GitHub Issues](https://github.com/jjones312git/mega-minds/issues)

## Next Steps

After installation:
1. ✅ **Read the [User Guide](USER_GUIDE.md)** for usage instructions
2. 🚀 **Start your first project** with Claude Code
3. 📊 **Enable enterprise features** if needed for team collaboration
4. 🔧 **Configure hooks** for automated workflows

## Updating

To update to the latest version:
```bash
npm update mega-minds
```

Check for breaking changes in the [CHANGELOG.md](CHANGELOG.md) before updating.