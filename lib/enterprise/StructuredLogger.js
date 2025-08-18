// lib/enterprise/StructuredLogger.js
// Enterprise structured logging system with configurable levels
// Phase 3.3: Enterprise Features - Production logging and audit trails

const fs = require('fs-extra');
const path = require('path');
const util = require('util');

/**
 * StructuredLogger provides enterprise-grade logging with structured output
 * PRD Requirements: Structured logging with configurable levels, audit trails
 * Meets enterprise standards: Configurable levels, log rotation, performance optimized
 */
class StructuredLogger {
    constructor(projectPath, options = {}) {
        this.projectPath = projectPath;
        this.options = {
            enableStructuredLogging: false, // Default: basic console logging (backward compatible)
            logLevel: options.logLevel || 'info',
            logFormat: options.logFormat || 'json', // 'json' or 'text'
            maxLogSize: options.maxLogSize || 10 * 1024 * 1024, // 10MB
            maxLogFiles: options.maxLogFiles || 5,
            logRetention: options.logRetention || 30, // days
            enableConsoleOutput: options.enableConsoleOutput !== false,
            enableFileOutput: options.enableFileOutput !== false,
            enableAuditLog: options.enableAuditLog || false,
            ...options
        };
        
        // Log levels (RFC 5424 standard)
        this.logLevels = {
            emergency: 0,  // System is unusable
            alert: 1,      // Action must be taken immediately
            critical: 2,   // Critical conditions
            error: 3,      // Error conditions
            warning: 4,    // Warning conditions
            notice: 5,     // Normal but significant condition
            info: 6,       // Informational messages
            debug: 7       // Debug-level messages
        };
        
        this.currentLogLevel = this.logLevels[this.options.logLevel] || this.logLevels.info;
        
        // Enterprise logging directory structure
        this.enterpriseDir = path.join(projectPath, '.mega-minds', 'enterprise');
        this.logsDir = path.join(this.enterpriseDir, 'logs');
        this.auditDir = path.join(this.enterpriseDir, 'audit');
        
        // Log files
        this.currentLogFile = null;
        this.currentAuditFile = null;
        this.logBuffer = [];
        this.auditBuffer = [];
        
        // Performance tracking
        this.logStats = {
            totalLogs: 0,
            errorLogs: 0,
            warningLogs: 0,
            lastFlush: null,
            avgLogTime: 0
        };
        
        // Flush timers
        this.logFlushTimer = null;
        this.auditFlushTimer = null;
        
        this.initialized = false;
    }

    /**
     * Initialize structured logging system
     * Only enables advanced features if explicitly requested
     */
    async initialize(enableStructuredLogging = false) {
        try {
            // Ensure logging directories exist
            await fs.ensureDir(this.logsDir);
            await fs.ensureDir(this.auditDir);
            
            // Enable structured logging if requested
            if (enableStructuredLogging) {
                this.options.enableStructuredLogging = true;
                console.log('📝 Structured logging enabled');
            }
            
            // Set up log files
            if (this.options.enableStructuredLogging && this.options.enableFileOutput) {
                await this.setupLogFiles();
                this.startFlushTimers();
            }
            
            // Override console methods if structured logging is enabled
            if (this.options.enableStructuredLogging) {
                this.overrideConsoleMethods();
            }
            
            this.initialized = true;
            
            // Log initialization
            this.info('StructuredLogger initialized', {
                logLevel: this.options.logLevel,
                logFormat: this.options.logFormat,
                fileOutput: this.options.enableFileOutput,
                auditLog: this.options.enableAuditLog
            });
            
            return true;
            
        } catch (error) {
            console.warn('⚠️ StructuredLogger initialization warning:', error.message);
            // Graceful degradation - continue with basic logging
            this.options.enableStructuredLogging = false;
            return false;
        }
    }

    /**
     * Check if structured logging is enabled
     */
    isStructuredLoggingEnabled() {
        return this.options.enableStructuredLogging;
    }

    /**
     * Log emergency message (level 0)
     */
    emergency(message, context = {}, error = null) {
        return this.log('emergency', message, context, error);
    }

    /**
     * Log alert message (level 1)
     */
    alert(message, context = {}, error = null) {
        return this.log('alert', message, context, error);
    }

    /**
     * Log critical message (level 2)
     */
    critical(message, context = {}, error = null) {
        return this.log('critical', message, context, error);
    }

    /**
     * Log error message (level 3)
     */
    error(message, context = {}, error = null) {
        return this.log('error', message, context, error);
    }

