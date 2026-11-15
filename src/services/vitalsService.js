// Healthcare Vitals & Mood Tracking Service
const db = require('../db');
const { generateId } = require('../utils/crypto');
const { VITAL_TYPES } = require('../config/constants');

class VitalsService {
  /**
   * Record a new vital log
   */
  async logVital(elderlyId, data) {
    const id = generateId();
    await db.execute(
      `INSERT INTO vital_logs (
        id, elderly_id, type, value_primary, value_secondary, unit, mood_tag, notes, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        elderlyId,
        data.type,
        parseFloat(data.value_primary || '0'),
        data.value_secondary ? parseFloat(data.value_secondary) : null,
        data.unit || '',
        data.mood_tag || 'GOOD',
        data.notes || '',
        data.recorded_at || new Date().toISOString()
      ]
    );

    return db.queryOne('SELECT * FROM vital_logs WHERE id = ?', [id]);
  }

  /**
   * Get all vitals for an elderly profile
   */
  async getVitals(elderlyId, limit = 50) {
    return db.queryAll(
      `SELECT * FROM vital_logs 
       WHERE elderly_id = ? 
       ORDER BY recorded_at DESC LIMIT ?`,
      [elderlyId, limit]
    );
  }

  /**
   * Compute Clinical Correlation between Medication Adherence & Blood Pressure / Glucose
   */
  async getCorrelationAnalytics(elderlyId, days = 7) {
    const vitals = await db.queryAll(
      `SELECT * FROM vital_logs 
       WHERE elderly_id = ? 
       ORDER BY recorded_at ASC`,
      [elderlyId]
    );

    const adherenceLogs = await db.queryAll(
      `SELECT scheduled_date, status 
       FROM adherence_logs 
       WHERE elderly_id = ? 
       ORDER BY scheduled_date ASC`,
      [elderlyId]
    );

    // Group adherence by date
    const adherenceByDate = {};
    for (const log of adherenceLogs) {
      if (!adherenceByDate[log.scheduled_date]) {
        adherenceByDate[log.scheduled_date] = { total: 0, taken: 0 };
      }
      adherenceByDate[log.scheduled_date].total++;
      if (log.status === 'TAKEN') {
        adherenceByDate[log.scheduled_date].taken++;
      }
    }

    // Build timeline points
    const pointsByDate = {};
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const adh = adherenceByDate[dateStr] || { total: 0, taken: 0 };
      const score = adh.total > 0 ? Math.round((adh.taken / adh.total) * 100) : null;

      pointsByDate[dateStr] = {
        date: dateStr,
        dayLabel: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        adherenceRate: score,
        systolic: null,
        diastolic: null,
        glucose: null,
        mood: null
      };
    }

    // Map vitals into points
    for (const v of vitals) {
      const dStr = v.recorded_at.split('T')[0];
      if (pointsByDate[dStr]) {
        if (v.type === VITAL_TYPES.BLOOD_PRESSURE) {
          pointsByDate[dStr].systolic = v.value_primary;
          pointsByDate[dStr].diastolic = v.value_secondary;
        } else if (v.type === VITAL_TYPES.GLUCOSE) {
          pointsByDate[dStr].glucose = v.value_primary;
        }
        if (v.mood_tag) {
          pointsByDate[dStr].mood = v.mood_tag;
        }
      }
    }

    return Object.values(pointsByDate);
  }
}

module.exports = new VitalsService();
