// Environment configuration helpers for local testing
// Loads .env and exposes key constants used across scripts

import { config } from "dotenv";
import { Keypair, PublicKey } from "@solana/web3.js";
import fs from "fs";
import * as os from "os";

config();

// RPC endpoint for the local validator
export const RPC_URL: string =
  process.env.RPC_URL ?? "http://127.0.0.1:8899";

// Path to the payer keypair used for all transactions
export const KEYPAIR_PATH: string =
  process.env.KEYPAIR_PATH ?? `${os.homedir()}/.config/solana/id.json`;

// Program IDs used throughout the smoke tests
export const REWARD_POOL_PROGRAM_ID = new PublicKey(
  "SRwd1XTVscKXu9nMU8f6MfEf9cAzGPmbMe69CFmHvAH"
);

export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

// Utility to load a keypair from the filesystem
export function loadKeypair(path: string): Keypair {
  const secret = JSON.parse(fs.readFileSync(path, "utf8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

