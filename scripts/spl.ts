// Convenience wrappers around @solana/spl-token operations

import { Keypair, PublicKey } from "@solana/web3.js";
import {
  createMint as splCreateMint,
  getOrCreateAssociatedTokenAccount,
  mintTo as splMintTo,
  transfer as splTransfer,
} from "@solana/spl-token";
import { connection, wallet } from "./connection";
import { TOKEN_PROGRAM_ID } from "./env";

// Creates a new mint with `payer` as both mint and freeze authority
export async function createMint(payer: Keypair, decimals = 6): Promise<PublicKey> {
  return splCreateMint(
    connection,
    payer,
    payer.publicKey,
    payer.publicKey,
    decimals,
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );
}

// Fetches or creates the associated token account for `owner`
export async function getOrCreateAta(
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> {
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet.payer,
    mint,
    owner,
    true,
    "confirmed",
    undefined,
    TOKEN_PROGRAM_ID
  );
  return ata.address;
}

// Mints tokens to the given destination account
export async function mintTo(
  mint: PublicKey,
  destination: PublicKey,
  amount: number | bigint
): Promise<void> {
  await splMintTo(
    connection,
    wallet.payer,
    mint,
    destination,
    wallet.payer,
    BigInt(amount),
    [],
    { commitment: "confirmed" },
    TOKEN_PROGRAM_ID
  );
}

// Transfers tokens between two token accounts
export async function transferTokens(
  source: PublicKey,
  destination: PublicKey,
  amount: number | bigint,
  owner: Keypair = wallet.payer
): Promise<void> {
  await splTransfer(
    connection,
    owner,
    source,
    destination,
    owner,
    BigInt(amount),
    [],
    { commitment: "confirmed" },
    TOKEN_PROGRAM_ID
  );
}

