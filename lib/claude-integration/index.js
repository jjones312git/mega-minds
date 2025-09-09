/**
 * Claude Code Integration Module for Mega-Minds
 * Exports all Claude Code specific enhancements and integrations
 * 
 * Version: 2.1.0
 * Features: Slash commands, statusline, settings optimization, interactive mode
 */

const { SlashCommandGenerator } = require('./SlashCommandGenerator');
const { StatuslineProvider } = require('./StatuslineProvider');
const { SettingsOptimizer } = require('./SettingsOptimizer');

// Export all integration components
module.exports = {
  SlashCommandGenerator,
  StatuslineProvider,
  SettingsOptimizer,
  
  // Utility function to initialize all integrations
  async initializeClaudeIntegration(projectPath, projectAnalysis, aiDevTeam) {
    const results = {
      slashCommands: null,
      statusline: null,
      settings: null,
      errors: []
    };
    
    try {
      // Initialize slash command generator
      const commandGenerator = new SlashCommandGenerator();
      results.slashCommands = await commandGenerator.generateAgentCommands(
        projectAnalysis.agents || [],
        projectPath
      );
      
      // Initialize statusline provider
      const statusProvider = new StatuslineProvider(aiDevTeam);
      const statuslinePath = await statusProvider.generateStatuslineScript(projectPath);
      results.statusline = { path: statuslinePath };
      
      // Initialize settings optimizer
      const settingsOptimizer = new SettingsOptimizer(projectAnalysis);
      const settings = await settingsOptimizer.generateOptimalSettings(projectAnalysis, projectPath);
      const settingsPath = require('path').join(projectPath, '.claude', 'settings.json');
      await settingsOptimizer.saveSettings(settings, settingsPath);
      results.settings = { path: settingsPath, config: settings };
      
      console.log('✅ Claude Code integration initialized successfully');
      return results;
      
    } catch (error) {
      console.error('❌ Claude integration initialization failed:', error.message);
      results.errors.push(error.message);
      return results;
    }
  },
  
  // Get version information
  getVersion() {
    return {
      version: '2.1.0',
      components: {
        SlashCommandGenerator: '2.1.0',
        StatuslineProvider: '2.1.0', 
        SettingsOptimizer: '2.1.0'
      },
      features: [
        'Custom slash commands for agents',
        'Real-time statusline monitoring',
        'Optimal settings generation',
        'Security-first configuration',
        'Performance optimization'
      ]
    };
  }
};