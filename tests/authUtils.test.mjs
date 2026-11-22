import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSignupStep,
  validateSignupForm,
  EMAIL_PATTERN,
  PIN_PATTERN,
} from '../src/utils/authValidation.js';
import { getFirebaseErrorKey, isProfileWriteError } from '../src/utils/firebaseErrors.js';

const validUser = {
  firstName: 'Jane',
  middleName: '',
  lastName: 'Doe',
  username: 'janedoe',
  email: 'jane.doe@example.com',
  phone: '+33 6 12 34 56 78',
  country: 'France',
  accountType: 'Checking',
  transactionPin: '1234',
  password: 'Secure123',
  confirmPassword: 'Secure123',
  termsAccepted: true,
};

test('step 1 requires first name, last name and username', () => {
  assert.equal(validateSignupStep(1, validUser), null);
  assert.equal(validateSignupStep(1, { ...validUser, firstName: '  ' }), 'fillRequired');
  assert.equal(validateSignupStep(1, { ...validUser, lastName: '' }), 'fillRequired');
  assert.equal(validateSignupStep(1, { ...validUser, username: '' }), 'fillRequired');
});

test('step 2 validates email, phone and country', () => {
  assert.equal(validateSignupStep(2, validUser), null);
  assert.equal(validateSignupStep(2, { ...validUser, email: 'not-an-email' }), 'invalidEmail');
  assert.equal(validateSignupStep(2, { ...validUser, email: '' }), 'invalidEmail');
  assert.equal(validateSignupStep(2, { ...validUser, phone: '123' }), 'invalidPhone');
  assert.equal(validateSignupStep(2, { ...validUser, country: '' }), 'countryRequired');
});

test('step 3 requires exactly four digits', () => {
  assert.equal(PIN_PATTERN.test('1234'), true);
  assert.equal(PIN_PATTERN.test('12a4'), false);
  assert.equal(validateSignupStep(3, validUser), null);
  assert.equal(validateSignupStep(3, { ...validUser, transactionPin: '123' }), 'invalidPin');
  assert.equal(validateSignupStep(3, { ...validUser, transactionPin: '12345' }), 'invalidPin');
  assert.equal(validateSignupStep(3, { ...validUser, transactionPin: 'abcd' }), 'invalidPin');
});

test('step 4 enforces Firebase password length, match and terms', () => {
  assert.equal(validateSignupStep(4, validUser), null);
  assert.equal(validateSignupStep(4, { ...validUser, password: '123' }), 'weakPassword');
  assert.equal(validateSignupStep(4, { ...validUser, password: 'Secure123', confirmPassword: 'Different1' }), 'passwordMismatch');
  assert.equal(validateSignupStep(4, { ...validUser, termsAccepted: false }), 'termsRequired');
});

test('full form validation reports the first failing step', () => {
  assert.equal(validateSignupForm(validUser), null);
  assert.deepEqual(validateSignupForm({ ...validUser, country: '', transactionPin: '1' }), {
    step: 2,
    errorKey: 'countryRequired',
  });
  assert.equal(EMAIL_PATTERN.test('a@b.co'), true);
});

test('Firebase codes map to translatable keys', () => {
  assert.equal(getFirebaseErrorKey({ code: 'auth/email-already-in-use' }), 'emailExists');
  assert.equal(getFirebaseErrorKey({ code: 'auth/weak-password' }), 'weakPassword');
  assert.equal(getFirebaseErrorKey({ code: 'auth/too-many-requests' }), 'tooManyRequests');
  assert.equal(getFirebaseErrorKey({ code: 'permission-denied' }), 'permissionDenied');
  assert.equal(getFirebaseErrorKey({ code: 'auth/some-unknown-code' }), 'generalError');
  assert.equal(getFirebaseErrorKey(null), 'generalError');
});

test('profile write failures are detected for retry', () => {
  assert.equal(isProfileWriteError({ code: 'permission-denied' }), true);
  assert.equal(isProfileWriteError({ code: 'unavailable' }), true);
  assert.equal(isProfileWriteError({ code: 'auth/weak-password' }), false);
});
