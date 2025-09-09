/**
 * Stack Profile Manager for Mega-Minds Variable-Driven Agent System
 * Manages predefined technology combinations and generates context-aware variables
 * Supports both popular stacks and custom configurations
 */

class StackProfileManager {
  constructor(config = {}) {
    this.config = {
      enableCustomProfiles: config.enableCustomProfiles !== false,
      profilesDirectory: config.profilesDirectory || null,
      ...config
    };
    
    this.profiles = this.initializeProfiles();
    this.customProfiles = new Map();
  }

  /**
   * Initialize all predefined stack profiles
   * @returns {Object} Predefined stack profiles
   */
  initializeProfiles() {
    return {
      // JavaScript/React Stacks
      'react-nextjs-supabase': {
        name: 'React + Next.js + Supabase',
        description: 'Full-stack React application with Next.js and Supabase backend',
        category: 'javascript-fullstack',
        popularity: 'high',
        match: (techStack) => 
          techStack.frameworks.frontend === 'React' && 
          techStack.frameworks.metaFramework === 'Next.js',
        variables: {
          // Core tech stack
          '{{LANGUAGE_PRIMARY}}': 'TypeScript',
          '{{LANGUAGES_ALL}}': 'TypeScript, JavaScript',
          '{{FRONTEND_FRAMEWORK}}': 'React',
          '{{FRONTEND_VERSION}}': '18+',
          '{{META_FRAMEWORK}}': 'Next.js',
          '{{META_FRAMEWORK_VERSION}}': '14+',
          '{{BACKEND_FRAMEWORK}}': 'Next.js API Routes',
          '{{CSS_FRAMEWORK}}': 'Tailwind CSS',
          '{{STATE_MANAGEMENT}}': 'Zustand',
          '{{BUILD_TOOL}}': 'Webpack',
          
          // Testing
          '{{TESTING_FRAMEWORK}}': 'Jest',
          '{{E2E_FRAMEWORK}}': 'Playwright',
          '{{TESTING_LIBRARY}}': 'React Testing Library',
          
          // Database
          '{{DATABASE_TYPE}}': 'PostgreSQL',
          '{{DATABASE_SERVICE}}': 'Supabase',
          '{{ORM_TOOL}}': 'Supabase Client',
          
          // Project structure
          '{{PROJECT_TYPE}}': 'nextjs-app-router',
          '{{FRONTEND_DIR}}': 'app',
          '{{COMPONENTS_DIR}}': 'components',
          '{{UTILS_DIR}}': 'lib',
          '{{TESTS_DIR}}': '__tests__',
          '{{PUBLIC_DIR}}': 'public',
          '{{API_DIR}}': 'app/api',
          
          // File patterns
          '{{FILE_EXTENSION}}': '.tsx',
          '{{STYLE_EXTENSION}}': '.css',
          '{{CONFIG_EXTENSION}}': '.ts',
          
          // Infrastructure
          '{{DEPLOYMENT_TARGET}}': 'Vercel',
          '{{CI_CD_PLATFORM}}': 'GitHub Actions',
          '{{CONTAINER_PLATFORM}}': 'Docker',
          '{{CLOUD_PROVIDER}}': 'Vercel Edge Network',
          
          // Quality standards
          '{{TEST_COVERAGE_MIN}}': '85',
          '{{CRITICAL_COVERAGE}}': '95',
          '{{COMPLEXITY_THRESHOLD}}': '8',
          '{{PERFORMANCE_BUDGET}}': '2s FCP, 100KB JS bundle',
          '{{ACCESSIBILITY_LEVEL}}': 'WCAG 2.1 AA',
          
          // Agent workflow
          '{{PRIMARY_AGENTS}}': 'project-orchestrator-agent, frontend-development-agent, backend-development-agent',
          '{{HANDOFF_PATTERN}}': 'orchestrator → frontend/backend → testing → deployment'
        },
        agentSpecializations: {
          'frontend-development-agent': 'React 18+, Next.js App Router, TypeScript, Tailwind CSS',
          'backend-development-agent': 'Next.js API Routes, Supabase integration, TypeScript',
          'database-agent': 'Supabase PostgreSQL, Row Level Security, real-time subscriptions',
          'testing-agent': 'Jest, React Testing Library, Playwright E2E testing'
        }
      },

      'react-vite-firebase': {
        name: 'React + Vite + Firebase',
        description: 'Single-page React application with Vite and Firebase backend',
        category: 'javascript-spa',
        popularity: 'medium',
        match: (techStack) => 
          techStack.frameworks.frontend === 'React' && 
          techStack.frameworks.buildTool === 'Vite',
        variables: {
          '{{LANGUAGE_PRIMARY}}': 'TypeScript',
          '{{FRONTEND_FRAMEWORK}}': 'React',
          '{{BUILD_TOOL}}': 'Vite',
          '{{TESTING_FRAMEWORK}}': 'Vitest',
          '{{DATABASE_SERVICE}}': 'Firebase',
          '{{DEPLOYMENT_TARGET}}': 'Firebase Hosting',
          '{{PROJECT_TYPE}}': 'react-spa',
          '{{FRONTEND_DIR}}': 'src',
          '{{FILE_EXTENSION}}': '.tsx'
        }
      },

      // Vue.js Stacks
      'vue-nuxt-prisma': {
        name: 'Vue + Nuxt + Prisma',
        description: 'Full-stack Vue application with Nuxt and Prisma ORM',
        category: 'vue-fullstack',
        popularity: 'medium',
        match: (techStack) => 
          techStack.frameworks.frontend === 'Vue' && 
          techStack.frameworks.metaFramework === 'Nuxt',
        variables: {
          '{{LANGUAGE_PRIMARY}}': 'TypeScript',
          '{{FRONTEND_FRAMEWORK}}': 'Vue',
          '{{FRONTEND_VERSION}}': '3+',
          '{{META_FRAMEWORK}}': 'Nuxt',
          '{{META_FRAMEWORK_VERSION}}': '3+',
          '{{CSS_FRAMEWORK}}': 'UnoCSS',
          '{{STATE_MANAGEMENT}}': 'Pinia',
          '{{BUILD_TOOL}}': 'Vite',
          '{{TESTING_FRAMEWORK}}': 'Vitest',
          '{{E2E_FRAMEWORK}}': 'Playwright',
          '{{DATABASE_TYPE}}': 'PostgreSQL',
          '{{ORM_TOOL}}': 'Prisma',
          '{{PROJECT_TYPE}}': 'nuxt',
          '{{FILE_EXTENSION}}': '.vue',
          '{{DEPLOYMENT_TARGET}}': 'Vercel'
        }
      },

      // Python Stacks
      'python-django-postgres': {
        name: 'Python + Django + PostgreSQL',
        description: 'Full-stack Python web application with Django framework',
        category: 'python-fullstack',
        popularity: 'high',
        match: (techStack) => 
          techStack.languages.includes('Python') && 
          techStack.frameworks.backend === 'Django',
        variables: {
          '{{LANGUAGE_PRIMARY}}': 'Python',
          '{{LANGUAGES_ALL}}': 'Python, HTML, CSS, JavaScript',
          '{{BACKEND_FRAMEWORK}}': 'Django',
          '{{FRAMEWORK_VERSION}}': '4+',
          '{{FRONTEND_APPROACH}}': 'Django Templates + HTMX',
          '{{DATABASE_TYPE}}': 'PostgreSQL',
          '{{ORM_TOOL}}': 'Django ORM',
          '{{TESTING_FRAMEWORK}}': 'pytest',
          '{{E2E_FRAMEWORK}}': 'Selenium',
          
          '{{PROJECT_TYPE}}': 'django',
          '{{BACKEND_DIR}}': '.',
          '{{TEMPLATES_DIR}}': 'templates',
          '{{STATIC_DIR}}': 'static',
          '{{TESTS_DIR}}': 'tests',
          
          '{{FILE_EXTENSION}}': '.py',
          '{{TEMPLATE_EXTENSION}}': '.html',
          '{{CONFIG_EXTENSION}}': '.py',
          
          '{{DEPLOYMENT_TARGET}}': 'AWS EC2',
          '{{CI_CD_PLATFORM}}': 'GitHub Actions',
          '{{CONTAINER_PLATFORM}}': 'Docker',
          
          '{{TEST_COVERAGE_MIN}}': '90',
          '{{CRITICAL_COVERAGE}}': '95'
        },
        agentSpecializations: {
          'backend-development-agent': 'Django 4+, Python best practices, Django ORM',
          'database-agent': 'PostgreSQL, Django migrations, database optimization',
          'testing-agent': 'pytest, Django TestCase, factory_boy',
          'frontend-development-agent': 'Django templates, HTMX, CSS frameworks'
        }
      },

      'python-fastapi-async': {
        name: 'Python + FastAPI + Async',
        description: 'High-performance async API with FastAPI and modern Python',
        category: 'python-api',
        popularity: 'high',
        match: (techStack) => 
          techStack.languages.includes('Python') && 
          techStack.frameworks.backend === 'FastAPI',
        variables: {
          '{{LANGUAGE_PRIMARY}}': 'Python',
          '{{BACKEND_FRAMEWORK}}': 'FastAPI',
          '{{ASYNC_SUPPORT}}': 'Full async/await',
          '{{API_DOCS}}': 'Automatic OpenAPI/Swagger',
          '{{TESTING_FRAMEWORK}}': 'pytest',
          '{{DATABASE_TYPE}}': 'PostgreSQL',
          '{{ORM_TOOL}}': 'SQLAlchemy + Alembic',
          '{{FILE_EXTENSION}}': '.py',
          '{{DEPLOYMENT_TARGET}}': 'AWS Lambda'
        }
      },

      // Java Stacks
      'java-spring-boot': {
        name: 'Java + Spring Boot',
        description: 'Enterprise Java application with Spring Boot framework',
        category: 'java-enterprise',
        popularity: 'high',
        match: (techStack) => 
          techStack.languages.includes('Java') && 
          techStack.frameworks.backend?.includes('Spring'),
        variables: {
          '{{LANGUAGE_PRIMARY}}': 'Java',
          '{{LANGUAGE_VERSION}}': '17+',
          '{{BACKEND_FRAMEWORK}}': 'Spring Boot',
          '{{FRAMEWORK_VERSION}}': '3+',
          '{{BUILD_TOOL}}': 'Maven',
          '{{TESTING_FRAMEWORK}}': 'JUnit',
          '{{TESTING_VERSION}}': '5+',
          '{{DATABASE_TYPE}}': 'PostgreSQL',
          '{{ORM_TOOL}}': 'Spring Data JPA',
          
          '{{PROJECT_TYPE}}': 'maven-spring-boot',
          '{{BACKEND_DIR}}': 'src/main/java',
          '{{RESOURCES_DIR}}': 'src/main/resources',
          '{{TESTS_DIR}}': 'src/test/java',
          
          '{{FILE_EXTENSION}}': '.java',
          '{{CONFIG_EXTENSION}}': '.properties',
          
          '{{DEPLOYMENT_TARGET}}': 'AWS ECS',
          '{{CONTAINER_PLATFORM}}': 'Docker',
          
          '{{TEST_COVERAGE_MIN}}': '80',
          '{{CRITICAL_COVERAGE}}': '90'
        }
      },

      // Node.js API Stacks
      'node-express-mongo': {
        name: 'Node.js + Express + MongoDB',
        description: 'RESTful API with Express and MongoDB database',
        category: 'nodejs-api',
        popularity: 'medium',
        match: (techStack) => 
          techStack.languages.includes('JavaScript') && 
          techStack.frameworks.backend === 'Express',
        variables: {
          '{{LANGUAGE_PRIMARY}}': 'JavaScript',
          '{{BACKEND_FRAMEWORK}}': 'Express',
          '{{DATABASE_TYPE}}': 'MongoDB',
          '{{ORM_TOOL}}': 'Mongoose',
          '{{TESTING_FRAMEWORK}}': 'Jest',
          '{{API_STYLE}}': 'RESTful',
          '{{FILE_EXTENSION}}': '.js',
          '{{DEPLOYMENT_TARGET}}': 'Railway'
        }
      },

      // Go Stacks
      'go-gin-postgres': {
        name: 'Go + Gin + PostgreSQL',
        description: 'High-performance API with Go and Gin framework',
        category: 'go-api',
        popularity: 'medium',
        match: (techStack) => 
          techStack.languages.includes('Go'),
        variables: {
          '{{LANGUAGE_PRIMARY}}': 'Go',
          '{{BACKEND_FRAMEWORK}}': 'Gin',
          '{{DATABASE_TYPE}}': 'PostgreSQL',
          '{{TESTING_FRAMEWORK}}': 'Go testing',
          '{{FILE_EXTENSION}}': '.go',
          '{{DEPLOYMENT_TARGET}}': 'Google Cloud Run'
        }
      },

      // Rust Stacks
      'rust-axum-sqlx': {
        name: 'Rust + Axum + SQLx',
        description: 'Ultra-fast API with Rust and modern async frameworks',
        category: 'rust-api',
        popularity: 'low',
        match: (techStack) => 
          techStack.languages.includes('Rust'),
        variables: {
          '{{LANGUAGE_PRIMARY}}': 'Rust',
          '{{BACKEND_FRAMEWORK}}': 'Axum',
          '{{DATABASE_TYPE}}': 'PostgreSQL',
          '{{ORM_TOOL}}': 'SQLx',
          '{{BUILD_TOOL}}': 'Cargo',
          '{{TESTING_FRAMEWORK}}': 'Rust test',
          '{{FILE_EXTENSION}}': '.rs',
          '{{DEPLOYMENT_TARGET}}': 'Fly.io'
        }
      }
    };
  }

