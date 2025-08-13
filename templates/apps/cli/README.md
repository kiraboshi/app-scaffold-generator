# CLI

Simple CLI to interact with the server's tRPC API.

Examples:

```bash
pnpm --filter @__SCOPE__/cli cli list
pnpm --filter @__SCOPE__/cli cli create "My chat" "Hello"
pnpm --filter @__SCOPE__/cli cli get <id>
pnpm --filter @__SCOPE__/cli cli send <id> "How are you?"
pnpm --filter @__SCOPE__/cli cli delete <id>
```

By default, it calls `APP_URL` (or `http://localhost:5173`) at `/trpc`. Override with `--url` to point directly to the server if needed.


