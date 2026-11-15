// Authentication and Authorization Service
const db = require('../db');
const { verifyPassword, verifyPasscode, hashPasscode, generateToken } = require('../utils/crypto');
const { ROLES } = require('../config/constants');

class AuthService {
  /**
   * Elderly login via 4-to-6 digit Passcode / PIN
   */
  async loginWithPasscode(elderlyProfileId, passcode) {
    if (!elderlyProfileId || !passcode) {
      throw new Error('Profile ID and Passcode are required');
    }

    const elderlyProfile = await db.queryOne(
      `SELECT ep.*, u.id as user_id, u.email, u.passcode_hash, u.failed_passcode_attempts, u.locked_until, u.role
       FROM elderly_profiles ep
       JOIN users u ON ep.user_id = u.id
       WHERE ep.id = ?`,
      [elderlyProfileId]
    );

    if (!elderlyProfile) {
      throw new Error('Elderly profile not found');
    }

    // Check Lockout
    if (elderlyProfile.locked_until) {
      const lockExpires = new Date(elderlyProfile.locked_until);
      if (new Date() < lockExpires) {
        const remainingMinutes = Math.ceil((lockExpires - new Date()) / (60 * 1000));
        throw new Error(`Account temporarily locked due to multiple incorrect PIN attempts. Please try again in ${remainingMinutes} minute(s) or contact your caregiver.`);
      } else {
        // Unlock if expired
        await db.execute('UPDATE users SET locked_until = NULL, failed_passcode_attempts = 0 WHERE id = ?', [elderlyProfile.user_id]);
      }
    }

    // Verify PIN
    const isValid = verifyPasscode(passcode, elderlyProfile.passcode_hash);
    if (!isValid) {
      const newAttempts = (elderlyProfile.failed_passcode_attempts || 0) + 1;
      let lockSql = 'UPDATE users SET failed_passcode_attempts = ? WHERE id = ?';
      let lockParams = [newAttempts, elderlyProfile.user_id];

      if (newAttempts >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins lock
        lockSql = 'UPDATE users SET failed_passcode_attempts = ?, locked_until = ? WHERE id = ?';
        lockParams = [newAttempts, lockUntil, elderlyProfile.user_id];

        // Log security notification for caregiver
        try {
          const crypto = require('node:crypto');
          await db.execute(
            `INSERT INTO notification_logs (id, elderly_id, recipient_email, subject, type, payload)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              crypto.randomUUID(),
              elderlyProfile.id,
              elderlyProfile.emergency_contact_email || 'caregiver@eldercare.com',
              'Security Alert: Multiple Failed PIN Attempts for ' + elderlyProfile.full_name,
              'SECURITY_ALERT',
              JSON.stringify({ attempts: newAttempts, lockedUntil: lockUntil })
            ]
          );
        } catch (e) {
          console.error('[AuthService] Failed to record lockout alert:', e);
        }

        throw new Error('Too many incorrect PIN attempts. Account locked for 15 minutes. An alert has been sent to your caregiver.');
      }

      await db.execute(lockSql, lockParams);
      const remainingAttempts = 5 - newAttempts;
      throw new Error(`Incorrect PIN. ${remainingAttempts} attempt(s) remaining before temporary lockout.`);
    }

    // Success: Reset failed attempts
    await db.execute('UPDATE users SET failed_passcode_attempts = 0, locked_until = NULL WHERE id = ?', [elderlyProfile.user_id]);

    const token = generateToken({
      userId: elderlyProfile.user_id,
      profileId: elderlyProfile.id,
      name: elderlyProfile.full_name,
      role: ROLES.ELDERLY,
      language: elderlyProfile.language_preference || 'te'
    });

    return {
      token,
      user: {
        id: elderlyProfile.user_id,
        profileId: elderlyProfile.id,
        name: elderlyProfile.full_name,
        role: ROLES.ELDERLY,
        age: elderlyProfile.age,
        bloodGroup: elderlyProfile.blood_group,
        allergies: elderlyProfile.allergies,
        conditions: elderlyProfile.medical_conditions,
        fontSizeMode: elderlyProfile.font_size_mode,
        highContrastMode: !!elderlyProfile.high_contrast_mode,
        emergencyContact: {
          name: elderlyProfile.emergency_contact_name,
          phone: elderlyProfile.emergency_contact_phone,
          email: elderlyProfile.emergency_contact_email
        }
      }
    };
  }

  /**
   * Caregiver / Family login via Email and Password
   */
  async loginWithPassword(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await db.queryOne(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
      [email.trim()]
    );

    if (!user || !user.password_hash) {
      throw new Error('Invalid email or password');
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Fetch linked elderly profiles for this caregiver/family member
    const linkedProfiles = await db.queryAll(
      `SELECT ep.*, cl.relationship, cl.permission_level
       FROM elderly_profiles ep
       JOIN caregiver_links cl ON ep.id = cl.elderly_id
       WHERE cl.caregiver_user_id = ?`,
      [user.id]
    );

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      linkedProfileIds: linkedProfiles.map(p => p.id)
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        language: user.language_preference || 'en',
        linkedProfiles
      }
    };
  }

  /**
   * Public directory of elderly profiles for PIN selection screen
   */
  async getElderlyProfileList() {
    return db.queryAll(
      `SELECT ep.id, ep.full_name, ep.age, ep.blood_group, u.language_preference
       FROM elderly_profiles ep
       JOIN users u ON ep.user_id = u.id`
    );
  }

  /**
   * Fast Demo Persona Switcher (for Hackathon evaluation)
   */
  async getDemoPersonas() {
    const elderly = await db.queryOne(`
      SELECT ep.id as profileId, u.id as userId, ep.full_name as name, u.role, '1234' as defaultPin
      FROM elderly_profiles ep
      JOIN users u ON ep.user_id = u.id
      LIMIT 1
    `);

    const caregiver = await db.queryOne(`
      SELECT id as userId, name, email, role, 'Caregiver@123' as defaultPassword
      FROM users WHERE role = ? LIMIT 1
    `, [ROLES.CAREGIVER]);

    const family = await db.queryOne(`
      SELECT id as userId, name, email, role, 'Family@123' as defaultPassword
      FROM users WHERE role = ? LIMIT 1
    `, [ROLES.FAMILY]);

    return { elderly, caregiver, family };
  }
}

module.exports = new AuthService();
