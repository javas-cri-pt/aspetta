import { getConfig, saveConfig, getCalls, addCall } from './store.js';
import { sameNumber, gateStatus } from './phone.js';
import { countdown } from './format.js';
import {
  showScreen, switchTab, renderRecents, renderContacts,
  renderSearch, buildKeypad,
} from './ui.js';

const $ = (sel) => document.querySelector(sel);
let countdownTimer = null;

function refreshTabs(config) {
  const calls = getCalls();
  renderRecents(calls, config, Date.now());
  renderContacts(config);
}

// --- Chiamata + gate ---
function placeCall(numero, nome) {
  const config = getConfig();
  if (sameNumber(numero, config.numero)) {
    const stato = gateStatus(getCalls(), config, Date.now());
    if (stato.blocked) { showBlock(config, stato.remainingMs); return; }
  }
  addCall({ numero, nome: nome || '', timestamp: Date.now() });
  refreshTabs(config);
  window.location.href = `tel:${numero}`;
}

function showBlock(config, remainingMs) {
  const frasi = config.frasi && config.frasi.length ? config.frasi : ['Aspetta un attimo.'];
  // indice pseudo-casuale basato sul tempo, senza Math.random (deterministico per secondo)
  const idx = Math.floor(remainingMs / 1000) % frasi.length;
  $('#block-frase').textContent = frasi[idx];
  $('#block-name').textContent = config.nome;
  const msg = $('#block-msg');
  if (config.linkMessaggi) { msg.href = config.linkMessaggi; msg.classList.remove('hidden'); }
  else { msg.classList.add('hidden'); }
  showScreen('screen-block');

  const tick = () => {
    const stato = gateStatus(getCalls(), config, Date.now());
    if (!stato.blocked) { clearInterval(countdownTimer); switchTab('keypad'); return; }
    $('#block-countdown').textContent = countdown(stato.remainingMs);
  };
  tick();
  clearInterval(countdownTimer);
  countdownTimer = setInterval(tick, 1000);
}

// --- Setup ---
function openSetup(existing) {
  if (existing) {
    $('#set-nome').value = existing.nome || '';
    $('#set-numero').value = existing.numero || '';
    $('#set-msg').value = existing.linkMessaggi || '';
    $('#set-minuti').value = existing.minutiAttesa || 30;
    $('#set-frasi').value = (existing.frasi || []).join('\n');
  }
  showScreen('screen-setup');
}

function saveSetup() {
  const cfg = {
    nome: $('#set-nome').value.trim() || 'Lui',
    numero: $('#set-numero').value.trim(),
    linkMessaggi: $('#set-msg').value.trim(),
    minutiAttesa: parseInt($('#set-minuti').value, 10) || 30,
    frasi: $('#set-frasi').value.split('\n').map((s) => s.trim()).filter(Boolean),
  };
  if (!cfg.numero) { alert('Inserisci il numero.'); return; }
  saveConfig(cfg);
  refreshTabs(cfg);
  switchTab('keypad');
}

// --- Keypad ---
let dialBuffer = '';
function renderDial() { $('#dial-display').textContent = dialBuffer; }

function initKeypad() {
  buildKeypad();
  $('#keypad').addEventListener('click', (e) => {
    const k = e.target.closest('.key');
    if (!k) return;
    dialBuffer += k.dataset.key === '0' ? '0' : k.dataset.key;
    renderDial();
  });
  $('#dial-back').addEventListener('click', () => { dialBuffer = dialBuffer.slice(0, -1); renderDial(); });
  $('#dial-call').addEventListener('click', () => {
    if (!dialBuffer) return;
    const config = getConfig();
    const nome = sameNumber(dialBuffer, config.numero) ? config.nome : '';
    placeCall(dialBuffer, nome);
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

  document.querySelectorAll('.tab-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const name = b.dataset.tab;
      const config = getConfig();
      if (name === 'recents' || name === 'contacts') refreshTabs(config);
      switchTab(name);
    });
  });

  $('#search-input').addEventListener('input', (e) => {
    renderSearch(e.target.value, getCalls(), getConfig());
  });

  $('#set-salva').addEventListener('click', saveSetup);
  $('#open-setup').addEventListener('click', () => openSetup(getConfig()));
  $('#block-close').addEventListener('click', () => { clearInterval(countdownTimer); switchTab('keypad'); });

  const config = getConfig();
  if (!config || !config.numero) { openSetup(config); return; }
  refreshTabs(config);
  switchTab('keypad');
}

document.addEventListener('DOMContentLoaded', init);
