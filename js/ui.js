import { relativeTime } from './format.js';
import { sameNumber } from './phone.js';

const $ = (sel) => document.querySelector(sel);

const SCREENS = ['screen-setup', 'screen-block', 'tab-recents', 'tab-contacts', 'tab-keypad', 'tab-search'];

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

export function renderRecents(calls, config, now) {
  const list = $('#recents-list');
  list.innerHTML = '';
  const ordinate = [...calls].sort((a, b) => b.timestamp - a.timestamp);
  for (const c of ordinate) {
    list.appendChild(callableRow({
      nome: c.nome || c.numero,
      numero: c.numero,
      sub: '↗ chiamata',
      time: relativeTime(c.timestamp, now),
    }));
  }
  const inizioGiorno = new Date(now); inizioGiorno.setHours(0, 0, 0, 0);
  const oggiLui = calls.filter((c) =>
    sameNumber(c.numero, config.numero) && c.timestamp >= inizioGiorno.getTime());
  $('#today-counter').textContent = oggiLui.length
    ? `${oggiLui.length} a ${config.nome} oggi`
    : '';
}

export function renderContacts(config) {
  const list = $('#contacts-list');
  list.innerHTML = '';
  const card = document.createElement('li');
  card.appendChild(el('span', 'avatar', 'C'));
  const cardMain = el('span', 'row-main');
  cardMain.appendChild(el('span', 'row-name', 'Cri'));
  cardMain.appendChild(el('span', 'row-sub', 'La mia scheda'));
  card.appendChild(cardMain);
  list.appendChild(card);
  list.appendChild(callableRow({ nome: config.nome, numero: config.numero }));
}

export function renderSearch(query, calls, config) {
  const list = $('#search-list');
  list.innerHTML = '';
  const q = query.trim().toLowerCase();
  const candidati = [
    { nome: config.nome, numero: config.numero },
    ...calls.map((c) => ({ nome: c.nome || c.numero, numero: c.numero })),
  ];
  const visti = new Set();
  const filtrati = candidati.filter((c) => {
    const key = c.numero;
    if (visti.has(key)) return false;
    visti.add(key);
    if (!q) return false;
    return (c.nome || '').toLowerCase().includes(q) || c.numero.includes(q);
  });
  for (const c of filtrati) list.appendChild(callableRow(c));
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
