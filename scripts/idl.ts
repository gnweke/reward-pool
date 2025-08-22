// Helper for loading the reward-pool program using its IDL

import { Program, Idl } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import RewardPoolIDL from "../target/idl/reward_pool.json";
import { provider } from "./connection";
import { REWARD_POOL_PROGRAM_ID } from "./env";

export function getRewardPoolProgram(): Program {
  return new Program(
    RewardPoolIDL as Idl,
    new PublicKey(REWARD_POOL_PROGRAM_ID),
    provider
  );
}

