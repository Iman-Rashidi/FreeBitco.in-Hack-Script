'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createSeededRandom, simulateRolls, wilsonInterval } = require('../src/simulator');
const { parseArgs } = require('../src/cli');

test('calculates exact theoretical probability for an inclusive range', () => {
  const result = simulateRolls({ rounds: 10, min: 1, max: 10, threshold: 2, random: () => 0.5 });
  assert.equal(result.theoreticalProbability, 0.2);
  assert.equal(result.hits, 0);
  assert.equal(result.misses, 10);
});

test('uses injected randomness and counts the threshold inclusively', () => {
  const samples = [0.09, 0.1, 0.2, 0.99];
  let index = 0;
  const result = simulateRolls({
    rounds: samples.length,
    min: 1,
    max: 10,
    threshold: 1,
    random: () => samples[index++]
  });
  assert.equal(result.hits, 1);
});

test('seeded simulations are reproducible', () => {
  const options = { rounds: 5000, min: 1, max: 10000, threshold: 100, seed: 'repeatable' };
  assert.deepEqual(simulateRolls(options), simulateRolls(options));
  assert.equal(createSeededRandom('same')(), createSeededRandom('same')());
});

test('defaults the threshold inside a narrowed range', () => {
  const result = simulateRolls({ rounds: 10, min: 1, max: 6, random: () => 0.5 });
  assert.equal(result.threshold, 6);
  assert.equal(result.theoreticalProbability, 1);
});

test('rejects invalid ranges, thresholds, and unreasonable trial counts', () => {
  assert.throws(() => simulateRolls({ min: 10, max: 1 }), /min must be less than or equal to max/);
  assert.throws(() => simulateRolls({ min: 1, max: 10, threshold: 11 }), /threshold/);
  assert.throws(() => simulateRolls({ rounds: 0 }), /rounds/);
  assert.throws(() => simulateRolls({ rounds: 10000001 }), /rounds/);
});

test('rejects a random source outside [0, 1)', () => {
  assert.throws(() => simulateRolls({ rounds: 1, random: () => 1 }), /interval/);
  assert.throws(() => simulateRolls({ rounds: 1, random: () => NaN }), /interval/);
});

test('Wilson confidence interval contains the observed proportion', () => {
  const interval = wilsonInterval(50, 100);
  assert.ok(interval.lower < 0.5);
  assert.ok(interval.upper > 0.5);
  assert.ok(interval.lower >= 0);
  assert.ok(interval.upper <= 1);
});

test('CLI parser accepts reproducibility and output flags', () => {
  assert.deepEqual(parseArgs(['--rounds', '100', '--seed', 'demo', '--json']), {
    options: { rounds: 100, seed: 'demo' },
    json: true
  });
  assert.equal(parseArgs(['--help']).help, true);
  assert.throws(() => parseArgs(['--unknown']), /Unknown option/);
});
