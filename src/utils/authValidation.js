// Pure validation helpers shared by the signup form and its unit tests.
// They return a translation KEY (or null), never a message, so the UI stays translatable.

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^[+()\d\s.-]{7,}$/;
export const PIN_PATTERN = /^\d{4}$/;
export const MIN_PASSWORD_LENGTH = 6;

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

/**
 * Validate one signup step.
 * @param {number} step 1..4
 * @param {object} data form data
 * @returns {string|null} translation key under `auth.errors`, or null when valid
 */
export function validateSignupStep(step, data = {}) {
  switch (step) {
    case 1:
      if (!hasText(data.firstName) || !hasText(data.lastName) || !hasText(data.username)) {
        return 'fillRequired';
      }
      return null;

    case 2:
      if (!EMAIL_PATTERN.test((data.email || '').trim())) return 'invalidEmail';
      if (!PHONE_PATTERN.test((data.phone || '').trim())) return 'invalidPhone';
      if (!hasText(data.country)) return 'countryRequired';
      return null;

    case 3:
      if (!PIN_PATTERN.test(data.transactionPin || '')) return 'invalidPin';
      return null;

    case 4:
      if ((data.password || '').length < MIN_PASSWORD_LENGTH) return 'weakPassword';
      if (data.password !== data.confirmPassword) return 'passwordMismatch';
      if (!data.termsAccepted) return 'termsRequired';
      return null;

    default:
      return null;
  }
}

/** Validate every step before calling Firebase (defensive: the user may have edited a previous step). */
export function validateSignupForm(data = {}) {
  for (const step of [1, 2, 3, 4]) {
    const errorKey = validateSignupStep(step, data);
    if (errorKey) return { step, errorKey };
  }
  return null;
}
