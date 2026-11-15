// Notification Service for Email Alerts (Missed Doses, SOS, Appointments)
const db = require('../db');
const env = require('../config/env');
const { generateId } = require('../utils/crypto');

class NotificationService {
  /**
   * Dispatch an email notification and log to database
   */
  async sendNotification({ elderlyId, recipientEmail, subject, type, payload, htmlBody }) {
    const logId = generateId();
    const sentAt = new Date().toISOString();

    console.log(`[NotificationService] Sending ${type} alert to: ${recipientEmail} | Subject: "${subject}"`);

    // In production with SMTP configured, send via SMTP
    let deliveryStatus = 'SIMULATED_SUCCESS';
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      try {
        // Optional nodemailer integration
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_PORT === 465,
          auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
        });

        await transporter.sendMail({
          from: `"ElderCare Connect" <${env.NOTIFICATION_FROM_EMAIL}>`,
          to: recipientEmail,
          subject: subject,
          html: htmlBody || `<p>${subject}</p>`
        });
        deliveryStatus = 'DELIVERED';
      } catch (err) {
        console.error('[NotificationService] SMTP delivery failed, recorded in logs:', err.message);
        deliveryStatus = 'FAILED: ' + err.message;
      }
    }

    // Always record in database audit log for caregiver visibility
    await db.execute(
      `INSERT INTO notification_logs (id, elderly_id, recipient_email, subject, type, payload, sent_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        elderlyId || null,
        recipientEmail,
        subject,
        type,
        typeof payload === 'string' ? payload : JSON.stringify(payload || {}),
        sentAt,
        deliveryStatus
      ]
    );

    return { logId, sentAt, status: deliveryStatus };
  }

  /**
   * Send Missed Dose Email Alert to Caregivers and Family
   */
  async sendMissedDoseAlert(elderly, medication, scheduledTime) {
    const subject = `⚠️ Missed Dose Alert: ${elderly.full_name} missed ${medication.name} (${scheduledTime})`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">⚠️ Missed Dose Notification</h1>
          <p style="margin: 5px 0 0 0; font-size: 16px;">ElderCare Connect Real-Time Monitoring</p>
        </div>
        <div style="padding: 24px; color: #1e293b;">
          <p>Dear Caregiver,</p>
          <p>Our automated monitoring system detected that <strong>${elderly.full_name}</strong> has not confirmed taking their scheduled medication within the 30-minute grace window:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold;">Patient:</td><td style="padding: 8px;">${elderly.full_name} (Age: ${elderly.age})</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Medication:</td><td style="padding: 8px; color: #ef4444; font-weight: bold;">${medication.name} (${medication.name_te || ''})</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold;">Dosage:</td><td style="padding: 8px;">${medication.dosage}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Scheduled Time:</td><td style="padding: 8px;">${scheduledTime}</td></tr>
            <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold;">Instructions:</td><td style="padding: 8px;">${medication.instructions || 'Take as prescribed'}</td></tr>
          </table>
          <p>Please check in with ${elderly.full_name} or assist them with their dosage.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="tel:${elderly.emergency_contact_phone || ''}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Call Patient Now</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="font-size: 12px; color: #64748b;">Medical Disclaimer: ElderCare Connect is a compliance tracking platform and does not replace emergency medical response.</p>
        </div>
      </div>
    `;

    return this.sendNotification({
      elderlyId: elderly.id,
      recipientEmail: elderly.emergency_contact_email || 'caregiver@eldercare.com',
      subject,
      type: 'MISSED_DOSE',
      payload: {
        elderlyName: elderly.full_name,
        medicationName: medication.name,
        scheduledTime
      },
      htmlBody
    });
  }

  /**
   * Send Emergency SOS Alert to Caregivers and Family
   */
  async sendSosAlert(elderly, location = {}) {
    const subject = `🚨 EMERGENCY SOS ALERT: ${elderly.full_name} triggered Emergency Help!`;
    const mapLink = location.latitude && location.longitude 
      ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
      : 'Location unavailable';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #b91c1c; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #b91c1c; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🚨 EMERGENCY SOS TRIGGERED</h1>
          <p style="margin: 8px 0 0 0; font-size: 18px;">Immediate Caregiver Attention Required</p>
        </div>
        <div style="padding: 24px; color: #1e293b;">
          <p style="font-size: 16px;"><strong>${elderly.full_name}</strong> pressed the Emergency SOS button on ElderCare Connect.</p>
          <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0;">
            <p style="margin: 0; font-weight: bold; color: #991b1b;">Patient Details:</p>
            <p style="margin: 4px 0 0 0;">Name: ${elderly.full_name} | Age: ${elderly.age} | Blood Group: ${elderly.blood_group || 'N/A'}</p>
            <p style="margin: 4px 0 0 0;">Allergies: ${elderly.allergies || 'None'}</p>
            <p style="margin: 4px 0 0 0;">Known Conditions: ${elderly.medical_conditions || 'None'}</p>
          </div>
          ${location.latitude ? `<p><strong>GPS Location:</strong> <a href="${mapLink}" target="_blank">View on Google Maps (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})</a></p>` : ''}
          <div style="text-align: center; margin: 24px 0;">
            <a href="tel:${elderly.emergency_contact_phone || ''}" style="background-color: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 18px; font-weight: bold;">📞 Call Emergency Contact</a>
          </div>
        </div>
      </div>
    `;

    return this.sendNotification({
      elderlyId: elderly.id,
      recipientEmail: elderly.emergency_contact_email || 'caregiver@eldercare.com',
      subject,
      type: 'SOS_EMERGENCY',
      payload: { elderlyName: elderly.full_name, location },
      htmlBody
    });
  }

  /**
   * Get notification audit feed for Caregiver Dashboard
   */
  async getNotifications(elderlyId = null, limit = 20) {
    let sql = 'SELECT * FROM notification_logs';
    const params = [];
    if (elderlyId) {
      sql += ' WHERE elderly_id = ?';
      params.push(elderlyId);
    }
    sql += ' ORDER BY sent_at DESC LIMIT ?';
    params.push(limit);

    return db.queryAll(sql, params);
  }
}

module.exports = new NotificationService();
