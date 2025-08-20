use super::PRECISION;

/// Calculate the updated reward per token.
pub fn reward_per_token(
    reward_per_token_stored: u128,
    reward_rate: u64,
    last_update_time: u64,
    current_time: u64,
    total_staked: u64,
) -> u128 {
    if total_staked == 0 {
        return reward_per_token_stored;
    }
    let time = current_time - last_update_time;
    reward_per_token_stored
        + (time as u128) * (reward_rate as u128) * PRECISION / (total_staked as u128)
}

/// Compute the reward rate for a funding amount and duration.
pub fn reward_rate(funding_amount: u64, duration: u64) -> u64 {
    funding_amount.checked_div(duration).unwrap_or(0)
}

/// Update a user's pending reward checkpoint.
pub fn checkpoint(
    pending: u128,
    complete: u128,
    reward_per_token_current: u128,
    balance: u64,
) -> (u128, u128) {
    let owed = reward_per_token_current - complete;
    let pending = pending + (balance as u128) * owed / PRECISION;
    (pending, reward_per_token_current)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_reward_per_token_accrual() {
        let rpt = reward_per_token(0, 10, 0, 5, 100);
        assert_eq!(rpt, 5 * 10 * PRECISION / 100);
    }

    #[test]
    fn test_reward_per_token_zero_stake() {
        let rpt = reward_per_token(7, 10, 0, 5, 0);
        assert_eq!(rpt, 7);
    }

    #[test]
    fn test_reward_rate_clamp() {
        let rate = reward_rate(1000, 10);
        assert_eq!(rate, 100);
    }

    #[test]
    fn test_user_checkpoint() {
        let rpt = PRECISION; // one token per staked token
        let (pending, complete) = checkpoint(0, 0, rpt, 50);
        assert_eq!(pending, 50);
        assert_eq!(complete, rpt);
    }
}
