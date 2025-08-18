// lib/commands/enterprise-admin.js
// CLI commands for enterprise administration and management
// Phase 3.3: Enterprise Features - Administrative commands

const TeamCollaboration = require('../enterprise/TeamCollaboration');
const EnterpriseMonitoring = require('../enterprise/EnterpriseMonitoring');
const StructuredLogger = require('../enterprise/StructuredLogger');

/**
 * Enable team collaboration mode
 * Command: mega-minds enable-team-collaboration
 */
async function enableTeamCollaboration() {
    try {
        console.log('👥 Enabling team collaboration...');
        
        const teamCollaboration = new TeamCollaboration(process.cwd());
        await teamCollaboration.initialize(true); // Enable team mode
        
        console.log('✅ Team collaboration enabled successfully!');
        console.log('');
        console.log('💡 Available team commands:');
        console.log('   mega-minds team add <userId> <userName> [role]     - Add team member');
        console.log('   mega-minds team list                               - List team members');
        console.log('   mega-minds team remove <userId>                    - Remove team member');
        console.log('   mega-minds team role <userId> <newRole>            - Change user role');
        console.log('   mega-minds team status                             - Show team status');
        console.log('   mega-minds team activity [options]                 - View activity log');
        console.log('');
        console.log('🔒 Available roles: owner, collaborator, viewer');
        console.log('📋 Team members can now coordinate agent usage and avoid conflicts');
        
        await teamCollaboration.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to enable team collaboration:', error.message);
        process.exit(1);
    }
}

/**
 * Add team member
 * Command: mega-minds team add <userId> <userName> [role]
 */
async function addTeamMember(userId, userName, role = 'collaborator') {
    try {
        const teamCollaboration = new TeamCollaboration(process.cwd());
        await teamCollaboration.initialize(true);
        
        console.log(`👥 Adding team member: ${userName} (${userId})`);
        
        const member = await teamCollaboration.addTeamMember(userId, userName, role);
        
        console.log('✅ Team member added successfully!');
        console.log(`   Name: ${member.name}`);
        console.log(`   ID: ${member.id}`);
        console.log(`   Role: ${member.role}`);
        console.log(`   Permissions: ${member.permissions.join(', ')}`);
        
        await teamCollaboration.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to add team member:', error.message);
        process.exit(1);
    }
}

/**
 * Remove team member
 * Command: mega-minds team remove <userId>
 */
async function removeTeamMember(userId) {
    try {
        const teamCollaboration = new TeamCollaboration(process.cwd());
        await teamCollaboration.initialize(true);
        
        console.log(`👥 Removing team member: ${userId}`);
        
        const member = await teamCollaboration.removeTeamMember(userId);
        
        console.log('✅ Team member removed successfully!');
        console.log(`   Removed: ${member.name} (${member.role})`);
        
        await teamCollaboration.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to remove team member:', error.message);
        process.exit(1);
    }
}

/**
 * Change team member role
 * Command: mega-minds team role <userId> <newRole>
 */
async function changeTeamMemberRole(userId, newRole) {
    try {
        const teamCollaboration = new TeamCollaboration(process.cwd());
        await teamCollaboration.initialize(true);
        
        console.log(`👥 Changing role for user ${userId} to ${newRole}`);
        
        const member = await teamCollaboration.changeUserRole(userId, newRole);
        
        console.log('✅ Role changed successfully!');
        console.log(`   User: ${member.name}`);
        console.log(`   New role: ${member.role}`);
        console.log(`   New permissions: ${member.permissions.join(', ')}`);
        
        await teamCollaboration.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to change user role:', error.message);
        process.exit(1);
    }
}

/**
 * List team members
 * Command: mega-minds team list
 */
