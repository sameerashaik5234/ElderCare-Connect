// Adherence Tracking and Dose Logging Service
const db = require('../db');
const { DOSE_STATUS } = require('../config/constants');
const { generateId } = require('../utils/crypto');

class AdherenceService {
  /**
   * Get all doses for a specific date (defaults to today)
   * Auto-generates pending records from active medications if missing.
   */
  async getDosesForDate(elderlyId, dateStr = null) {
    if (!dateStr) {
      dateStr = new Date().toISOString().split('T')[0];
    }

    // Auto-generate missing schedule entries for active meds
    const activeMeds = await db.queryAll(
      'SELECT id, time_slots FROM medications WHERE elderly_id = ? AND is_active = 1',
      [elderlyId]
    );

    for (const med of activeMeds) {
      const slots = JSON.parse(med.time_slots || '[]');
      for (const time of slots) {
        const existing = await db.queryOne(
          `SELECT id FROM adherence_logs 
           WHERE medication_id = ? AND scheduled_date = ? AND scheduled_time = ?`,
          [med.id, dateStr, time]
        );
        if (!existing) {
          await db.execute(
            `INSERT INTO adherence_logs (
              id, medication_id, elderly_id, scheduled_date, scheduled_time, 
              scheduled_datetime, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [generateId(), med.id, elderlyId, dateStr, time, `${dateStr} ${time}`, DOSE_STATUS.PENDING]
          );
        }
      }
    }

    // Fetch full dose details joined with medication attributes
    const doses = await db.queryAll(
      `SELECT 
        al.id as log_id,
        al.medication_id,
        al.scheduled_date,
        al.scheduled_time,
        al.scheduled_datetime,
        al.taken_datetime,
        al.status,
        al.snooze_until,
        al.skip_reason,
        al.notes,
        m.name as medication_name,
        m.name_te as medication_name_te,
        m.name_hi as medication_name_hi,
        m.dosage,
        m.dosage_te,
        m.dosage_hi,
        m.form,
        m.pill_color,
        m.pill_shape,
        m.meal_timing,
        m.instructions,
        m.instructions_te,
        m.instructions_hi,
        m.remaining_quantity,
        m.refill_threshold
       FROM adherence_logs al
       JOIN medications m ON al.medication_id = m.id
       WHERE al.elderly_id = ? AND al.scheduled_date = ?
       ORDER BY al.scheduled_time ASC, m.name ASC`,
      [elderlyId, dateStr]
    );

    return doses;
  }

  /**
   * Record a dose action: TAKE, SNOOZE, SKIP
   */
  async recordDoseAction(logId, action, options = {}) {
    const log = await db.queryOne(
      `SELECT al.*, m.name, m.remaining_quantity, m.refill_threshold, ep.emergency_contact_email 
       FROM adherence_logs al
       JOIN medications m ON al.medication_id = m.id
       JOIN elderly_profiles ep ON al.elderly_id = ep.id
       WHERE al.id = ?`,
      [logId]
    );

    if (!log) {
      throw new Error('Dose record not found');
    }

    const recordedBy = options.recordedBy || 'SELF';
    const nowIso = new Date().toISOString();

    if (action === 'TAKE') {
      await db.execute(
        `UPDATE adherence_logs SET 
          status = ?, taken_datetime = ?, recorded_by = ?, notes = ?
         WHERE id = ?`,
        [DOSE_STATUS.TAKEN, nowIso, recordedBy, options.notes || null, logId]
      );

      // Decrement remaining pills
      if (log.remaining_quantity > 0) {
        const newQty = log.remaining_quantity - 1;
        await db.execute('UPDATE medications SET remaining_quantity = ? WHERE id = ?', [newQty, log.medication_id]);

        // If newly low stock, record notification
        if (newQty <= log.refill_threshold && (log.remaining_quantity > log.refill_threshold)) {
          await db.execute(
            `INSERT INTO notification_logs (id, elderly_id, recipient_email, subject, type, payload)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              generateId(),
              log.elderly_id,
              log.emergency_contact_email || 'caregiver@eldercare.com',
              `Refill Alert: ${log.name} has only ${newQty} pills remaining`,
              'REFILL_ALERT',
              JSON.stringify({ medicationId: log.medication_id, remaining: newQty })
            ]
          );
        }
      }

      return { success: true, status: DOSE_STATUS.TAKEN, takenAt: nowIso };
    }

