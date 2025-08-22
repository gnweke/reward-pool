# Reward Pool Smoke Test

This directory contains a TypeScript script that exercises the Reward Pool
program end‑to‑end against a local Solana validator.

## Prerequisites

1. Start a local validator and fund your default keypair:

```bash
solana-test-validator -r --quiet &
sleep 5
solana airdrop 2
```

2. Install dependencies and compile TypeScript on the fly with `ts-node`:

```bash
pnpm install
```

## Running

```bash
RPC_URL=http://127.0.0.1:8899 \
KEYPAIR_PATH=~/.config/solana/id.json \
pnpm ts-node scripts/reward_pool_smoke.ts
```

Environment variables:

- `RPC_URL` – RPC endpoint (defaults to `http://127.0.0.1:8899`).
- `KEYPAIR_PATH` – path to the keypair file (defaults to
  `~/.config/solana/id.json`).

The script prints every created account and logs each instruction signature.
Successful execution ends with `Smoke test succeeded`.

