import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../src/utils/slugify.js';
import { mergeDeep } from '../src/utils/merge.js';

test('slugify normalizes but preserves tech symbols', () => {
  assert.equal(slugify('Node.js '), 'node.js');
  assert.equal(slugify('C++'), 'c++');
  assert.equal(slugify('C#'), 'c#');
  assert.equal(slugify('  Machine  Learning '), 'machine learning');
  assert.equal(slugify('React.js'), 'react.js');
});

test('mergeDeep merges objects and replaces arrays', () => {
  const target = { a: 1, nested: { x: 1, y: 2 }, list: [1, 2, 3] };
  const source = { b: 2, nested: { y: 9, z: 3 }, list: [9] };
  const out = mergeDeep(target, source);
  assert.deepEqual(out, { a: 1, b: 2, nested: { x: 1, y: 9, z: 3 }, list: [9] });
});

test('mergeDeep ignores undefined values in source', () => {
  const out = mergeDeep({ a: 1 }, { a: undefined, b: 2 });
  assert.deepEqual(out, { a: 1, b: 2 });
});
