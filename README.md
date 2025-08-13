# Monorepo Scaffold Generator

CLI to bootstrap a ready-to-run client-server monorepo with shared contracts, tests, migrations, memory/DB stores, and OpenRouter LLM integration.

Usage:

```bash
pnpm --filter @scaffold/generator dev my-new-app --dir .. --pm pnpm --install --git
```

Options:

- `projectName` positional: directory and root package name
- `--dir <path>`: parent directory to create the project in
- `--pm <pnpm|npm|yarn>`: package manager for installation
- `--install`: run installation after generating
- `--git`: initialize a git repository

After generation:

- Copy `apps/server/.env.example` to `apps/server/.env` and fill values
- Run dev: `pnpm dev`


