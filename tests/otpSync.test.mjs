import test from 'node:test';
import assert from 'node:assert/strict';
import { findLiveRequiresOtp } from '../netlify/functions/transfer.mjs';

const snapshotStep = { id: 'code_3', value: 'AB12-CD34', label: 'Code 3', requiresOtp: false };

test('OTP enabled after the transfer started is picked up from the live code config', () => {
  const liveSteps = [
    { id: 'code_1', value: 'AA11-BB22', requiresOtp: false },
    { id: 'code_2', value: 'CC33-DD44', requiresOtp: false },
    { id: 'code_3', value: 'AB12-CD34', requiresOtp: true }
  ];

  assert.equal(findLiveRequiresOtp(liveSteps, snapshotStep, 2), true);
});

test('live OTP flag is matched by code id even when the value changed', () => {
  const liveSteps = [{ id: 'code_3', value: 'ZZ99-YY88', requiresOtp: true }];
  assert.equal(findLiveRequiresOtp(liveSteps, snapshotStep, 0), true);
});

test('live OTP flag is matched by normalized value when ids are unavailable', () => {
  const liveSteps = [{ value: ' ab12 cd34 ', requiresOtp: true }];
  assert.equal(findLiveRequiresOtp(liveSteps, { value: 'AB12CD34', requiresOtp: false }, 0), true);
});

test('snapshot is used only when the live config has no matching code', () => {
  assert.equal(findLiveRequiresOtp([], snapshotStep, 9), false);
  assert.equal(findLiveRequiresOtp([{ id: 'other', value: 'XX11-YY22', requiresOtp: true }], snapshotStep, 9), false);
  assert.equal(findLiveRequiresOtp([], { ...snapshotStep, requiresOtp: true }, 9), true);
});
