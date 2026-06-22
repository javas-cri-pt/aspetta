import { normalizeNumber } from './phone.js';

// RFC 6350 line unfolding: una riga che inizia con spazio/tab continua la precedente.
function unfold(text) {
  return String(text ?? '').replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
}

// "item1.TEL;type=CELL" -> "TEL"
function propName(rawKey) {
  let k = rawKey.split(';')[0];
  const dot = k.indexOf('.');
  if (dot !== -1) k = k.slice(dot + 1);
  return k.trim().toUpperCase();
}

// "N:Cognome;Nome;Middle;Prefix;Suffix" -> "Nome Cognome"
function nomeFromN(value) {
  const p = value.split(';').map((s) => s.trim());
  return [p[1] || '', p[0] || ''].filter(Boolean).join(' ').trim();
}

export function parseVCard(text) {
  const lines = unfold(text).split('\n');
  const out = [];
  let inCard = false, fn = '', n = '', tels = [];
  const flush = () => {
    const nome = fn || nomeFromN(n);
    for (const t of tels) {
      const numero = t.trim();
      if (normalizeNumber(numero).length >= 5) out.push({ nome: nome || numero, numero });
    }
  };
  for (const line of lines) {
    if (/^BEGIN:VCARD/i.test(line)) { inCard = true; fn = ''; n = ''; tels = []; continue; }
    if (/^END:VCARD/i.test(line)) { if (inCard) flush(); inCard = false; continue; }
    if (!inCard) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = propName(line.slice(0, idx));
    const value = line.slice(idx + 1);
    if (key === 'FN') fn = value.trim();
    else if (key === 'N') n = value;
    else if (key === 'TEL') tels.push(value);
  }
  return out;
}
