# Local Testing Guide - Mega-Minds 2.0.1

Quick guide for testing mega-minds locally using `npm link` before publishing to NPM.

## 🔗 Setup Local Link

```bash
# In the mega-minds project directory
npm link

# Verify link was created
ls -la /usr/local/lib/node_modules/mega-minds
```

## 📁 Test in New Project

```bash
# Create test project
mkdir /tmp/mega-minds-test
cd /tmp/mega-minds-test

# Link to local mega-minds
npm link mega-minds

# Verify installation
npx mega-minds --version
# Should show: 2.0.1
```

## 🧪 Critical Tests

### 1. Basic Functionality
```bash
npx mega-minds init
npx mega-minds agent-status
```

### 2. Dashboard Test (Fixed Issues)
```bash
# Terminal 1: Start dashboard
npx mega-minds dashboard start

# Terminal 2: Activate agent
npx mega-minds record-agent-start "test-agent" "testing local version"

# Check dashboard shows agent (http://localhost:3001)
```

### 3. Session File Test (Fixed Issues)
```bash
# Monitor session files
watch -n 1 "ls -la .mega-minds/sessions/ | wc -l"

# Run multiple commands - should NOT create 30+ files/minute
npx mega-minds record-agent-start "agent1" "task1"
npx mega-minds record-agent-start "agent2" "task2"
```

## ✅ Expected Results

- **Dashboard**: Shows active agents properly
- **Session Files**: Max 2-3 files (not 30+/minute)
- **Throttling**: Log shows "Session save throttled" messages
- **No Crashes**: System remains stable

## 🧹 Cleanup

```bash
# Remove link from test project
cd /tmp/mega-minds-test
npm unlink mega-minds

# Remove global link
npm unlink -g mega-minds

# Clean up test directory
rm -rf /tmp/mega-minds-test
```

## 🚨 Emergency Stop

If system acts up during testing:
```bash
# Kill all processes
pkill -f "mega-minds"

# Reset state
rm -rf .mega-minds/
```

---

**Ready for NPM publish once local testing passes!** 🚀