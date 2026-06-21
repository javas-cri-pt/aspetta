import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNumber, sameNumber } from '../js/phone.js';

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