  /**
   * Find matching stack profile for given tech stack
   * @param {Object} techStack - Technology stack information
   * @returns {Object|null} Matched profile or null
   */
  findMatchingProfile(techStack) {
    // Try custom profiles first
    for (const [key, profile] of this.customProfiles) {
      if (profile.match && profile.match(techStack)) {
        return { key, ...profile, source: 'custom' };
      }
    }

    // Try predefined profiles
    for (const [key, profile] of Object.entries(this.profiles)) {
      try {
        if (profile.match(techStack)) {
          return { key, ...profile, source: 'predefined' };
        }
      } catch (error) {
        console.warn(`Profile match error for ${key}:`, error.message);
      }
    }

    return null;
  }

  /**
   * Get a specific profile by key
   * @param {string} key - Profile key
   * @returns {Object|null} Profile or null if not found
   */
  getProfile(key) {
    // Check predefined profiles first
    if (this.profiles[key]) {
      return {
        key,
        ...this.profiles[key],
        source: 'predefined'
      };
    }
    
    // Check custom profiles
    if (this.customProfiles.has(key)) {
      return {
        key,
        ...this.customProfiles.get(key),
        source: 'custom'
      };
    }
    
    return null;
  }

  /**
   * Get all available profiles
   * @param {Object} filters - Filter criteria
   * @returns {Array} Available profiles
   */
  getAvailableProfiles(filters = {}) {
    const allProfiles = [
      ...Object.entries(this.profiles).map(([key, profile]) => ({ 
        key, 
        ...profile, 
        source: 'predefined' 
      })),
      ...Array.from(this.customProfiles.entries()).map(([key, profile]) => ({ 
        key, 
        ...profile, 
        source: 'custom' 
      }))
    ];

    // Apply filters
    let filtered = allProfiles;

    if (filters.category) {
      filtered = filtered.filter(profile => profile.category === filters.category);
    }

    if (filters.popularity) {
      filtered = filtered.filter(profile => profile.popularity === filters.popularity);
    }

    if (filters.language) {
      filtered = filtered.filter(profile => 
        profile.variables['{{LANGUAGE_PRIMARY}}'] === filters.language
      );
    }

    return filtered.sort((a, b) => {
      // Sort by popularity (high -> medium -> low), then name
      const popularityOrder = { high: 0, medium: 1, low: 2 };
      const popularityDiff = (popularityOrder[a.popularity] || 3) - (popularityOrder[b.popularity] || 3);
      return popularityDiff !== 0 ? popularityDiff : a.name.localeCompare(b.name);
    });
  }