    /**
     * Log warning message (level 4)
     */
    warning(message, context = {}, error = null) {
        return this.log('warning', message, context, error);
    }

    /**
     * Log notice message (level 5)
     */
    notice(message, context = {}, error = null) {
        return this.log('notice', message, context, error);
    }

    /**
     * Log info message (level 6)
     */
    info(message, context = {}, error = null) {
        return this.log('info', message, context, error);
    }

    /**
     * Log debug message (level 7)
     */
    debug(message, context = {}, error = null) {
        return this.log('debug', message, context, error);
    }

    /**
     * Core logging method with structured output
     */
    log(level, message, context = {}, error = null) {
        const startTime = Date.now();
        
        // Check if this level should be logged
        const levelNum = this.logLevels[level];
        if (levelNum > this.currentLogLevel) {
            return; // Skip logging this level
        }
        
        try {
            // Create structured log entry
            const logEntry = this.createLogEntry(level, message, context, error);
            
            // Console output (if enabled)
            if (this.options.enableConsoleOutput) {
                this.outputToConsole(logEntry);
            }
            
            // File output (if enabled and structured logging active)
            if (this.options.enableStructuredLogging && this.options.enableFileOutput) {
                this.bufferLogEntry(logEntry);
            }
            
            // Audit log (for specific events)
            if (this.options.enableAuditLog && this.isAuditableEvent(level, context)) {
                this.bufferAuditEntry(logEntry);
            }
            
            // Update stats
            this.updateLogStats(level, Date.now() - startTime);
            
        } catch (logError) {
            // Fallback to basic console logging if structured logging fails
            console.error('Logging error:', logError.message);
            console.log(`[${level.toUpperCase()}] ${message}`, context);
        }
    }

    /**
     * Create structured log entry
     */
    createLogEntry(level, message, context = {}, error = null) {
        const timestamp = new Date().toISOString();
        
        const entry = {
            timestamp: timestamp,
            level: level,
            message: message,
            logger: 'mega-minds',
            project: path.basename(this.projectPath),
            projectPath: this.projectPath,
            pid: process.pid,
            version: '2.0', // Would typically read from package.json
            context: context
        };
        
        // Add error details if provided
        if (error) {
            entry.error = {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code
            };
        }
        
        // Add performance context
        if (process.memoryUsage) {
            const memUsage = process.memoryUsage();
            entry.performance = {
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
                uptime: Math.round(process.uptime())
            };
        }
        
        // Add request context if available
        if (context.requestId) {
            entry.requestId = context.requestId;
        }
        
        if (context.userId) {
            entry.userId = context.userId;
        }
        
        if (context.agentName) {
            entry.agent = context.agentName;
        }
        
        return entry;
    }

    /**
     * Output log entry to console
     */
    outputToConsole(logEntry) {
        if (!this.options.enableConsoleOutput) {
            return;
        }
        
        const emoji = this.getLevelEmoji(logEntry.level);
        const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
        
        if (this.options.logFormat === 'json') {
            console.log(JSON.stringify(logEntry));
        } else {
            // Text format for better readability
            let output = `${emoji} [${timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}`;
            
            if (Object.keys(logEntry.context).length > 0) {
                output += ` | Context: ${JSON.stringify(logEntry.context)}`;
            }
            
            if (logEntry.error) {
                output += ` | Error: ${logEntry.error.message}`;
            }
            
            console.log(output);
            
            // Stack trace for errors
            if (logEntry.error && logEntry.error.stack && logEntry.level === 'error') {
                console.log(logEntry.error.stack);
            }
        }
    }

    /**
     * Get emoji for log level
     */
    getLevelEmoji(level) {
        const emojis = {
            emergency: '🚨',
            alert: '⚠️',
            critical: '🔴',
            error: '❌',
            warning: '⚠️',
            notice: '📢',
            info: 'ℹ️',
            debug: '🔧'
        };
        
        return emojis[level] || 'ℹ️';
    }

    /**
     * Buffer log entry for file output
     */
    bufferLogEntry(logEntry) {
        this.logBuffer.push(logEntry);
        
        // Auto-flush if buffer gets large (performance optimization)
        if (this.logBuffer.length >= 100) {
            this.flushLogBuffer();
        }
    }

    /**
     * Buffer audit entry
     */
    bufferAuditEntry(logEntry) {
        // Audit logs have additional security context
        const auditEntry = {
            ...logEntry,
            auditType: this.getAuditType(logEntry.level, logEntry.context),
            securityLevel: this.getSecurityLevel(logEntry.context),
            compliance: {
                retained: true,
                retentionDays: this.options.logRetention
            }
        };
        
        this.auditBuffer.push(auditEntry);
        
        // Audit logs flush more frequently for compliance
        if (this.auditBuffer.length >= 10) {
            this.flushAuditBuffer();
        }
    }

