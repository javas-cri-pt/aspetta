import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getConfig, saveConfig, getCalls, addCall } from '../js/store.js';

function fakeStorage() {
  const data = {};
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
  };
}

test('getConfig restituisce null se assente', () => {
  assert.equal(getConfig(fakeStorage()), null);
});

test('saveConfig e getConfig fanno round-trip', () => {
  const s = fakeStorage();
  saveConfig({ nome: 'Marco', minutiAttesa: 30 }, s);
  assert.deepEqual(getConfig(s), { nome: 'Marco', minutiAttesa: 30 });
});

test('getCalls parte da array vuoto', () => {
  assert.deepEqual(getCalls(fakeStorage()), []);
});

test('addCall accoda e persiste', () => {
  const s = fakeStorage();
  addCall({ numero: '333', nome: 'Marco', timestamp: 1 }, s);
  addCall({ numero: '333', nome: 'Marco', timestamp: 2 }, s);
  const calls = getCalls(s);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].timestamp, 2);
});
