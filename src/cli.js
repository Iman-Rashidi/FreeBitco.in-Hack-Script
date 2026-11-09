#!/usr/bin/env node
'use strict';

const { simulateRolls } = require('./simulator');
const { simulateRisk } = require('./risk');

const HELP = 'Faucet Odds Lab — offline probability and risk simulator\n\n' +
  'Usage: node src/cli.js [options]\n\n' +
  'Modes:\n  --mode rolls        Simulate uniform integer rolls (default)\n  --mode risk         Simulate fixed-stake bankroll paths\n\n' +
  'Roll options:\n  --rounds <n>        Number of roll trials (default: 100000; max: 10000000)\n  --min <n>           Inclusive minimum roll (default: 1)\n  --max <n>           Inclusive maximum roll (default: 10000)\n  --threshold <n>     Count rolls <= this value (default: 100)\n\n' +
  'Risk options:\n  --probability <p>   Win probability from 0 to 1 (default: 0.49)\n  --payout <x>        Gross payout multiplier including stake (default: 1.9)\n  --stake <x>         Fixed stake per round (default: 1)\n  --bankroll <x>      Starting bankroll (default: 100)\n  --paths <n>         Independent sessions (default: 10000; max: 100000)\n  --rounds <n>        Scheduled rounds per session (default: 1000)\n\n' +
  'Common options:\n  --seed <text>       Reproducible seed (optional)\n  --json              Print machine-readable JSON\n  --help              Show this help\n\n' +
  'Offline educational simulation only. It does not interact with websites or wallets.\n';

function parseArgs(argv) {
  const options = {};
  let mode = 'rolls';
  let json = false;
  const allowed = new Set(['--mode', '--rounds', '--min', '--max', '--threshold', '--seed', '--probability', '--payout', '--stake', '--bankroll', '--paths']);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help') return { help: true };
    if (argument === '--json') { json = true; continue; }
    if (!allowed.has(argument)) throw new Error('Unknown option: ' + argument);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) throw new Error('Missing value for ' + argument);
    index += 1;
    const key = argument.slice(2);
    if (key === 'mode') mode = value;
    else options[key === 'probability' ? 'winProbability' : key === 'payout' ? 'payoutMultiplier' : key] = key === 'seed' ? value : Number(value);
  }
  if (mode !== 'rolls' && mode !== 'risk') throw new Error('mode must be rolls or risk.');
  if (mode === 'risk' && options.rounds !== undefined) {
    options.roundsPerPath = options.rounds;
    delete options.rounds;
  }
  return { mode, options, json };
}

function formatPercent(value) { return (value * 100).toFixed(4) + '%'; }

function main(argv = process.argv.slice(2)) {
  try {
    const parsed = parseArgs(argv);
    if (parsed.help) { process.stdout.write(HELP); return 0; }
    const result = parsed.mode === 'risk' ? simulateRisk(parsed.options) : simulateRolls(parsed.options);
    if (parsed.json) { process.stdout.write(JSON.stringify(result, null, 2) + '\n'); return 0; }
    const lines = parsed.mode === 'risk' ? [
      'Faucet Odds Lab — bankroll risk summary', '---------------------------------------',
      'Independent paths:        ' + result.paths.toLocaleString(),
      'Scheduled rounds/path:    ' + result.roundsPerPath.toLocaleString(),
      'Win probability:          ' + formatPercent(result.winProbability),
      'Gross payout multiplier:  ' + result.payoutMultiplier,
      'Stake / starting bankroll: ' + result.stake + ' / ' + result.initialBankroll,
      'Theoretical RTP:          ' + formatPercent(result.theoreticalRtp),
      'Expected net per round:   ' + result.expectedNetPerRound.toFixed(4),
      'Expected net per stake:   ' + formatPercent(result.expectedNetPerStake),
      'Estimated ruin frequency: ' + formatPercent(result.ruinProbability),
      'Average final bankroll:  ' + result.averageFinalBankroll.toFixed(4),
      'Median final bankroll:   ' + result.medianFinalBankroll.toFixed(4),
      'Average max drawdown:    ' + formatPercent(result.averageMaxDrawdown),
      'Average rounds completed: ' + result.averageCompletedRounds.toFixed(2),
      'Seed:                     ' + (result.seed === null ? '(not fixed)' : result.seed), '',
      result.note, 'Simulation only — estimates depend on the assumptions supplied.'
    ] : [
      'Faucet Odds Lab — roll simulation summary', '-----------------------------------------',
      'Trials:                  ' + result.rounds.toLocaleString(),
      'Roll range:              ' + result.min + '..' + result.max,
      'Success condition:       roll <= ' + result.threshold,
      'Hits / misses:           ' + result.hits.toLocaleString() + ' / ' + result.misses.toLocaleString(),
      'Theoretical probability: ' + formatPercent(result.theoreticalProbability),
      'Observed probability:    ' + formatPercent(result.observedProbability),
      'Expected hits:            ' + result.expectedHits.toFixed(2),
      '95% Wilson interval:      ' + formatPercent(result.confidence95.lower) + ' – ' + formatPercent(result.confidence95.upper),
      'Seed:                     ' + (result.seed === null ? '(not fixed)' : result.seed), '',
      'Simulation only — this does not predict or influence real-world outcomes.'
    ];
    process.stdout.write(lines.join('\n') + '\n');
    return 0;
  } catch (error) {
    process.stderr.write('Error: ' + error.message + '\nRun with --help for usage.\n');
    return 1;
  }
}

if (require.main === module) process.exitCode = main();
module.exports = { main, parseArgs };
