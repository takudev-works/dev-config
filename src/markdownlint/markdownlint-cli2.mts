type Options = {
  config: Record<string, boolean | Record<string, unknown>>;
  ignores: string[];
};

const options: Options = {
  config: {
    default: true,
    MD003: { style: 'atx' },
    MD013: false,
    MD024: { siblings_only: true },
    MD028: false,
    MD031: false,
    MD033: false,
    MD034: false,
    MD036: false,
    MD040: false,
    MD041: false,
    MD056: false,
    MD060: false
  },
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
  ]
};

export default options;
