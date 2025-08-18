// lib/enterprise/TeamCollaboration.js
// Enterprise team collaboration system with role-based permissions
// Phase 3.3: Enterprise Features - Multi-user development support

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

/**
 * TeamCollaboration handles multi-user project management with enterprise features
 * PRD Requirements: User roles, conflict resolution, activity logging, permission control
 * Maintains 100% backward compatibility - single user mode unaffected
 */
class TeamCollaboration {
    constructor(projectPath, options = {}) {
        this.projectPath = projectPath;
        this.options = {
            enableTeamMode: false, // Default: single-user mode (backward compatible)
            maxTeamMembers: options.maxTeamMembers || 10,
            activityLogRetention: options.activityLogRetention || 90, // days
            conflictResolutionTimeout: options.conflictResolutionTimeout || 30000, // 30 seconds
            ...options
        };
        
        // Enterprise directory structure
        this.enterpriseDir = path.join(projectPath, '.mega-minds', 'enterprise');
        this.teamConfigFile = path.join(this.enterpriseDir, 'team-config.json');
        this.activityLogDir = path.join(this.enterpriseDir, 'activity-logs');
        this.collaborationStateFile = path.join(this.enterpriseDir, 'collaboration-state.json');
        
        // Team configuration
        this.teamConfig = {
            enabled: false,
            owner: null,
            members: new Map(),
            roles: {
                owner: {
                    permissions: ['read', 'write', 'admin', 'invite', 'remove', 'configure']
                },
                collaborator: {
                    permissions: ['read', 'write', 'collaborate']
                },
                viewer: {
                    permissions: ['read', 'view_activity']
                }
            }
        };
        
        // Current user context (defaults to owner for backward compatibility)
        this.currentUser = {
            id: 'default-user',
            name: 'Project Owner',
            role: 'owner',
            sessionId: this.generateSessionId()
        };
        
        // Active collaboration state
        this.collaborationState = {
            activeUsers: new Map(),
            agentLocks: new Map(),
            conflictQueue: [],
            lastActivity: null
        };
        
        this.initialized = false;
    }

    /**
     * Initialize team collaboration system
     * Only enables team features if explicitly requested
     */
    async initialize(enableTeamMode = false) {
        try {
            // Ensure enterprise directory exists
            await fs.ensureDir(this.enterpriseDir);
            await fs.ensureDir(this.activityLogDir);
            
            // Load existing team configuration
            await this.loadTeamConfig();
            
            // Enable team mode if requested
            if (enableTeamMode) {
                this.options.enableTeamMode = true;
                this.teamConfig.enabled = true;
                
                // Initialize owner if not set
                if (!this.teamConfig.owner) {
                    this.teamConfig.owner = this.currentUser.id;
                    this.teamConfig.members.set(this.currentUser.id, {
                        ...this.currentUser,
                        role: 'owner',
                        joinedAt: new Date().toISOString(),
                        status: 'active'
                    });
                }
                
                await this.saveTeamConfig();
                console.log('👥 Team collaboration mode enabled');
            }
            
            // Load collaboration state
            await this.loadCollaborationState();
            
            // Register current user session
            await this.registerUserSession(this.currentUser);
            
            this.initialized = true;
            return true;
            
        } catch (error) {
            console.warn('⚠️ TeamCollaboration initialization warning:', error.message);
            // Graceful degradation - continue in single-user mode
            this.options.enableTeamMode = false;
            this.teamConfig.enabled = false;
            return false;
        }
    }

    /**
     * Check if team mode is enabled
     */
    isTeamModeEnabled() {
        return this.options.enableTeamMode && this.teamConfig.enabled;
    }

    /**
     * Get current user info
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Set current user (for multi-user scenarios)
     */
    async setCurrentUser(userId, userName, sessionInfo = {}) {
        if (!this.isTeamModeEnabled()) {
            return this.currentUser; // Single-user mode - no change
        }
        
        const member = this.teamConfig.members.get(userId);
        if (!member) {
            throw new Error(`User ${userId} is not a team member`);
        }
        
        this.currentUser = {
            id: userId,
            name: userName || member.name,
            role: member.role,
            sessionId: sessionInfo.sessionId || this.generateSessionId(),
            ...sessionInfo
        };
        
        // Register session
        await this.registerUserSession(this.currentUser);
        
        return this.currentUser;
    }

