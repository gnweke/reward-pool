<h1 align="center">
  <br>
   <img width="400" src="https://github.com/step-finance/reward-pool/blob/main/logo.svg?raw=true" alt="step logo"/>
  <br>
</h1>

[![CircleCI](https://circleci.com/gh/step-finance/reward-pool/tree/main.svg?style=svg)](https://circleci.com/gh/step-finance/reward-pool/tree/main)

# Reward Pool

Program for staking and receiving rewards. 

## Design Overview

![reward pool account overview](https://github.com/step-finance/reward-pool/blob/main/account-design.png)

*draw.io editable*

## Note

- **This code is unaudited. Use at your own risk.**

## Local Quickstart (macOS)
```bash
# toolchains
rustup default 1.83.0
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install 0.31.1 && avm use 0.31.1
brew install node
npm i -g yarn

# local validator
pkill -f solana-test-validator 2>/dev/null || true
solana-test-validator -r --quiet & sleep 5
solana config set -ul
solana airdrop 2

# build + test
anchor build -p reward_pool
anchor test  -p reward_pool
```

### Ubuntu variant
```bash
sudo apt update && sudo apt install -y curl pkg-config build-essential libssl-dev
rustup default 1.83.0
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install 0.31.1 && avm use 0.31.1
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
npm i -g yarn
# then same validator/build/test steps as above
```

## Developing

[Anchor](https://github.com/project-serum/anchor) is used for developoment, and it's
recommended workflow is used here. To get started, see the [guide](https://project-serum.github.io/anchor/getting-started/introduction.html).

### Toolchain

```bash
rustup default 1.83.0
cargo install --locked anchor-cli@0.31.1
sh -c "$(curl -sSfL https://release.solana.com/v2.3.2/install)"
```

Verify versions:

```bash
rustc --version
cargo --version
anchor --version
solana --version
```

### Build

```
anchor build --verifiable
```

The `--verifiable` flag should be used before deploying so that your build artifacts
can be deterministically generated with docker.

### Test

When testing locally, be sure to build with feature "local-testing" to enable the testing IDs.  You can do this by editing `programs/step-staking/Cargo.toml` and uncommenting the default feature set line.

```
anchor test
```

### Verify

To verify the program deployed on Solana matches your local source code, change directory
into the program you want to verify, e.g., `cd program`, and run

```bash
anchor verify <program-id | write-buffer>
```

A list of build artifacts can be found under [releases](https://github.com/step-finance/reward-pool/releases).

### Deploy

To deploy the program, configure your CLI to the desired network/wallet and run 

```bash
solana program deploy --programid <keypair> target/verifiable/reward_pool.so
```

I would not suggest using anchor deploy at this time; it wouldn't/couldn't really add much value.  Be sure to use `--programid <keypair>` to deploy to the correct address.

Note: By default, programs are deployed to accounts that are twice the size of the original deployment. Doing so leaves room for program growth in future redeployments. For this program, I beleive that's proper - I wouldn't want to limit  further, but I do see some possibility for growth, but not beyond double.

### Initial Migration

There is no initial migration required with this program.

## Account Map

| Account | PDA seeds | Notes |
| --- | --- | --- |
| **Pool signer** | `[pool.key()]` | Authority for staking/reward vaults |
| **User** | `[owner.key(), pool.key()]` | Tracks stake and reward checkpoints; bump stored in `nonce` |
| **Vaults** | n/a | Owned by pool signer, close authority = `None` |

## Local Runbook

```
# start a validator
solana-test-validator --reset &

# airdrop some SOL
solana airdrop 10

# build and deploy the program
anchor build -p reward_pool
anchor deploy -p reward_pool

# example instruction flow (Anchor scripts)
anchor run initialize_pool
anchor run create_user
anchor run stake
anchor run fund
anchor run claim
anchor run unstake
```

The `anchor run` scripts are placeholders showing call order; the TypeScript SDK can drive the same instructions.