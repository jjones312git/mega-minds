// lib/dashboard/DashboardServer.js
// Real-time dashboard server for mega-minds project monitoring
// Phase 3.1: Enterprise Features - Real-time visualization

const http = require('http');
const fs = require('fs-extra');
const path = require('path');

/**
 * Real-time dashboard server for mega-minds project monitoring
 * Provides web-based interface for agent activity, progress, and metrics
 * PRD Requirements: Real-time project dashboard with agent visualization
 */
class DashboardServer {
    constructor(projectPath, options = {}) {
        this.projectPath = projectPath;
        this.options = {
            port: options.port || 3001,
            autoStart: options.autoStart || false,
            updateInterval: options.updateInterval || 2000, // 2 seconds
            ...options
        };
        
        this.server = null;
        this.clients = new Set();
        this.isRunning = false;
        
        // File paths for monitoring existing system components
        this.stateDir = path.join(projectPath, '.mega-minds', 'state');
        this.qualityDir = path.join(projectPath, '.mega-minds', 'quality');
        this.intelligenceDir = path.join(projectPath, '.mega-minds', 'intelligence');
        this.sessionsDir = path.join(projectPath, '.mega-minds', 'sessions');
        
        // Dashboard data cache
        this.dashboardData = {
            agents: {},
            handoffs: {},
            quality: {},
            system: {},
            lastUpdate: null
        };
        
        // File watchers (lightweight polling to avoid complex dependencies)
        this.monitorInterval = null;
        this.lastFileStates = new Map();
    }

