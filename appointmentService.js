// Doctor Appointment Management Service
const db = require('../db');
const { generateId } = require('../utils/crypto');
const { APPOINTMENT_STATUS } = require('../config/constants');

class AppointmentService {
  /**
   * Get all appointments for an elderly user
   */
  async getAppointments(elderlyId) {
    return db.queryAll(
      `SELECT * FROM appointments 
       WHERE elderly_id = ? 
       ORDER BY appointment_date ASC, appointment_time ASC`,
      [elderlyId]
    );
  }

  /**
   * Schedule a new appointment
   */
  async createAppointment(elderlyId, data) {
    const id = generateId();
    await db.execute(
      `INSERT INTO appointments (
        id, elderly_id, doctor_name, specialty, clinic_address, 
        phone, appointment_date, appointment_time, checklist_notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        elderlyId,
        data.doctor_name,
        data.specialty || 'General Physician',
        data.clinic_address || '',
        data.phone || '',
        data.appointment_date,
        data.appointment_time,
        data.checklist_notes || 'Bring current pill bottles and vitals log',
        APPOINTMENT_STATUS.UPCOMING
      ]
    );

    return db.queryOne('SELECT * FROM appointments WHERE id = ?', [id]);
  }

  /**
   * Update appointment status (COMPLETED, CANCELLED) or details
   */
  async updateAppointment(id, data) {
    const existing = await db.queryOne('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!existing) throw new Error('Appointment not found');

    await db.execute(
      `UPDATE appointments SET
        doctor_name = ?, specialty = ?, clinic_address = ?, phone = ?,
        appointment_date = ?, appointment_time = ?, checklist_notes = ?, status = ?
       WHERE id = ?`,
      [
        data.doctor_name || existing.doctor_name,
        data.specialty || existing.specialty,
        data.clinic_address !== undefined ? data.clinic_address : existing.clinic_address,
        data.phone !== undefined ? data.phone : existing.phone,
        data.appointment_date || existing.appointment_date,
        data.appointment_time || existing.appointment_time,
        data.checklist_notes !== undefined ? data.checklist_notes : existing.checklist_notes,
        data.status || existing.status,
        id
      ]
    );

    return db.queryOne('SELECT * FROM appointments WHERE id = ?', [id]);
  }

  /**
   * Delete an appointment
   */
  async deleteAppointment(id) {
    return db.execute('DELETE FROM appointments WHERE id = ?', [id]);
  }
}

module.exports = new AppointmentService();
