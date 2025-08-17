// tests/unit/TaskToolHandler.test.js
/**
 * Unit tests for TaskToolHandler
 * Tests the Task tool formatting and validation functionality
 */

const TaskToolHandler = require('../../lib/utils/TaskToolHandler');

// Mock console to suppress test output noise
const originalConsole = console;
const mockConsole = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

describe('TaskToolHandler', () => {
    let handler;

    beforeEach(() => {
        handler = new TaskToolHandler();
        console.log = mockConsole.log;
        console.warn = mockConsole.warn;
        console.error = mockConsole.error;
    });

    afterEach(() => {
        console.log = originalConsole.log;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
        jest.clearAllMocks();
    });

    describe('Constructor and Configuration', () => {
        test('should initialize with default configuration', () => {
            const config = handler.getConfig();
            expect(config.defaultSubagentType).toBe('general-purpose');
            expect(config.maxDescriptionLength).toBe(50);
            expect(config.validateHandoffs).toBe(true);
        });

        test('should accept custom configuration', () => {
            const customHandler = new TaskToolHandler({
                defaultSubagentType: 'specialized',
                maxDescriptionLength: 100,
                enableTaskTool: true
            });
            
            const config = customHandler.getConfig();
            expect(config.defaultSubagentType).toBe('specialized');
            expect(config.maxDescriptionLength).toBe(100);
            expect(config.enableTaskTool).toBe(true);
        });

        test('should update configuration', () => {
            handler.updateConfig({ enableTaskTool: true });
            expect(handler.getConfig().enableTaskTool).toBe(true);
        });
    });

    describe('formatTaskInvocation', () => {
        const validAgent = 'frontend-development-agent';
        const validDescription = 'Create navigation component';
        const validPrompt = 'Complete handoff prompt here';

        test('should format valid Task tool invocation', () => {
            const result = handler.formatTaskInvocation(validAgent, validDescription, validPrompt);
            
            expect(result).toHaveProperty('function_calls');
            expect(result.function_calls).toHaveLength(1);
            expect(result.function_calls[0].invoke.name).toBe('Task');
            expect(result.function_calls[0].invoke.parameters.subagent_type).toBe('general-purpose');
            expect(result.function_calls[0].invoke.parameters.description).toBe(validDescription);
            expect(result.function_calls[0].invoke.parameters.prompt).toBe(validPrompt);
        });

        test('should use custom subagent type when provided', () => {
            const result = handler.formatTaskInvocation(
                validAgent, 
                validDescription, 
                validPrompt, 
                { subagentType: 'specialized' }
            );
            
            expect(result.function_calls[0].invoke.parameters.subagent_type).toBe('specialized');
        });

        test('should throw error for missing target agent', () => {
            expect(() => {
                handler.formatTaskInvocation('', validDescription, validPrompt);
            }).toThrow('Target agent name is required and must be a string');
        });

        test('should throw error for missing task description', () => {
            expect(() => {
                handler.formatTaskInvocation(validAgent, '', validPrompt);
            }).toThrow('Task description is required and must be a string');
        });

        test('should throw error for missing handoff prompt', () => {
            expect(() => {
                handler.formatTaskInvocation(validAgent, validDescription, '');
            }).toThrow('Handoff prompt is required and must be a string');
        });

        test('should throw error for description too long', () => {
            const longDescription = 'a'.repeat(60);
            expect(() => {
                handler.formatTaskInvocation(validAgent, longDescription, validPrompt);
            }).toThrow('Task description must be 50 characters or less');
        });
    });

    describe('formatTaskInvocationXML', () => {
        const validAgent = 'frontend-development-agent';
        const validDescription = 'Create component';
        const validPrompt = 'Complete handoff prompt';

        test('should format valid XML Task tool invocation', () => {
            const result = handler.formatTaskInvocationXML(validAgent, validDescription, validPrompt);
            
            expect(result).toContain('<function_calls>');
            expect(result).toContain('<invoke name="Task">');
            expect(result).toContain('<parameter name="subagent_type">general-purpose</parameter>');
            expect(result).toContain(`<parameter name="description">${validDescription}</parameter>`);
            expect(result).toContain(`<parameter name="prompt">${validPrompt}</parameter>`);
            expect(result).toContain('</invoke>');
            expect(result).toContain('</function_calls>');
        });

        test('should escape XML special characters', () => {
            const promptWithXML = 'Test <script>alert("test")</script> & "quotes"';
            const result = handler.formatTaskInvocationXML(validAgent, validDescription, promptWithXML);
            
            expect(result).toContain('&lt;script&gt;');
            expect(result).toContain('&amp;');
            expect(result).toContain('&quot;quotes&quot;');
        });
    });

    describe('escapeXML', () => {
        test('should escape XML special characters', () => {
            const input = '<tag attr="value">content & more</tag>';
            const result = handler.escapeXML(input);
            
            expect(result).toBe('&lt;tag attr=&quot;value&quot;&gt;content &amp; more&lt;/tag&gt;');
        });

        test('should handle non-string input', () => {
            expect(handler.escapeXML(null)).toBe(null);
            expect(handler.escapeXML(undefined)).toBe(undefined);
            expect(handler.escapeXML(123)).toBe(123);
        });
    });

    describe('validateHandoffParameters', () => {
        const validHandoffData = {
            targetAgent: 'frontend-development-agent',
            taskDescription: 'Create nav component',
            context: 'Building a SaaS dashboard with React and needs navigation component',
            requirements: 'Must be responsive and accessible',
            successCriteria: 'Component renders correctly on all screen sizes'
        };

        test('should validate complete handoff data', () => {
            const result = handler.validateHandoffParameters(validHandoffData);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.score).toBeGreaterThan(70);
        });

        test('should detect missing required fields', () => {
            const incompleteData = {
                targetAgent: 'frontend-development-agent'
            };
            
            const result = handler.validateHandoffParameters(incompleteData);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some(error => error.includes('Missing required field'))).toBe(true);
        });

        test('should warn about agent naming convention', () => {
            const dataWithBadAgentName = {
                ...validHandoffData,
                targetAgent: 'frontend-developer'
            };
            
            const result = handler.validateHandoffParameters(dataWithBadAgentName);
            
            expect(result.warnings.some(warning => 
                warning.includes('naming convention')
            )).toBe(true);
        });

        test('should warn about verbose task description', () => {
            const dataWithLongDescription = {
                ...validHandoffData,
                taskDescription: 'Create a very complex navigation component with multiple advanced features and configurations'
            };
            
            const result = handler.validateHandoffParameters(dataWithLongDescription);
            
            expect(result.warnings.some(warning => 
                warning.includes('3-5 words')
            )).toBe(true);
        });

        test('should calculate quality score correctly', () => {
            const highQualityData = {
                ...validHandoffData,
                timeline: '2 days',
                dependencies: ['Authentication service'],
                integrationPoints: ['User menu', 'Search bar'],
                nextAgent: 'testing-agent'
            };
            
            const result = handler.validateHandoffParameters(highQualityData);
            
            expect(result.score).toBeGreaterThan(90);
        });
    });

    describe('validateHandoffTemplate', () => {
        const validTemplate = `## Handoff to @frontend-development-agent

🤖 @frontend-development-agent ACTIVE

**Context**: Building a SaaS dashboard

**Your Task**: Create navigation component

**Success Criteria**: 
- Component renders correctly
- Responsive design works

**Requirements & Constraints**:
- Must use React
- Follow design system

**Integration Points**:
- Connect to user service

**Timeline**: 2 business days`;

        test('should validate complete handoff template', () => {
            const result = handler.validateHandoffTemplate(validTemplate);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.templateCompleteness).toBeGreaterThan(80);
        });

        test('should detect missing required sections', () => {
            const incompleteTemplate = `## Handoff to @frontend-development-agent
            
**Your Task**: Create component`;
            
            const result = handler.validateHandoffTemplate(incompleteTemplate);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test('should detect missing activation marker', () => {
            const templateWithoutMarker = `## Handoff to @frontend-development-agent

**Context**: Building a SaaS dashboard

**Your Task**: Create navigation component

**Success Criteria**: Component works`;
            
            const result = handler.validateHandoffTemplate(templateWithoutMarker);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => 
                error.includes('visual activation marker')
            )).toBe(true);
        });

        test('should calculate template completeness', () => {
            const result = handler.validateHandoffTemplate(validTemplate);
            expect(result.templateCompleteness).toBe(89); // 8 out of 9 sections present
        });
    });

    describe('Utility Methods', () => {
        test('should return correct version', () => {
            expect(handler.getVersion()).toBe('1.0.0');
        });

        test('should validate dependencies', () => {
            expect(handler.validateDependencies()).toBe(true);
        });

        test('should check if Task tool is enabled', () => {
            expect(handler.isTaskToolEnabled()).toBe(false);
            
            handler.updateConfig({ enableTaskTool: true });
            expect(handler.isTaskToolEnabled()).toBe(true);
        });
    });
});