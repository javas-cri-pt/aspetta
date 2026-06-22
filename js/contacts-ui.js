import { groupByInitial } from './contacts.js';
import { isBloccato } from './phone.js';

const $ = (sel) => document.querySelector(sel);

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function iniziale(s) {
  return String(s || '?').trim().charAt(0).toUpperCase() || '?';
}

function contactRow(c, config) {
  const li = el('li', 'callable');
  li.dataset.numero = c.numero;
  li.dataset.nome = c.nome || '';
  li.appendChild(el('span', 'avatar', iniziale(c.nome || c.numero)));
  const main = el('span', 'row-main');
  main.appendChild(el('span', 'row-name', c.nome || c.numero));
  li.appendChild(main);
  if (isBloccato(c.numero, config)) {
    li.classList.add('bloccato');
    li.appendChild(el('span', 'row-lock', '🔒'));
  }
  return li;
}

export function renderRubrica(contatti, config) {
  const list = $('#contacts-list');
  list.innerHTML = '';

  const card = el('li');
  card.appendChild(el('span', 'avatar', 'C'));
  const cardMain = el('span', 'row-main');
  cardMain.appendChild(el('span', 'row-name', 'Cri'));
  cardMain.appendChild(el('span', 'row-sub', 'La mia scheda'));
  card.appendChild(cardMain);
  list.appendChild(card);

  const sezioni = groupByInitial(contatti);
  for (const { letter, items } of sezioni) {
    const h = el('li', 'sec-header', letter);
    h.id = `sec-${letter}`;
    list.appendChild(h);
    for (const c of items) list.appendChild(contactRow(c, config));
  }

  const az = $('#az-index');
  az.innerHTML = '';
  for (const { letter } of sezioni) {
    const b = el('button', null, letter);
    b.addEventListener('click', () => {
      const target = document.getElementById(`sec-${letter}`);
      if (target) target.scrollIntoView({ block: 'start' });
    });
    az.appendChild(b);
  }
}