async function listTeamMembers() {
    try {
        const teamCollaboration = new TeamCollaboration(process.cwd());
        await teamCollaboration.initialize();
        
        const status = await teamCollaboration.getTeamStatus();
        
        if (!status.teamMode) {
            console.log('👥 Team collaboration not enabled');
            console.log('💡 Enable it with: mega-minds enable-team-collaboration');
            return;
        }
        
        console.log('👥 Team Members:');
        console.log('================');
        
        if (status.members && status.members.length > 0) {
            for (const member of status.members) {
                const isOwner = member.role === 'owner';
                const isActive = status.activeUsers.some(u => u.id === member.id);
                const statusIcon = isActive ? '🟢' : '⚫';
                const ownerIndicator = isOwner ? ' (OWNER)' : '';
                
                console.log(`${statusIcon} ${member.name}${ownerIndicator}`);
                console.log(`   ID: ${member.id}`);
                console.log(`   Role: ${member.role}`);
                console.log(`   Status: ${member.status}`);
                console.log(`   Joined: ${new Date(member.joinedAt).toLocaleDateString()}`);
                
                if (isActive) {
                    const activeUser = status.activeUsers.find(u => u.id === member.id);
                    console.log(`   Last active: ${new Date(activeUser.lastActivity).toLocaleString()}`);
                }
                
                console.log('');
            }
        } else {
            console.log('No team members found');
        }
        
        // Show active collaboration info
        if (status.agentLocks.length > 0) {
            console.log('🔒 Active Agent Locks:');
            for (const lock of status.agentLocks) {
                console.log(`   ${lock.agentName}: locked by ${lock.userName}`);
                console.log(`   Task: ${lock.taskDescription || 'No description'}`);
                console.log(`   Since: ${new Date(lock.timestamp).toLocaleString()}`);
                console.log('');
            }
        }
        
        console.log('📊 Team Statistics:');
        console.log(`   Total members: ${status.teamSize}`);
        console.log(`   Active users: ${status.activeUsers.length}`);
        console.log(`   Agent locks: ${status.agentLocks.length}`);
        
        await teamCollaboration.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to list team members:', error.message);
        process.exit(1);
    }
}

/**
 * Show team status
 * Command: mega-minds team status
 */
async function showTeamStatus() {
    try {
        const teamCollaboration = new TeamCollaboration(process.cwd());
        await teamCollaboration.initialize();
        
        const status = await teamCollaboration.getTeamStatus();
        
        console.log('👥 Team Collaboration Status:');
        console.log('==============================');
        console.log(`Team mode: ${status.teamMode ? 'Enabled' : 'Disabled'}`);
        console.log(`Current user: ${status.currentUser.name} (${status.currentUser.role})`);
        
        if (status.teamMode) {
            console.log(`Team size: ${status.teamSize}`);
            console.log(`Active users: ${status.activeUsers.length}`);
            console.log(`Agent locks: ${status.agentLocks.length}`);
            console.log(`Conflicts in queue: ${status.conflictQueue}`);
            
            if (status.owner) {
                console.log(`Project owner: ${status.owner.name}`);
            }
        } else {
            console.log('💡 Enable team collaboration with: mega-minds enable-team-collaboration');
        }
        
        await teamCollaboration.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to get team status:', error.message);
        process.exit(1);
    }
}

/**
 * View team activity log
 * Command: mega-minds team activity [--user=<userId>] [--type=<type>] [--limit=<limit>]
 */
async function viewTeamActivity(options = {}) {
    try {
        const teamCollaboration = new TeamCollaboration(process.cwd());
        await teamCollaboration.initialize();
        
        console.log('📋 Team Activity Log:');
        console.log('=====================');
        
        const activities = await teamCollaboration.getActivityLog({
            userId: options.user,
            activityType: options.type,
            limit: options.limit || 20
        });
        
        if (activities.length === 0) {
            console.log('No activities found');
            return;
        }
        
        for (const activity of activities) {
            const time = new Date(activity.timestamp).toLocaleString();
            const user = activity.userName || activity.userId;
            
            console.log(`[${time}] ${activity.activityType}`);
            console.log(`   User: ${user} (${activity.userRole})`);
            
            if (activity.details && Object.keys(activity.details).length > 0) {
                console.log(`   Details: ${JSON.stringify(activity.details, null, 2)}`);
            }
            
            console.log('');
        }
        
        await teamCollaboration.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to get activity log:', error.message);
        process.exit(1);
    }
}

