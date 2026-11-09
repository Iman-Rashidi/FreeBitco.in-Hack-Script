#!/usr/bin/env node
'use strict';

const { simulateRolls } = require('./simulator');

const HELP = 'Faucet Odds Lab — offline probability simulator\n\n' +
  'Usage: node src/cli.js [options]\n\n' +
  'Options:\n' +
  '  --rounds <n>       Trials to simulate (default: 100000; max: 10000000)\n' +
  '  --min <n>          Inclusive minimum roll (default: 1)\n' +
  '  --max <n>          Inclusive maximum roll (default: 10000)\n' +
  '  --threshold <n>    Count rolls <= this value (default: 100, limited to range)\n' +
  '  --seed <text>      Reproducible seed (optional)\n' +
  '  --json             Print JSON instead of a readable summary\n' +
  '  --help             Show this help\n\n' +
  'This tool is offline-only. It does not interact with third-party websites or wallets.\n';

function parseArgs(argv) {
  const options = {};
  let json = false;
  const allowed = new Set(['--rounds', '--min', '--max', '--threshold', '--seed']);

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help') return { help: true };
    if (argument === '--json') {
      json = true;
      continue;
    }
    if (!allowed.has(argument)) throw new Error('Unknown option: ' + argument);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new Error('Missing value for ' + argument);
    }
    index += 1;
    const key = argument.slice(2);
    options[key] = key === 'seed' ? value : Number(value);
  }

  return { options, json };
}

function formatPercent(value) {
  return (value * 100).toFixed(4) + '%';
}

function main(argv = process.argv.slice(2)) {
  try {
    const parsed = parseArgs(argv);
    if (parsed.help) {
      process.stdout.write(HELP);
      return 0;
    }

    const result = simulateRolls(parsed.options);
    if (parsed.json) {
      process.stdout.write(JSON.stringify(result, null, 2) + '\n');
      return 0;
    }

    const lines = [
      'Faucet Odds Lab — simulation summary',
      '------------------------------------',
      'Trials:                  ' + result.rounds.toLocaleString(),
      'Roll range:              ' + result.min + '..' + result.max,
      'Success condition:       roll <= ' + result.threshold,
      'Hits / misses:           ' + result.hits.toLocaleString() + ' / ' + result.misses.toLocaleString(),
      'Theoretical probability: ' + formatPercent(result.theoreticalProbability),
      'Observed probability:    ' + formatPercent(result.observedProbability),
      'Expected hits:            ' + result.expectedHits.toFixed(2),
      '95% Wilson interval:      ' + formatPercent(result.confidence95.lower) + ' – ' + formatPercent(result.confidence95.upper),
      'Seed:                     ' + (result.seed === null ? '(not fixed)' : result.seed),
      '',
      'Simulation only — this does not predict or influence real-world outcomes.'
    ];
    process.stdout.write(lines.join('\n') + '\n');
    return 0;
  } catch (error) {
    process.stderr.write('Error: ' + error.message + '\nRun with --help for usage.\n');
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = { main, parseArgs };
