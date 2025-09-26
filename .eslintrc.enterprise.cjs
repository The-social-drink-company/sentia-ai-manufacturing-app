module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:security/recommended',
    'plugin:import/recommended',
    'plugin:jsx-a11y/recommended'
  ],
  ignorePatterns: [
    'dist',
    '.eslintrc.cjs',
    '.eslintrc.enterprise.cjs',
    'node_modules',
    'build',
    '*.min.js',
    'coverage',
    'public',
    '*.config.js',
    '*.config.cjs'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    react: {
      version: '18.2'
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    }
  },
  plugins: [
    'react-refresh',
    'security',
    'import',
    'jsx-a11y'
  ],
  rules: {
    // React Rules
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true }
    ],
    'react/prop-types': 'off',
    'react/jsx-no-target-blank': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Import Rules
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

    // Security Rules
    'security/detect-unsafe-regex': 'warn',
    'security/detect-non-literal-fs-filename': 'off',
    'security/detect-object-injection': 'warn',
    'security/detect-possible-timing-attacks': 'warn',

    // General Rules
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': 'error',
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-template': 'warn',
    'object-shorthand': 'warn',
    'array-callback-return': 'error',
    'consistent-return': 'warn',
    'default-case': 'warn',
    'dot-notation': 'warn',
    'eqeqeq': ['error', 'always', { null: 'ignore' }],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-param-reassign': ['warn', { props: false }],
    'no-return-await': 'warn',
    'no-script-url': 'error',
    'no-self-compare': 'error',
    'no-throw-literal': 'error',
    'no-useless-concat': 'warn',
    'prefer-promise-reject-errors': 'error',
    'radix': 'error',
    'require-await': 'warn'
  }
}