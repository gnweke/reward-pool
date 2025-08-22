import * as anchor from "@coral-xyz/anchor";
import { readFileSync } from "fs";

const idl = JSON.parse(
  readFileSync(new URL("../app/idl/reward_pool.json", import.meta.url).toString(), "utf8"),
);

const PROGRAM_ID = new anchor.web3.PublicKey("5HfySyCkk6ApUJs658yAdtQBotQxNE3MxsA2MeLd4j5v");

async function main() {
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = new anchor.Program(idl as anchor.Idl, PROGRAM_ID, provider);

  // add minimal flow here
  // This script is a placeholder for local testing; complete with real mint/ATA setup as needed.
  console.log("Loaded program", program.programId.toBase58());
}

main().catch((err) => {
  console.error(err);
});