/**
 * Enable enterprise monitoring
 * Command: mega-minds enable-monitoring
 */
async function enableEnterpriseMonitoring() {
    try {
        console.log('📊 Enabling enterprise monitoring...');
        
        const monitoring = new EnterpriseMonitoring(process.cwd());
        await monitoring.initialize(true); // Enable advanced monitoring
        
        console.log('✅ Enterprise monitoring enabled successfully!');
        console.log('');
        console.log('💡 Available monitoring commands:');
        console.log('   mega-minds monitoring status                 - Show monitoring status');
        console.log('   mega-minds monitoring metrics                - View current metrics');
        console.log('   mega-minds monitoring alerts                 - View recent alerts');
        console.log('   mega-minds monitoring health                 - System health check');
        console.log('   mega-minds monitoring report [days]          - Generate analytics report');
        console.log('');
        console.log('📊 Monitoring features:');
        console.log('   • Real-time performance metrics (<500ms collection)');
        console.log('   • Automated alerting for memory, performance, and errors');
        console.log('   • Enterprise analytics and reporting');
        console.log('   • Historical data retention and trending');
        
        await monitoring.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to enable enterprise monitoring:', error.message);
        process.exit(1);
    }
}

/**
 * Show monitoring status
 * Command: mega-minds monitoring status
 */
async function showMonitoringStatus() {
    try {
        const monitoring = new EnterpriseMonitoring(process.cwd());
        await monitoring.initialize();
        
        const health = monitoring.getHealthStatus();
        const metrics = monitoring.getCurrentMetrics();
        
        console.log('📊 Enterprise Monitoring Status:');
        console.log('=================================');
        console.log(`Status: ${health.status.toUpperCase()}`);
        console.log(`Monitoring active: ${health.monitoring}`);
        console.log(`Uptime: ${Math.round(health.uptime / 60)} minutes`);
        console.log(`Memory usage: ${health.memoryUsage}MB`);
        console.log(`Quality score: ${health.qualityScore}`);
        
        if (health.issues.length > 0) {
            console.log('');
            console.log('⚠️ Issues:');
            health.issues.forEach(issue => {
                console.log(`   • ${issue}`);
            });
        }
        
        if (metrics.timestamp) {
            console.log(`Last update: ${new Date(metrics.timestamp).toLocaleString()}`);
            console.log(`Collection time: ${metrics.collectionTime}ms`);
        }
        
        await monitoring.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to get monitoring status:', error.message);
        process.exit(1);
    }
}

/**
 * Show current metrics
 * Command: mega-minds monitoring metrics
 */
async function showCurrentMetrics() {
    try {
        const monitoring = new EnterpriseMonitoring(process.cwd());
        await monitoring.initialize();
        
        const metrics = monitoring.getCurrentMetrics();
        
        console.log('📊 Current System Metrics:');
        console.log('===========================');
        
        if (metrics.system) {
            console.log('💾 Memory:');
            console.log(`   Heap used: ${metrics.system.memory.heapUsed}MB`);
            console.log(`   Heap total: ${metrics.system.memory.heapTotal}MB`);
            console.log(`   Usage: ${metrics.system.memory.usagePercent}%`);
            console.log('');
        }
        
        if (metrics.agents) {
            console.log('🤖 Agents:');
            console.log(`   Active agents: ${metrics.agents.activeCount}`);
            if (metrics.agents.lastUpdate) {
                console.log(`   Last update: ${new Date(metrics.agents.lastUpdate).toLocaleString()}`);
            }
            console.log('');
        }
        
        if (metrics.quality) {
            console.log('🛡️ Quality:');
            console.log(`   Overall score: ${metrics.quality.overallScore}`);
            console.log(`   Status: ${metrics.quality.passed ? 'PASS' : 'FAIL'}`);
            console.log(`   Gates: ${metrics.quality.gatesCount}`);
            console.log('');
        }
        
        if (metrics.application) {
            console.log('📁 Application:');
            console.log(`   State files: ${metrics.application.stateFiles}`);
            console.log(`   Session files: ${metrics.application.sessionFiles}`);
            console.log('');
        }
        
        console.log(`Collected: ${new Date(metrics.timestamp).toLocaleString()}`);
        console.log(`Collection time: ${metrics.collectionTime}ms (target: <500ms)`);
        
        await monitoring.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to get current metrics:', error.message);
        process.exit(1);
    }
}

