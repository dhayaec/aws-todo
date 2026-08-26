import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-alert': 'off',
      'no-div-regex': 'off',
      'import/no-unresolved': 'off',
      'import/extensions': 'off',
      'import/order': 'off',
    },
  },
  {
    ignores: ['node_modules/*', 'dist/*', 'build/*', '.next/*', 'prisma/generated/*'],
  },
];