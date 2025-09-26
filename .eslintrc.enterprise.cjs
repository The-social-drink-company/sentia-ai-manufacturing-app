import js from '@eslint/js'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import security from 'eslint-plugin-security'
import eslintPluginImport from 'eslint-plugin-import'
import jsxA11y from 'eslint-plugin-jsx-a11y'

const projectFiles = ['src/**/*.js', 'src/**/*.jsx']

export default [
  {
    files: projectFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...js.configs.recommended.languageOptions.globals,
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        process: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly'
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      security,
      import: eslintPluginImport,
      'jsx-a11y': jsxA11y
    },
    settings: {
      react: {
        version: 'detect'
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx']
        }
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactPlugin.configs.flat.recommended.rules,
      ...reactPlugin.configs.flat['jsx-runtime'].rules,
      ...reactHooks.configs['recommended-latest'].rules,
      ...eslintPluginImport.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      ...security.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ],
      'react/prop-types': 'off',
      'react/jsx-no-target-blank': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',
      'import/no-cycle': 'warn',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index'
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          }
        }
      ],
      'security/detect-unsafe-regex': 'warn',
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-object-injection': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'no-debugger': 'error',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^[A-Z_]|^_',
          ignoreRestSiblings: true
        }
      ],
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'warn',
      'object-shorthand': 'warn',
      'array-callback-return': 'error',
      'consistent-return': 'warn',
      'default-case': 'warn',
      'dot-notation': 'warn',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-param-reassign': [
        'warn',
        { props: false }
      ],
      'no-return-await': 'warn',
      'no-script-url': 'error',
      'no-self-compare': 'error',
      'no-throw-literal': 'error',
      'no-useless-concat': 'warn',
      'prefer-promise-reject-errors': 'error',
      radix: 'error',
      'require-await': 'warn'
    }
  },
  // Test files configuration
  {
    files: ['**/*.test.js', '**/*.test.jsx', '**/*.spec.js', '**/*.spec.jsx'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        global: 'readonly',
        process: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'security/detect-object-injection': 'off',
      'react-hooks/exhaustive-deps': 'off'
    }
  },
  // Legacy files with relaxed rules
  {
    files: [
      'src/App-*.jsx',
      'src/LandingPage.jsx',
      'src/components/LandingPage.jsx',
      'src/components/DashboardLayout.jsx',
      'src/components/ExecutiveDashboard.jsx'
    ],
    rules: {
      'no-unused-vars': 'warn',
      'react-hooks/exhaustive-deps': 'warn'
    }
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'build/**',
      'coverage/**',
      'public/**',
      '*.config.js',
      '*.config.cjs',
      'tests/fixtures/**'
    ]
  }
]
