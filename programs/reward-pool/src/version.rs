use crate::*;
#[cfg(feature = "idl-build")]
use anchor_lang::idl::types::IdlBuild;

pub const SECONDS_IN_YEAR: u64 = 365 * 24 * 60 * 60;

#[derive(
    anchor_lang::prelude::AnchorSerialize,
    anchor_lang::prelude::AnchorDeserialize,
    Clone,
    Copy,
    Debug,
    PartialEq,
    Eq,
)]
#[cfg_attr(feature = "idl-build", derive(IdlBuild))]
#[repr(u8)]
/// A version marker for different logic pertaining to program upgrades
pub enum PoolVersion {
    /// a V1 pool is the original math logic where rate is per second
    V1 = 0,
    /// a V2 pool uses the rate field as a ANNUAL lamport rate
    V2 = 2,
}

impl Pool {
    /// Will upgrade the pool if an upgrade is available and able to be done
    pub fn upgrade_if_needed(&mut self) {
        if self.version == PoolVersion::V1 {
            self.reward_a_rate = self.reward_a_rate.checked_mul(SECONDS_IN_YEAR).unwrap();
            self.reward_b_rate = self.reward_b_rate.checked_mul(SECONDS_IN_YEAR).unwrap();
            self.version = PoolVersion::V2;

            msg!("pool upgraded to v2");
        }
    }
}