    if (action === 'SNOOZE') {
      const snoozeMinutes = options.minutes || 15;
      const snoozeUntil = new Date(Date.now() + snoozeMinutes * 60 * 1000).toISOString();
      await db.execute(
        `UPDATE adherence_logs SET status = ?, snooze_until = ?, recorded_by = ? WHERE id = ?`,
        [DOSE_STATUS.SNOOZED, snoozeUntil, recordedBy, logId]
      );
      return { success: true, status: DOSE_STATUS.SNOOZED, snoozeUntil };
    }

    if (action === 'SKIP') {
      await db.execute(
        `UPDATE adherence_logs SET status = ?, skip_reason = ?, recorded_by = ? WHERE id = ?`,
        [DOSE_STATUS.SKIPPED, options.reason || 'Patient opted to skip', recordedBy, logId]
      );
      return { success: true, status: DOSE_STATUS.SKIPPED, reason: options.reason };
    }

    throw new Error(`Unsupported dose action: ${action}`);
  }

  /**
   * Compute comprehensive adherence analytics (7-day / 30-day compliance, streak)
   */
  async getAdherenceStats(elderlyId, days = 7) {
    const logs = await db.queryAll(
      `SELECT scheduled_date, status 
       FROM adherence_logs 
       WHERE elderly_id = ? 
       ORDER BY scheduled_date DESC`,
      [elderlyId]
    );

    // Group by date
    const byDate = {};
    let totalDoses = 0;
    let takenDoses = 0;
    let missedDoses = 0;
    let snoozedDoses = 0;
    let skippedDoses = 0;

    for (const log of logs) {
      if (!byDate[log.scheduled_date]) {
        byDate[log.scheduled_date] = { total: 0, taken: 0, missed: 0, snoozed: 0, skipped: 0 };
      }
      byDate[log.scheduled_date].total++;
      totalDoses++;

      if (log.status === DOSE_STATUS.TAKEN) {
        byDate[log.scheduled_date].taken++;
        takenDoses++;
      } else if (log.status === DOSE_STATUS.MISSED) {
        byDate[log.scheduled_date].missed++;
        missedDoses++;
      } else if (log.status === DOSE_STATUS.SNOOZED) {
        byDate[log.scheduled_date].snoozed++;
        snoozedDoses++;
      } else if (log.status === DOSE_STATUS.SKIPPED) {
        byDate[log.scheduled_date].skipped++;
        skippedDoses++;
      }
    }

    const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

    // Calculate current consecutive day streak
    let streak = 0;
    const sortedDates = Object.keys(byDate).sort().reverse();
    for (const date of sortedDates) {
      const day = byDate[date];
      if (day.taken > 0 && day.missed === 0) {
        streak++;
      } else if (day.missed > 0) {
        break;
      }
    }

    // Heatmap data for the past N days
    const heatmap = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const stats = byDate[dStr] || { total: 0, taken: 0, missed: 0, snoozed: 0, skipped: 0 };
      const score = stats.total > 0 ? Math.round((stats.taken / stats.total) * 100) : null;
      heatmap.push({
        date: dStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        ...stats,
        score
      });
    }

    return {
      adherenceRate,
      streak,
      totalDoses,
      takenDoses,
      missedDoses,
      snoozedDoses,
      skippedDoses,
      heatmap
    };
  }
}

module.exports = new AdherenceService();
