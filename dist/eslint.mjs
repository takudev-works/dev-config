import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
export default defineConfig(globalIgnores([
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
    '**/.pytest_cache/**',
    '**/.mypy_cache/**',
    '**/.ruff_cache/**',
    '**/.expo/**',
    '**/.next/**',
    '**/.turbo/**',
    '**/.ruby-lsp/**',
    '**/.terraform/**',
    '**/.vercel/**',
    '**/.git/**'
]), js.configs.recommended, tseslint.configs.recommended, prettier);
