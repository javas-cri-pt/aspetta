const KEY_CONFIG = 'aspetta.config';
const KEY_CALLS = 'aspetta.chiamate';

const ls = () => globalThis.localStorage;

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
