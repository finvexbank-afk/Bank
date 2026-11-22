// Maps Firebase Auth / Firestore error codes to translation keys under `auth.errors`.
// The raw code is always logged by the caller so the real cause stays debuggable.

const ERROR_KEYS = {
  'auth/email-already-in-use': 'emailExists',
  'auth/invalid-email': 'invalidEmail',
  'auth/weak-password': 'weakPassword',
  'auth/too-many-requests': 'tooManyRequests',
  'auth/network-request-failed': 'networkError',
  'auth/invalid-credential': 'invalidCredentials',
  'auth/wrong-password': 'invalidCredentials',
  'auth/user-not-found': 'invalidCredentials',
  'permission-denied': 'permissionDenied',
  'firestore/permission-denied': 'permissionDenied',
  unavailable: 'networkError',
};

export function getFirebaseErrorKey(error) {
  if (!error) return 'generalError';
  return ERROR_KEYS[error.code] || 'generalError';
}

export function isProfileWriteError(error) {
  const code = error?.code || '';
  return code === 'permission-denied' || code === 'firestore/permission-denied' || code === 'unavailable';
}
