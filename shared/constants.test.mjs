import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filmStocks, getFilmStock } from './film-stocks.ts';
import { MAX_EDGE } from './image-constants.ts';

test('film stock lookup returns the canonical shared entry', () => {
  assert.equal(getFilmStock('kodak-colorplus-200'), filmStocks['kodak-colorplus-200']);
  assert.equal(filmStocks['kodak-tri-x-400'].type, 'bw');
});

test('shared image output is capped at 2048px', () => {
  assert.equal(MAX_EDGE, 2048);
});
