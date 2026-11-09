'use strict';

const { createSeededRandom } = require('./simulator');

const MAX_PATHS = 100_000;
const MAX_TOTAL_TRIALS = 10_000_000;

function finiteNumber(value, name, minimum, maximum, inclusiveMinimum = true) {
  const number = Number(value);
  if (!Number.isFinite(number) || (inclusiveMinimum ? number < minimum : number <= minimum) || number > maximum) {
    const left = inclusiveMinimum ? '[' : '(';
    throw new RangeError(name + ' must be a finite number in ' + left + minimum + ', ' + maximum + '].');
  }
  return number;
}

function positiveInteger(value, name, maximum) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1 || number > maximum) {
    throw new RangeError(name + ' must be an integer from 1 to ' + maximum + '.');
  }
  return number;
}

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * Simulate independent fixed-stake sessions for a binary-outcome game.
 * payoutMultiplier is gross return (stake included), e.g. 2 means a 1:1 net win.
 */
function simulateRisk(options = {}) {
  const paths = positiveInteger(options.paths ?? 10_000, 'paths', MAX_PATHS);
  const roundsPerPath = positiveInteger(options.roundsPerPath ?? 1_000, 'roundsPerPath', MAX_TOTAL_TRIALS);
  if (paths * roundsPerPath > MAX_TOTAL_TRIALS) {
    throw new RangeError('paths * roundsPerPath must not exceed ' + MAX_TOTAL_TRIALS + '.');
  }
  const winProbability = finiteNumber(options.winProbability ?? 0.49, 'winProbability', 0, 1);
  const stake = finiteNumber(options.stake ?? 1, 'stake', 0, Number.MAX_SAFE_INTEGER, false);
  const payoutMultiplier = finiteNumber(options.payoutMultiplier ?? 1.9, 'payoutMultiplier', 0, 1_000_000);
  const initialBankroll = finiteNumber(options.bankroll ?? 100, 'bankroll', 0, Number.MAX_SAFE_INTEGER, false);
  const random = options.random ?? (options.seed === undefined ? Math.random : createSeededRandom(options.seed));
  if (typeof random !== 'function') throw new TypeError('random must be a function.');

  let bankruptPaths = 0;
  let totalFinalBankroll = 0;
  let totalMaxDrawdown = 0;
  let totalCompletedRounds = 0;
  const finalBankrolls = [];

  for (let path = 0; path < paths; path += 1) {
    let balance = initialBankroll;
    let peak = balance;
    let maxDrawdown = 0;
    let completedRounds = 0;
    let bankrupt = false;

    for (let round = 0; round < roundsPerPath; round += 1) {
      if (balance + Number.EPSILON < stake) {
        bankrupt = true;
        break;
      }
      const sample = random();
      if (typeof sample !== 'number' || !Number.isFinite(sample) || sample < 0 || sample >= 1) {
        throw new RangeError('random must return a finite number in the interval [0, 1).');
      }
      balance += sample < winProbability ? stake * (payoutMultiplier - 1) : -stake;
      completedRounds += 1;
      if (balance > peak) peak = balance;
      const drawdown = peak === 0 ? 0 : (peak - balance) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    if (bankrupt) bankruptPaths += 1;
    totalFinalBankroll += balance;
    totalMaxDrawdown += maxDrawdown;
    totalCompletedRounds += completedRounds;
    finalBankrolls.push(balance);
  }

  const theoreticalRtp = winProbability * payoutMultiplier;
  const expectedNetPerRound = stake * (theoreticalRtp - 1);
  return {
    paths,
    roundsPerPath,
    winProbability,
    stake,
    payoutMultiplier,
    initialBankroll,
    theoreticalRtp,
    expectedNetPerRound,
    expectedNetPerStake: theoreticalRtp - 1,
    bankruptPaths,
    ruinProbability: bankruptPaths / paths,
    averageFinalBankroll: totalFinalBankroll / paths,
    medianFinalBankroll: median(finalBankrolls),
    averageMaxDrawdown: totalMaxDrawdown / paths,
    averageCompletedRounds: totalCompletedRounds / paths,
    seed: options.seed === undefined ? null : String(options.seed),
    note: 'Ruin means a path cannot afford the next full stake before all scheduled rounds are complete.'
  };
}

module.exports = { MAX_PATHS, MAX_TOTAL_TRIALS, simulateRisk };
