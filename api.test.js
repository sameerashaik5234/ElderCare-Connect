// Comprehensive REST API Integration Tests
const test = require('node:test');
const assert = require('node:assert');
const { handleApiRequest } = require('../src/routes/apiRoutes');

function createMockReqRes(method, headers = {}, body = {}) {
  let statusCode = 200;
  let responseData = '';
  const responseHeaders = {};

  const req = {
    method,
    headers: { ...headers }
  };

  const res = {
    setHeader: (key, val) => { responseHeaders[key] = val; },
    writeHead: (code) => { statusCode = code; },
    end: (data) => { responseData = data; }
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getBody: () => responseData ? JSON.parse(responseData) : null,
    getHeaders: () => responseHeaders
  };
}

test('API: GET /api/health returns status UP and medical disclaimer', async () => {
  const { req, res, getStatus, getBody } = createMockReqRes('GET');
  await handleApiRequest(req, res, '/api/health', {}, {});
  assert.strictEqual(getStatus(), 200);
  const body = getBody();
  assert.strictEqual(body.status, 'UP');
  assert.ok(body.disclaimer.includes('medical diagnoses'));
});

test('API: GET /api/auth/demo-personas returns seed credentials', async () => {
  const { req, res, getStatus, getBody } = createMockReqRes('GET');
  await handleApiRequest(req, res, '/api/auth/demo-personas', {}, {});
  assert.strictEqual(getStatus(), 200);
  const body = getBody();
  assert.ok(body.personas.elderly);
  assert.ok(body.personas.caregiver);
  assert.strictEqual(body.personas.elderly.defaultPin, '1234');
});

test('API: POST /api/auth/pin-login logs in senior and returns token', async () => {
  const personasReq = createMockReqRes('GET');
  await handleApiRequest(personasReq.req, personasReq.res, '/api/auth/demo-personas', {}, {});
  const elderly = personasReq.getBody().personas.elderly;

  const { req, res, getStatus, getBody } = createMockReqRes('POST');
  await handleApiRequest(req, res, '/api/auth/pin-login', {}, {
    profileId: elderly.profileId,
    passcode: '1234'
  });

  assert.strictEqual(getStatus(), 200);
  const body = getBody();
  assert.ok(body.token);
  assert.strictEqual(body.user.role, 'ELDERLY');
});

test('API: GET /api/adherence/today returns active doses for senior', async () => {
  const personasReq = createMockReqRes('GET');
  await handleApiRequest(personasReq.req, personasReq.res, '/api/auth/demo-personas', {}, {});
  const elderly = personasReq.getBody().personas.elderly;

  const { req, res, getStatus, getBody } = createMockReqRes('GET');
  await handleApiRequest(req, res, '/api/adherence/today', { elderlyId: elderly.profileId }, {});
  assert.strictEqual(getStatus(), 200);
  const body = getBody();
  assert.ok(Array.isArray(body.doses));
  assert.ok(body.doses.length > 0);
});

test('API: POST /api/scheduler/check-reminders triggers routine evaluation', async () => {
  const { req, res, getStatus, getBody } = createMockReqRes('POST', { 'x-cloudscheduler': 'true' });
  await handleApiRequest(req, res, '/api/scheduler/check-reminders', {}, {});
  assert.strictEqual(getStatus(), 200);
  const body = getBody();
  assert.strictEqual(body.success, true);
  assert.ok(typeof body.missedDosesMarked === 'number');
});
