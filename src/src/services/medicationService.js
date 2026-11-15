// Medication Management Service
const db = require('../db');
const { generateId } = require('../utils/crypto');

class MedicationService {
  /**
   * Get all active medications for an elderly profile
   */
  async getMedications(elderlyId) {
    const meds = await db.queryAll(
      `SELECT * FROM medications 
       WHERE elderly_id = ? AND is_active = 1 
       ORDER BY created_at DESC`,
      [elderlyId]
    );

    return meds.map(m => ({
      ...m,
      timeSlots: JSON.parse(m.time_slots || '[]'),
      isLowStock: m.remaining_quantity <= m.refill_threshold
    }));
  }

  /**
   * Get single medication by ID
   */
  async getMedicationById(id) {
    const med = await db.queryOne('SELECT * FROM medications WHERE id = ?', [id]);
    if (!med) return null;
    return {
      ...med,
      timeSlots: JSON.parse(med.time_slots || '[]'),
      isLowStock: med.remaining_quantity <= med.refill_threshold
    };
  }

  /**
   * Add a new medication prescription
   */
  async addMedication(elderlyId, data) {
    const id = generateId();
    const timeSlots = Array.isArray(data.timeSlots) ? JSON.stringify(data.timeSlots) : JSON.stringify(['08:00']);
    const totalQty = parseInt(data.totalQuantity || '30', 10);
    const refillThreshold = parseInt(data.refillThreshold || '7', 10);

    await db.execute(
      `INSERT INTO medications (
        id, elderly_id, name, name_te, name_hi, dosage, dosage_te, dosage_hi, form, 
        pill_color, pill_shape, frequency, time_slots, meal_timing, 
        instructions, instructions_te, instructions_hi, total_quantity, remaining_quantity, 
        refill_threshold, doctor_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        elderlyId,
        data.name,
        data.name_te || data.name,
        data.name_hi || data.name,
        data.dosage,
        data.dosage_te || data.dosage,
        data.dosage_hi || data.dosage,
        data.form || 'TABLET',
        data.pill_color || '#3B82F6',
        data.pill_shape || 'round',
        data.frequency || 'ONCE_DAILY',
        timeSlots,
        data.meal_timing || 'AFTER_MEAL',
        data.instructions || '',
        data.instructions_te || data.instructions || '',
        data.instructions_hi || data.instructions || '',
        totalQty,
        totalQty,
        refillThreshold,
        data.doctor_name || ''
      ]
    );

    // Automatically generate today's doses for this new medication
    await this.generateDosesForDate(id, elderlyId, new Date().toISOString().split('T')[0], JSON.parse(timeSlots));

    return this.getMedicationById(id);
  }

  /**
   * Update existing medication
   */
  async updateMedication(id, data) {
    const existing = await this.getMedicationById(id);
    if (!existing) throw new Error('Medication not found');

    const timeSlots = Array.isArray(data.timeSlots) ? JSON.stringify(data.timeSlots) : existing.time_slots;
    const remainingQty = data.remainingQuantity !== undefined ? parseInt(data.remainingQuantity, 10) : existing.remaining_quantity;
    const refillThreshold = data.refillThreshold !== undefined ? parseInt(data.refillThreshold, 10) : existing.refill_threshold;

    await db.execute(
      `UPDATE medications SET
        name = ?, name_te = ?, dosage = ?, dosage_te = ?, form = ?,
        pill_color = ?, pill_shape = ?, frequency = ?, time_slots = ?,
        meal_timing = ?, instructions = ?, instructions_te = ?,
        remaining_quantity = ?, refill_threshold = ?, doctor_name = ?
       WHERE id = ?`,
      [
        data.name || existing.name,
        data.name_te || existing.name_te,
        data.dosage || existing.dosage,
        data.dosage_te || existing.dosage_te,
        data.form || existing.form,
        data.pill_color || existing.pill_color,
        data.pill_shape || existing.pill_shape,
        data.frequency || existing.frequency,
        timeSlots,
        data.meal_timing || existing.meal_timing,
        data.instructions !== undefined ? data.instructions : existing.instructions,
        data.instructions_te !== undefined ? data.instructions_te : existing.instructions_te,
        remainingQty,
        refillThreshold,
        data.doctor_name || existing.doctor_name,
        id
      ]
    );

    return this.getMedicationById(id);
  }

  /**
   * Soft-delete medication
   */
  async deleteMedication(id) {
    return db.execute('UPDATE medications SET is_active = 0 WHERE id = ?', [id]);
  }

  /**
   * Helper: Generate adherence log records for a date
   */
  async generateDosesForDate(medicationId, elderlyId, dateStr, timeSlots) {
    for (const time of timeSlots) {
      const existing = await db.queryOne(
        `SELECT id FROM adherence_logs 
         WHERE medication_id = ? AND scheduled_date = ? AND scheduled_time = ?`,
        [medicationId, dateStr, time]
      );
      if (!existing) {
        await db.execute(
          `INSERT INTO adherence_logs (
            id, medication_id, elderly_id, scheduled_date, scheduled_time, 
            scheduled_datetime, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [generateId(), medicationId, elderlyId, dateStr, time, `${dateStr} ${time}`, 'PENDING']
        );
      }
    }
  }

  /**
   * Get refill alerts for low-stock medications
   */
  async getRefillAlerts(elderlyId) {
    return db.queryAll(
      `SELECT id, name, name_te, dosage, remaining_quantity, refill_threshold 
       FROM medications 
       WHERE elderly_id = ? AND is_active = 1 AND remaining_quantity <= refill_threshold`,
      [elderlyId]
    );
  }
}

module.exports = new MedicationService();
