// Connection and Anchor provider setup

import * as anchor from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import { RPC_URL, KEYPAIR_PATH, loadKeypair } from "./env";

// Create the RPC connection
export const connection = new Connection(RPC_URL, "confirmed");

// Load payer keypair and construct wallet + provider
const payer = loadKeypair(KEYPAIR_PATH);
export const wallet = new anchor.Wallet(payer);
export const provider = new anchor.AnchorProvider(
  connection,
  wallet,
  { commitment: "confirmed" }
);

anchor.setProvider(provider);

