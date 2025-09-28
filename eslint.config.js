import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

const sharedRules = {
  ...js.configs.recommended.rules,
  'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }]
}

export default [
  {
    ignores: [
      'dist/**',
      'build/**',
      'coverage/**',
      'public/**',
      'node_modules/**',
      'spec-kit/**',
      'agents/**',
      'src/features/**',
      'src/components/ui/*.test.*',
      'tests/**',
      'scripts/**',
      'api/**',
      'prisma/**',
      'routes/**',
      'security/**',
      'services/**',
      'sentia-financial-lakehouse/**',
      'enterprise-server.js',
      'railway-simple.js',
      'FORCE-MEMORY-FIX.js',
      'prisma-wrapper.js',
      '.eslintrc.enterprise.cjs'
    ]
  },
  {
    files: [
      'src/components/**/*.{js,jsx,ts,tsx}',
      'src/hooks/**/*.{js,jsx,ts,tsx}',
      'src/pages/**/*.{js,jsx,ts,tsx}',
      'src/stores/**/*.{js,jsx,ts,tsx}',
      'src/utils/**/*.{js,jsx,ts,tsx}'
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...sharedRules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ]
    }
  },
  {
    files: ['server/**/*.{js,jsx,ts,tsx}', 'vite.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    rules: {
      ...sharedRules
    }
  }
]

