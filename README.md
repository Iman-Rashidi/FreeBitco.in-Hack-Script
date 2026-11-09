# Faucet Odds Lab

An offline probability, Monte Carlo, and bankroll-risk analysis engine for discrete random events and fixed-stake binary-outcome models.

> **Safety and scope:** This is an educational simulator only. It does not connect to FreeBitco.in or any other website, automate browser actions, alter page values, submit requests, or access wallets or funds. Simulation results do not predict future outcomes or create an advantage in real-money games.

## Why this repository changed

The repository began as a fork of [0xStormbit/FreeBitco.in-Hack-Script](https://github.com/0xStormbit/FreeBitco.in-Hack-Script). The inherited, obfuscated browser script targeted a third-party site's page elements and local browser storage. It has been removed from the active code path and replaced with a transparent offline tool. Upstream authorship remains credited; maintenance work in this fork is by **Iman Rashidi** (GitHub: [Iman-Rashidi](https://github.com/Iman-Rashidi)).

## Requirements

- Node.js 20 or newer
- No third-party runtime dependencies

## Modes

### 1. Discrete roll probability

Draws integers uniformly from the inclusive range `min..max` and counts values less than or equal to a threshold. Reports theoretical and observed probabilities, expected hit count, and a 95% Wilson interval.

```sh
npm test
npm start -- --mode rolls --rounds 100000 --min 1 --max 10000 --threshold 100 --seed demo
```

Options: `--rounds`, `--min`, `--max`, `--threshold`, `--seed`, `--json`.

### 2. Bankroll and risk analysis

Runs many independent sessions of a fixed-stake binary-outcome model. The payout multiplier is the **gross return including the original stake**: a multiplier of 2.0 means a net win equal to the stake.

```sh
node src/cli.js --mode risk --probability 0.49 --payout 1.9 --stake 1 --bankroll 100 --paths 10000 --rounds 1000 --seed research-01
```

Options:

| Option | Default | Meaning |
|---|---:|---|
| `--probability` | 0.49 | Probability of a winning outcome (0–1) |
| `--payout` | 1.9 | Gross payout multiplier, including stake |
| `--stake` | 1 | Fixed amount risked on each round |
| `--bankroll` | 100 | Starting bankroll for each independent path |
| `--paths` | 10000 | Number of independent sessions (max 100000) |
| `--rounds` | 1000 | Scheduled rounds per session |
| `--seed` | none | Optional reproducible seed |
| `--json` | off | Machine-readable JSON output |

The risk report includes theoretical RTP (`win probability × gross payout multiplier`), expected net value per round, estimated ruin frequency, average and median final bankroll, average maximum drawdown, and average rounds completed.

**Ruin definition:** a simulated path is counted as ruined when its remaining bankroll cannot fund the next full stake before completing all scheduled rounds. This is a model-specific operational definition, not a prediction of an individual's future.

### Expected value example

For a 49% win probability and 1.9× gross payout:

```text
RTP = 0.49 × 1.9 = 0.931 (93.1%)
Expected net per unit staked = 0.931 − 1 = −0.069 (−6.9%)
```

This means the model's theoretical average loss is 6.9% of the amount staked over a large number of bets, before any other fees or constraints. A Monte Carlo run illustrates variability around the model; it does not change the underlying expectation.

## Interpretation and limitations

- Monte Carlo estimates are subject to sampling error; increase paths for more stable estimates within the configured workload cap.
- Results assume independent trials, a constant win probability, fixed stake, and a constant gross payout.
- Real systems may have changing rules, dependencies, fees, limits, or non-uniform outcomes that this model does not represent.
- A seeded generator is for reproducible experiments only. It is **not** cryptographically secure and must not be used for keys, tokens, betting, or production randomness.
- The simulator cannot test whether a real website is fair or random without a valid, independently collected dataset and a separate statistical test design.

## Project status

- [x] Replace the opaque site-targeting script with a documented offline simulator
- [x] Discrete roll probability and Wilson interval
- [x] Fixed-stake bankroll and risk simulation
- [x] Expected value, RTP, drawdown, and estimated ruin frequency
- [x] Input validation, workload caps, deterministic experiments, and unit tests
- [x] Node.js CI workflow

## Attribution

- Upstream project: [0xStormbit/FreeBitco.in-Hack-Script](https://github.com/0xStormbit/FreeBitco.in-Hack-Script)
- Maintained fork: [Iman-Rashidi/FreeBitco.in-Hack-Script](https://github.com/Iman-Rashidi/FreeBitco.in-Hack-Script)
