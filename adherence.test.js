// Adherence and Medication Unit Tests
const test = require('node:test');
const assert = require('node:assert');
const authService = require('../src/services/authService');
const adherenceService = require('../src/services/adherenceService');
const medicationService = require('../src/services/medicationService');

test('AdherenceService: Fetch today doses for elderly user', async () => {
  const personas = await authService.getDemoPersonas();
  const doses = await adherenceService.getDosesForDate(personas.elderly.profileId);
  assert.ok(Array.isArray(doses));
  assert.ok(doses.length > 0, 'Should have at least 1 dose scheduled today');
  assert.ok(doses[0].medication_name, 'Dose should include joined medication name');
});

test('AdherenceService: Record TAKE dose and verify inventory deduction', async () => {
  const personas = await authService.getDemoPersonas();
  const doses = await adherenceService.getDosesForDate(personas.elderly.profileId);
  const pendingDose = doses.find(d => d.status === 'PENDING') || doses[0];

  const beforeMed = await medicationService.getMedicationById(pendingDose.medication_id);
  const beforeQty = beforeMed.remaining_quantity;

  const result = await adherenceService.recordDoseAction(pendingDose.log_id, 'TAKE');
  assert.strictEqual(result.status, 'TAKEN');

  const afterMed = await medicationService.getMedicationById(pendingDose.medication_id);
  assert.strictEqual(afterMed.remaining_quantity, beforeQty - 1);
});

test('AdherenceService: Compute 7-day adherence stats and streak', async () => {
  const personas = await authService.getDemoPersonas();
  const stats = await adherenceService.getAdherenceStats(personas.elderly.profileId, 7);
  assert.ok(typeof stats.adherenceRate === 'number');
  assert.ok(stats.adherenceRate >= 0 && stats.adherenceRate <= 100);
  assert.strictEqual(stats.heatmap.length, 7);
});