    /**
     * Add team member with role
     */
    async addTeamMember(userId, userName, role = 'collaborator', invitedBy = null) {
        if (!this.isTeamModeEnabled()) {
            throw new Error('Team mode not enabled. Enable with mega-minds enable-team-collaboration');
        }
        
        // Check permissions
        if (!this.hasPermission(this.currentUser.role, 'invite')) {
            throw new Error('Insufficient permissions to invite team members');
        }
        
        // Check team size limit
        if (this.teamConfig.members.size >= this.options.maxTeamMembers) {
            throw new Error(`Team size limit reached (${this.options.maxTeamMembers})`);
        }
        
        // Validate role
        if (!this.teamConfig.roles[role]) {
            throw new Error(`Invalid role: ${role}`);
        }
        
        // Check if user already exists
        if (this.teamConfig.members.has(userId)) {
            throw new Error(`User ${userId} is already a team member`);
        }
        
        const member = {
            id: userId,
            name: userName,
            role: role,
            joinedAt: new Date().toISOString(),
            invitedBy: invitedBy || this.currentUser.id,
            status: 'active',
            permissions: this.teamConfig.roles[role].permissions
        };
        
        this.teamConfig.members.set(userId, member);
        await this.saveTeamConfig();
        
        // Log activity
        await this.logActivity('team_member_added', {
            targetUser: userId,
            targetUserName: userName,
            role: role,
            invitedBy: this.currentUser.id
        });
        
        console.log(`✅ Added team member: ${userName} (${role})`);
        return member;
    }

    /**
     * Remove team member
     */
    async removeTeamMember(userId) {
        if (!this.isTeamModeEnabled()) {
            throw new Error('Team mode not enabled');
        }
        
        // Check permissions
        if (!this.hasPermission(this.currentUser.role, 'remove')) {
            throw new Error('Insufficient permissions to remove team members');
        }
        
        const member = this.teamConfig.members.get(userId);
        if (!member) {
            throw new Error(`User ${userId} is not a team member`);
        }
        
        // Cannot remove owner
        if (member.role === 'owner') {
            throw new Error('Cannot remove project owner');
        }
        
        // Remove member
        this.teamConfig.members.delete(userId);
        await this.saveTeamConfig();
        
        // Remove from active sessions
        this.collaborationState.activeUsers.delete(userId);
        await this.saveCollaborationState();
        
        // Log activity
        await this.logActivity('team_member_removed', {
            targetUser: userId,
            targetUserName: member.name,
            removedBy: this.currentUser.id
        });
        
        console.log(`✅ Removed team member: ${member.name}`);
        return member;
    }

    /**
     * Change user role
     */
    async changeUserRole(userId, newRole) {
        if (!this.isTeamModeEnabled()) {
            throw new Error('Team mode not enabled');
        }
        
        // Check permissions
        if (!this.hasPermission(this.currentUser.role, 'admin')) {
            throw new Error('Insufficient permissions to change user roles');
        }
        
        const member = this.teamConfig.members.get(userId);
        if (!member) {
            throw new Error(`User ${userId} is not a team member`);
        }
        
        // Validate new role
        if (!this.teamConfig.roles[newRole]) {
            throw new Error(`Invalid role: ${newRole}`);
        }
        
        // Cannot change owner role
        if (member.role === 'owner' || newRole === 'owner') {
            throw new Error('Cannot change owner role');
        }
        
        const oldRole = member.role;
        member.role = newRole;
        member.permissions = this.teamConfig.roles[newRole].permissions;
        
        this.teamConfig.members.set(userId, member);
        await this.saveTeamConfig();
        
        // Log activity
        await this.logActivity('user_role_changed', {
            targetUser: userId,
            targetUserName: member.name,
            oldRole: oldRole,
            newRole: newRole,
            changedBy: this.currentUser.id
        });
        
        console.log(`✅ Changed role for ${member.name}: ${oldRole} → ${newRole}`);
        return member;
    }