    /**
     * Start the dashboard server
     */
    async start() {
        if (this.isRunning) {
            console.log('📊 Dashboard server is already running');
            return;
        }

        try {
            console.log('📊 Starting mega-minds dashboard server...');
            
            // Ensure required directories exist
            await this.ensureDirectories();
            
            // Create HTTP server with simple routing
            this.server = http.createServer(this.handleRequest.bind(this));
            
            // Start server
            await new Promise((resolve, reject) => {
                this.server.listen(this.options.port, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
            
            // Start file monitoring
            this.startMonitoring();
            
            this.isRunning = true;
            console.log(`✅ Dashboard server running at http://localhost:${this.options.port}`);
            console.log(`📁 Monitoring project: ${this.projectPath}`);
            
        } catch (error) {
            console.error('❌ Failed to start dashboard server:', error.message);
            throw error;
        }
    }

    /**
     * Stop the dashboard server
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }

        console.log('📊 Stopping dashboard server...');
        
        // Stop monitoring
        this.stopMonitoring();
        
        // Close server
        if (this.server) {
            await new Promise((resolve) => {
                this.server.close(() => {
                    resolve();
                });
            });
        }
        
        // Clear clients
        this.clients.clear();
        
        this.isRunning = false;
        console.log('✅ Dashboard server stopped');
    }

    /**
     * Handle HTTP requests
     */
    async handleRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.options.port}`);
        
        try {
            // Set CORS headers for development
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            // Route handling
            if (url.pathname === '/') {
                await this.serveDashboard(res);
            } else if (url.pathname === '/api/status') {
                await this.serveStatus(res);
            } else if (url.pathname === '/api/agents') {
                await this.serveAgents(res);
            } else if (url.pathname === '/api/handoffs') {
                await this.serveHandoffs(res);
            } else if (url.pathname === '/api/quality') {
                await this.serveQuality(res);
            } else if (url.pathname === '/api/intelligence') {
                await this.serveIntelligence(res);
            } else if (url.pathname === '/api/metrics') {
                await this.serveMetrics(res);
            } else if (url.pathname.startsWith('/api/sse')) {
                await this.handleSSE(req, res);
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
            
        } catch (error) {
            console.error('❌ Dashboard request error:', error.message);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        }
    }

    /**
     * Serve the main dashboard HTML
     */
    async serveDashboard(res) {
        const html = this.generateDashboardHTML();
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }

    /**
     * Serve project status API
     */
    async serveStatus(res) {
        await this.updateDashboardData();
        
        // Check for multi-project mode
        let projects = [];
        try {
            const ProjectManager = require('../core/ProjectManager');
            const projectManager = new ProjectManager();
            await projectManager.initialize();
            
            if (projectManager.isMultiProjectMode()) {
                projects = projectManager.listProjects().map(p => ({
                    id: p.id,
                    name: p.name,
                    path: p.path,
                    status: p.status,
                    isCurrent: projectManager.getCurrentProject()?.id === p.id
                }));
            }
            
            await projectManager.shutdown();
        } catch (error) {
            // Fallback to single-project mode
        }
        
        const status = {
            project: {
                path: this.projectPath,
                name: path.basename(this.projectPath),
                lastUpdate: this.dashboardData.lastUpdate
            },
            server: {
                running: this.isRunning,
                port: this.options.port,
                clients: this.clients.size
            },
            system: this.dashboardData.system,
            multiProject: {
                enabled: projects.length > 0,
                projects: projects
            }
        };
        
        this.sendJSON(res, status);
    }

    /**
     * Serve agents API
     */
    async serveAgents(res) {
        await this.updateDashboardData();
        this.sendJSON(res, this.dashboardData.agents);
    }

    /**
     * Serve handoffs API
     */
    async serveHandoffs(res) {
        await this.updateDashboardData();
        this.sendJSON(res, this.dashboardData.handoffs);
    }

    /**
     * Serve quality gates API
     */
    async serveQuality(res) {
        await this.updateDashboardData();
        this.sendJSON(res, this.dashboardData.quality);
    }

    /**
     * Serve intelligence data API
     */
    async serveIntelligence(res) {
        await this.updateDashboardData();
        this.sendJSON(res, this.dashboardData.intelligence);
    }

    /**
     * Serve metrics API
     */
    async serveMetrics(res) {
        await this.updateDashboardData();
        
        const metrics = {
            agents: this.dashboardData.agents,
            handoffs: this.dashboardData.handoffs,
            quality: this.dashboardData.quality,
            system: this.dashboardData.system,
            summary: this.generateMetricsSummary()
        };
        
        this.sendJSON(res, metrics);
    }

    /**
     * Handle Server-Sent Events for real-time updates
     */
    async handleSSE(req, res) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });
        
        // Add client
        this.clients.add(res);
        
        // Send initial data
        await this.updateDashboardData();
        this.broadcastToClient(res, 'update', this.dashboardData);
        
        // Handle client disconnect
        req.on('close', () => {
            this.clients.delete(res);
        });
    }

    /**
     * Update dashboard data from existing system files
     */
    async updateDashboardData() {
        const now = new Date().toISOString();
        
        try {
            // Update agents data (from Phase 1 AgentStateBroadcaster)
            this.dashboardData.agents = await this.loadAgentsData();
            
            // Update handoffs data (from Phase 1 StateMonitor)
            this.dashboardData.handoffs = await this.loadHandoffsData();
            
            // Update quality data (from Phase 2 QualityGateManager)
            this.dashboardData.quality = await this.loadQualityData();
            
            // Update intelligence data (from RequestAnalyzer)
            this.dashboardData.intelligence = await this.loadIntelligenceData();
            
            // Update system data
            this.dashboardData.system = await this.loadSystemData();
            
            this.dashboardData.lastUpdate = now;
            
        } catch (error) {
            console.warn('⚠️ Error updating dashboard data:', error.message);
        }
    }

    /**
     * Load agents data from existing state files
     */
    async loadAgentsData() {
        try {
            const agentStateFile = path.join(this.stateDir, 'active-agents.json');
            if (await fs.pathExists(agentStateFile)) {
                return await fs.readJSON(agentStateFile);
            }
        } catch (error) {
            console.warn('⚠️ Could not load agents data:', error.message);
        }
        
        return { activeAgents: {}, totalActiveCount: 0, lastUpdate: null };
    }

    /**
     * Load handoffs data from existing state files
     */
    async loadHandoffsData() {
        try {
            const handoffQueueFile = path.join(this.stateDir, 'handoff-queue.json');
            if (await fs.pathExists(handoffQueueFile)) {
                return await fs.readJSON(handoffQueueFile);
            }
        } catch (error) {
            console.warn('⚠️ Could not load handoffs data:', error.message);
        }
        
        return { handoffs: [], queueLength: 0, pendingCount: 0 };
    }

    /**
     * Load quality data from existing reports
     */
    async loadQualityData() {
        try {
            const qualityReportsDir = path.join(this.qualityDir, 'reports');
            if (await fs.pathExists(qualityReportsDir)) {
                const files = await fs.readdir(qualityReportsDir);
                const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse();
                
                if (jsonFiles.length > 0) {
                    const latestReport = path.join(qualityReportsDir, jsonFiles[0]);
                    return await fs.readJSON(latestReport);
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not load quality data:', error.message);
        }
        
        return { overall: { passed: true, score: 100 }, gates: {} };
    }

    /**
     * Load intelligence data from RequestAnalyzer
     */
    async loadIntelligenceData() {
        try {
            const intelligenceDir = path.join(this.projectPath, '.mega-minds', 'intelligence');
            
            // Load agent capabilities
            const capabilitiesFile = path.join(intelligenceDir, 'agent-capabilities.json');
            const feedbackFile = path.join(intelligenceDir, 'selection-feedback.json');
            const metricsFile = path.join(intelligenceDir, 'selection-metrics.json');
            
            let capabilities = null;
            let feedback = [];
            let metrics = null;
            
            if (await fs.pathExists(capabilitiesFile)) {
                capabilities = await fs.readJSON(capabilitiesFile);
            }
            
            if (await fs.pathExists(feedbackFile)) {
                feedback = await fs.readJSON(feedbackFile);
            }
            
            if (await fs.pathExists(metricsFile)) {
                metrics = await fs.readJSON(metricsFile);
            }
            
            // Calculate intelligence statistics
            const recentFeedback = feedback.slice(-20); // Last 20 selections
            const avgAccuracy = recentFeedback.length > 0 ? 
                recentFeedback.reduce((sum, f) => sum + (f.accuracy || 0), 0) / recentFeedback.length : 0;
            
            const agentUsage = recentFeedback.reduce((usage, f) => {
                usage[f.selectedAgent] = (usage[f.selectedAgent] || 0) + 1;
                return usage;
            }, {});
            
            return {
                totalAgents: capabilities ? capabilities.totalAgents : 0,
                agentCapabilities: capabilities ? Object.keys(capabilities.agents || {}).length : 0,
                totalSelections: feedback.length,
                recentSelections: recentFeedback.length,
                averageAccuracy: Math.round(avgAccuracy * 100),
                agentUsageDistribution: agentUsage,
                feedback: recentFeedback.slice(-5), // Show last 5 selections
                metrics: metrics,
                capabilities: capabilities,
                lastUpdate: new Date().toISOString()
            };
            
        } catch (error) {
            console.warn('⚠️ Could not load intelligence data:', error.message);
        }
        
        return {
            totalAgents: 0,
            agentCapabilities: 0,
            totalSelections: 0,
            recentSelections: 0,
            averageAccuracy: 0,
            agentUsageDistribution: {},
            feedback: [],
            metrics: null,
            capabilities: null,
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Load system data
     */
    async loadSystemData() {
        try {
            const systemStateFile = path.join(this.stateDir, 'system-status.json');
            if (await fs.pathExists(systemStateFile)) {
                const systemData = await fs.readJSON(systemStateFile);
                return {
                    ...systemData,
                    memory: process.memoryUsage(),
                    uptime: process.uptime()
                };
            }
        } catch (error) {
            console.warn('⚠️ Could not load system data:', error.message);
        }
        
        return {
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            status: 'healthy'
        };
    }

    /**
     * Start monitoring for file changes
     */
    startMonitoring() {
        if (this.monitorInterval) {
            return;
        }
        
        console.log('👁️ Starting dashboard file monitoring...');
        
        this.monitorInterval = setInterval(async () => {
            const prevData = JSON.stringify(this.dashboardData);
            await this.updateDashboardData();
            const newData = JSON.stringify(this.dashboardData);
            
            // Broadcast updates if data changed
            if (prevData !== newData && this.clients.size > 0) {
                this.broadcastToAll('update', this.dashboardData);
            }
        }, this.options.updateInterval);
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
            console.log('👁️ Dashboard monitoring stopped');
        }
    }

    /**
     * Broadcast to all connected clients
     */
    broadcastToAll(event, data) {
        for (const client of this.clients) {
            this.broadcastToClient(client, event, data);
        }
    }

    /**
     * Broadcast to specific client
     */
    broadcastToClient(client, event, data) {
        try {
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            client.write(message);
        } catch (error) {
            // Client disconnected, remove from set
            this.clients.delete(client);
        }
    }

    /**
     * Send JSON response
     */
    sendJSON(res, data) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data, null, 2));
    }

    /**
     * Ensure required directories exist
     */
    async ensureDirectories() {
        await fs.ensureDir(this.stateDir);
        await fs.ensureDir(this.qualityDir);
        await fs.ensureDir(this.intelligenceDir);
        await fs.ensureDir(this.sessionsDir);
    }

    /**
     * Generate metrics summary
     */
    generateMetricsSummary() {
        const agents = this.dashboardData.agents;
        const handoffs = this.dashboardData.handoffs;
        const quality = this.dashboardData.quality;
        
        return {
            activeAgents: agents.totalActiveCount || 0,
            pendingHandoffs: handoffs.pendingCount || 0,
            qualityScore: quality.overall?.score || 0,
            qualityPassed: quality.overall?.passed || false,
            memoryUsage: this.dashboardData.system.memory ? 
                Math.round(this.dashboardData.system.memory.heapUsed / 1024 / 1024) : 0
        };
    }

    /**
     * Generate dashboard HTML
     */
    generateDashboardHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mega-Minds Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .grid { 
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .card h2 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 1.3em;
        }
        .status-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-active { background: #27ae60; }
        .status-warning { background: #f39c12; }
        .status-error { background: #e74c3c; }
        .metric {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .metric:last-child { border-bottom: none; }
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #ecf0f1;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #3498db, #2ecc71);
            transition: width 0.3s ease;
        }
        .last-update {
            color: #7f8c8d;
            font-size: 0.9em;
            text-align: center;
            margin-top: 20px;
        }
        .connection-status {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
        }
        .connected { background: #2ecc71; color: white; }
        .disconnected { background: #e74c3c; color: white; }
    </style>
</head>
<body>
    <div class="connection-status" id="connectionStatus">Connecting...</div>
    
    <div class="container">
        <div class="header">
            <h1>🧠 Mega-Minds Dashboard</h1>
            <p id="projectName">Loading project information...</p>
            <div id="projectSelector" style="margin-top: 10px; display: none;">
                <select id="projectDropdown" style="padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="">Select project...</option>
                </select>
                <button id="switchProjectBtn" style="margin-left: 10px; padding: 5px 15px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Switch</button>
            </div>
        </div>
        
        <div class="grid">
            <div class="card">
                <h2>🤖 Active Agents</h2>
                <div id="agentsContainer">
                    <p>Loading agent data...</p>
                </div>
            </div>
            
            <div class="card">
                <h2>🔄 Handoff Queue</h2>
                <div id="handoffsContainer">
                    <p>Loading handoff data...</p>
                </div>
            </div>
            
            <div class="card">
                <h2>🛡️ Quality Gates</h2>
                <div id="qualityContainer">
                    <p>Loading quality data...</p>
                </div>
            </div>
            
            <div class="card">
                <h2>📊 System Metrics</h2>
                <div id="systemContainer">
                    <p>Loading system data...</p>
                </div>
            </div>
            
            <div class="card">
                <h2>🧠 Intelligence System</h2>
                <div id="intelligenceContainer">
                    <p>Loading intelligence data...</p>
                </div>
            </div>
        </div>
        
        <div class="last-update" id="lastUpdate">
            Waiting for data...
        </div>
    </div>

    <script>
        class MegaMindsDashboard {
            constructor() {
                this.eventSource = null;
                this.isConnected = false;
                this.reconnectAttempts = 0;
                this.maxReconnectAttempts = 5;
                this.init();
            }
            
            init() {
                this.connect();
                this.loadInitialData();
            }
            
            connect() {
                try {
                    this.eventSource = new EventSource('/api/sse');
                    
                    this.eventSource.onopen = () => {
                        this.isConnected = true;
                        this.reconnectAttempts = 0;
                        this.updateConnectionStatus();
                        console.log('Dashboard connected');
                    };
                    
                    this.eventSource.onmessage = (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            this.updateDashboard(data);
                        } catch (error) {
                            console.error('Error parsing dashboard data:', error);
                        }
                    };
                    
                    this.eventSource.onerror = () => {
                        this.isConnected = false;
                        this.updateConnectionStatus();
                        
                        if (this.reconnectAttempts < this.maxReconnectAttempts) {
                            this.reconnectAttempts++;
                            setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
                        }
                    };
                } catch (error) {
                    console.error('Error connecting to dashboard:', error);
                }
            }
            
            async loadInitialData() {
                try {
                    const response = await fetch('/api/metrics');
                    const data = await response.json();
                    this.updateDashboard(data);
                } catch (error) {
                    console.error('Error loading initial data:', error);
                }
            }
            
            updateConnectionStatus() {
                const status = document.getElementById('connectionStatus');
                if (this.isConnected) {
                    status.textContent = 'Connected';
                    status.className = 'connection-status connected';
                } else {
                    status.textContent = 'Disconnected';
                    status.className = 'connection-status disconnected';
                }
            }
            
            updateDashboard(data) {
                // Store intelligence data for agent display
                this.lastIntelligenceData = data.intelligence;
                
                this.updateProjectName(data);
                this.updateAgents(data.agents);
                this.updateHandoffs(data.handoffs);
                this.updateQuality(data.quality);
                this.updateSystem(data.system);
                this.updateIntelligence(data.intelligence);
                this.updateLastUpdate(data.lastUpdate);
            }
            
            updateProjectName(data) {
                if (data.project) {
                    document.getElementById('projectName').textContent = 
                        \`Project: \${data.project.name || 'Unknown'}\`;
                }
                
                // Handle multi-project mode
                if (data.multiProject && data.multiProject.enabled) {
                    const selector = document.getElementById('projectSelector');
                    const dropdown = document.getElementById('projectDropdown');
                    const switchBtn = document.getElementById('switchProjectBtn');
                    
                    selector.style.display = 'block';
                    
                    // Clear existing options except first
                    dropdown.innerHTML = '<option value="">Select project...</option>';
                    
                    // Add projects to dropdown
                    data.multiProject.projects.forEach(project => {
                        const option = document.createElement('option');
                        option.value = project.id;
                        option.textContent = \`\${project.name} \${project.isCurrent ? '(Current)' : ''}\`;
                        if (project.status === 'archived') {
                            option.textContent += ' [Archived]';
                            option.style.color = '#999';
                        }
                        dropdown.appendChild(option);
                    });
                    
                    // Handle project switching (note: this is just UI - actual switching requires CLI)
                    switchBtn.onclick = () => {
                        const selectedId = dropdown.value;
                        if (selectedId) {
                            alert(\`To switch to this project, run:\\n\\nmega-minds project switch \${selectedId}\\n\\nThen restart the dashboard.\`);
                        }
                    };
                }
            }
            
            updateAgents(agents) {
                const container = document.getElementById('agentsContainer');
                
                // Get intelligence data from the dashboard data if available  
                const intelligenceData = this.lastIntelligenceData;
                
                let html = '';
                
                // Show active agents first
                if (agents && agents.activeAgents) {
                    const activeAgents = agents.activeAgents;
                    const agentNames = Object.keys(activeAgents);
                    
                    if (agentNames.length > 0) {
                        html += '<h3 style="margin-bottom: 10px; color: #27ae60;">🟢 Active (' + agentNames.length + ')</h3>';
                        
                        html += agentNames.map(name => {
                            const agent = activeAgents[name];
                            const status = agent.status || 'active';
                            const task = agent.task || agent.currentTask || 'Working';
                            
                            return \`
                                <div class="metric">
                                    <span>
                                        <span class="status-dot status-active"></span>
                                        \${name.replace('-agent', '')}
                                    </span>
                                    <span>\${status}</span>
                                </div>
                                <div style="font-size: 0.85em; color: #7f8c8d; margin-bottom: 8px; margin-left: 16px;">
                                    \${task.length > 40 ? task.substring(0, 40) + '...' : task}
                                </div>
                            \`;
                        }).join('');
                    }
                }
                
                // Show available agents from intelligence system
                if (intelligenceData && intelligenceData.capabilities && intelligenceData.capabilities.agents) {
                    const allAgents = intelligenceData.capabilities.agents;
                    const activeAgentNames = agents?.activeAgents ? Object.keys(agents.activeAgents) : [];
                    const availableAgents = Object.keys(allAgents).filter(name => !activeAgentNames.includes(name));
                    
                    if (availableAgents.length > 0) {
                        html += '<h3 style="margin: 15px 0 10px 0; color: #3498db;">⚡ Available (' + availableAgents.length + ')</h3>';
                        
                        // Group by category and show summary
                        const categoryCount = {};
                        availableAgents.forEach(agentName => {
                            const agent = allAgents[agentName];
                            const category = agent.category || 'other';
                            categoryCount[category] = (categoryCount[category] || 0) + 1;
                        });
                        
                        // Show category breakdown
                        Object.entries(categoryCount).slice(0, 4).forEach(([category, count]) => {
                            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
                            html += \`
                                <div class="metric" style="margin-left: 8px;">
                                    <span>
                                        <span class="status-dot" style="background: #95a5a6;"></span>
                                        \${categoryName}
                                    </span>
                                    <span>\${count} agents</span>
                                </div>
                            \`;
                        });
                        
                        if (Object.keys(categoryCount).length > 4) {
                            const remainingCount = Object.keys(categoryCount).slice(4)
                                .reduce((sum, cat) => sum + categoryCount[cat], 0);
                            html += \`<div style="margin-left: 24px; font-size: 0.8em; color: #999;">
                                +\${remainingCount} in other categories
                            </div>\`;
                        }
                    }
                    
                    // Show total
                    if (intelligenceData.totalAgents > 0) {
                        html += \`<div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee;">
                            <div class="metric">
                                <span><strong>Total Agents</strong></span>
                                <span><strong>\${intelligenceData.totalAgents}</strong></span>
                            </div>
                        </div>\`;
                    }
                } else {
                    // Fallback if no intelligence data
                    if (!html) {
                        html = '<p>No agent data available</p>';
                    } else {
                        html += '<div style="margin-top: 10px; font-size: 0.85em; color: #888;">Intelligence data loading...</div>';
                    }
                }
                
                if (!html) {
                    html = '<p>Loading agent data...</p>';
                }
                
                container.innerHTML = html;
            }
            
            updateHandoffs(handoffs) {
                const container = document.getElementById('handoffsContainer');
                if (!handoffs || !handoffs.handoffs) {
                    container.innerHTML = '<p>No handoffs in queue</p>';
                    return;
                }
                
                const metrics = [
                    ['Total', handoffs.queueLength || 0],
                    ['Pending', handoffs.pendingCount || 0],
                    ['Acknowledged', handoffs.acknowledgedCount || 0],
                    ['In Progress', handoffs.inProgressCount || 0]
                ];
                
                const html = metrics.map(([label, value]) => \`
                    <div class="metric">
                        <span>\${label}</span>
                        <span>\${value}</span>
                    </div>
                \`).join('');
                
                container.innerHTML = html;
            }
            
            updateQuality(quality) {
                const container = document.getElementById('qualityContainer');
                if (!quality || !quality.overall) {
                    container.innerHTML = '<p>No quality data available</p>';
                    return;
                }
                
                const score = quality.overall.score || 0;
                const passed = quality.overall.passed;
                const statusClass = passed ? 'status-active' : 'status-error';
                
                const html = \`
                    <div class="metric">
                        <span>
                            <span class="status-dot \${statusClass}"></span>
                            Overall Status
                        </span>
                        <span>\${passed ? 'PASS' : 'FAIL'}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: \${score}%"></div>
                    </div>
                    <div style="text-align: center; font-size: 0.9em; color: #7f8c8d;">
                        Score: \${score}/100
                    </div>
                \`;
                
                container.innerHTML = html;
            }
            
            updateSystem(system) {
                const container = document.getElementById('systemContainer');
                if (!system) {
                    container.innerHTML = '<p>No system data available</p>';
                    return;
                }
                
                const memory = system.memory;
                const memoryUsage = memory ? Math.round(memory.heapUsed / 1024 / 1024) : 0;
                const uptime = system.uptime ? Math.round(system.uptime / 60) : 0;
                
                const html = \`
                    <div class="metric">
                        <span>Memory Usage</span>
                        <span>\${memoryUsage}MB</span>
                    </div>
                    <div class="metric">
                        <span>Uptime</span>
                        <span>\${uptime} minutes</span>
                    </div>
                    <div class="metric">
                        <span>Status</span>
                        <span>
                            <span class="status-dot status-active"></span>
                            \${system.status || 'Running'}
                        </span>
                    </div>
                \`;
                
                container.innerHTML = html;
            }
            
            updateIntelligence(intelligence) {
                const container = document.getElementById('intelligenceContainer');
                if (!intelligence) {
                    container.innerHTML = '<p>No intelligence data available</p>';
                    return;
                }
                
                const accuracyColor = intelligence.averageAccuracy >= 80 ? 'status-active' : 
                                    intelligence.averageAccuracy >= 60 ? 'status-warning' : 'status-error';
                
                // Top agents by usage
                const topAgents = Object.entries(intelligence.agentUsageDistribution || {})
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);
                
                const html = \`
                    <div class="metric">
                        <span>Total Agents</span>
                        <span>\${intelligence.totalAgents || 0}</span>
                    </div>
                    <div class="metric">
                        <span>Agent Selections</span>
                        <span>\${intelligence.totalSelections || 0}</span>
                    </div>
                    <div class="metric">
                        <span>Selection Accuracy</span>
                        <span>
                            <span class="status-dot \${accuracyColor}"></span>
                            \${intelligence.averageAccuracy || 0}%
                        </span>
                    </div>
                    \${topAgents.length > 0 ? \`
                        <div class="metric">
                            <span>Most Used Agent</span>
                            <span>\${topAgents[0][0].replace('-agent', '')} (\${topAgents[0][1]})</span>
                        </div>
                    \` : ''}
                    \${intelligence.recentSelections > 0 ? \`
                        <div class="metric">
                            <span>Recent Selections</span>
                            <span>\${intelligence.recentSelections}</span>
                        </div>
                    \` : ''}
                \`;
                
                container.innerHTML = html;
            }
            
            updateLastUpdate(lastUpdate) {
                if (lastUpdate) {
                    const date = new Date(lastUpdate);
                    document.getElementById('lastUpdate').textContent = 
                        \`Last update: \${date.toLocaleTimeString()}\`;
                }
            }
        }
        
        // Initialize dashboard when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new MegaMindsDashboard();
        });
    </script>
</body>
</html>`;
    }

    /**
     * Get dashboard status
     */
    getStatus() {
        return {
            running: this.isRunning,
            port: this.options.port,
            clients: this.clients.size,
            projectPath: this.projectPath
        };
    }
}

module.exports = DashboardServer;