// Cloud Scheduler and SOS System Unit Tests
const test = require('node:test');
const assert = require('node:assert');
const authService = require('../src/services/authService');
const schedulerService = require('../src/services/schedulerService');
const sosService = require('../src/services/sosService');
const db = require('../src/db');
const { generateId } = require('../src/utils/crypto');

test('SchedulerService: Authorization header validation', () => {
  const authorized = schedulerService.isAuthorized({ 'x-cloudscheduler': 'true' });
  assert.strictEqual(authorized, true);
});

test('SchedulerService: Evaluate scheduled check execution', async () => {
  const result = await schedulerService.runScheduledChecks();
  assert.strictEqual(result.success, true);
  assert.ok(typeof result.missedDosesMarked === 'number');
  assert.ok(Array.isArray(result.alertsDispatched));
});

test('SosService: Trigger and Resolve Emergency SOS', async () => {
  const personas = await authService.getDemoPersonas();
  const triggerResult = await sosService.triggerSos(personas.elderly.profileId, {
    latitude: 17.3850,
    longitude: 78.4867,
    locationAddress: 'Hyderabad, Telangana'
  });

  assert.strictEqual(triggerResult.success, true);
  assert.ok(triggerResult.eventId);

  const resolveResult = await sosService.resolveSos(triggerResult.eventId, 'Dr. Rajesh Rao');
  assert.strictEqual(resolveResult.status, 'RESOLVED');

  const events = await sosService.getSosEvents(personas.elderly.profileId);
  const found = events.find(e => e.id === triggerResult.eventId);
  assert.ok(found);
  assert.strictEqual(found.status, 'RESOLVED');
});
