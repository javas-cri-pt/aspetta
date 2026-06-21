import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNumber, sameNumber, gateStatus } from '../js/phone.js';

test('normalizeNumber tiene solo le cifre', () => {
  assert.equal(normalizeNumber('+39 333 12 34 567'), '393331234567');
  assert.equal(normalizeNumber('(02) 3061-7827'), '0230617827');
  assert.equal(normalizeNumber('0039 333 1234567'), '00393331234567');
});

test('sameNumber confronta le ultime 9 cifre', () => {
  assert.equal(sameNumber('+39 333 1234567', '3331234567'), true);
  assert.equal(sameNumber('0039 333 1234567', '+39 333 1234567'), true);
  assert.equal(sameNumber('3331234567', '3339999999'), false);
});

test('sameNumber non combacia con numeri corti (< 9 cifre)', () => {
  assert.equal(sameNumber('1234567', '+39 333 1234567'), false);
  assert.equal(sameNumber('567', '331234567'), false);
  assert.equal(sameNumber('', '331234567'), false);
});

const cfg = { numero: '+39 333 1234567', minutiAttesa: 30 };
const MIN = 60 * 1000;

test('gate libero se nessuna chiamata precedente a lui', () => {
  const r = gateStatus([], cfg, 1_000_000);
  assert.equal(r.blocked, false);
  assert.equal(r.remainingMs, 0);
});

test('gate bloccato se ultima chiamata a lui < 30 min fa', () => {
  const calls = [{ numero: '3331234567', timestamp: 0 }];
  const r = gateStatus(calls, cfg, 10 * MIN);
  assert.equal(r.blocked, true);
  assert.equal(r.remainingMs, 20 * MIN);
});

test('gate libero a esattamente 30 min', () => {
  const calls = [{ numero: '3331234567', timestamp: 0 }];
  const r = gateStatus(calls, cfg, 30 * MIN);
  assert.equal(r.blocked, false);
  assert.equal(r.remainingMs, 0);
});

test('gate ignora chiamate ad altri numeri', () => {
  const calls = [{ numero: '3339999999', timestamp: 0 }];
  const r = gateStatus(calls, cfg, 5 * MIN);
  assert.equal(r.blocked, false);
});

test('gate usa la chiamata a lui piu recente', () => {
  const calls = [
    { numero: '3331234567', timestamp: 0 },
    { numero: '3331234567', timestamp: 25 * MIN },
  ];
  const r = gateStatus(calls, cfg, 30 * MIN);
  assert.equal(r.blocked, true);
  assert.equal(r.remainingMs, 25 * MIN);
});
