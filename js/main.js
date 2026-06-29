import { getConfig, saveConfig, getCalls, addCall, getContatti, saveContatti } from './store.js';
import { sameNumber, gateStatus, isBloccato, isHardcoded, MINUTI_HARDCODED, normalizeNumber } from './phone.js';
import { countdown } from './format.js';
import { parseVCard } from './vcard.js';
import { renderRubrica } from './contacts-ui.js?v=4';
import { nameForNumber } from './contacts.js';
import {
  showScreen, switchTab, renderRecents, renderSearch, buildKeypad,
} from './ui.js?v=4';

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
  const hardcoded = isHardcoded(numero);
  const minuti = hardcoded ? MINUTI_HARDCODED : config?.minutiAttesa;
  if (hardcoded || isBloccato(numero, config)) {
    const stato = gateStatus(getCalls(), numero, minuti, Date.now());
    if (stato.blocked) { showBlock({ ...config, minutiAttesa: minuti }, numero, stato.remainingMs); return; }
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
  clearInterval(countdownTimer);
  tick();
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
      // Parsa in memoria; persiste solo al "Salva e blocca" (commit atomico).
      wizContatti = parseVCard(reader.result);
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
  saveContatti(wizContatti);
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

// --- Scheda contatto: il tap su una riga apre la scheda, NON chiama.
// La chiamata (e il log) avviene solo premendo "Chiama" qui dentro. ---
let contattoCorrente = null;

function iniziale(s) {
  return String(s || '?').trim().charAt(0).toUpperCase() || '?';
}

function openContact(numero, nome) {
  contattoCorrente = { numero, nome: nome || '' };
  $('#contact-avatar').textContent = iniziale(nome || numero);
  $('#contact-name').textContent = nome || numero;
  $('#contact-number').textContent = numero;
  showScreen('screen-contact');
}

function initCallableLists() {
  document.querySelectorAll('.list').forEach((list) => {
    list.addEventListener('click', (e) => {
      const row = e.target.closest('.callable');
      if (!row) return;
      openContact(row.dataset.numero, row.dataset.nome);
    });
  });
  $('#contact-call').addEventListener('click', () => {
    if (contattoCorrente) placeCall(contattoCorrente.numero, contattoCorrente.nome);
  });
  $('#contact-back').addEventListener('click', () => switchTab('contacts'));
}

// --- Impostazioni protette da codice (modifica nome utente + minuti) ---
let codiceSbloccato = null;

function openSettings() {
  const config = getConfig() || {};
  codiceSbloccato = null;
  $('#settings-code').value = '';
  $('#settings-code-err').textContent = '';
  $('#settings-lock-title').textContent = config.codice ? 'Inserisci codice' : 'Crea un codice';
  $('#settings-nome').value = config.nomeUtente || '';
  $('#settings-minuti').value = config.minutiAttesa || 30;
  $('#settings-lock').classList.remove('hidden');
  $('#settings-form').classList.add('hidden');
  showScreen('screen-settings');
}

function initSettings() {
  $('#open-settings').addEventListener('click', openSettings);
  $('#settings-back').addEventListener('click', () => switchTab('contacts'));
  $('#settings-unlock').addEventListener('click', () => {
    const config = getConfig() || {};
    const entered = $('#settings-code').value.trim();
    if (config.codice) {
      if (entered !== config.codice) { $('#settings-code-err').textContent = 'Codice errato.'; return; }
      codiceSbloccato = config.codice;
    } else {
      if (!entered) { $('#settings-code-err').textContent = 'Scegli un codice.'; return; }
      codiceSbloccato = entered; // verrà salvato al "Salva"
    }
    $('#settings-lock').classList.add('hidden');
    $('#settings-form').classList.remove('hidden');
  });
  $('#settings-save').addEventListener('click', () => {
    const config = getConfig() || {};
    const minuti = parseInt($('#settings-minuti').value, 10);
    saveConfig({
      ...config,
      nomeUtente: $('#settings-nome').value.trim() || config.nomeUtente || 'Tu',
      minutiAttesa: Number.isFinite(minuti) && minuti >= 1 ? minuti : (config.minutiAttesa || 30),
      codice: config.codice || codiceSbloccato,
    });
    refreshTabs(getConfig());
    switchTab('contacts');
  });
  $('#add-contatto').addEventListener('click', () => {
    const nome = $('#add-nome').value.trim();
    const numero = $('#add-numero').value.trim();
    if (normalizeNumber(numero).length < 5) { $('#add-status').textContent = 'Numero non valido.'; return; }
    const contatti = getContatti();
    contatti.push({ nome: nome || numero, numero });
    saveContatti(contatti);
    if ($('#add-blocca').checked) {
      const config = getConfig() || {};
      const bloccati = config.bloccati || [];
      if (!bloccati.some((b) => sameNumber(b, numero))) bloccati.push(numero);
      saveConfig({ ...config, bloccati });
    }
    $('#add-status').textContent = `Aggiunto: ${nome || numero}.`;
    $('#add-nome').value = ''; $('#add-numero').value = ''; $('#add-blocca').checked = false;
    refreshTabs(getConfig());
  });
}

// Blocca lo zoom su iOS: il viewport meta viene ignorato da Safari, quindi
// servono i listener JS. gesturestart/change = pinch; doppio-tap = zoom da tap.
function initNoZoom() {
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) =>
    document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }));
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
}

function init() {
  initNoZoom();
  initKeypad();
  initCallableLists();
  initWizard();
  initSettings();

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
