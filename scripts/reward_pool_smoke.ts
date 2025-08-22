// End-to-end smoke test exercising the reward-pool program on localnet

import { BN, AnchorError } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { connection, wallet } from "./connection";
import { getRewardPoolProgram } from "./idl";
import {
  createMint,
  getOrCreateAta,
  mintTo,
} from "./spl";
import { poolSignerPda, userPda } from "./pdas";
import {
  expectEq,
  expectGte,
  expectPubkeyEq,
} from "./asserts";
import { TOKEN_PROGRAM_ID } from "./env";

async function main() {
  const program = getRewardPoolProgram();
  const authority = wallet.payer; // wallet used for all txs

  // Ensure we have some SOL for fees
  const balance = await connection.getBalance(authority.publicKey);
  if (balance < 2n * 1_000_000_000n) {
    const sig = await connection.requestAirdrop(
      authority.publicKey,
      2n * 1_000_000_000n
    );
    await connection.confirmTransaction(sig, "confirmed");
  }

  // ----- Mint setup -----
  const stakingMint = await createMint(authority);
  const rewardAMint = await createMint(authority);
  const rewardBMint = await createMint(authority);
  const xMint = await createMint(authority);

  // Derive pool signer PDA
  const pool = Keypair.generate();
  const [poolSigner, poolBump] = poolSignerPda(pool.publicKey);

  // Create vaults owned by the pool signer PDA
  const stakingVault = await getOrCreateAta(stakingMint, poolSigner);
  const rewardAVault = await getOrCreateAta(rewardAMint, poolSigner);
  const rewardBVault = await getOrCreateAta(rewardBMint, poolSigner);
  let xTokenPoolVault = await getOrCreateAta(xMint, poolSigner);

  // User accounts (owner = authority)
  const stakeFromAccount = await getOrCreateAta(
    stakingMint,
    authority.publicKey
  );
  const rewardAAccount = await getOrCreateAta(rewardAMint, authority.publicKey);
  const rewardBAccount = await getOrCreateAta(rewardBMint, authority.publicKey);
  const xTokenDepositor = await getOrCreateAta(xMint, authority.publicKey);
  const xTokenReceiver = xTokenDepositor;

  // Mint tokens to the user's accounts for staking and funding
  await mintTo(stakingMint, stakeFromAccount, 1_000_000_000); // 1,000 tokens
  await mintTo(rewardAMint, rewardAAccount, 1_000_000_000);
  await mintTo(rewardBMint, rewardBAccount, 1_000_000_000);
  await mintTo(xMint, xTokenDepositor, 1_000_000);

  // ----- initialize_pool -----
  const rewardDuration = new BN(60); // 60 seconds
  await program.methods
    .initializePool(poolBump, rewardDuration)
    .accounts({
      authority: authority.publicKey,
      xTokenPoolVault: xTokenPoolVault,
      xTokenDepositor: xTokenDepositor,
      xTokenDepositAuthority: authority.publicKey,
      stakingMint,
      stakingVault,
      rewardAMint,
      rewardAVault,
      rewardBMint,
      rewardBVault,
      poolSigner,
      pool: pool.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([pool])
    .rpc();
  console.log("initialize_pool completed");

  // ----- create_user -----
  const [user, userBump] = userPda(authority.publicKey, pool.publicKey);
  await program.methods
    .createUser(userBump)
    .accounts({
      pool: pool.publicKey,
      user,
      owner: authority.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log("create_user completed");

  // ----- stake -----
  const stakeAmount = new BN(100_000_000); // 100 tokens
  await program.methods
    .stake(stakeAmount)
    .accounts({
      pool: pool.publicKey,
      stakingVault,
      user,
      owner: authority.publicKey,
      stakeFromAccount,
      poolSigner,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  let userAccount = await program.account.user.fetch(user);
  expectEq(
    Number(userAccount.balanceStaked),
    stakeAmount.toNumber(),
    "user stake balance"
  );
  console.log("stake completed");

  // ----- fund -----
  const fundAmountA = new BN(50_000_000);
  const fundAmountB = new BN(30_000_000);
  await program.methods
    .fund(fundAmountA, fundAmountB)
    .accounts({
      pool: pool.publicKey,
      stakingVault,
      rewardAVault,
      rewardBVault,
      funder: authority.publicKey,
      fromA: rewardAAccount,
      fromB: rewardBAccount,
      poolSigner,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  console.log("fund completed");

  // Wait a bit so rewards accrue
  await new Promise((r) => setTimeout(r, 1000));

  // ----- claim -----
  const balBeforeA = Number(
    (await connection.getTokenAccountBalance(rewardAAccount)).value.amount
  );
  await program.methods
    .claim()
    .accounts({
      pool: pool.publicKey,
      stakingVault,
      rewardAVault,
      rewardBVault,
      user,
      owner: authority.publicKey,
      rewardAAccount,
      rewardBAccount,
      poolSigner,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  const balAfterA = Number(
    (await connection.getTokenAccountBalance(rewardAAccount)).value.amount
  );
  expectGte(balAfterA, balBeforeA, "reward A balance should not decrease");
  console.log("claim completed");

  // ----- unstake -----
  await program.methods
    .unstake(stakeAmount)
    .accounts({
      pool: pool.publicKey,
      stakingVault,
      user,
      owner: authority.publicKey,
      stakeFromAccount,
      poolSigner,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  userAccount = await program.account.user.fetch(user);
  expectEq(Number(userAccount.balanceStaked), 0, "unstake should zero balance");
  console.log("unstake completed");

  // ----- pause -----
  await program.methods
    .pause()
    .accounts({
      xTokenPoolVault: xTokenPoolVault,
      xTokenReceiver: xTokenReceiver,
      pool: pool.publicKey,
      authority: authority.publicKey,
      poolSigner,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  console.log("pause completed");

  // Recreate x token vault for unpause
  xTokenPoolVault = await getOrCreateAta(xMint, poolSigner);

  // ----- unpause -----
  await program.methods
    .unpause()
    .accounts({
      xTokenPoolVault: xTokenPoolVault,
      xTokenDepositor: xTokenDepositor,
      xTokenDepositAuthority: authority.publicKey,
      pool: pool.publicKey,
      authority: authority.publicKey,
      poolSigner,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  console.log("unpause completed");

  // ----- close_user -----
  await program.methods
    .closeUser()
    .accounts({
      pool: pool.publicKey,
      user,
      owner: authority.publicKey,
    })
    .rpc();
  console.log("close_user completed");

  // ----- close_pool -----
  await program.methods
    .closePool()
    .accounts({
      refundee: authority.publicKey,
      stakingRefundee: stakeFromAccount,
      rewardARefundee: rewardAAccount,
      rewardBRefundee: rewardBAccount,
      pool: pool.publicKey,
      authority: authority.publicKey,
      stakingVault,
      rewardAVault,
      rewardBVault,
      poolSigner,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  console.log("close_pool completed");

  console.log("Smoke test succeeded");
  console.log("Pool:", pool.publicKey.toBase58());
  console.log("User:", user.toBase58());
  console.log("Pool signer:", poolSigner.toBase58());
}

main().catch((err) => {
  if (err instanceof AnchorError) {
    console.error("Anchor error:", err.error.errorCode.code);
  }
  console.error(err);
});

