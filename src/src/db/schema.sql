-- ElderCare Connect Database Schema
-- Compatible with both PostgreSQL and SQLite

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'ELDERLY', -- 'ELDERLY', 'CAREGIVER', 'FAMILY', 'ADMIN'
    password_hash TEXT,
    passcode_hash TEXT, -- Hashed 4-to-6 digit PIN for Elderly users
    failed_passcode_attempts INTEGER DEFAULT 0,
    locked_until TEXT,
    phone TEXT,
    language_preference TEXT DEFAULT 'en', -- 'en' or 'te'
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS elderly_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    age INTEGER,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_email TEXT,
    blood_group TEXT,
    allergies TEXT,
    medical_conditions TEXT,
    high_contrast_mode INTEGER DEFAULT 0,
    font_size_mode TEXT DEFAULT 'large', -- 'normal', 'large', 'xl'
    voice_guidance_enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS caregiver_links (
    id TEXT PRIMARY KEY,
    elderly_id TEXT NOT NULL,
    caregiver_user_id TEXT NOT NULL,
    relationship TEXT DEFAULT 'Family',
    permission_level TEXT DEFAULT 'FULL', -- 'FULL', 'VIEW_ONLY'
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(elderly_id) REFERENCES elderly_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY(caregiver_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medications (
    id TEXT PRIMARY KEY,
    elderly_id TEXT NOT NULL,
    name TEXT NOT NULL,
    name_te TEXT,
    name_hi TEXT,
    dosage TEXT NOT NULL,
    dosage_te TEXT,
    dosage_hi TEXT,
    form TEXT NOT NULL DEFAULT 'TABLET', -- 'TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'DROPS'
    pill_color TEXT DEFAULT '#3B82F6',
    pill_shape TEXT DEFAULT 'round', -- 'round', 'oval', 'capsule', 'square'
    frequency TEXT NOT NULL DEFAULT 'ONCE_DAILY',
    time_slots TEXT NOT NULL, -- JSON array of strings e.g. ["08:00", "20:00"]
    meal_timing TEXT DEFAULT 'AFTER_MEAL', -- 'BEFORE_MEAL', 'WITH_MEAL', 'AFTER_MEAL', 'ANYTIME'
    instructions TEXT,
    instructions_te TEXT,
    instructions_hi TEXT,
    total_quantity INTEGER DEFAULT 30,
    remaining_quantity INTEGER DEFAULT 30,
    refill_threshold INTEGER DEFAULT 7,
    doctor_name TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(elderly_id) REFERENCES elderly_profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS adherence_logs (
    id TEXT PRIMARY KEY,
    medication_id TEXT NOT NULL,
    elderly_id TEXT NOT NULL,
    scheduled_date TEXT NOT NULL, -- YYYY-MM-DD
    scheduled_time TEXT NOT NULL, -- HH:MM
    scheduled_datetime TEXT NOT NULL, -- ISO-like format YYYY-MM-DD HH:MM
    taken_datetime TEXT,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'TAKEN', 'SNOOZED', 'MISSED', 'SKIPPED'
    snooze_until TEXT,
    skip_reason TEXT,
    recorded_by TEXT DEFAULT 'SELF', -- 'SELF', 'CAREGIVER'
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(medication_id) REFERENCES medications(id) ON DELETE CASCADE,
    FOREIGN KEY(elderly_id) REFERENCES elderly_profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    elderly_id TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    specialty TEXT,
    clinic_address TEXT,
    phone TEXT,
    appointment_date TEXT NOT NULL, -- YYYY-MM-DD
    appointment_time TEXT NOT NULL, -- HH:MM
    checklist_notes TEXT,
    status TEXT DEFAULT 'UPCOMING', -- 'UPCOMING', 'COMPLETED', 'CANCELLED'
    reminder_sent INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(elderly_id) REFERENCES elderly_profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vital_logs (
    id TEXT PRIMARY KEY,
    elderly_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'BLOOD_PRESSURE', 'GLUCOSE', 'HEART_RATE', 'SPO2', 'WEIGHT', 'MOOD'
    value_primary REAL, -- Systolic, Glucose (mg/dL), Heart rate (bpm), SpO2 (%)
    value_secondary REAL, -- Diastolic
    unit TEXT,
    mood_tag TEXT, -- 'GREAT', 'GOOD', 'TIRED', 'UNWELL'
    notes TEXT,
    recorded_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(elderly_id) REFERENCES elderly_profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sos_events (
    id TEXT PRIMARY KEY,
    elderly_id TEXT NOT NULL,
    triggered_at TEXT DEFAULT (datetime('now')),
    latitude REAL,
    longitude REAL,
    location_address TEXT,
    status TEXT DEFAULT 'TRIGGERED', -- 'TRIGGERED', 'ACKNOWLEDGED', 'RESOLVED'
    acknowledged_by TEXT,
    notification_sent INTEGER DEFAULT 1,
    FOREIGN KEY(elderly_id) REFERENCES elderly_profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notification_logs (
    id TEXT PRIMARY KEY,
    elderly_id TEXT,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    type TEXT NOT NULL, -- 'MISSED_DOSE', 'SOS_EMERGENCY', 'REFILL_ALERT', 'APPOINTMENT_REMINDER'
    payload TEXT,
    sent_at TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'SENT'
);
