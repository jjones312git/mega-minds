/**
 * Project Context Analyzer for Mega-Minds Variable-Driven Agent System
 * Automatically detects technology stack, project structure, and context
 * Enables universal compatibility across different tech stacks
 */

const fs = require('fs').promises;
const path = require('path');

class ProjectContextAnalyzer {
  constructor(projectPath, config = {}) {
    this.projectPath = projectPath;
    this.config = {
      enableCaching: config.enableCaching !== false,
      cacheTimeout: config.cacheTimeout || 300000, // 5 minutes
      enableDeepAnalysis: config.enableDeepAnalysis !== false,
      ...config
    };
    
    this.analysisCache = new Map();
    this.stackProfiles = this.initializeStackProfiles();
  }

  /**
   * Analyze complete project context
   * @param {Object} options - Analysis options
   * @returns {Object} Complete project context analysis
   */
  async analyzeProject(options = {}) {
    try {
      const cacheKey = `full_analysis_${this.projectPath}`;
      
      // Check cache first
      if (this.config.enableCaching && this.analysisCache.has(cacheKey)) {
        const cached = this.analysisCache.get(cacheKey);
        if (!this.isCacheExpired(cached)) {
          return cached.analysis;
        }
      }

      console.log('🔍 Analyzing project context...');

      // Perform comprehensive analysis
      const analysis = {
        metadata: await this.getProjectMetadata(),
        techStack: await this.detectTechStack(),
        structure: await this.analyzeStructure(),
        agents: await this.discoverAgents(),
        quality: await this.extractQualityStandards(),
        infrastructure: await this.detectInfrastructure(),
        workflow: await this.analyzeWorkflow(),
        
        // Analysis metadata
        analyzedAt: new Date().toISOString(),
        analyzer: 'ProjectContextAnalyzer',
        version: '2.1.0'
      };

      // Apply stack profile if match found
      const matchedProfile = this.matchStackProfile(analysis.techStack);
      if (matchedProfile) {
        analysis.stackProfile = matchedProfile;
        analysis.variables = this.generateVariables(analysis, matchedProfile);
      } else {
        analysis.variables = this.generateVariables(analysis);
      }

      // Cache the analysis
      this.cacheAnalysis(cacheKey, analysis);

      console.log(`✅ Project analysis complete: ${analysis.stackProfile?.name || 'Custom Stack'}`);
      return analysis;

    } catch (error) {
      console.error('❌ Project analysis failed:', error.message);
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Detect technology stack from project files
   * @returns {Object} Technology stack information
   */
  async detectTechStack() {
    const techStack = {
      languages: [],
      frameworks: {},
      databases: [],
      infrastructure: [],
      tools: [],
      confidence: 'unknown'
    };

    try {
      // Check for JavaScript/Node.js stack
      const jsStack = await this.detectJavaScriptStack();
      if (jsStack.detected) {
        techStack.languages.push('JavaScript');
        if (jsStack.typescript) techStack.languages.push('TypeScript');
        techStack.frameworks = { ...techStack.frameworks, ...jsStack.frameworks };
        techStack.tools.push(...jsStack.tools);
      }

      // Check for Python stack
      const pythonStack = await this.detectPythonStack();
      if (pythonStack.detected) {
        techStack.languages.push('Python');
        techStack.frameworks = { ...techStack.frameworks, ...pythonStack.frameworks };
        techStack.tools.push(...pythonStack.tools);
      }

      // Check for Java stack
      const javaStack = await this.detectJavaStack();
      if (javaStack.detected) {
        techStack.languages.push('Java');
        techStack.frameworks = { ...techStack.frameworks, ...javaStack.frameworks };
        techStack.tools.push(...javaStack.tools);
      }

      // Check for other languages  
      await this.detectOtherLanguages(techStack);

      // Detect databases
      techStack.databases = await this.detectDatabases();

      // Detect infrastructure
      techStack.infrastructure = await this.detectInfrastructureTools();

      // Calculate confidence score
      techStack.confidence = this.calculateTechStackConfidence(techStack);

      return techStack;

    } catch (error) {
      console.error('Tech stack detection error:', error.message);
      return this.getFallbackTechStack();
    }
  }

  /**
   * Detect JavaScript/Node.js technology stack
   * @returns {Object} JavaScript stack information
   */
  async detectJavaScriptStack() {
    const result = {
      detected: false,
      typescript: false,
      frameworks: {},
      tools: []
    };

    try {
      // Check package.json
      const packageJson = await this.readPackageJson();
      if (!packageJson) return result;

      result.detected = true;

      // Check for TypeScript
      if (packageJson.devDependencies?.typescript || packageJson.dependencies?.typescript) {
        result.typescript = true;
      }

      // Detect frontend frameworks
      if (packageJson.dependencies?.react) {
        result.frameworks.frontend = 'React';
        result.frameworks.frontendVersion = packageJson.dependencies.react;
      } else if (packageJson.dependencies?.vue) {
        result.frameworks.frontend = 'Vue';
        result.frameworks.frontendVersion = packageJson.dependencies.vue;
      } else if (packageJson.dependencies?.angular) {
        result.frameworks.frontend = 'Angular';
        result.frameworks.frontendVersion = packageJson.dependencies.angular;
      } else if (packageJson.dependencies?.svelte) {
        result.frameworks.frontend = 'Svelte';
        result.frameworks.frontendVersion = packageJson.dependencies.svelte;
      }

      // Detect meta frameworks
      if (packageJson.dependencies?.next) {
        result.frameworks.metaFramework = 'Next.js';
        result.frameworks.metaFrameworkVersion = packageJson.dependencies.next;
      } else if (packageJson.dependencies?.nuxt) {
        result.frameworks.metaFramework = 'Nuxt';
        result.frameworks.metaFrameworkVersion = packageJson.dependencies.nuxt;
      } else if (packageJson.dependencies?.gatsby) {
        result.frameworks.metaFramework = 'Gatsby';
        result.frameworks.metaFrameworkVersion = packageJson.dependencies.gatsby;
      }

      // Detect backend frameworks
      if (packageJson.dependencies?.express) {
        result.frameworks.backend = 'Express';
        result.frameworks.backendVersion = packageJson.dependencies.express;
      } else if (packageJson.dependencies?.fastify) {
        result.frameworks.backend = 'Fastify';
        result.frameworks.backendVersion = packageJson.dependencies.fastify;
      } else if (packageJson.dependencies?.koa) {
        result.frameworks.backend = 'Koa';
        result.frameworks.backendVersion = packageJson.dependencies.koa;
      }

      // Detect CSS frameworks
      if (packageJson.dependencies?.['tailwindcss'] || packageJson.devDependencies?.['tailwindcss']) {
        result.frameworks.css = 'Tailwind CSS';
      } else if (packageJson.dependencies?.bootstrap) {
        result.frameworks.css = 'Bootstrap';
      } else if (packageJson.dependencies?.['@mui/material']) {
        result.frameworks.css = 'Material-UI';
      }

      // Detect state management
      if (packageJson.dependencies?.redux) {
        result.frameworks.stateManagement = 'Redux';
      } else if (packageJson.dependencies?.zustand) {
        result.frameworks.stateManagement = 'Zustand';
      } else if (packageJson.dependencies?.mobx) {
        result.frameworks.stateManagement = 'MobX';
      }

      // Detect testing frameworks
      if (packageJson.devDependencies?.jest) {
        result.frameworks.testing = 'Jest';
        result.tools.push('Jest');
      } else if (packageJson.devDependencies?.vitest) {
        result.frameworks.testing = 'Vitest';
        result.tools.push('Vitest');
      }

      // Detect E2E frameworks
      if (packageJson.devDependencies?.playwright) {
        result.frameworks.e2e = 'Playwright';
        result.tools.push('Playwright');
      } else if (packageJson.devDependencies?.cypress) {
        result.frameworks.e2e = 'Cypress';
        result.tools.push('Cypress');
      }

      // Detect build tools
      if (packageJson.devDependencies?.vite) {
        result.frameworks.buildTool = 'Vite';
        result.tools.push('Vite');
      } else if (packageJson.devDependencies?.webpack) {
        result.frameworks.buildTool = 'Webpack';
        result.tools.push('Webpack');
      }

      return result;

    } catch (error) {
      console.error('JavaScript stack detection error:', error.message);
      return result;
    }
  }

  /**
   * Detect Python technology stack
   * @returns {Object} Python stack information
   */
  async detectPythonStack() {
    const result = {
      detected: false,
      frameworks: {},
      tools: []
    };

    try {
      // Check for Python files
      const pythonFiles = await this.findFiles(['*.py']);
      if (pythonFiles.length === 0) return result;

      result.detected = true;

      // Check requirements.txt
      const requirements = await this.readRequirements();
      if (requirements) {
        // Detect Django
        if (requirements.includes('django')) {
          result.frameworks.backend = 'Django';
          result.frameworks.language = 'Python';
        }
        // Detect FastAPI
        else if (requirements.includes('fastapi')) {
          result.frameworks.backend = 'FastAPI';
          result.frameworks.language = 'Python';
        }
        // Detect Flask
        else if (requirements.includes('flask')) {
          result.frameworks.backend = 'Flask';
          result.frameworks.language = 'Python';
        }

        // Detect testing frameworks
        if (requirements.includes('pytest')) {
          result.frameworks.testing = 'pytest';
          result.tools.push('pytest');
        }

        // Detect databases
        if (requirements.includes('psycopg2') || requirements.includes('psycopg')) {
          result.frameworks.database = 'PostgreSQL';
        }
      }

      // Check pyproject.toml
      const pyproject = await this.readPyprojectToml();
      if (pyproject) {
        // Additional framework detection from pyproject.toml
        result.tools.push('Poetry');
      }

      return result;

    } catch (error) {
      console.error('Python stack detection error:', error.message);
      return result;
    }
  }

  /**
   * Detect Java technology stack
   * @returns {Object} Java stack information
   */
  async detectJavaStack() {
    const result = {
      detected: false,
      frameworks: {},
      tools: []
    };

    try {
      // Check for Java files
      const javaFiles = await this.findFiles(['*.java']);
      if (javaFiles.length === 0) return result;

      result.detected = true;
      result.frameworks.language = 'Java';

      // Check pom.xml (Maven)
      const pomExists = await this.fileExists('pom.xml');
      if (pomExists) {
        result.frameworks.buildTool = 'Maven';
        result.tools.push('Maven');
        
        // Read pom.xml to detect Spring
        const pomContent = await this.readFile('pom.xml');
        if (pomContent.includes('spring-boot')) {
          result.frameworks.backend = 'Spring Boot';
        } else if (pomContent.includes('springframework')) {
          result.frameworks.backend = 'Spring Framework';
        }
      }

      // Check build.gradle (Gradle)
      const gradleExists = await this.fileExists('build.gradle') || await this.fileExists('build.gradle.kts');
      if (gradleExists) {
        result.frameworks.buildTool = 'Gradle';
        result.tools.push('Gradle');
      }

      return result;

    } catch (error) {
      console.error('Java stack detection error:', error.message);
      return result;
    }
  }

  /**
   * Analyze project structure
   * @returns {Object} Project structure information
   */
  async analyzeStructure() {
    const structure = {
      type: 'unknown',
      directories: {},
      patterns: {},
      conventions: {}
    };

    try {
      const rootDirs = await this.getRootDirectories();
      
      // Detect Next.js App Router structure
      if (rootDirs.includes('app') && await this.fileExists('next.config.js')) {
        structure.type = 'nextjs-app-router';
        structure.directories = {
          frontend: 'app',
          components: 'components',
          lib: 'lib',
          utils: 'utils',
          public: 'public',
          styles: 'styles'
        };
      }
      // Detect Next.js Pages Router structure
      else if (rootDirs.includes('pages') && await this.fileExists('next.config.js')) {
        structure.type = 'nextjs-pages-router';
        structure.directories = {
          frontend: 'pages',
          components: 'components',
          lib: 'lib',
          utils: 'utils',
          public: 'public',
          styles: 'styles'
        };
      }
      // Detect Django structure
      else if (rootDirs.includes('manage.py') || rootDirs.some(dir => dir.endsWith('settings.py'))) {
        structure.type = 'django';
        structure.directories = {
          backend: '.',
          apps: this.findDjangoApps(rootDirs),
          static: 'static',
          templates: 'templates'
        };
      }
      // Detect generic React structure
      else if (rootDirs.includes('src') && await this.detectReactInSrc()) {
        structure.type = 'react-spa';
        structure.directories = {
          frontend: 'src',
          components: 'src/components',
          utils: 'src/utils',
          public: 'public'
        };
      }
      // Detect Java Maven structure
      else if (rootDirs.includes('src') && await this.fileExists('pom.xml')) {
        structure.type = 'maven-java';
        structure.directories = {
          backend: 'src/main/java',
          resources: 'src/main/resources',
          tests: 'src/test/java'
        };
      }

      // Detect file patterns
      structure.patterns = await this.detectFilePatterns();

      return structure;

    } catch (error) {
      console.error('Structure analysis error:', error.message);
      return structure;
    }
  }

  /**
   * Generate variables based on analysis
   * @param {Object} analysis - Project analysis
   * @param {Object} stackProfile - Matched stack profile
   * @returns {Object} Generated variables
   */
  generateVariables(analysis, stackProfile = null) {
    const variables = {
      // Apply stack profile variables first
      ...(stackProfile?.variables || {}),

      // Core tech stack variables
      '{{LANGUAGE_PRIMARY}}': analysis.techStack.languages[0] || 'JavaScript',
      '{{LANGUAGES_ALL}}': analysis.techStack.languages.join(', '),
      
      // Framework variables
      '{{FRONTEND_FRAMEWORK}}': analysis.techStack.frameworks.frontend || 'React',
      '{{BACKEND_FRAMEWORK}}': analysis.techStack.frameworks.backend || 'Express',
      '{{META_FRAMEWORK}}': analysis.techStack.frameworks.metaFramework || '',
      '{{CSS_FRAMEWORK}}': analysis.techStack.frameworks.css || 'CSS',
      '{{STATE_MANAGEMENT}}': analysis.techStack.frameworks.stateManagement || 'React State',
      '{{BUILD_TOOL}}': analysis.techStack.frameworks.buildTool || 'Webpack',
      
      // Testing variables
      '{{TESTING_FRAMEWORK}}': analysis.techStack.frameworks.testing || 'Jest',
      '{{E2E_FRAMEWORK}}': analysis.techStack.frameworks.e2e || 'Playwright',
      
      // Project structure variables
      '{{PROJECT_TYPE}}': analysis.structure.type,
      '{{FRONTEND_DIR}}': analysis.structure.directories.frontend || 'src',
      '{{BACKEND_DIR}}': analysis.structure.directories.backend || 'api',
      '{{COMPONENTS_DIR}}': analysis.structure.directories.components || 'components',
      '{{UTILS_DIR}}': analysis.structure.directories.utils || 'utils',
      '{{TESTS_DIR}}': analysis.structure.directories.tests || '__tests__',
      '{{PUBLIC_DIR}}': analysis.structure.directories.public || 'public',
      
      // File extension variables
      '{{FILE_EXTENSION}}': analysis.structure.patterns.primaryExtension || '.jsx',
      '{{STYLE_EXTENSION}}': analysis.structure.patterns.styleExtension || '.css',
      
      // Database variables
      '{{DATABASE_TYPE}}': analysis.techStack.databases[0] || 'PostgreSQL',
      '{{DATABASE_SERVICE}}': this.detectDatabaseService(analysis.techStack),
      
      // Quality standards (can be overridden by project config)
      '{{TEST_COVERAGE_MIN}}': '80',
      '{{CRITICAL_COVERAGE}}': '90',
      '{{COMPLEXITY_THRESHOLD}}': '10',
      
      // Infrastructure variables
      '{{DEPLOYMENT_TARGET}}': this.detectDeploymentTarget(analysis.techStack),
      '{{CI_CD_PLATFORM}}': this.detectCiCdPlatform(),
      '{{CONTAINER_PLATFORM}}': this.detectContainerPlatform(),
      
      // Analysis metadata
      '{{STACK_CONFIDENCE}}': analysis.techStack.confidence,
      '{{ANALYSIS_VERSION}}': analysis.version,
      '{{ANALYZED_AT}}': analysis.analyzedAt
    };

    return variables;
  }

  /**
   * Initialize predefined stack profiles
   * @returns {Object} Stack profiles
   */
  initializeStackProfiles() {
    return {
      'react-nextjs-supabase': {
        name: 'React + Next.js + Supabase',
        match: (techStack) => 
          techStack.frameworks.frontend === 'React' && 
          techStack.frameworks.metaFramework === 'Next.js' &&
          (techStack.databases.includes('PostgreSQL') || techStack.tools.includes('Supabase')),
        variables: {
          '{{FRONTEND_FRAMEWORK}}': 'React',
          '{{META_FRAMEWORK}}': 'Next.js',
          '{{CSS_FRAMEWORK}}': 'Tailwind CSS',
          '{{STATE_MANAGEMENT}}': 'Zustand',
          '{{DATABASE_SERVICE}}': 'Supabase',
          '{{DEPLOYMENT_TARGET}}': 'Vercel',
          '{{FILE_EXTENSION}}': '.tsx'
        }
      },
      
      'vue-nuxt': {
        name: 'Vue + Nuxt',
        match: (techStack) => 
          techStack.frameworks.frontend === 'Vue' && 
          techStack.frameworks.metaFramework === 'Nuxt',
        variables: {
          '{{FRONTEND_FRAMEWORK}}': 'Vue',
          '{{META_FRAMEWORK}}': 'Nuxt',
          '{{CSS_FRAMEWORK}}': 'UnoCSS',
          '{{STATE_MANAGEMENT}}': 'Pinia',
          '{{FILE_EXTENSION}}': '.vue'
        }
      },
      
      'python-django': {
        name: 'Python + Django',
        match: (techStack) => 
          techStack.languages.includes('Python') && 
          techStack.frameworks.backend === 'Django',
        variables: {
          '{{LANGUAGE_PRIMARY}}': 'Python',
          '{{BACKEND_FRAMEWORK}}': 'Django',
          '{{TESTING_FRAMEWORK}}': 'pytest',
          '{{DATABASE_TYPE}}': 'PostgreSQL',
          '{{FILE_EXTENSION}}': '.py'
        }
      },
      
      'java-spring': {
        name: 'Java + Spring Boot',
        match: (techStack) => 
          techStack.languages.includes('Java') && 
          techStack.frameworks.backend?.includes('Spring'),
        variables: {
          '{{LANGUAGE_PRIMARY}}': 'Java',
          '{{BACKEND_FRAMEWORK}}': 'Spring Boot',
          '{{BUILD_TOOL}}': 'Maven',
          '{{TESTING_FRAMEWORK}}': 'JUnit',
          '{{FILE_EXTENSION}}': '.java'
        }
      }
    };
  }

  // Helper methods
  async readPackageJson() {
    try {
      const content = await this.readFile('package.json');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async readRequirements() {
    try {
      return await this.readFile('requirements.txt');
    } catch {
      return null;
    }
  }

  async readPyprojectToml() {
    try {
      return await this.readFile('pyproject.toml');
    } catch {
      return null;
    }
  }

  async readFile(filePath) {
    const fullPath = path.join(this.projectPath, filePath);
    return await fs.readFile(fullPath, 'utf8');
  }

  async fileExists(filePath) {
    try {
      const fullPath = path.join(this.projectPath, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async hasFiles(pattern) {
    try {
      const files = await this.findFiles([pattern]);
      return files.length > 0;
    } catch {
      return false;
    }
  }

  async readJsonFile(filePath) {
    try {
      const content = await this.readFile(filePath);
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async getRootDirectories() {
    try {
      const entries = await fs.readdir(this.projectPath, { withFileTypes: true });
      return entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
    } catch {
      return [];
    }
  }

  async findFiles(patterns) {
    // Simple file pattern matching - would use glob in production
    try {
      const allFiles = await this.getAllFiles(this.projectPath);
      return allFiles.filter(file => 
        patterns.some(pattern => 
          file.endsWith(pattern.replace('*.', '.'))
        )
      );
    } catch {
      return [];
    }
  }

  async getAllFiles(dir, files = []) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await this.getAllFiles(fullPath, files);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch {
      // Ignore errors
    }
    return files;
  }

  matchStackProfile(techStack) {
    for (const [key, profile] of Object.entries(this.stackProfiles)) {
      if (profile.match(techStack)) {
        return { key, ...profile };
      }
    }
    return null;
  }

  // Placeholder methods for additional analysis
  async detectDatabases() {
    // Would analyze config files, dependencies, etc.
    return ['PostgreSQL']; // Default
  }

  async detectInfrastructureTools() {
    // Would check for Docker, K8s configs, etc.
    return [];
  }

  async detectOtherLanguages(techStack) {
    try {
      // Detect Go
      if (await this.fileExists('go.mod') || await this.fileExists('go.sum')) {
        techStack.languages.push('Go');
        techStack.frameworks.backend = 'Go Standard Library';
      }

      // Detect Rust
      if (await this.fileExists('Cargo.toml')) {
        techStack.languages.push('Rust');
        techStack.frameworks.backend = 'Rust';
      }

      // Detect C#/.NET
      if (await this.fileExists('*.csproj') || await this.fileExists('*.sln')) {
        techStack.languages.push('C#');
        techStack.frameworks.backend = '.NET';
      }

      // Detect PHP
      if (await this.fileExists('composer.json') || await this.hasFiles('*.php')) {
        techStack.languages.push('PHP');
        // Check for common PHP frameworks
        const composerJson = await this.readJsonFile('composer.json');
        if (composerJson?.require) {
          if (composerJson.require['laravel/framework']) {
            techStack.frameworks.backend = 'Laravel';
          } else if (composerJson.require['symfony/symfony']) {
            techStack.frameworks.backend = 'Symfony';
          } else {
            techStack.frameworks.backend = 'PHP';
          }
        }
      }

      // Detect Ruby
      if (await this.fileExists('Gemfile') || await this.hasFiles('*.rb')) {
        techStack.languages.push('Ruby');
        const gemfile = await this.readFile('Gemfile');
        if (gemfile?.includes('rails')) {
          techStack.frameworks.backend = 'Ruby on Rails';
        } else {
          techStack.frameworks.backend = 'Ruby';
        }
      }

      // Detect Swift (iOS)
      if (await this.hasFiles('*.swift') || await this.fileExists('Package.swift')) {
        techStack.languages.push('Swift');
        techStack.frameworks.mobile = 'SwiftUI';
      }

      // Detect Kotlin (Android)
      if (await this.hasFiles('*.kt') || await this.hasFiles('*.kts')) {
        techStack.languages.push('Kotlin');
        techStack.frameworks.mobile = 'Android';
      }

    } catch (error) {
      console.warn('Error detecting other languages:', error.message);
    }
  }

  async discoverAgents() {
    // Would scan for available agents
    return {
      available: ['project-orchestrator-agent', 'frontend-development-agent', 'backend-development-agent'],
      workflow: 'standard'
    };
  }

  async extractQualityStandards() {
    // Would parse config files for quality standards
    return {
      coverage: { minimum: 80, critical: 90 },
      complexity: { threshold: 10 }
    };
  }

  async detectInfrastructure() {
    // Would detect cloud providers, CI/CD, etc.
    return {
      cloud: 'unknown',
      cicd: 'github-actions',
      deployment: 'vercel'
    };
  }

  async analyzeWorkflow() {
    // Would analyze workflow patterns
    return {
      type: 'standard',
      handoffPattern: 'sequential'
    };
  }

  calculateTechStackConfidence(techStack) {
    const score = techStack.languages.length + 
                 Object.keys(techStack.frameworks).length + 
                 techStack.tools.length;
    
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  // Fallback methods
  getFallbackAnalysis() {
    return {
      techStack: this.getFallbackTechStack(),
      structure: { type: 'unknown', directories: {} },
      variables: this.generateFallbackVariables()
    };
  }

  getFallbackTechStack() {
    return {
      languages: ['JavaScript'],
      frameworks: { frontend: 'React', backend: 'Express' },
      databases: ['PostgreSQL'],
      infrastructure: [],
      tools: ['Jest'],
      confidence: 'low'
    };
  }

  generateFallbackVariables() {
    return {
      '{{LANGUAGE_PRIMARY}}': 'JavaScript',
      '{{FRONTEND_FRAMEWORK}}': 'React',
      '{{BACKEND_FRAMEWORK}}': 'Express',
      '{{TESTING_FRAMEWORK}}': 'Jest',
      '{{FILE_EXTENSION}}': '.jsx'
    };
  }

  // Cache management
  cacheAnalysis(key, analysis) {
    if (this.config.enableCaching) {
      this.analysisCache.set(key, {
        analysis,
        timestamp: Date.now()
      });
      
      // Cleanup old entries
      if (this.analysisCache.size > 10) {
        const oldestKey = this.analysisCache.keys().next().value;
        this.analysisCache.delete(oldestKey);
      }
    }
  }

  isCacheExpired(cached) {
    return (Date.now() - cached.timestamp) > this.config.cacheTimeout;
  }

  // Additional helper methods for specific detections
  detectDatabaseService(techStack) {
    if (techStack.tools.includes('Supabase')) return 'Supabase';
    if (techStack.tools.includes('Firebase')) return 'Firebase';
    if (techStack.databases.includes('PostgreSQL')) return 'Custom PostgreSQL';
    return 'Unknown';
  }

  detectDeploymentTarget(techStack) {
    if (techStack.frameworks.metaFramework === 'Next.js') return 'Vercel';
    if (techStack.frameworks.backend === 'Django') return 'AWS';
    return 'Custom';
  }

  detectCiCdPlatform() {
    // Would check for .github/workflows, .gitlab-ci.yml, etc.
    return 'GitHub Actions';
  }

  detectContainerPlatform() {
    // Would check for Dockerfile, docker-compose.yml, etc.
    return 'Docker';
  }

  async getProjectMetadata() {
    const packageJson = await this.readPackageJson();
    return {
      name: packageJson?.name || path.basename(this.projectPath),
      version: packageJson?.version || '1.0.0',
      description: packageJson?.description || ''
    };
  }

  async detectFilePatterns() {
    // Simplified pattern detection
    const hasTypeScript = await this.fileExists('tsconfig.json');
    const hasJSX = await this.findFiles(['*.jsx', '*.tsx']);
    
    return {
      primaryExtension: hasTypeScript ? '.tsx' : '.jsx',
      styleExtension: '.css',
      hasTypeScript,
      hasJSX: hasJSX.length > 0
    };
  }

  async detectReactInSrc() {
    const packageJson = await this.readPackageJson();
    return packageJson?.dependencies?.react || packageJson?.devDependencies?.react;
  }

  findDjangoApps(rootDirs) {
    // Would scan for Django app directories
    return rootDirs.filter(dir => !['static', 'templates', 'media'].includes(dir));
  }

  /**
   * Get analysis summary for display
   * @returns {Object} Summary information
   */
  async getAnalysisSummary() {
    try {
      const analysis = await this.analyzeProject();
      return {
        projectName: analysis.metadata.name,
        primaryLanguage: analysis.techStack.languages[0],
        stack: analysis.stackProfile?.name || 'Custom Stack',
        confidence: analysis.techStack.confidence,
        variableCount: Object.keys(analysis.variables).length
      };
    } catch (error) {
      return {
        error: error.message,
        status: 'analysis-failed'
      };
    }
  }
}

module.exports = { ProjectContextAnalyzer };