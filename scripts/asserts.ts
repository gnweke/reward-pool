// Lightweight assertion helpers for readable diagnostics

import { PublicKey } from "@solana/web3.js";

export function expectEq<T>(actual: T, expected: T, msg?: string): void {
  if (actual !== expected) {
    throw new Error(
      `expectEq failed: ${actual} !== ${expected}${msg ? ` (${msg})` : ""}`
    );
  }
}

export function expectGte(
  actual: number | bigint,
  threshold: number | bigint,
  msg?: string
): void {
  if (BigInt(actual) < BigInt(threshold)) {
    throw new Error(
      `expectGte failed: ${actual} < ${threshold}${msg ? ` (${msg})` : ""}`
    );
  }
}

export function expectPubkeyEq(
  actual: PublicKey,
  expected: PublicKey,
  msg?: string
): void {
  if (!actual.equals(expected)) {
    throw new Error(
      `expectPubkeyEq failed: ${actual.toBase58()} !== ${expected.toBase58()}${
        msg ? ` (${msg})` : ""
      }`
    );
  }
}

