// Auth and Security Unit Tests
const test = require('node:test');
const assert = require('node:assert');
const authService = require('../src/services/authService');
const { verifyToken } = require('../src/utils/crypto');

test('AuthService: Elderly login with valid PIN', async () => {
  const personas = await authService.getDemoPersonas();
  assert.ok(personas.elderly, 'Elderly demo profile should exist');

  const result = await authService.loginWithPasscode(personas.elderly.profileId, '1234');
  assert.ok(result.token, 'Token should be returned');
  assert.strictEqual(result.user.role, 'ELDERLY');

  const decoded = verifyToken(result.token);
  assert.ok(decoded);
  assert.strictEqual(decoded.profileId, personas.elderly.profileId);
});

test('AuthService: Elderly login with invalid PIN fails', async () => {
  const personas = await authService.getDemoPersonas();
  await assert.rejects(
    async () => {
      await authService.loginWithPasscode(personas.elderly.profileId, '9999');
    },
    /Incorrect PIN/
  );
});

test('AuthService: Caregiver login with valid password', async () => {
  const result = await authService.loginWithPassword('caregiver@eldercare.com', 'Caregiver@123');
  assert.ok(result.token);
  assert.strictEqual(result.user.role, 'CAREGIVER');
  assert.ok(result.user.linkedProfiles.length > 0);
});

test('AuthService: Caregiver login with wrong password fails', async () => {
  await assert.rejects(
    async () => {
      await authService.loginWithPassword('caregiver@eldercare.com', 'WrongPass!');
    },
    /Invalid email or password/
  );
});