    /**
     * Check if user has specific permission
     */
    hasPermission(role, permission) {
        const roleConfig = this.teamConfig.roles[role];
        return roleConfig && roleConfig.permissions.includes(permission);
    }

    /**
     * Register user session for collaboration tracking
     */
    async registerUserSession(user) {
        if (!this.isTeamModeEnabled()) {
            return; // Single-user mode - no session tracking needed
        }
        
        this.collaborationState.activeUsers.set(user.id, {
            ...user,
            lastActivity: new Date().toISOString(),
            status: 'active'
        });
        
        await this.saveCollaborationState();
        
        // Log activity
        await this.logActivity('user_session_started', {
            sessionId: user.sessionId
        });
    }

    /**
     * Update user activity timestamp
     */
    async updateUserActivity(userId = null) {
        if (!this.isTeamModeEnabled()) {
            return;
        }
        
        const targetUserId = userId || this.currentUser.id;
        const activeUser = this.collaborationState.activeUsers.get(targetUserId);
        
        if (activeUser) {
            activeUser.lastActivity = new Date().toISOString();
            this.collaborationState.activeUsers.set(targetUserId, activeUser);
            this.collaborationState.lastActivity = new Date().toISOString();
            
            await this.saveCollaborationState();
        }
    }

    /**
     * Request agent lock for exclusive access
     */
    async requestAgentLock(agentName, taskDescription = '') {
        if (!this.isTeamModeEnabled()) {
            return { granted: true, lockId: 'single-user' }; // Single-user mode - always granted
        }
        
        // Check if agent is already locked
        const existingLock = this.collaborationState.agentLocks.get(agentName);
        if (existingLock && existingLock.userId !== this.currentUser.id) {
            // Check if lock has expired
            const lockAge = Date.now() - new Date(existingLock.timestamp).getTime();
            if (lockAge < this.options.conflictResolutionTimeout) {
                return {
                    granted: false,
                    conflict: true,
                    lockedBy: existingLock.userId,
                    lockExpires: new Date(new Date(existingLock.timestamp).getTime() + this.options.conflictResolutionTimeout)
                };
            }
        }
        
        // Grant lock
        const lockId = this.generateLockId();
        const lock = {
            lockId: lockId,
            agentName: agentName,
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            taskDescription: taskDescription,
            timestamp: new Date().toISOString(),
            expiresAt: new Date(Date.now() + this.options.conflictResolutionTimeout).toISOString()
        };
        
        this.collaborationState.agentLocks.set(agentName, lock);
        await this.saveCollaborationState();
        
        // Log activity
        await this.logActivity('agent_lock_acquired', {
            agentName: agentName,
            lockId: lockId,
            taskDescription: taskDescription
        });
        
        return { granted: true, lockId: lockId, lock: lock };
    }

    /**
     * Release agent lock
     */
    async releaseAgentLock(agentName, lockId = null) {
        if (!this.isTeamModeEnabled()) {
            return { released: true }; // Single-user mode - always successful
        }
        
        const existingLock = this.collaborationState.agentLocks.get(agentName);
        if (!existingLock) {
            return { released: false, reason: 'No active lock found' };
        }
        
        // Verify lock ownership or admin permissions
        if (existingLock.userId !== this.currentUser.id && !this.hasPermission(this.currentUser.role, 'admin')) {
            return { released: false, reason: 'Insufficient permissions to release lock' };
        }
        
        // Verify lock ID if provided
        if (lockId && existingLock.lockId !== lockId) {
            return { released: false, reason: 'Invalid lock ID' };
        }
        
        this.collaborationState.agentLocks.delete(agentName);
        await this.saveCollaborationState();
        
        // Log activity
        await this.logActivity('agent_lock_released', {
            agentName: agentName,
            lockId: existingLock.lockId,
            releasedBy: this.currentUser.id,
            originalOwner: existingLock.userId
        });
        
        return { released: true, lock: existingLock };
    }

