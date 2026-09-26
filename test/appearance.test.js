const test = require('node:test');
const assert = require('node:assert/strict');
const { validSizeIndex, sizeIndexFor, validDisplayTarget, displaysForTarget } = require('../electron/appearance');

test('size settings inherit from all animals, then species, then coat', () => {
  const variant = { id: 'rabbit-netherland-fawn', species: 'rabbit' };
  const settings = { size: 1, sizeBySpecies: {}, sizeByVariant: {} };
  assert.equal(sizeIndexFor(settings, variant), 1);
  settings.sizeBySpecies.rabbit = 3;
  assert.equal(sizeIndexFor(settings, variant), 3);
  settings.sizeByVariant[variant.id] = 0;
  assert.equal(sizeIndexFor(settings, variant), 0);
  delete settings.sizeByVariant[variant.id];
  assert.equal(sizeIndexFor(settings, variant), 3);
  assert.equal(validSizeIndex('2'), false);
  assert.equal(validSizeIndex(4), false);
});

test('display target supports cursor, all, named display and disconnected fallback', () => {
  const displays = [{ id: 10 }, { id: 20 }, { id: 30 }];
  assert.deepEqual(displaysForTarget('cursor', displays, 10, 20), [displays[1]]);
  assert.deepEqual(displaysForTarget('all', displays, 10, 20), displays);
  assert.deepEqual(displaysForTarget('display:30', displays, 10, 20), [displays[2]]);
  assert.deepEqual(displaysForTarget('display:99', displays, 10, 20), [displays[0]]);
  assert.deepEqual(displaysForTarget('primary', displays, 10, 20), [displays[0]]);
  assert.deepEqual(displaysForTarget('all', [], 10, 20), []);
  assert.equal(validDisplayTarget('display:20'), true);
  assert.equal(validDisplayTarget('display:unknown'), false);
});
