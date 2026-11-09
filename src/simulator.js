'use strict';

const MAX_ROUNDS = 10_000_000;

function integerInRange(value, name, minimum, maximum) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new RangeError(name + ' must be an integer from ' + minimum + ' to ' + maximum + '.');
  }
  return parsed;
}

function hashSeed(seed) {
  const text = String(seed);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// Mulberry32: deterministic PRNG for repeatable experiments, not cryptography.
function createSeededRandom(seed) {
  let state = hashSeed(seed);
  return function random() {
    state = (state + 0x6D2B79F5) | 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function wilsonInterval(successes, total) {
  if (total === 0) return { lower: 0, upper: 1 };
  const z = 1.96;
  const proportion = successes / total;
  const denominator = 1 + (z * z) / total;
  const centre = (proportion + (z * z) / (2 * total)) / denominator;
  const margin = (z * Math.sqrt((proportion * (1 - proportion) + (z * z) / (4 * total)) / total)) / denominator;
  return {
    lower: Math.max(0, centre - margin),
    upper: Math.min(1, centre + margin)
  };
}

function simulateRolls(options = {}) {
  const rounds = integerInRange(options.rounds ?? 100_000, 'rounds', 1, MAX_ROUNDS);
  const min = integerInRange(options.min ?? 1, 'min', 0, 1_000_000_000);
  const max = integerInRange(options.max ?? 10_000, 'max', 0, 1_000_000_000);
  if (min > max) throw new RangeError('min must be less than or equal to max.');
  const defaultThreshold = Math.min(Math.max(100, min), max);
  const threshold = integerInRange(options.threshold ?? defaultThreshold, 'threshold', min, max);

  const random = options.random ?? (options.seed === undefined ? Math.random : createSeededRandom(options.seed));
  if (typeof random !== 'function') throw new TypeError('random must be a function.');

  const rangeSize = max - min + 1;
  const theoreticalProbability = (threshold - min + 1) / rangeSize;
  let hits = 0;

  for (let index = 0; index < rounds; index += 1) {
    const sample = random();
    if (typeof sample !== 'number' || !Number.isFinite(sample) || sample < 0 || sample >= 1) {
      throw new RangeError('random must return a finite number in the interval [0, 1).');
    }
    const roll = min + Math.floor(sample * rangeSize);
    if (roll <= threshold) hits += 1;
  }

  const observedProbability = hits / rounds;
  return {
    rounds,
    min,
    max,
    threshold,
    hits,
    misses: rounds - hits,
    theoreticalProbability,
    observedProbability,
    expectedHits: rounds * theoreticalProbability,
    confidence95: wilsonInterval(hits, rounds),
    seed: options.seed === undefined ? null : String(options.seed)
  };
}

module.exports = { MAX_ROUNDS, createSeededRandom, simulateRolls, wilsonInterval };
