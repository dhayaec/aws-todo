// Simple ESLint config for CI/CD (ESLint 9.x)
// Avoid circular structure to JSON errors by using flat config directly

module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  files: ['**/*.{js,jsx,ts,tsx}'],
  ignorePatterns: ['node_modules/*', 'dist/*', 'build/*', '.next/*'],
  plugins: [
    'import',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_' }
    ],
    '@typescript-eslint/explicit-function-return-type': 'warn',

    // General rules
    'no-console': 'off',
    'no-unused-vars': 'off', // Handled by @typescript-eslint
    'no-div-regex': 'off',

    // Import rules
    'import/no-unresolved': 'error',
    'import/extensions': [
      'error',
      'ignorePackages',
    ],
    'import/order': [
      'error',
      'within-group',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
      },
    ],

    // Next.js specific
    'no-alert': 'off',
  },
  globals: {
    console: 'readonly',
    process: 'readonly',
    Buffer: 'readonly',
  },
};