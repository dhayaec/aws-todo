import { defineConfig } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  nextVitals,
  nextTs,
  { name: 'project/ignores',
    ignores: [
      // Default ignores of eslint-config-next:
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'coverage/**',
      'dist/**',
      'dist-tsc/**',
      'node_modules/.cache/**',
      'node_modules/.pnpm/**',
      // Ignore generated Prisma files
      'lib/generated/**',
      'prisma/generated/**',
    ],
  },
  { name: 'project/strict',
    plugins: {
      react: await import('eslint-plugin-react').then(m => m.default || m),
    },
    settings: {
      react: { version: '18.3' },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [ 'warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' } ],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' } ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      // React rules
      'react/no-array-index-key': 'warn',
      'react/jsx-no-useless-fragment': 'warn',
      'react/display-name': 'off',
      'react-hooks/set-state-in-effect': 'off',
      // General rules
      'no-console': [ 'warn', { allow: ['warn', 'error'] } ],
      'no-debugger': 'warn',
    }},
]);
export default eslintConfig;