    /**
     * Get team status and active collaboration info
     */
    async getTeamStatus() {
        const status = {
            teamMode: this.isTeamModeEnabled(),
            currentUser: this.currentUser,
            teamSize: this.teamConfig.members.size,
            activeUsers: Array.from(this.collaborationState.activeUsers.values()),
            agentLocks: Array.from(this.collaborationState.agentLocks.values()),
            conflictQueue: this.collaborationState.conflictQueue.length
        };
        
        if (this.isTeamModeEnabled()) {
            status.members = Array.from(this.teamConfig.members.values());
            status.owner = this.teamConfig.members.get(this.teamConfig.owner);
        }
        
        return status;
    }

    /**
     * Get activity log for audit trails
     */
    async getActivityLog(options = {}) {
        const {
            userId = null,
            activityType = null,
            startDate = null,
            endDate = null,
            limit = 100
        } = options;
        
        try {
            const today = new Date().toISOString().split('T')[0];
            const logFile = path.join(this.activityLogDir, `${today}.json`);
            
            if (!await fs.pathExists(logFile)) {
                return [];
            }
            
            const activities = await fs.readJSON(logFile);
            
            // Apply filters
            let filtered = activities;
            
            if (userId) {
                filtered = filtered.filter(a => a.userId === userId);
            }
            
            if (activityType) {
                filtered = filtered.filter(a => a.activityType === activityType);
            }
            
            if (startDate) {
                filtered = filtered.filter(a => a.timestamp >= startDate);
            }
            
            if (endDate) {
                filtered = filtered.filter(a => a.timestamp <= endDate);
            }
            
            // Sort by timestamp (newest first) and limit
            return filtered
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
                
        } catch (error) {
            console.warn('⚠️ Error reading activity log:', error.message);
            return [];
        }
    }

    /**
     * Log activity for audit trails
     */
    async logActivity(activityType, details = {}) {
        try {
            const activity = {
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                userId: this.currentUser.id,
                userName: this.currentUser.name,
                userRole: this.currentUser.role,
                sessionId: this.currentUser.sessionId,
                activityType: activityType,
                details: details,
                projectPath: this.projectPath
            };
            
            // Daily log files for performance
            const today = new Date().toISOString().split('T')[0];
            const logFile = path.join(this.activityLogDir, `${today}.json`);
            
            let activities = [];
            if (await fs.pathExists(logFile)) {
                activities = await fs.readJSON(logFile);
            }
            
            activities.push(activity);
            await fs.writeJSON(logFile, activities, { spaces: 2 });
            
            // Update collaboration state
            await this.updateUserActivity();
            
        } catch (error) {
            console.warn('⚠️ Failed to log activity:', error.message);
            // Non-critical - don't throw error
        }
    }

    /**
     * Load team configuration
     */
    async loadTeamConfig() {
        try {
            if (await fs.pathExists(this.teamConfigFile)) {
                const config = await fs.readJSON(this.teamConfigFile);
                
                this.teamConfig.enabled = config.enabled || false;
                this.teamConfig.owner = config.owner;
                
                // Convert members array to Map
                if (config.members) {
                    if (Array.isArray(config.members)) {
                        config.members.forEach(member => {
                            this.teamConfig.members.set(member.id, member);
                        });
                    } else if (typeof config.members === 'object') {
                        Object.entries(config.members).forEach(([id, member]) => {
                            this.teamConfig.members.set(id, member);
                        });
                    }
                }
                
                // Merge custom roles if any
                if (config.roles) {
                    Object.assign(this.teamConfig.roles, config.roles);
                }
            }
        } catch (error) {
            console.warn('⚠️ Error loading team config:', error.message);
        }
    }

    /**
     * Save team configuration
     */
    async saveTeamConfig() {
        try {
            const config = {
                enabled: this.teamConfig.enabled,
                owner: this.teamConfig.owner,
                members: Array.from(this.teamConfig.members.values()),
                roles: this.teamConfig.roles,
                lastUpdated: new Date().toISOString()
            };
            
            await fs.writeJSON(this.teamConfigFile, config, { spaces: 2 });
        } catch (error) {
            console.warn('⚠️ Error saving team config:', error.message);
        }
    }

