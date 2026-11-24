import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../netlify/functions/transfer.mjs';

let idCounter = 0;
const nextId = (prefix) => `${prefix}_${++idCounter}`;

class MockSnapshot {
  constructor(id, data, exists = true) {
    this.id = id;
    this._data = data;
    this.exists = exists;
  }

  data() {
    return this._data ? { ...this._data } : undefined;
  }
}

class MockDocRef {
  constructor(store, collectionName, id) {
    this.store = store;
    this.collectionName = collectionName;
    this.id = id;
  }

  async get() {
    const data = this.store[this.collectionName][this.id];
    return new MockSnapshot(this.id, data, Boolean(data));
  }

  async set(data, options = {}) {
    const bucket = this.store[this.collectionName];
    bucket[this.id] = options.merge ? { ...(bucket[this.id] || {}), ...data } : { ...data };
  }

  async update(data) {
    const bucket = this.store[this.collectionName];
    if (!bucket[this.id]) throw new Error(`Missing document ${this.collectionName}/${this.id}`);
    bucket[this.id] = { ...bucket[this.id], ...data };
  }
}

class MockQuery {
  constructor(store, collectionName, filters) {
    this.store = store;
    this.collectionName = collectionName;
    this.filters = filters;
  }

  limit(count) {
    return new MockQuery(this.store, this.collectionName, this.filters, count);
  }

  async get() {
    let docs = Object.entries(this.store[this.collectionName])
      .map(([id, data]) => new MockSnapshot(id, data));
    for (const { field, value } of this.filters) {
      docs = docs.filter((doc) => doc.data()?.[field] === value);
    }
    return { docs };
  }
}

class MockCollectionRef {
  constructor(store, collectionName) {
    this.store = store;
    this.collectionName = collectionName;
  }

  doc(id) {
    return new MockDocRef(this.store, this.collectionName, id || nextId(this.collectionName));
  }

  where(field, _operator, value) {
    return new MockQuery(this.store, this.collectionName, [{ field, value }]);
  }

  async get() {
    const docs = Object.entries(this.store[this.collectionName])
      .map(([id, data]) => new MockSnapshot(id, data));
    return { docs };
  }
}

function createMockDb(store) {
  return {
    collection: (name) => new MockCollectionRef(store, name),
    runTransaction: async (callback) => callback({
      get: (ref) => ref.get(),
      set: (ref, data) => ref.set(data),
      update: (ref, data) => ref.update(data)
    })
  };
}

function createClientCodes() {
  return [
    { id: 'code_1', label: 'Code 1', value: 'AAAA-1111', message: 'Premier code', requiresOtp: false, enabled: true },
    { id: 'code_2', label: 'Code 2', value: 'BBBB-2222', message: 'Deuxième code', requiresOtp: false, enabled: true },
    { id: 'code_3', label: 'Code 3', value: 'CCCC-3333', message: 'Troisième code', requiresOtp: false, enabled: true }
  ];
}

function setup({ emailSent = true } = {}) {
  const store = {
    users: {
      'user-1': {
        id: 'user-1', name: 'Jean Client', email: 'jean@example.com', role: 'client',
        balance: 1000, transferCodes: createClientCodes()
      },
      'admin-1': { id: 'admin-1', name: 'Admin', email: 'admin@example.com', role: 'admin', balance: 0 }
    },
    transferRequests: {},
    transferCodes: {},
    notifications: {},
    transactions: {}
  };
  const emails = [];
  const emailSender = async (message) => {
    emails.push(message);
    return emailSent;
  };
  const auth = {
    verifyIdToken: async (token) => ({ uid: token === 'admin-token' ? 'admin-1' : 'user-1' })
  };
  const handler = createHandler({
    getDb: () => createMockDb(store),
    getAuthFn: () => auth,
    sendEmailFn: emailSender
  });

  const call = async (action, payload = {}, token = 'user-token') => {
    const response = await handler({
      httpMethod: 'POST',
      body: JSON.stringify({ action, idToken: token, ...payload })
    });
    return { status: response.statusCode, body: JSON.parse(response.body) };
  };

  const notifications = () => Object.entries(store.notifications).map(([id, data]) => ({ id, ...data }));

  return { store, emails, call, notifications };
}

