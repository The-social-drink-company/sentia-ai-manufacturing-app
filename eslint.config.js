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
      'no-unused-vars': 'error',
      'no-undef': 'error',
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-unsafe-regex': 'error'
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly'
      }
    }
  }
]