import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import security from 'eslint-plugin-security'

const sharedRules = {
  ...js.configs.recommended.rules,
  ...react.configs.recommended.rules,
  ...reactHooks.configs.recommended.rules,
  ...security.configs.recommended.rules,
  'no-unused-vars': ['error', { argsIgnorePattern: '^_|next', varsIgnorePattern: '^_' }],
  'no-console': 'warn',
  'no-debugger': 'error',
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'prefer-const': 'error',
  'no-var': 'error',
  eqeqeq: ['error', 'always'],
  'no-throw-literal': 'error',
  'no-return-await': 'error',
  'require-await': 'warn',
  'react/react-in-jsx-scope': 'off',
  'react/prop-types': 'off',
  'react/jsx-no-target-blank': 'error'
}

export default [
  {
    ignores: [
      'dist/**',
      'build/**',
      '*.min.js',
      'node_modules/**',
      'coverage/**',
      '*.config.js',
      '*.config.cjs',
      '*.config.mjs',
      'public/**',
      'scripts/**',
      'tests/**',
      'mcp-server/**',
      'database/**',
      'monitoring/**',
      'agents/**',
      'FORCE-*.js',
      'verify-*.js',
      'deploy-*.js',
      'validate-*.js',
      'railway-*.js',
      'render-*.js',
      'auto-fix-*.js'
    ]
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node
      }
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      security
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...sharedRules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-object-injection': 'warn',
      'security/detect-unsafe-regex': 'warn'
    }
  },
  {
    files: ['server/**/*.{js,jsx}', 'server-*.js', 'server/**'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        VITE_FORCE_MOCK_AUTH: 'readonly'
      }
    }
  }
]