/**
 * Show recent alerts
 * Command: mega-minds monitoring alerts [limit]
 */
async function showRecentAlerts(limit = 10) {
    try {
        const monitoring = new EnterpriseMonitoring(process.cwd());
        await monitoring.initialize();
        
        const alerts = monitoring.getRecentAlerts(limit);
        
        console.log('🚨 Recent Alerts:');
        console.log('==================');
        
        if (alerts.length === 0) {
            console.log('No alerts found');
            return;
        }
        
        for (const alert of alerts) {
            const time = new Date(alert.timestamp).toLocaleString();
            const emoji = alert.level === 'critical' ? '🚨' : '⚠️';
            
            console.log(`${emoji} [${alert.level.toUpperCase()}] ${time}`);
            console.log(`   Type: ${alert.type}`);
            console.log(`   Message: ${alert.message}`);
            console.log(`   Value: ${alert.value} (threshold: ${alert.threshold})`);
            console.log('');
        }
        
        await monitoring.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to get alerts:', error.message);
        process.exit(1);
    }
}

/**
 * Generate analytics report
 * Command: mega-minds monitoring report [days]
 */
async function generateAnalyticsReport(days = 7) {
    try {
        console.log(`📊 Generating ${days}-day analytics report...`);
        
        const monitoring = new EnterpriseMonitoring(process.cwd(), { analyticsEnabled: true });
        await monitoring.initialize(true);
        
        const report = await monitoring.generateAnalyticsReport(days);
        
        console.log('📊 Analytics Report:');
        console.log('====================');
        console.log(`Period: ${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}`);
        console.log('');
        
        console.log('📈 Summary:');
        console.log(`   Average memory usage: ${report.summary.averageMemoryUsage}MB`);
        console.log(`   Peak memory usage: ${report.summary.peakMemoryUsage}MB`);
        console.log(`   Average quality score: ${report.summary.averageQualityScore}`);
        console.log(`   Total alerts: ${report.summary.totalAlerts}`);
        console.log('');
        
        if (report.trends.memory.length > 0) {
            console.log('📊 Memory Trend (daily averages):');
            report.trends.memory.forEach(point => {
                console.log(`   ${point.date}: ${point.value}MB`);
            });
            console.log('');
        }
        
        if (report.trends.alerts.length > 0) {
            console.log('🚨 Alert Trend (daily counts):');
            report.trends.alerts.forEach(point => {
                console.log(`   ${point.date}: ${point.value} alerts`);
            });
            console.log('');
        }
        
        console.log(`Report generated: ${new Date(report.generated).toLocaleString()}`);
        
        await monitoring.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to generate analytics report:', error.message);
        process.exit(1);
    }
}

/**
 * Enable structured logging
 * Command: mega-minds enable-logging
 */
async function enableStructuredLogging() {
    try {
        console.log('📝 Enabling structured logging...');
        
        const logger = new StructuredLogger(process.cwd());
        await logger.initialize(true); // Enable structured logging
        
        console.log('✅ Structured logging enabled successfully!');
        console.log('');
        console.log('💡 Available logging commands:');
        console.log('   mega-minds logging status                    - Show logging status');
        console.log('   mega-minds logging level <level>             - Set log level');
        console.log('   mega-minds logging stats                     - View logging statistics');
        console.log('');
        console.log('📝 Logging features:');
        console.log('   • Structured JSON output for log aggregation');
        console.log('   • Configurable log levels (debug, info, warning, error, critical)');
        console.log('   • Automatic log rotation and retention');
        console.log('   • Enterprise audit trails for compliance');
        console.log('   • Performance-optimized with buffering');
        
        await logger.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to enable structured logging:', error.message);
        process.exit(1);
    }
}

