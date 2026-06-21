import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countdown, relativeTime } from '../js/format.js';

test('countdown formatta mm:ss con zero padding', () => {
  assert.equal(countdown(0), '00:00');
  assert.equal(countdown(65 * 1000), '01:05');
  assert.equal(countdown(20 * 60 * 1000), '20:00');
});

test('countdown non va sotto zero', () => {
  assert.equal(countdown(-5000), '00:00');
});

test('relativeTime mostra "oggi HH:MM" per oggi', () => {
  const now = new Date(2026, 5, 21, 18, 0, 0).getTime();
  const ts = new Date(2026, 5, 21, 14, 32, 0).getTime();
  assert.equal(relativeTime(ts, now), 'oggi 14:32');
});

test('relativeTime mostra "ieri" per ieri', () => {
  const now = new Date(2026, 5, 21, 9, 0, 0).getTime();
  const ts = new Date(2026, 5, 20, 22, 0, 0).getTime();
  assert.equal(relativeTime(ts, now), 'ieri');
});
