import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultClientCodes, findMatchingClientCode } from '../src/utils/transferCodes.js';

test('default client codes contain three active references', () => {
  const codes = createDefaultClientCodes('fr');
  assert.equal(codes.length, 3);
  assert.ok(codes.every((code) => code.enabled === true));
  assert.ok(codes.every((code) => /^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code.value)));
});

test('code matching ignores spaces, dashes and case', () => {
  const codes = [{ value: 'AB12-CD34', enabled: true }];
  assert.ok(findMatchingClientCode(codes, ' ab12 cd34 '));
  assert.equal(findMatchingClientCode(codes, 'AB12-CD35'), undefined);
});

test('disabled codes cannot be used', () => {
  const codes = [{ value: 'AB12-CD34', enabled: false }];
  assert.equal(findMatchingClientCode(codes, 'AB12CD34'), undefined);
});
