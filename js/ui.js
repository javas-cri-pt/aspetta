import { relativeTime } from './format.js';
import { sameNumber } from './phone.js';
import { nameForNumber } from './contacts.js';

const $ = (sel) => document.querySelector(sel);

const SCREENS = ['screen-setup', 'screen-block', 'screen-contact', 'screen-settings', 'tab-recents', 'tab-contacts', 'tab-keypad', 'tab-search'];

export function showScreen(id) {
  for (const s of SCREENS) {
    const el = document.getElementById(s);
    if (el) el.classList.toggle('hidden', s !== id);
  }
}

export function switchTab(name) {
  showScreen(`tab-${name}`);
  document.querySelectorAll('.tab-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === name);
  });
  // Riparti dall'alto: così la barra di ricerca (e le intestazioni) sono subito visibili.
  window.scrollTo(0, 0);
}

function iniziale(nome) {
  return (nome || '?').trim().charAt(0).toUpperCase() || '?';
}

// Costruisce un elemento usando textContent (mai innerHTML) per i campi
// utente, così nomi/numeri con caratteri speciali non rompono il rendering.
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function callableRow({ nome, numero, sub, time }) {
  const li = document.createElement('li');
  li.className = 'callable';
  li.dataset.numero = numero;
  li.dataset.nome = nome || '';
  li.appendChild(el('span', 'avatar', iniziale(nome || numero)));
  const main = el('span', 'row-main');
  main.appendChild(el('span', 'row-name', nome || numero));
  if (sub) main.appendChild(el('span', 'row-sub', sub));
  li.appendChild(main);
  if (time) li.appendChild(el('span', 'row-time', time));
  li.appendChild(el('span', 'row-call', '📞'));
  return li;
}

export function renderRecents(calls, config, contatti, now) {
  const list = $('#recents-list');
  list.innerHTML = '';
  const ordinate = [...calls].sort((a, b) => b.timestamp - a.timestamp);
  for (const c of ordinate) {
    list.appendChild(callableRow({
      nome: nameForNumber(c.numero, contatti),
      numero: c.numero,
      sub: '↗ chiamata',
      time: relativeTime(c.timestamp, now),
    }));
  }
  const inizioGiorno = new Date(now); inizioGiorno.setHours(0, 0, 0, 0);
  const oggiBloccati = calls.filter((c) =>
    (config.bloccati || []).some((b) => sameNumber(b, c.numero)) && c.timestamp >= inizioGiorno.getTime());
  $('#today-counter').textContent = oggiBloccati.length
    ? `${oggiBloccati.length} a contatti bloccati oggi`
    : '';
}

export function renderSearch(query, contatti) {
  const list = $('#search-list');
  list.innerHTML = '';
  const q = query.trim().toLowerCase();
  if (!q) return;
  const visti = new Set();
  for (const c of contatti) {
    if (visti.has(c.numero)) continue;
    visti.add(c.numero);
    if ((c.nome || '').toLowerCase().includes(q) || c.numero.includes(q)) {
      list.appendChild(callableRow({ nome: c.nome, numero: c.numero }));
    }
  }
}

const KEYS = [
  ['1', ''], ['2', 'ABC'], ['3', 'DEF'],
  ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'],
  ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'],
  ['*', ''], ['0', '+'], ['#', ''],
];

export function buildKeypad() {
  const pad = $('#keypad');
  pad.innerHTML = '';
  for (const [n, sub] of KEYS) {
    const b = document.createElement('button');
    b.className = 'key';
    b.dataset.key = n;
    b.innerHTML = `${n}${sub ? `<small>${sub}</small>` : ''}`;
    pad.appendChild(b);
  }
}
