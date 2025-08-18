// lib/commands/dashboard.js
// CLI command for dashboard management
// Phase 3.1: Real-time dashboard with web interface

const DashboardServer = require('../dashboard/DashboardServer');

/**
 * Start the mega-minds dashboard
 * Command: mega-minds dashboard start [--port=3001]
 */
async function startDashboard(options = {}) {
    const projectPath = process.cwd();
    const port = options.port || 3001;
    
    try {
        console.log('📊 Starting mega-minds dashboard...');
        
        const server = new DashboardServer(projectPath, { port });
        await server.start();
        
        console.log('\n✅ Dashboard is now running!');
        console.log(`🌐 Open your browser to: http://localhost:${port}`);
        console.log('📊 Real-time monitoring of:');
        console.log('   • Agent activity and status');
        console.log('   • Handoff queue and coordination');
        console.log('   • Quality gate results');
        console.log('   • System metrics and memory usage');
        console.log('\n💡 Use Ctrl+C to stop the dashboard');
        
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n📊 Stopping dashboard...');
            await server.stop();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            await server.stop();
            process.exit(0);
        });
        
        // Keep process alive
        const keepAlive = () => {
            setTimeout(keepAlive, 1000);
        };
        keepAlive();
        
    } catch (error) {
        console.error('❌ Failed to start dashboard:', error.message);
        
        if (error.code === 'EADDRINUSE') {
            console.log(`💡 Port ${port} is already in use. Try a different port:`);
            console.log(`   mega-minds dashboard start --port=3002`);
        }
        
        process.exit(1);
    }
}

/**
 * Get dashboard status
 * Command: mega-minds dashboard status
 */
async function getDashboardStatus() {
    try {
        // Try to connect to see if dashboard is running
        const response = await fetch(`http://localhost:3001/api/status`).catch(() => null);
        
        if (response && response.ok) {
            const status = await response.json();
            
            console.log('📊 Dashboard Status: RUNNING');
            console.log(`🌐 URL: http://localhost:${status.server.port}`);
            console.log(`📁 Project: ${status.project.name}`);
            console.log(`👥 Connected clients: ${status.server.clients}`);
            console.log(`🕒 Last update: ${new Date(status.project.lastUpdate).toLocaleString()}`);
            
            // Show quick metrics
            if (status.system) {
                const memoryMB = status.system.memory ? 
                    Math.round(status.system.memory.heapUsed / 1024 / 1024) : 0;
                console.log(`🧠 Memory usage: ${memoryMB}MB`);
            }
        } else {
            console.log('📊 Dashboard Status: NOT RUNNING');
            console.log('💡 Start the dashboard with: mega-minds dashboard start');
        }
        
    } catch (error) {
        console.log('📊 Dashboard Status: NOT RUNNING');
        console.log('💡 Start the dashboard with: mega-minds dashboard start');
    }
}

/**
 * Stop the dashboard (helper for external stop)
 */
async function stopDashboard() {
    try {
        // Try to connect and trigger shutdown
        const response = await fetch('http://localhost:3001/api/status').catch(() => null);
        
        if (response && response.ok) {
            console.log('📊 Dashboard is running on port 3001');
            console.log('💡 To stop it, press Ctrl+C in the terminal where it\'s running');
            console.log('   Or close the terminal/process running the dashboard');
        } else {
            console.log('📊 Dashboard is not currently running');
        }
        
    } catch (error) {
        console.log('📊 Dashboard is not currently running');
    }
}

/**
 * Open dashboard in browser
 */
async function openDashboard() {
    const { spawn } = require('child_process');
    const url = 'http://localhost:3001';
    
    try {
        // Check if dashboard is running
        const response = await fetch(`${url}/api/status`).catch(() => null);
        
        if (!response || !response.ok) {
            console.log('❌ Dashboard is not running');
            console.log('💡 Start it first with: mega-minds dashboard start');
            return;
        }
        
        console.log(`🌐 Opening dashboard in browser: ${url}`);
        
        // Open browser based on platform
        const platform = process.platform;
        let command;
        
        if (platform === 'darwin') {
            command = 'open';
        } else if (platform === 'win32') {
            command = 'start';
        } else {
            command = 'xdg-open';
        }
        
        spawn(command, [url], { detached: true, stdio: 'ignore' });
        
    } catch (error) {
        console.error('❌ Could not open browser:', error.message);
        console.log(`💡 Manually open your browser to: ${url}`);
    }
}

/**
 * Show dashboard help
 */
function showDashboardHelp() {
    console.log('📊 Mega-Minds Dashboard Commands');
    console.log('================================');
    console.log('');
    console.log('mega-minds dashboard start [--port=3001]  - Start dashboard server');
    console.log('mega-minds dashboard status               - Check dashboard status');
    console.log('mega-minds dashboard open                 - Open dashboard in browser');
    console.log('mega-minds dashboard stop                 - Show how to stop dashboard');
    console.log('');
    console.log('🌐 The dashboard provides real-time monitoring of:');
    console.log('   • Active agents and their current tasks');
    console.log('   • Handoff queue and coordination status');
    console.log('   • Quality gate results and scores');
    console.log('   • System metrics and memory usage');
    console.log('');
    console.log('💡 Examples:');
    console.log('   mega-minds dashboard start              # Start on default port 3001');
    console.log('   mega-minds dashboard start --port=3002  # Start on custom port');
    console.log('   mega-minds dashboard open               # Open in browser');
}

module.exports = {
    startDashboard,
    getDashboardStatus,
    stopDashboard,
    openDashboard,
    showDashboardHelp
};