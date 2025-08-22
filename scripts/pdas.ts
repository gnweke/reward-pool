// PDA derivation helpers matching the on-chain program seeds

import { PublicKey } from "@solana/web3.js";
import { REWARD_POOL_PROGRAM_ID } from "./env";

// Pool signer PDA is derived from the pool account's public key
export function poolSignerPda(pool: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [pool.toBuffer()],
    REWARD_POOL_PROGRAM_ID
  );
}

// User PDA derives from [owner, pool]
export function userPda(
  owner: PublicKey,
  pool: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), pool.toBuffer()],
    REWARD_POOL_PROGRAM_ID
  );
}

