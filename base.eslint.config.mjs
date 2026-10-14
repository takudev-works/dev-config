import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.venv/**',
      '**/venv/**',
      '**/vendor/**',
      '**/dist/**',
      '**/build/**',
      '**/out/**',
      '**/.output/**',
      '**/coverage/**',
      '**/__pycache__/**',
      '**/.expo/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/.vercel/**',
      '**/.terraform/**'
    ]
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  prettier
);
