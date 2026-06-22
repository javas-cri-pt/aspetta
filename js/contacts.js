import { sameNumber } from './phone.js';

export function nameForNumber(numero, contatti) {
  const hit = (contatti || []).find((c) => sameNumber(c.numero, numero));
  return hit ? hit.nome : numero;
}

function inizialeOf(nome) {
  const ch = String(nome || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : '#';
}

export function groupByInitial(contatti) {
  const ordinati = [...(contatti || [])].sort((a, b) =>
    String(a.nome || '').localeCompare(String(b.nome || ''), 'it', { sensitivity: 'base' }));
  const map = new Map();
  for (const c of ordinati) {
    const L = inizialeOf(c.nome);
    if (!map.has(L)) map.set(L, []);
    map.get(L).push(c);
  }
  const letters = [...map.keys()].sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });
  return letters.map((letter) => ({ letter, items: map.get(letter) }));
}