    /**
     * Check if event should be audited
     */
    isAuditableEvent(level, context) {
        // Audit critical events and security-related actions
        const auditableLevels = ['emergency', 'alert', 'critical', 'error'];
        const auditableEvents = [
            'user_login', 'user_logout', 'permission_change', 'data_access',
            'system_failure', 'security_violation', 'configuration_change'
        ];
        
        return auditableLevels.includes(level) || 
               auditableEvents.some(event => context.eventType === event);
    }

    /**
     * Get audit type for compliance
     */
    getAuditType(level, context) {
        if (context.eventType) {
            return context.eventType;
        }
        
        const auditTypes = {
            emergency: 'system_emergency',
            alert: 'system_alert',
            critical: 'system_critical',
            error: 'system_error'
        };
        
        return auditTypes[level] || 'general';
    }

    /**
     * Get security level
     */
    getSecurityLevel(context) {
        if (context.securityLevel) {
            return context.securityLevel;
        }
        
        // Determine security level based on context
        if (context.userId || context.authentication) {
            return 'medium';
        }
        
        if (context.systemAccess || context.configurationChange) {
            return 'high';
        }
        
        return 'low';
    }

    /**
     * Setup log files with rotation
     */
    async setupLogFiles() {
        const timestamp = new Date().toISOString().split('T')[0];
        
        // Main log file
        this.currentLogFile = path.join(this.logsDir, `mega-minds-${timestamp}.log`);
        
        // Audit log file
        if (this.options.enableAuditLog) {
            this.currentAuditFile = path.join(this.auditDir, `audit-${timestamp}.log`);
        }
        
        // Ensure files exist
        await fs.ensureFile(this.currentLogFile);
        if (this.currentAuditFile) {
            await fs.ensureFile(this.currentAuditFile);
        }
        
        // Check for log rotation
        await this.checkLogRotation();
    }

    /**
     * Check if log rotation is needed
     */
    async checkLogRotation() {
        try {
            if (await fs.pathExists(this.currentLogFile)) {
                const stats = await fs.stat(this.currentLogFile);
                
                if (stats.size > this.options.maxLogSize) {
                    await this.rotateLogFile(this.currentLogFile);
                }
            }
            
            if (this.currentAuditFile && await fs.pathExists(this.currentAuditFile)) {
                const stats = await fs.stat(this.currentAuditFile);
                
                if (stats.size > this.options.maxLogSize) {
                    await this.rotateLogFile(this.currentAuditFile);
                }
            }
        } catch (error) {
            console.warn('⚠️ Log rotation check failed:', error.message);
        }
    }

    /**
     * Rotate log file
     */
    async rotateLogFile(logFile) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const rotatedFile = logFile.replace('.log', `-${timestamp}.log`);
            
            await fs.move(logFile, rotatedFile);
            await fs.ensureFile(logFile);
            
