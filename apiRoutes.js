// RESTful API Router Dispatcher
const authService = require('../services/authService');
const medicationService = require('../services/medicationService');
const adherenceService = require('../services/adherenceService');
const appointmentService = require('../services/appointmentService');
const vitalsService = require('../services/vitalsService');
const sosService = require('../services/sosService');
const notificationService = require('../services/notificationService');
const schedulerService = require('../services/schedulerService');
const { verifyToken } = require('../utils/crypto');
const { MEDICAL_DISCLAIMER } = require('../config/constants');

/**
 * Extract authenticated user from Authorization header
 */
function getAuthUser(req) {
  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyToken(token);
  }
  return null;
}

/**
 * Handle incoming API requests
 */
async function handleApiRequest(req, res, pathname, query, body) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Medical-Disclaimer', MEDICAL_DISCLAIMER);

  const authUser = getAuthUser(req);

  try {
    // -------------------------------------------------------------
    // Health Check (For Cloud Run Liveness & Readiness Probes)
    // -------------------------------------------------------------
    if (pathname === '/api/health' && req.method === 'GET') {
      return sendJson(res, 200, {
        status: 'UP',
        service: 'ElderCare Connect',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        disclaimer: MEDICAL_DISCLAIMER
      });
    }

    // -------------------------------------------------------------
    // Authentication Endpoints
    // -------------------------------------------------------------
    if (pathname === '/api/auth/demo-personas' && req.method === 'GET') {
      const personas = await authService.getDemoPersonas();
      return sendJson(res, 200, { success: true, personas });
    }

    if (pathname === '/api/auth/profiles' && req.method === 'GET') {
      const profiles = await authService.getElderlyProfileList();
      return sendJson(res, 200, { success: true, profiles });
    }

    if (pathname === '/api/auth/pin-login' && req.method === 'POST') {
      const { profileId, passcode } = body;
      const result = await authService.loginWithPasscode(profileId, passcode);
      return sendJson(res, 200, { success: true, ...result });
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = body;
      const result = await authService.loginWithPassword(email, password);
      return sendJson(res, 200, { success: true, ...result });
    }

    // -------------------------------------------------------------
    // Google Cloud Scheduler Endpoint
    // -------------------------------------------------------------
    if (pathname === '/api/scheduler/check-reminders' && (req.method === 'POST' || req.method === 'GET')) {
      if (!schedulerService.isAuthorized(req.headers)) {
        return sendJson(res, 401, { error: 'Unauthorized Cloud Scheduler request' });
      }
      const summary = await schedulerService.runScheduledChecks();
      return sendJson(res, 200, summary);
    }

    // -------------------------------------------------------------
    // Medication Endpoints
    // -------------------------------------------------------------
    if (pathname === '/api/medications' && req.method === 'GET') {
      const elderlyId = query.elderlyId || (authUser ? authUser.profileId : null);
      if (!elderlyId) return sendJson(res, 400, { error: 'elderlyId parameter is required' });
      const meds = await medicationService.getMedications(elderlyId);
      return sendJson(res, 200, { success: true, medications: meds });
    }

    if (pathname === '/api/medications' && req.method === 'POST') {
      const elderlyId = body.elderlyId || (authUser ? authUser.profileId : null);
      if (!elderlyId) return sendJson(res, 400, { error: 'elderlyId is required' });
      const med = await medicationService.addMedication(elderlyId, body);
      return sendJson(res, 201, { success: true, medication: med });
    }

    if (pathname.startsWith('/api/medications/') && req.method === 'PUT') {
      const id = pathname.split('/')[3];
      const updated = await medicationService.updateMedication(id, body);
      return sendJson(res, 200, { success: true, medication: updated });
    }

    if (pathname.startsWith('/api/medications/') && req.method === 'DELETE') {
      const id = pathname.split('/')[3];
      await medicationService.deleteMedication(id);
      return sendJson(res, 200, { success: true, message: 'Medication removed' });
    }

    if (pathname === '/api/medications/refills' && req.method === 'GET') {
      const elderlyId = query.elderlyId || (authUser ? authUser.profileId : null);
      const refills = await medicationService.getRefillAlerts(elderlyId);
      return sendJson(res, 200, { success: true, refills });
    }

    // -------------------------------------------------------------
    // Adherence & Dose Actions
    // -------------------------------------------------------------
    if (pathname === '/api/adherence/today' && req.method === 'GET') {
      const elderlyId = query.elderlyId || (authUser ? authUser.profileId : null);
      const dateStr = query.date || null;
      if (!elderlyId) return sendJson(res, 400, { error: 'elderlyId parameter is required' });
      const doses = await adherenceService.getDosesForDate(elderlyId, dateStr);
      return sendJson(res, 200, { success: true, doses });
    }

    if (pathname === '/api/adherence/action' && req.method === 'POST') {
      const { logId, action, options } = body;
      if (!logId || !action) return sendJson(res, 400, { error: 'logId and action are required' });
      const result = await adherenceService.recordDoseAction(logId, action, options || {});
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/adherence/stats' && req.method === 'GET') {
      const elderlyId = query.elderlyId || (authUser ? authUser.profileId : null);
      const days = parseInt(query.days || '7', 10);
      if (!elderlyId) return sendJson(res, 400, { error: 'elderlyId parameter is required' });
      const stats = await adherenceService.getAdherenceStats(elderlyId, days);
      return sendJson(res, 200, { success: true, stats });
    }

    // -------------------------------------------------------------
    // Doctor Appointments
    // -------------------------------------------------------------
    if (pathname === '/api/appointments' && req.method === 'GET') {
      const elderlyId = query.elderlyId || (authUser ? authUser.profileId : null);
      if (!elderlyId) return sendJson(res, 400, { error: 'elderlyId is required' });
      const appointments = await appointmentService.getAppointments(elderlyId);
      return sendJson(res, 200, { success: true, appointments });
    }

    if (pathname === '/api/appointments' && req.method === 'POST') {
      const elderlyId = body.elderlyId || (authUser ? authUser.profileId : null);
      if (!elderlyId) return sendJson(res, 400, { error: 'elderlyId is required' });
      const appt = await appointmentService.createAppointment(elderlyId, body);
      return sendJson(res, 201, { success: true, appointment: appt });
    }

    if (pathname.startsWith('/api/appointments/') && req.method === 'PUT') {
      const id = pathname.split('/')[3];
      const updated = await appointmentService.updateAppointment(id, body);
      return sendJson(res, 200, { success: true, appointment: updated });
    }

    if (pathname.startsWith('/api/appointments/') && req.method === 'DELETE') {
      const id = pathname.split('/')[3];
      await appointmentService.deleteAppointment(id);
      return sendJson(res, 200, { success: true, message: 'Appointment deleted' });
    }

    // -------------------------------------------------------------
    // Healthcare Vitals & Analytics
    // -------------------------------------------------------------
    if (pathname === '/api/vitals' && req.method === 'GET') {
      const elderlyId = query.elderlyId || (authUser ? authUser.profileId : null);
      if (!elderlyId) return sendJson(res, 400, { error: 'elderlyId is required' });
      const vitals = await vitalsService.getVitals(elderlyId);
      return sendJson(res, 200, { success: true, vitals });
    }

    if (pathname === '/api/vitals' && req.method === 'POST') {
      const elderlyId = body.elderlyId || (authUser ? authUser.profileId : null);
      if (!elderlyId) return sendJson(res, 400, { error: 'elderlyId is required' });
      const vital = await vitalsService.logVital(elderlyId, body);
      return sendJson(res, 201, { success: true, vital });
    }

    if (pathname === '/api/vitals/correlation' && req.method === 'GET') {
      const elderlyId = query.elderlyId || (authUser ? authUser.profileId : null);
      if (!elderlyId) return sendJson(res, 400, { error: 'elderlyId is required' });
      const days = parseInt(query.days || '7', 10);
      const points = await vitalsService.getCorrelationAnalytics(elderlyId, days);
      return sendJson(res, 200, { success: true, points });
    }

    // -------------------------------------------------------------
    // Emergency SOS
    // -------------------------------------------------------------
    if (pathname === '/api/sos/trigger' && req.method === 'POST') {
      const elderlyId = body.elderlyId || (authUser ? authUser.profileId : null);
      if (!elderlyId) return sendJson(res, 400, { error: 'elderlyId is required' });
      const result = await sosService.triggerSos(elderlyId, body);
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/sos/resolve' && req.method === 'POST') {
      const { eventId, acknowledgedBy } = body;
      const result = await sosService.resolveSos(eventId, acknowledgedBy);
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/sos/events' && req.method === 'GET') {
      const elderlyId = query.elderlyId || (authUser ? authUser.profileId : null);
      const events = await sosService.getSosEvents(elderlyId);
      return sendJson(res, 200, { success: true, events });
    }

    // -------------------------------------------------------------
    // Caregiver Notification Audit Feed
    // -------------------------------------------------------------
    if (pathname === '/api/notifications' && req.method === 'GET') {
      const elderlyId = query.elderlyId || null;
      const logs = await notificationService.getNotifications(elderlyId);
      return sendJson(res, 200, { success: true, notifications: logs });
    }

    // Endpoint not found
    return sendJson(res, 404, { error: `Endpoint ${pathname} not found` });
  } catch (err) {
    console.error(`[API Error] ${req.method} ${pathname}:`, err);
    return sendJson(res, 500, { error: err.message || 'Internal Server Error' });
  }
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode);
  res.end(JSON.stringify(data));
}

module.exports = { handleApiRequest };
