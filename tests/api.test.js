const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../api/index.js');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
});

test('GET / returns the health check message', async () => {
  const res = await fetch(`${baseUrl}/`);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), 'express-shevchenko');
});

test('POST / declines a single person into the requested case', async () => {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grammaticalCase: 'родовий',
      personData: { gender: 'masculine', familyName: 'Шевченко', givenName: 'Тарас' },
    }),
  });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { familyName: 'Шевченка', givenName: 'Тараса' });
});

test('POST / declines a batch array in order', async () => {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([
      { grammaticalCase: 'родовий', personData: { gender: 'masculine', familyName: 'Шевченко' } },
      { grammaticalCase: 'кличний', personData: { gender: 'feminine', familyName: 'Мельник' } },
    ]),
  });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), [{ familyName: 'Шевченка' }, { familyName: 'Мельник' }]);
});

test('POST / normalizes short Ukrainian gender codes before declining', async () => {
  const shortCode = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grammaticalCase: 'родовий',
      personData: { gender: 'ч', familyName: 'Шевченко' },
    }),
  });
  assert.equal(shortCode.status, 200);
  assert.deepEqual(await shortCode.json(), { familyName: 'Шевченка' });
});

test('POST / rejects a request missing personData', async () => {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grammaticalCase: 'родовий' }),
  });
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: 'grammaticalCase and personData are required' });
});

test('POST / rejects an unknown grammatical case', async () => {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grammaticalCase: 'орудний2',
      personData: { gender: 'masculine', familyName: 'Шевченко' },
    }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /Unknown grammatical case/);
});

test('POST / rejects an empty batch array', async () => {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([]),
  });
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: 'Request body is required' });
});