            // Clean up old log files
            await this.cleanupOldLogs(path.dirname(logFile));
            
        } catch (error) {
            console.warn('⚠️ Log rotation failed:', error.message);
        }
    }

    /**
     * Clean up old log files
     */
    async cleanupOldLogs(logDir) {
        try {
            const files = await fs.readdir(logDir);
            const logFiles = files.filter(f => f.endsWith('.log')).sort();
            
            // Keep only maxLogFiles
            if (logFiles.length > this.options.maxLogFiles) {
                const filesToDelete = logFiles.slice(0, logFiles.length - this.options.maxLogFiles);
                
                for (const file of filesToDelete) {
                    await fs.remove(path.join(logDir, file));
                }
            }
        } catch (error) {
            console.warn('⚠️ Log cleanup failed:', error.message);
        }
    }

    /**
     * Start flush timers
     */
    startFlushTimers() {
        // Flush logs every 5 seconds
        this.logFlushTimer = setInterval(() => {
            this.flushLogBuffer();
        }, 5000);
        
        // Flush audit logs every 2 seconds (more frequent for compliance)
        if (this.options.enableAuditLog) {
            this.auditFlushTimer = setInterval(() => {
                this.flushAuditBuffer();
            }, 2000);
        }
    }

    /**
     * Stop flush timers
     */
    stopFlushTimers() {
        if (this.logFlushTimer) {
            clearInterval(this.logFlushTimer);
            this.logFlushTimer = null;
        }
        
        if (this.auditFlushTimer) {
            clearInterval(this.auditFlushTimer);
            this.auditFlushTimer = null;
        }
    }

    /**
     * Flush log buffer to file
     */
    async flushLogBuffer() {
        if (this.logBuffer.length === 0 || !this.currentLogFile) {
            return;
        }
        
        try {
            const logLines = this.logBuffer.map(entry => JSON.stringify(entry)).join('\n') + '\n';
            await fs.appendFile(this.currentLogFile, logLines);
            
            this.logBuffer = [];
            this.logStats.lastFlush = new Date().toISOString();
            
            // Check if rotation is needed
            await this.checkLogRotation();
            
        } catch (error) {
            console.warn('⚠️ Failed to flush log buffer:', error.message);
        }
    }

    /**
     * Flush audit buffer to file
     */
    async flushAuditBuffer() {
        if (this.auditBuffer.length === 0 || !this.currentAuditFile) {
            return;
        }
        
        try {
            const auditLines = this.auditBuffer.map(entry => JSON.stringify(entry)).join('\n') + '\n';
            await fs.appendFile(this.currentAuditFile, auditLines);
            
            this.auditBuffer = [];
            
        } catch (error) {
            console.warn('⚠️ Failed to flush audit buffer:', error.message);
        }
    }

    /**
     * Update logging statistics
     */
    updateLogStats(level, logTime) {
        this.logStats.totalLogs++;
        
        if (level === 'error') {
            this.logStats.errorLogs++;
        } else if (level === 'warning') {
            this.logStats.warningLogs++;
        }
        
        // Calculate rolling average of log time
        this.logStats.avgLogTime = (this.logStats.avgLogTime + logTime) / 2;
    }

    /**
     * Get logging statistics
     */
    getLogStats() {
        return {
            ...this.logStats,
            bufferSize: this.logBuffer.length,
            auditBufferSize: this.auditBuffer.length,
            currentLogLevel: this.options.logLevel,
            structuredLogging: this.options.enableStructuredLogging
        };
    }

    /**
     * Override console methods for structured logging integration
     */
    overrideConsoleMethods() {
        const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info,
            debug: console.debug
        };
        
        // Override console.error
        console.error = (...args) => {
            const message = args.join(' ');
            this.error(message, { source: 'console' });
        };
        
        // Override console.warn
        console.warn = (...args) => {
            const message = args.join(' ');
            this.warning(message, { source: 'console' });
        };
        
        // Override console.info
        console.info = (...args) => {
            const message = args.join(' ');
            this.info(message, { source: 'console' });
        };
        
        // Override console.debug
        console.debug = (...args) => {
            const message = args.join(' ');
            this.debug(message, { source: 'console' });
        };
        
        // Store reference to restore if needed
        this.originalConsole = originalConsole;
    }

    /**
     * Restore original console methods
     */
    restoreConsoleMethods() {
        if (this.originalConsole) {
            Object.assign(console, this.originalConsole);
            this.originalConsole = null;
        }
    }

    /**
     * Set log level dynamically
     */
    setLogLevel(level) {
        if (this.logLevels[level] !== undefined) {
            this.options.logLevel = level;
            this.currentLogLevel = this.logLevels[level];
            
            this.info('Log level changed', { 
                newLevel: level, 
                numericLevel: this.currentLogLevel 
            });
        } else {
            this.warning('Invalid log level', { requestedLevel: level });
        }
    }

    /**
     * Create child logger with additional context
     */
    child(context = {}) {
        const childLogger = Object.create(this);
        childLogger.defaultContext = { ...this.defaultContext, ...context };
        
        // Override log method to include default context
        childLogger.log = (level, message, additionalContext = {}, error = null) => {
            const mergedContext = { ...childLogger.defaultContext, ...additionalContext };
            return this.log(level, message, mergedContext, error);
        };
        
        return childLogger;
    }

    /**
     * Shutdown logging system
     */
    async shutdown() {
        this.stopFlushTimers();
        
        // Flush any remaining logs
        await this.flushLogBuffer();
        if (this.options.enableAuditLog) {
            await this.flushAuditBuffer();
        }
        
        // Restore console methods
        this.restoreConsoleMethods();
        
        // Final log
        this.info('StructuredLogger shutdown complete', {
            totalLogs: this.logStats.totalLogs,
            errorLogs: this.logStats.errorLogs,
            warningLogs: this.logStats.warningLogs
        });
        
        console.log('📝 StructuredLogger shutdown complete');
    }
}

module.exports = StructuredLogger;