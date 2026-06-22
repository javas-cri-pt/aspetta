import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVCard } from '../js/vcard.js';

test('estrae nome e numero da una vCard 3.0 base', () => {
  const v = `BEGIN:VCARD
VERSION:3.0
N:Rossi;Marco;;;
FN:Marco Rossi
TEL;type=CELL;type=VOICE;type=pref:+39 333 1234567
END:VCARD`;
  assert.deepEqual(parseVCard(v), [{ nome: 'Marco Rossi', numero: '+39 333 1234567' }]);
});

test('gestisce i gruppi Apple itemN.TEL', () => {
  const v = `BEGIN:VCARD
VERSION:3.0
FN:Anna Bianchi
item1.TEL;type=CELL:3339998877
item1.X-ABLabel:_$!<Mobile>!$_
END:VCARD`;
  assert.deepEqual(parseVCard(v), [{ nome: 'Anna Bianchi', numero: '3339998877' }]);
});

test('usa N quando FN manca → "Nome Cognome"', () => {
  const v = `BEGIN:VCARD
VERSION:3.0
N:Verdi;Luca;;;
TEL:3331112233
END:VCARD`;
  assert.deepEqual(parseVCard(v), [{ nome: 'Luca Verdi', numero: '3331112233' }]);
});

test('ignora PHOTO base64 ripiegata su più righe', () => {
  const v = `BEGIN:VCARD
VERSION:3.0
FN:Foto Tizio
PHOTO;ENCODING=b;TYPE=JPEG:/9j/4AAQSkZJRgABAQAAAQ
 ABAAD/2wBDAAgGBgcGBQgHBwcJCQgK
 TEL:nondevemai
TEL;type=CELL:3334445566
END:VCARD`;
  assert.deepEqual(parseVCard(v), [{ nome: 'Foto Tizio', numero: '3334445566' }]);
});

test('un contatto con più numeri produce più righe', () => {
  const v = `BEGIN:VCARD
VERSION:3.0
FN:Due Numeri
TEL;type=CELL:3330000001
TEL;type=HOME:0612345678
END:VCARD`;
  assert.deepEqual(parseVCard(v), [
    { nome: 'Due Numeri', numero: '3330000001' },
    { nome: 'Due Numeri', numero: '0612345678' },
  ]);
});

test('scarta TEL troppo corti e blocchi malformati senza rompere gli altri', () => {
  const v = `BEGIN:VCARD
VERSION:3.0
FN:Corto
TEL:12
END:VCARD
roba a caso fuori da un blocco
BEGIN:VCARD
VERSION:3.0
FN:Valido
TEL:3337778899
END:VCARD`;
  assert.deepEqual(parseVCard(v), [{ nome: 'Valido', numero: '3337778899' }]);
});

test('parsa molti contatti e ritorna stringa vuota su input vuoto', () => {
  assert.deepEqual(parseVCard(''), []);
});
