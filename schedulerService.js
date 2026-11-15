// Google Cloud Scheduler Engine & Reminder Service
const db = require('../db');
const { DOSE_STATUS, APPOINTMENT_STATUS } = require('../config/constants');
const notificationService = require('./notificationService');
const env = require('../config/env');

class SchedulerService {
  /**
   * Validate Cloud Scheduler request authorization
   */
  isAuthorized(headers) {
    const authHeader = headers['authorization'] || '';
    const schedulerToken = headers['x-scheduler-token'] || '';
    const isGcpSchedulerHeader = headers['x-cloudscheduler'] === 'true';

    // Allow if matching secret token or if running in local development mode
    if (authHeader.includes(env.SCHEDULER_SECRET) || schedulerToken === env.SCHEDULER_SECRET) {
      return true;
    }

    if (env.NODE_ENV !== 'production') {
      return true; // Convenient for local hackathon demo and automated testing
    }

    return isGcpSchedulerHeader;
  }

  /**
   * Main Google Cloud Scheduler job handler:
   * 1. Detects overdue pending doses (>30 mins past scheduled time)
   * 2. Marks them as MISSED
   * 3. Dispatches Missed-Dose email alerts to caregivers
   * 4. Scans upcoming doctor appointments for 24h reminders
   */
  async runScheduledChecks() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const checkTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    console.log(`[CloudScheduler] Running routine check at ${todayStr} ${checkTime}...`);

    // Calculate cutoff time: 30 minutes ago
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const cutoffTimeStr = thirtyMinsAgo.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    // 1. Find overdue pending doses for today
    const overdueDoses = await db.queryAll(
      `SELECT al.id as log_id, al.scheduled_time, al.scheduled_datetime,
              m.id as medication_id, m.name as medication_name, m.name_te, m.dosage, m.instructions,
              ep.id as elderly_id, ep.full_name, ep.age, ep.emergency_contact_phone, ep.emergency_contact_email
       FROM adherence_logs al
       JOIN medications m ON al.medication_id = m.id
       JOIN elderly_profiles ep ON al.elderly_id = ep.id
       WHERE al.scheduled_date = ? 
         AND al.status = ?
         AND al.scheduled_time <= ?`,
      [todayStr, DOSE_STATUS.PENDING, cutoffTimeStr]
    );

    let missedCount = 0;
    const alertsDispatched = [];

    for (const dose of overdueDoses) {
      // Mark as MISSED
      await db.execute(
        `UPDATE adherence_logs SET status = ?, notes = ? WHERE id = ?`,
        [DOSE_STATUS.MISSED, 'Auto-marked as MISSED by Cloud Scheduler (>30m past due)', dose.log_id]
      );
      missedCount++;

      // Dispatch Missed Dose Alert to Caregivers
      const dispatchResult = await notificationService.sendMissedDoseAlert(
        {
          id: dose.elderly_id,
          full_name: dose.full_name,
          age: dose.age,
          emergency_contact_phone: dose.emergency_contact_phone,
          emergency_contact_email: dose.emergency_contact_email
        },
        {
          id: dose.medication_id,
          name: dose.medication_name,
          name_te: dose.name_te,
          dosage: dose.dosage,
          instructions: dose.instructions
        },
        dose.scheduled_time
      );

      alertsDispatched.push({
        patient: dose.full_name,
        medication: dose.medication_name,
        time: dose.scheduled_time,
        notificationId: dispatchResult.logId
      });
    }

    // 2. Scan upcoming doctor appointments within the next 24 hours
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const upcomingAppts = await db.queryAll(
      `SELECT a.*, ep.full_name, ep.emergency_contact_email
       FROM appointments a
       JOIN elderly_profiles ep ON a.elderly_id = ep.id
       WHERE a.appointment_date = ? 
         AND a.reminder_sent = 0 
         AND a.status = ?`,
      [tomorrowStr, APPOINTMENT_STATUS.UPCOMING]
    );

    let apptRemindersSent = 0;
    for (const appt of upcomingAppts) {
      await notificationService.sendNotification({
        elderlyId: appt.elderly_id,
        recipientEmail: appt.emergency_contact_email || 'caregiver@eldercare.com',
        subject: `📅 Doctor Appointment Reminder: Tomorrow at ${appt.appointment_time} with ${appt.doctor_name}`,
        type: 'APPOINTMENT_REMINDER',
        payload: {
          doctorName: appt.doctor_name,
          specialty: appt.specialty,
          clinicAddress: appt.clinic_address,
          time: appt.appointment_time,
          checklist: appt.checklist_notes
        },
        htmlBody: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Appointment Reminder for ${appt.full_name}</h2>
            <p><strong>Doctor:</strong> ${appt.doctor_name} (${appt.specialty || 'General'})</p>
            <p><strong>Time:</strong> Tomorrow at ${appt.appointment_time}</p>
            <p><strong>Clinic:</strong> ${appt.clinic_address || 'Clinic'}</p>
            <p><strong>Checklist:</strong> ${appt.checklist_notes || 'Bring existing medications and reports.'}</p>
          </div>
        `
      });

      await db.execute('UPDATE appointments SET reminder_sent = 1 WHERE id = ?', [appt.id]);
      apptRemindersSent++;
    }

    return {
      success: true,
      timestamp: now.toISOString(),
      evaluatedDate: todayStr,
      cutoffTime: cutoffTimeStr,
      missedDosesMarked: missedCount,
      alertsDispatched,
      appointmentRemindersSent: apptRemindersSent
    };
  }
}

module.exports = new SchedulerService();