test('end-to-end: OTP enabled after the transfer started blocks finalization until OTP is valid', async () => {
  const { store, call, notifications } = setup();

  const initiated = await call('initiate', {
    transfer: { amount: 100, to: 'Marie', speed: 'Standard', scope: 'Local', description: 'Test' }
  });
  assert.equal(initiated.status, 200);
  const requestId = initiated.body.requestId;
  assert.equal(initiated.body.code.label, 'Code 1');

  // The admin enables OTP on code 3 after the request snapshot was created.
  store.users['user-1'].transferCodes[2].requiresOtp = true;

  // Go through codes 1 and 2 normally.
  const step2 = await call('verifyCode', { requestId, codeValue: 'AAAA-1111' });
  assert.equal(step2.status, 200);
  assert.equal(step2.body.nextCode.label, 'Code 2');

  const step3 = await call('verifyCode', { requestId, codeValue: 'BBBB-2222' });
  assert.equal(step3.status, 200);
  assert.equal(step3.body.nextCode.label, 'Code 3');

  const otpStep = await call('verifyCode', { requestId, codeValue: 'CCCC-3333' });
  assert.equal(otpStep.status, 200);
  assert.equal(otpStep.body.otp, true);
  assert.equal(otpStep.body.phase, 'otp');
  assert.equal(otpStep.body.otpDelivery, 'email');

  const request = store.transferRequests[requestId];
  assert.equal(request.status, 'awaiting_otp');
  assert.match(request.otpValue, /^\d{6}$/);
  assert.equal(request.otpCodeId, 'code_3');
  assert.ok(request.otpHash);

  const clientOtpNotification = notifications().find((item) => item.id === `${requestId}_client_otp_code_2`);
  assert.ok(clientOtpNotification, 'client OTP notification must exist');
  assert.equal(clientOtpNotification.userId, 'user-1');
  assert.ok(clientOtpNotification.body.includes(request.otpValue));

  const adminOtpNotification = notifications().find((item) => item.id === `${requestId}_admin_otp_2`);
  assert.ok(adminOtpNotification, 'admin OTP notification must exist');
  assert.equal(adminOtpNotification.audience, 'admin');
  assert.ok(!adminOtpNotification.body.includes(request.otpValue));

  const wrongOtp = await call('finalize', { requestId, otp: '000000' === request.otpValue ? '111111' : '000000' });
  assert.equal(wrongOtp.status, 400);

  const completed = await call('finalize', { requestId, otp: request.otpValue });
  assert.equal(completed.status, 200);
  assert.ok(completed.body.reference);
  assert.equal(store.users['user-1'].balance, 900);
  assert.equal(store.transferRequests[requestId].status, 'completed');
  const transaction = Object.values(store.transactions)[0];
  assert.equal(transaction.requestId, requestId);
  assert.equal(transaction.amount, -100);
});

test('end-to-end: OTP is delivered in a notification when email is unavailable', async () => {
  const { store, call, notifications } = setup({ emailSent: false });
  store.users['user-1'].transferCodes[0].requiresOtp = true;

  const initiated = await call('initiate', { transfer: { amount: 50, to: 'Paul' } });
  const requestId = initiated.body.requestId;

  const otpStep = await call('verifyCode', { requestId, codeValue: 'AAAA-1111' });
  assert.equal(otpStep.status, 200);
  assert.equal(otpStep.body.otpDelivery, 'notification');
  assert.equal(otpStep.body.emailSent, false);

  const otp = store.transferRequests[requestId].otpValue;
  const clientNotification = notifications().find((item) => item.id === `${requestId}_client_otp_code_0`);
  assert.ok(clientNotification.body.includes(otp));
  assert.ok(clientNotification.body.includes('e-mail n\'est pas disponible'));
});

test('end-to-end: admin can send the confirmation code via notification with the real value', async () => {
  const { call, notifications } = setup();

  const forbidden = await call('sendClientCodeNotification', { uid: 'user-1', codeId: 'code_3' });
  assert.equal(forbidden.status, 403);

  const sent = await call('sendClientCodeNotification', { uid: 'user-1', codeId: 'code_3' }, 'admin-token');
  assert.equal(sent.status, 200);
  assert.equal(sent.body.code.value, 'CCCC-3333');

  const notification = notifications().find((item) => item.code === 'CCCC-3333');
  assert.ok(notification, 'notification must contain the code field');
  assert.equal(notification.userId, 'user-1');
  assert.equal(notification.audience, 'client');
  assert.ok(notification.body.includes('CCCC-3333'));
});

test('end-to-end: email delivery notification also contains the real code value', async () => {
  const { call, emails, notifications } = setup();

  const sent = await call('sendClientCodeEmail', { uid: 'user-1', codeId: 'code_2' }, 'admin-token');
  assert.equal(sent.status, 200);

  const notification = notifications().find((item) => item.code === 'BBBB-2222');
  assert.ok(notification.body.includes('BBBB-2222'));
  assert.ok(emails[0].html.includes('BBBB-2222'));
});
