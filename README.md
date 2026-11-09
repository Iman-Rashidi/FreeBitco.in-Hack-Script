# Faucet Odds Lab

An offline probability and Monte Carlo simulator for discrete, faucet-style roll ranges.

> **Safety and scope:** This maintained version is an educational simulator only. It does not connect to FreeBitco.in or any other website, automate browser actions, alter page values, submit requests, or access wallets or funds. Simulation results do not predict future outcomes.

## Why this repository changed

The repository began as a fork of [0xStormbit/FreeBitco.in-Hack-Script](https://github.com/0xStormbit/FreeBitco.in-Hack-Script). The inherited, obfuscated browser script targeted a third-party site's page elements and local browser storage. It has been removed from the active code path and replaced with a transparent offline tool. Upstream authorship remains credited; maintenance work in this fork is by **Iman Rashidi** (GitHub: [Iman-Rashidi](https://github.com/Iman-Rashidi)).

## Requirements

- Node.js 20 or newer
- No third-party runtime dependencies

## Run

    npm test
    npm start -- --rounds 100000 --min 1 --max 10000 --threshold 100 --seed demo

The simulator draws an integer uniformly from the inclusive range min..max for each trial and counts results less than or equal to threshold.

### Options

| Option | Default | Meaning |
|---|---:|---|
| --rounds | 100000 | Number of simulated trials (1–10,000,000) |
| --min | 1 | Inclusive minimum roll |
| --max | 10000 | Inclusive maximum roll |
| --threshold | 100 | Count rolls less than or equal to this value |
| --seed | none | Optional reproducible seed |
| --json | off | Print machine-readable JSON |
| --help | — | Show usage |

Examples:

    node src/cli.js --rounds 500000 --min 1 --max 10000 --threshold 100
    node src/cli.js --rounds 500000 --min 1 --max 10000 --threshold 100 --seed research-01
    node src/cli.js --rounds 100000 --threshold 100 --json

## Interpreting results

The output compares theoretical probability with observed simulation frequency. It also reports the expected hit count and a 95% Wilson interval for the observed proportion. Small differences between theory and simulation are normal; more trials generally reduce sampling noise but do not make a random process predictable.

The seeded generator is for reproducible experiments only. It is **not** a cryptographic random-number generator and must not be used for keys, tokens, betting, or production randomness.

## Project status

- [x] Replace the opaque site-targeting script with a documented offline simulator
- [x] Validate simulation inputs and enforce a trial limit
- [x] Add deterministic runs and unit tests
- [x] Add CI on supported Node.js versions

## Attribution

- Upstream project: [0xStormbit/FreeBitco.in-Hack-Script](https://github.com/0xStormbit/FreeBitco.in-Hack-Script)
- Maintained fork: [Iman-Rashidi/FreeBitco.in-Hack-Script](https://github.com/Iman-Rashidi/FreeBitco.in-Hack-Script)
