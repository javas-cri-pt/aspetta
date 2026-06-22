import { getConfig, saveConfig, getCalls, addCall, getContatti, saveContatti } from './store.js';
import { sameNumber, gateStatus, isBloccato } from './phone.js';
import { countdown } from './format.js';
import { parseVCard } from './vcard.js';
import { renderRubrica } from './contacts-ui.js';
import { nameForNumber } from './contacts.js';
import {
  showScreen, switchTab, renderRecents, renderSearch, buildKeypad,
} from './ui.js';

const $ = (sel) => document.querySelector(sel);
let countdownTimer = null;

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function refreshTabs(config) {
  const calls = getCalls();
  const contatti = getContatti();
  renderRecents(calls, config, contatti, Date.now());
  renderRubrica(contatti, config);
}

// --- Chiamata + gate ---
function placeCall(numero, nome) {
  const config = getConfig();
  if (isBloccato(numero, config)) {
    const stato = gateStatus(getCalls(), numero, config.minutiAttesa, Date.now());
    if (stato.blocked) { showBlock(config, numero, stato.remainingMs); return; }
  }
  addCall({ numero, nome: nome || '', timestamp: Date.now() });
  refreshTabs(config);
  window.location.href = `tel:${String(numero).replace(/\s/g, '')}`;
}

function showBlock(config, numero, remainingMs) {
  const frasi = config.frasi && config.frasi.length ? config.frasi : ['Aspetta un attimo.'];
  const idx = Math.floor(remainingMs / 1000) % frasi.length;
  $('#block-frase').textContent = frasi[idx];
  $('#block-name').textContent = nameForNumber(numero, getContatti());
  const msg = $('#block-msg');
  const norm = String(numero).replace(/\s/g, '');
  msg.href = `https://wa.me/${norm.replace(/^\+/, '')}`;
  msg.classList.remove('hidden');
  showScreen('screen-block');

  const tick = () => {
    const stato = gateStatus(getCalls(), numero, config.minutiAttesa, Date.now());
    if (!stato.blocked) { clearInterval(countdownTimer); switchTab('contacts'); return; }
    $('#block-countdown').textContent = countdown(stato.remainingMs);
  };
  tick();
  clearInterval(countdownTimer);
  countdownTimer = setInterval(tick, 1000);
}

// --- Setup wizard (una tantum) ---
let wizContatti = [];
let wizBloccati = new Set();

function showWizStep(step) {
  document.querySelectorAll('#screen-setup .wiz-step').forEach((s) => {
    s.classList.toggle('hidden', s.dataset.step !== step);
  });
  showScreen('screen-setup');
}

function initWizard() {
  const fileInput = $('#wiz-file');
  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      wizContatti = parseVCard(reader.result);
      saveContatti(wizContatti);
      $('#wiz-import-status').textContent = `Importati ${wizContatti.length} contatti.`;
      $('#wiz-next-import').disabled = wizContatti.length === 0;
    };
    reader.readAsText(file);
  });

  $('#wiz-next-import').addEventListener('click', () => { renderWizBloccati(''); showWizStep('bloccati'); });
  $('#wiz-bloccati-search').addEventListener('input', (e) => renderWizBloccati(e.target.value));
  $('#wiz-next-bloccati').addEventListener('click', () => showWizStep('frasi'));
  $('#wiz-next-frasi').addEventListener('click', () => { renderWizRiepilogo(); showWizStep('conferma'); });
  $('#wiz-salva').addEventListener('click', salvaSetup);
}

function renderWizBloccati(query) {
  const list = $('#wiz-bloccati-list');
  list.innerHTML = '';
  const q = query.trim().toLowerCase();
  const filtrati = wizContatti.filter((c) =>
    !q || (c.nome || '').toLowerCase().includes(q) || c.numero.includes(q));
  for (const c of filtrati) {
    const li = el('li');
    li.classList.toggle('sel', wizBloccati.has(c.numero));
    const main = el('span', 'row-main');
    main.appendChild(el('span', 'row-name', c.nome || c.numero));
    li.appendChild(main);
    li.appendChild(el('span', 'chk'));
    li.addEventListener('click', () => {
      if (wizBloccati.has(c.numero)) wizBloccati.delete(c.numero);
      else wizBloccati.add(c.numero);
      li.classList.toggle('sel');
    });
    list.appendChild(li);
  }
}

function renderWizRiepilogo() {
  const list = $('#wiz-riepilogo');
  list.innerHTML = '';
  const byNumero = new Map(wizContatti.map((c) => [c.numero, c.nome]));
  for (const numero of wizBloccati) {
    const li = el('li');
    li.appendChild(el('span', 'avatar', '🔒'));
    li.appendChild(el('span', 'row-name', byNumero.get(numero) || numero));
    list.appendChild(li);
  }
}

function salvaSetup() {
  const frasi = $('#wiz-frasi').value.split('\n').map((s) => s.trim()).filter(Boolean);
  saveConfig({
    minutiAttesa: 30,
    frasi,
    bloccati: [...wizBloccati],
    setupCompleto: true,
  });
  const config = getConfig();
  refreshTabs(config);
  switchTab('contacts');
}

// --- Keypad ---
let dialBuffer = '';
function renderDial() { $('#dial-display').textContent = dialBuffer; }

function initKeypad() {
  buildKeypad();
  $('#keypad').addEventListener('click', (e) => {
    const k = e.target.closest('.key');
    if (!k) return;
    dialBuffer += k.dataset.key;
    renderDial();
  });
  $('#dial-back').addEventListener('click', () => { dialBuffer = dialBuffer.slice(0, -1); renderDial(); });
  $('#dial-call').addEventListener('click', () => {
    if (!dialBuffer) return;
    placeCall(dialBuffer, nameForNumber(dialBuffer, getContatti()));
    dialBuffer = ''; renderDial();
  });
}

// --- Delegazione click su righe chiamabili ---
function initCallableLists() {
  document.querySelectorAll('.list').forEach((list) => {
    list.addEventListener('click', (e) => {
      const row = e.target.closest('.callable');
      if (!row) return;
      placeCall(row.dataset.numero, row.dataset.nome);
    });
  });
}

function init() {
  initKeypad();
  initCallableLists();
  initWizard();

  document.querySelectorAll('.tab-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const name = b.dataset.tab;
      const config = getConfig();
      if (name === 'recents' || name === 'contacts') refreshTabs(config);
      switchTab(name);
    });
  });

  $('#search-input').addEventListener('input', (e) => renderSearch(e.target.value, getContatti()));
  $('#block-close').addEventListener('click', () => { clearInterval(countdownTimer); switchTab('contacts'); });

  const config = getConfig();
  if (!config || !config.setupCompleto) { showWizStep('import'); return; }
  refreshTabs(config);
  switchTab('contacts');
}

document.addEventListener('DOMContentLoaded', init);
