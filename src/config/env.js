// Environment and Application Configuration
const path = require('node:path');

const env = {
  PORT: parseInt(process.env.PORT || '8080', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'eldercare-connect-hackathon-secret-key-2026',
  SCHEDULER_SECRET: process.env.SCHEDULER_SECRET || 'cloud-scheduler-auth-token-xyz',
  DATABASE_URL: process.env.DATABASE_URL || '', // If set to postgresql://..., will use PG; otherwise native SQLite
  SQLITE_DB_PATH: process.env.SQLITE_DB_PATH || path.resolve(__dirname, '../../data/eldercare.db'),
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  NOTIFICATION_FROM_EMAIL: process.env.NOTIFICATION_FROM_EMAIL || 'alerts@eldercare-connect.app',
  CARE_ALERT_EMAIL: process.env.CARE_ALERT_EMAIL || 'caregiver.demo@eldercare-connect.app'
};

module.exports = env;
