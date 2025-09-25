import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    ignores: [
      'dist',
      'dist/**',
      '**/dist/**',
      'build',
      'build/**',
      '**/build/**',
      'coverage/**',
      'node_modules/**',
      '*.min.js',
      '*.min.css',
      '.vite/**',
      'public/**',
      'database/**',
      'scripts/**',
      'agents/**',
      '*-agent.js',
      '*-agent.cjs',
      'agent-*.js',
      'agent-*.cjs',
      '*agent*.js',
      '*agent*.cjs',
      'services/monitoring/**',
      'services/observability/**',
      '**/monitoring/**',
      '**/*monitoring*.js',
      'tests/**',
      '**/*.test.{js,jsx}',
      '**/*.spec.{js,jsx}',
      '**/tests/**',
      'src/App-*.jsx',
      'src/*-backup*.jsx',
      'src/*-debug*.jsx',
      'src/*-Original*.jsx',
      'src/MinimalApp.jsx',
      'src/TestDashboard.jsx',
      'vite.config.js',
      'tailwind.config.js',
      'playwright.config.js',
      'vitest.config.js'
    ]
  },

  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.es2020
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module'
      }
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  },

  {
    files: [
      '*.js',
      'server/**/*.js',
      'api/**/*.js',
      'services/**/*.js',
      'database/**/*.js',
      'scripts/**/*.js',
      'agents/**/*.js',
      'mcp-server/**/*.js',
      'ai/**/*.js',
      'analytics/**/*.js',
      'config/**/*.js',
      'middleware/**/*.js',
      'utils/**/*.js'
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        ...globals.es2020,
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        global: 'readonly',
        console: 'readonly'
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      'no-console': 'off'
    }
  },

  {
    files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        test: 'readonly',
        vi: 'readonly'
      }
    },
    rules: {
      'no-console': 'off'
    }
  }
]