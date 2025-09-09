import js from '@eslint/js'
import security from 'eslint-plugin-security'

export default [
  js.configs.recommended,
  {
    plugins: {
      security
    },
    rules: {
      ...security.configs.recommended.rules,
      'no-console': 'warn',
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_|req|res|next|error|err' }],
      'no-undef': 'error',
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-eval-with-expression': 'error',
      'security/detect-unsafe-regex': 'warn'
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly'
      }
    }
  },
  // Server environment specific
  {
    files: ['*.js', '**/*.js'],
    rules: {
      'no-console': 'off' // Allow console logs in MCP server
    }
  }
]