  /**
   * Create a custom stack profile
   * @param {string} key - Profile identifier
   * @param {Object} profile - Profile configuration
   */
  addCustomProfile(key, profile) {
    if (!this.config.enableCustomProfiles) {
      throw new Error('Custom profiles are disabled');
    }

    // Validate profile structure
    this.validateProfileStructure(profile);

    this.customProfiles.set(key, {
      ...profile,
      source: 'custom',
      createdAt: new Date().toISOString()
    });
  }

  /**
   * Update existing profile
   * @param {string} key - Profile key
   * @param {Object} updates - Profile updates
   */
  updateProfile(key, updates) {
    if (this.customProfiles.has(key)) {
      const existing = this.customProfiles.get(key);
      this.customProfiles.set(key, {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } else if (this.profiles[key]) {
      // Create custom override of predefined profile
      this.addCustomProfile(`${key}-custom`, {
        ...this.profiles[key],
        ...updates
      });
    } else {
      throw new Error(`Profile ${key} not found`);
    }
  }

  /**
   * Get profile recommendations for a tech stack
   * @param {Object} techStack - Technology stack
   * @returns {Array} Recommended profiles
   */
  getRecommendations(techStack) {
    const recommendations = [];
    
    // Find exact matches
    const exactMatch = this.findMatchingProfile(techStack);
    if (exactMatch) {
      recommendations.push({
        ...exactMatch,
        matchType: 'exact',
        confidence: 'high'
      });
    }

    // Find partial matches
    const partialMatches = this.findPartialMatches(techStack);
    recommendations.push(...partialMatches);

    // Suggest popular alternatives
    if (recommendations.length === 0) {
      const popular = this.getAvailableProfiles({ popularity: 'high' }).slice(0, 3);
      recommendations.push(...popular.map(profile => ({
        ...profile,
        matchType: 'suggested',
        confidence: 'low'
      })));
    }

    return recommendations;
  }

  /**
   * Find partial matches for tech stack
   * @param {Object} techStack - Technology stack
   * @returns {Array} Partial matches
   */
  findPartialMatches(techStack) {
    const matches = [];

    for (const [key, profile] of Object.entries(this.profiles)) {
      const score = this.calculateMatchScore(techStack, profile);
      if (score > 0.3 && score < 1.0) { // Partial match threshold
        matches.push({
          key,
          ...profile,
          matchType: 'partial',
          confidence: score > 0.7 ? 'medium' : 'low',
          matchScore: score
        });
      }
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calculate match score between tech stack and profile
   * @param {Object} techStack - Technology stack
   * @param {Object} profile - Stack profile
   * @returns {number} Match score (0-1)
   */
  calculateMatchScore(techStack, profile) {
    let score = 0;
    let checks = 0;

    // Check language match
    const profileLanguage = profile.variables['{{LANGUAGE_PRIMARY}}'];
    if (profileLanguage && techStack.languages.includes(profileLanguage)) {
      score += 0.4;
    }
    checks++;

    // Check frontend framework match
    const profileFrontend = profile.variables['{{FRONTEND_FRAMEWORK}}'];
    if (profileFrontend && techStack.frameworks.frontend === profileFrontend) {
      score += 0.3;
    }
    checks++;

    // Check backend framework match
    const profileBackend = profile.variables['{{BACKEND_FRAMEWORK}}'];
    if (profileBackend && techStack.frameworks.backend === profileBackend) {
      score += 0.3;
    }
    checks++;

    return checks > 0 ? score / checks : 0;
  }

  /**
   * Generate variables for unknown/custom stack
   * @param {Object} techStack - Technology stack
   * @returns {Object} Generated variables
   */
  generateCustomVariables(techStack) {
    const variables = {
      // Core tech stack
      '{{LANGUAGE_PRIMARY}}': techStack.languages[0] || 'JavaScript',
      '{{LANGUAGES_ALL}}': techStack.languages.join(', ') || 'JavaScript',
      '{{FRONTEND_FRAMEWORK}}': techStack.frameworks.frontend || 'React',
      '{{BACKEND_FRAMEWORK}}': techStack.frameworks.backend || 'Express',
      '{{DATABASE_TYPE}}': techStack.databases[0] || 'PostgreSQL',
      '{{TESTING_FRAMEWORK}}': techStack.frameworks.testing || 'Jest',
      
      // Defaults for unknown stack
      '{{PROJECT_TYPE}}': 'custom',
      '{{FRONTEND_DIR}}': 'src',
      '{{BACKEND_DIR}}': 'api',
      '{{FILE_EXTENSION}}': '.js',
      '{{DEPLOYMENT_TARGET}}': 'Custom',
      '{{CI_CD_PLATFORM}}': 'GitHub Actions',
      
      // Conservative quality standards
      '{{TEST_COVERAGE_MIN}}': '70',
      '{{CRITICAL_COVERAGE}}': '85',
      '{{COMPLEXITY_THRESHOLD}}': '12'
    };

    return variables;
  }

  /**
   * Validate profile structure
   * @param {Object} profile - Profile to validate
   * @throws {Error} If profile is invalid
   */
  validateProfileStructure(profile) {
    const required = ['name', 'description', 'variables'];
    
    for (const field of required) {
      if (!profile[field]) {
        throw new Error(`Profile missing required field: ${field}`);
      }
    }

    if (typeof profile.variables !== 'object') {
      throw new Error('Profile variables must be an object');
    }

    if (profile.match && typeof profile.match !== 'function') {
      throw new Error('Profile match must be a function');
    }
  }

  /**
   * Export profile for sharing
   * @param {string} key - Profile key
   * @returns {Object} Exportable profile
   */
  exportProfile(key) {
    const profile = this.customProfiles.get(key) || this.profiles[key];
    if (!profile) {
      throw new Error(`Profile ${key} not found`);
    }

    return {
      key,
      ...profile,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import profile from external source
   * @param {Object} profileData - Profile data
   * @param {Object} options - Import options
   */
  importProfile(profileData, options = {}) {
    const { key, ...profile } = profileData;
    
    if (!key) {
      throw new Error('Profile data missing key');
    }

    this.validateProfileStructure(profile);

    if (options.allowOverwrite || !this.customProfiles.has(key)) {
      this.addCustomProfile(key, {
        ...profile,
        importedAt: new Date().toISOString()
      });
    } else {
      throw new Error(`Profile ${key} already exists. Use allowOverwrite option.`);
    }
  }

  /**
   * Get profile statistics
   * @returns {Object} Usage statistics
   */
  getStatistics() {
    const allProfiles = this.getAvailableProfiles();
    
    return {
      totalProfiles: allProfiles.length,
      predefined: Object.keys(this.profiles).length,
      custom: this.customProfiles.size,
      categories: this.getCategoryStats(allProfiles),
      popularityDistribution: this.getPopularityStats(allProfiles),
      languageDistribution: this.getLanguageStats(allProfiles)
    };
  }

  getCategoryStats(profiles) {
    const categories = {};
    profiles.forEach(profile => {
      categories[profile.category] = (categories[profile.category] || 0) + 1;
    });
    return categories;
  }

  getPopularityStats(profiles) {
    const popularity = {};
    profiles.forEach(profile => {
      popularity[profile.popularity] = (popularity[profile.popularity] || 0) + 1;
    });
    return popularity;
  }

  getLanguageStats(profiles) {
    const languages = {};
    profiles.forEach(profile => {
      const lang = profile.variables['{{LANGUAGE_PRIMARY}}'];
      if (lang) {
        languages[lang] = (languages[lang] || 0) + 1;
      }
    });
    return languages;
  }

  /**
   * Set the current active stack profile
   * @param {Object} profile - Stack profile object to set
   */
  setProfile(profile) {
    if (profile && typeof profile === 'object') {
      this.currentProfile = profile;
    }
  }

  /**
   * Get the currently active stack profile
   * @returns {Object|null} Current stack profile
   */
  getCurrentProfile() {
    return this.currentProfile || null;
  }
}

module.exports = { StackProfileManager };