    /**
     * Load collaboration state
     */
    async loadCollaborationState() {
        try {
            if (await fs.pathExists(this.collaborationStateFile)) {
                const state = await fs.readJSON(this.collaborationStateFile);
                
                // Convert arrays/objects to Maps
                if (state.activeUsers) {
                    if (Array.isArray(state.activeUsers)) {
                        state.activeUsers.forEach(user => {
                            this.collaborationState.activeUsers.set(user.id, user);
                        });
                    } else if (typeof state.activeUsers === 'object') {
                        Object.entries(state.activeUsers).forEach(([id, user]) => {
                            this.collaborationState.activeUsers.set(id, user);
                        });
                    }
                }
                
                if (state.agentLocks) {
                    if (Array.isArray(state.agentLocks)) {
                        state.agentLocks.forEach(lock => {
                            this.collaborationState.agentLocks.set(lock.agentName, lock);
                        });
                    } else if (typeof state.agentLocks === 'object') {
                        Object.entries(state.agentLocks).forEach(([agentName, lock]) => {
                            this.collaborationState.agentLocks.set(agentName, lock);
                        });
                    }
                }
                
                this.collaborationState.conflictQueue = state.conflictQueue || [];
                this.collaborationState.lastActivity = state.lastActivity;
            }
        } catch (error) {
            console.warn('⚠️ Error loading collaboration state:', error.message);
        }
    }

    /**
     * Save collaboration state
     */
    async saveCollaborationState() {
        try {
            const state = {
                activeUsers: Array.from(this.collaborationState.activeUsers.values()),
                agentLocks: Array.from(this.collaborationState.agentLocks.values()),
                conflictQueue: this.collaborationState.conflictQueue,
                lastActivity: this.collaborationState.lastActivity,
                lastUpdated: new Date().toISOString()
            };
            
            await fs.writeJSON(this.collaborationStateFile, state, { spaces: 2 });
        } catch (error) {
            console.warn('⚠️ Error saving collaboration state:', error.message);
        }
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return crypto.randomUUID();
    }

    /**
     * Generate unique lock ID
     */
    generateLockId() {
        return crypto.randomBytes(8).toString('hex');
    }

    /**
     * Cleanup expired locks and inactive sessions
     */
    async cleanup() {
        if (!this.isTeamModeEnabled()) {
            return;
        }
        
        const now = Date.now();
        let changed = false;
        
        // Clean expired agent locks
        for (const [agentName, lock] of this.collaborationState.agentLocks) {
            const lockAge = now - new Date(lock.timestamp).getTime();
            if (lockAge > this.options.conflictResolutionTimeout) {
                this.collaborationState.agentLocks.delete(agentName);
                changed = true;
                
                await this.logActivity('agent_lock_expired', {
                    agentName: agentName,
                    lockId: lock.lockId,
                    originalOwner: lock.userId
                });
            }
        }
        
        // Clean inactive user sessions (older than 1 hour)
        const sessionTimeout = 60 * 60 * 1000; // 1 hour
        for (const [userId, user] of this.collaborationState.activeUsers) {
            const lastActivity = now - new Date(user.lastActivity).getTime();
            if (lastActivity > sessionTimeout) {
                this.collaborationState.activeUsers.delete(userId);
                changed = true;
            }
        }
        
        if (changed) {
            await this.saveCollaborationState();
        }
    }

    /**
     * Shutdown and cleanup
     */
    async shutdown() {
        await this.cleanup();
        
        if (this.isTeamModeEnabled()) {
            // Log session end
            await this.logActivity('user_session_ended', {
                sessionId: this.currentUser.sessionId
            });
            
            // Remove from active users
            this.collaborationState.activeUsers.delete(this.currentUser.id);
            await this.saveCollaborationState();
        }
        
        console.log('👥 TeamCollaboration shutdown complete');
    }
}

module.exports = TeamCollaboration;