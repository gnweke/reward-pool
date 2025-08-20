import * as anchor from "@coral-xyz/anchor";
import {Program} from "@coral-xyz/anchor";
import {RewardPool} from "../target/types/reward_pool";
import {Keypair, PublicKey, SystemProgram} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import fs from "fs";

describe("reward pool flow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.RewardPool as Program<RewardPool>;
  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  it("initializes, stakes, funds, claims and unstakes", async () => {
    // fixed xSTEP mint for local tests
    const secret = JSON.parse(
      fs.readFileSync(
        "tests/keys/xstep-tEsTL8G8drugWztoCKrPpEAXV21qEajfHg4q45KYs6s.json",
        "utf8"
      )
    );
    const xMintKey = Keypair.fromSecretKey(new Uint8Array(secret));
    const xMint = await createMint(
      connection,
      wallet.payer,
      wallet.publicKey,
      null,
      9,
      xMintKey
    );

    const xDepositor = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      xMint,
      wallet.publicKey
    );
    await mintTo(
      connection,
      wallet.payer,
      xMint,
      xDepositor.address,
      wallet.publicKey,
      10_000_000_000_000n
    );

    const poolKey = Keypair.generate();
    const [poolSigner, bump] = await PublicKey.findProgramAddress(
      [poolKey.publicKey.toBuffer()],
      program.programId
    );

    const stakingMint = await createMint(
      connection,
      wallet.payer,
      wallet.publicKey,
      null,
      0
    );
    const rewardAMint = await createMint(
      connection,
      wallet.payer,
      wallet.publicKey,
      null,
      0
    );
    const rewardBMint = await createMint(
      connection,
      wallet.payer,
      wallet.publicKey,
      null,
      0
    );

    const xVault = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      xMint,
      poolSigner,
      true
    );
    const stakingVault = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      stakingMint,
      poolSigner,
      true
    );
    const rewardAVault = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      rewardAMint,
      poolSigner,
      true
    );
    const rewardBVault = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      rewardBMint,
      poolSigner,
      true
    );

    const userStaking = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      stakingMint,
      wallet.publicKey
    );
    const rewardAUser = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      rewardAMint,
      wallet.publicKey
    );
    const rewardBUser = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      rewardBMint,
      wallet.publicKey
    );

    await mintTo(
      connection,
      wallet.payer,
      stakingMint,
      userStaking.address,
      wallet.publicKey,
      100n
    );

    await program.methods
      .initializePool(bump, new anchor.BN(1))
      .accounts({
        authority: wallet.publicKey,
        xTokenPoolVault: xVault.address,
        xTokenDepositor: xDepositor.address,
        xTokenDepositAuthority: wallet.publicKey,
        stakingMint,
        stakingVault: stakingVault.address,
        rewardAMint,
        rewardAVault: rewardAVault.address,
        rewardBMint,
        rewardBVault: rewardBVault.address,
        poolSigner,
        pool: poolKey.publicKey,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .signers([poolKey])
      .rpc();

    const [userPda] = await PublicKey.findProgramAddress(
      [wallet.publicKey.toBuffer(), poolKey.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .createUser(new anchor.BN(0))
      .accounts({
        pool: poolKey.publicKey,
        user: userPda,
        owner: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await program.methods
      .stake(new anchor.BN(100))
      .accounts({
        pool: poolKey.publicKey,
        stakingVault: stakingVault.address,
        user: userPda,
        owner: wallet.publicKey,
        from: userStaking.address,
        poolSigner,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .rpc();

    const fromA = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      rewardAMint,
      wallet.publicKey
    );
    const fromB = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer,
      rewardBMint,
      wallet.publicKey
    );
    await mintTo(
      connection,
      wallet.payer,
      rewardAMint,
      fromA.address,
      wallet.publicKey,
      1000n
    );
    await mintTo(
      connection,
      wallet.payer,
      rewardBMint,
      fromB.address,
      wallet.publicKey,
      1000n
    );

    await program.methods
      .fund(new anchor.BN(1000), new anchor.BN(1000))
      .accounts({
        pool: poolKey.publicKey,
        stakingVault: stakingVault.address,
        rewardAVault: rewardAVault.address,
        rewardBVault: rewardBVault.address,
        funder: wallet.publicKey,
        fromA: fromA.address,
        fromB: fromB.address,
        poolSigner,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .rpc();

    await new Promise((r) => setTimeout(r, 1000));

    await program.methods
      .claim()
      .accounts({
        pool: poolKey.publicKey,
        stakingVault: stakingVault.address,
        rewardAVault: rewardAVault.address,
        rewardBVault: rewardBVault.address,
        user: userPda,
        owner: wallet.publicKey,
        rewardAAccount: rewardAUser.address,
        rewardBAccount: rewardBUser.address,
        poolSigner,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .rpc();

    await program.methods
      .unstake(new anchor.BN(100))
      .accounts({
        pool: poolKey.publicKey,
        stakingVault: stakingVault.address,
        user: userPda,
        owner: wallet.publicKey,
        from: userStaking.address,
        poolSigner,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .rpc();

    const rewardABalance = await connection.getTokenAccountBalance(
      rewardAUser.address
    );
    const rewardBBalance = await connection.getTokenAccountBalance(
      rewardBUser.address
    );
    const stakingBalance = await connection.getTokenAccountBalance(
      userStaking.address
    );

    if (parseInt(rewardABalance.value.amount) === 0) {
      throw new Error("no reward A claimed");
    }
    if (parseInt(rewardBBalance.value.amount) === 0) {
      throw new Error("no reward B claimed");
    }
    if (parseInt(stakingBalance.value.amount) !== 100) {
      throw new Error("unstake failed");
    }
  });
});
