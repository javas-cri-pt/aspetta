import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nameForNumber, groupByInitial } from '../js/contacts.js';

const rubrica = [
  { nome: 'Marco Rossi', numero: '+39 333 1234567' },
  { nome: 'anna bianchi', numero: '3339998877' },
  { nome: 'Àlex', numero: '3331112200' },
  { nome: '+39 02 99999', numero: '0299999' },
];

test('nameForNumber risolve il nome e fa fallback al numero', () => {
  assert.equal(nameForNumber('3331234567', rubrica), 'Marco Rossi');
  assert.equal(nameForNumber('3330000000', rubrica), '3330000000');
});

test('groupByInitial ordina e raggruppa per iniziale', () => {
  const g = groupByInitial(rubrica);
  const letters = g.map((s) => s.letter);
  assert.deepEqual(letters, ['A', 'M', '#']);
  assert.deepEqual(g[0].items.map((c) => c.nome), ['Àlex', 'anna bianchi']);
  assert.equal(g[2].letter, '#');
  assert.equal(g[2].items[0].nome, '+39 02 99999');
});

test('groupByInitial gestisce lista vuota', () => {
  assert.deepEqual(groupByInitial([]), []);
});
