// Emergency SOS Service
const db = require('../db');
const { generateId } = require('../utils/crypto');
const notificationService = require('./notificationService');

class SosService {
  /**
   * Trigger an Emergency SOS Event
   */
  async triggerSos(elderlyId, { latitude = null, longitude = null, locationAddress = null } = {}) {
    const elderly = await db.queryOne('SELECT * FROM elderly_profiles WHERE id = ?', [elderlyId]);
    if (!elderly) throw new Error('Elderly profile not found');

    const id = generateId();
    const triggeredAt = new Date().toISOString();

    await db.execute(
      `INSERT INTO sos_events (id, elderly_id, triggered_at, latitude, longitude, location_address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, elderlyId, triggeredAt, latitude, longitude, locationAddress, 'TRIGGERED']
    );

    // Dispatch instant Emergency SOS notification to family & caregiver
    await notificationService.sendSosAlert(elderly, { latitude, longitude, locationAddress });

    console.warn(`[SOS] 🚨 EMERGENCY TRIGGERED by ${elderly.full_name} at ${triggeredAt}!`);

    return {
      success: true,
      eventId: id,
      patientName: elderly.full_name,
      triggeredAt,
      emergencyContact: {
        name: elderly.emergency_contact_name,
        phone: elderly.emergency_contact_phone,
        email: elderly.emergency_contact_email
      }
    };
  }

  /**
   * Caregiver Acknowledge or Resolve SOS
   */
  async resolveSos(eventId, acknowledgedBy = 'Caregiver') {
    await db.execute(
      `UPDATE sos_events SET status = 'RESOLVED', acknowledged_by = ? WHERE id = ?`,
      [acknowledgedBy, eventId]
    );
    return { success: true, eventId, status: 'RESOLVED' };
  }

  /**
   * Get recent SOS events
   */
  async getSosEvents(elderlyId = null) {
    let sql = `
      SELECT se.*, ep.full_name, ep.emergency_contact_phone 
      FROM sos_events se
      JOIN elderly_profiles ep ON se.elderly_id = ep.id
    `;
    const params = [];
    if (elderlyId) {
      sql += ' WHERE se.elderly_id = ?';
      params.push(elderlyId);
    }
    sql += ' ORDER BY se.triggered_at DESC LIMIT 20';
    return db.queryAll(sql, params);
  }
}

module.exports = new SosService();
