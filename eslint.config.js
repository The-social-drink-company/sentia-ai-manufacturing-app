import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

const commonLanguageOptions = {
  ecmaVersion: 'latest',
  parserOptions: {
    ecmaVersion: 'latest',
    ecmaFeatures: { jsx: true },
    sourceType: 'module'
  }
}

const commonPlugins = {
  'react-hooks': reactHooks,
  'react-refresh': reactRefresh
}

const commonRules = {
  ...js.configs.recommended.rules,
  ...reactHooks.configs.recommended.rules,
  'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
  'react-refresh/only-export-components': [
    'warn',
    { allowConstantExport: true }
  ]
}

export default [
  { ignores: ['dist'] },
  {
    files: ['src/**/*.{js,jsx}', 'tests/**/*.{js,jsx}'],
    languageOptions: {
      ...commonLanguageOptions,
      globals: {
        ...globals.browser,
        ...globals.es2021
      }
    },
    plugins: commonPlugins,
    rules: commonRules
  },
  {
    files: [
      'server/**/*.{js,jsx}',
      'scripts/**/*.{js,jsx}',
      '*.config.js',
      '*.config.cjs',
      '*.config.mjs',
      'vite.config.js',
      'vite.config.mjs',
      'vitest.config.js',
      'vitest.config.mjs',
      'postcss.config.js',
      'tailwind.config.js',
      'eslint.config.js'
    ],
    languageOptions: {
      ...commonLanguageOptions,
      globals: {
        ...globals.node,
        ...globals.commonjs
      }
    },
    plugins: commonPlugins,
    rules: commonRules
  }
]