/**
 * Show logging status
 * Command: mega-minds logging status
 */
async function showLoggingStatus() {
    try {
        const logger = new StructuredLogger(process.cwd());
        await logger.initialize();
        
        const stats = logger.getLogStats();
        
        console.log('📝 Structured Logging Status:');
        console.log('==============================');
        console.log(`Structured logging: ${stats.structuredLogging ? 'Enabled' : 'Disabled'}`);
        console.log(`Current log level: ${stats.currentLogLevel}`);
        console.log(`Total logs: ${stats.totalLogs}`);
        console.log(`Error logs: ${stats.errorLogs}`);
        console.log(`Warning logs: ${stats.warningLogs}`);
        console.log(`Buffer size: ${stats.bufferSize}`);
        console.log(`Average log time: ${stats.avgLogTime.toFixed(2)}ms`);
        
        if (stats.lastFlush) {
            console.log(`Last flush: ${new Date(stats.lastFlush).toLocaleString()}`);
        }
        
        await logger.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to get logging status:', error.message);
        process.exit(1);
    }
}

/**
 * Set log level
 * Command: mega-minds logging level <level>
 */
async function setLogLevel(level) {
    try {
        const logger = new StructuredLogger(process.cwd());
        await logger.initialize(true);
        
        console.log(`📝 Setting log level to: ${level}`);
        
        logger.setLogLevel(level);
        
        console.log('✅ Log level updated successfully!');
        console.log(`New log level: ${level}`);
        
        await logger.shutdown();
        
    } catch (error) {
        console.error('❌ Failed to set log level:', error.message);
        process.exit(1);
    }
}

/**
 * Show enterprise administration help
 */
function showEnterpriseHelp() {
    console.log('🏢 Mega-Minds Enterprise Administration');
    console.log('=======================================');
    console.log('');
    console.log('Team Collaboration:');
    console.log('  mega-minds enable-team-collaboration         - Enable team mode');
    console.log('  mega-minds team add <id> <name> [role]       - Add team member');
    console.log('  mega-minds team list                         - List team members');
    console.log('  mega-minds team remove <id>                  - Remove team member');
    console.log('  mega-minds team role <id> <role>             - Change user role');
    console.log('  mega-minds team status                       - Show team status');
    console.log('  mega-minds team activity [--user=] [--type=] - View activity log');
    console.log('');
    console.log('Enterprise Monitoring:');
    console.log('  mega-minds enable-monitoring                 - Enable advanced monitoring');
    console.log('  mega-minds monitoring status                 - Show monitoring status');
    console.log('  mega-minds monitoring metrics                - View current metrics');
    console.log('  mega-minds monitoring alerts [limit]         - View recent alerts');
    console.log('  mega-minds monitoring health                 - System health check');
    console.log('  mega-minds monitoring report [days]          - Generate analytics report');
    console.log('');
    console.log('Structured Logging:');
    console.log('  mega-minds enable-logging                    - Enable structured logging');
    console.log('  mega-minds logging status                    - Show logging status');
    console.log('  mega-minds logging level <level>             - Set log level');
    console.log('  mega-minds logging stats                     - View logging statistics');
    console.log('');
    console.log('💡 Enterprise Features:');
    console.log('  • Multi-user collaboration with role-based permissions');
    console.log('  • Real-time performance monitoring and alerting');
    console.log('  • Structured logging with audit trails');
    console.log('  • Advanced analytics and reporting');
    console.log('  • Production-grade error handling and recovery');
}

module.exports = {
    enableTeamCollaboration,
    addTeamMember,
    removeTeamMember,
    changeTeamMemberRole,
    listTeamMembers,
    showTeamStatus,
    viewTeamActivity,
    enableEnterpriseMonitoring,
    showMonitoringStatus,
    showCurrentMetrics,
    showRecentAlerts,
    generateAnalyticsReport,
    enableStructuredLogging,
    showLoggingStatus,
    setLogLevel,
    showEnterpriseHelp
};