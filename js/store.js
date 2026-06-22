const KEY_CONFIG = 'aspetta.config';
const KEY_CALLS = 'aspetta.chiamate';
const KEY_CONTATTI = 'aspetta.contatti';

const ls = () => globalThis.localStorage;

export function getContatti(storage = ls()) {
  const raw = storage.getItem(KEY_CONTATTI);
  return raw ? JSON.parse(raw) : [];
}

export function saveContatti(contatti, storage = ls()) {
  storage.setItem(KEY_CONTATTI, JSON.stringify(contatti));
}

export function getConfig(storage = ls()) {
  const raw = storage.getItem(KEY_CONFIG);
  return raw ? JSON.parse(raw) : null;
}

export function saveConfig(cfg, storage = ls()) {
  storage.setItem(KEY_CONFIG, JSON.stringify(cfg));
}

export function getCalls(storage = ls()) {
  const raw = storage.getItem(KEY_CALLS);
  return raw ? JSON.parse(raw) : [];
}

export function addCall(call, storage = ls()) {
  const calls = getCalls(storage);
  calls.push(call);
  storage.setItem(KEY_CALLS, JSON.stringify(calls));
  return calls;
}
