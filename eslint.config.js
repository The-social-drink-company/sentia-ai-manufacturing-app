import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

<<<<<<< HEAD
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
  'no-unused-vars': ['error', {
    varsIgnorePattern: '^[A-Z_]',
    argsIgnorePattern: '^_',
    ignoreRestSiblings: true
  }],
  'react-refresh/only-export-components': [
    'warn',
    { allowConstantExport: true }
  ],
  // Additional rules for code quality
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'prefer-const': 'error',
  'no-var': 'error',
  'eqeqeq': ['error', 'always'],
  'curly': ['error', 'multi-line'],
  'no-duplicate-imports': 'error'
}

=======
>>>>>>> development
export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
<<<<<<< HEAD
      ...commonLanguageOptions,
      globals: {
        ...globals.browser,
        ...globals.es2021,
        // Additional globals for React ecosystem
        React: 'readonly',
        JSX: 'readonly',
        // Vite globals
        import: 'readonly',
        // Testing globals
        expect: 'readonly',
        test: 'readonly',
        describe: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        vitest: 'readonly'
      }
=======
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
>>>>>>> development
    },
  },
]

