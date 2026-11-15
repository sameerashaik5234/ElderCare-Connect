// Seed realistic sample data for ElderCare Connect
const db = require('./index');
const { hashPassword, hashPasscode, generateId } = require('../utils/crypto');
const { ROLES, DOSE_STATUS, VITAL_TYPES, APPOINTMENT_STATUS } = require('../config/constants');

async function seed() {
  console.log('[Seed] Seeding database with realistic patient and caregiver data...');

  // Clear existing data
  await db.execute('DELETE FROM notification_logs');
  await db.execute('DELETE FROM sos_events');
  await db.execute('DELETE FROM vital_logs');
  await db.execute('DELETE FROM appointments');
  await db.execute('DELETE FROM adherence_logs');
  await db.execute('DELETE FROM medications');
  await db.execute('DELETE FROM caregiver_links');
  await db.execute('DELETE FROM elderly_profiles');
  await db.execute('DELETE FROM users');

  // 1. Create Elderly User (Lakshmi Devi) - PIN: 1234
  const elderlyUserId = generateId();
  const elderlyProfileId = generateId();
  const elderlyPinHash = hashPasscode('1234');

  await db.execute(
    `INSERT INTO users (id, email, name, role, passcode_hash, phone, language_preference)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      elderlyUserId,
      'lakshmi@eldercare.com',
      'Lakshmi Devi (లక్ష్మీ దేవి)',
      ROLES.ELDERLY,
      elderlyPinHash,
      '+91 98765 43210',
      'te'
    ]
  );

  await db.execute(
    `INSERT INTO elderly_profiles (id, user_id, full_name, age, emergency_contact_name, emergency_contact_phone, emergency_contact_email, blood_group, allergies, medical_conditions, font_size_mode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      elderlyProfileId,
      elderlyUserId,
      'Lakshmi Devi (లక్ష్మీ దేవి)',
      72,
      'Suresh Kumar (Son)',
      '+91 98765 00001',
      'family@eldercare.com',
      'O+',
      'Penicillin (పెన్సిలిన్)',
      'Type-2 Diabetes, Hypertension (రక్తపోటు, మధుమేహం)',
      'large'
    ]
  );

  // 2. Create Caregiver User (Dr. Rajesh Rao) - Password: Caregiver@123
  const caregiverUserId = generateId();
  const caregiverPasswordHash = hashPassword('Caregiver@123');
  await db.execute(
    `INSERT INTO users (id, email, name, role, password_hash, phone, language_preference)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      caregiverUserId,
      'caregiver@eldercare.com',
      'Dr. Rajesh Rao (డాక్టర్ రాజేష్)',
      ROLES.CAREGIVER,
      caregiverPasswordHash,
      '+91 98480 12345',
      'en'
    ]
  );

  // 3. Create Family Member (Suresh Kumar) - Password: Family@123
  const familyUserId = generateId();
  const familyPasswordHash = hashPassword('Family@123');
  await db.execute(
    `INSERT INTO users (id, email, name, role, password_hash, phone, language_preference)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      familyUserId,
      'family@eldercare.com',
      'Suresh Kumar (సురేష్ కుమార్)',
      ROLES.FAMILY,
      familyPasswordHash,
      '+91 98765 00001',
      'te'
    ]
  );

  // Link Caregivers to Elderly Profile
  await db.execute(
    `INSERT INTO caregiver_links (id, elderly_id, caregiver_user_id, relationship, permission_level)
     VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)`,
    [
      generateId(), elderlyProfileId, caregiverUserId, 'Primary Doctor', 'FULL',
      generateId(), elderlyProfileId, familyUserId, 'Son (కుమారుడు)', 'FULL'
    ]
  );

  // 4. Create Realistic Medications for Lakshmi Devi
  const med1Id = generateId();
  const med2Id = generateId();
  const med3Id = generateId();
  const med4Id = generateId();

  await db.execute(
    `INSERT INTO medications (id, elderly_id, name, name_te, name_hi, dosage, dosage_te, dosage_hi, form, pill_color, pill_shape, frequency, time_slots, meal_timing, instructions, instructions_te, instructions_hi, total_quantity, remaining_quantity, refill_threshold, doctor_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      med1Id,
      elderlyProfileId,
      'Metformin 500mg',
      'మెట్‌ఫార్మిన్ 500mg',
      'मेटफॉर्मिन 500mg',
      '1 Tablet (1 మాత్ర)',
      '1 మాత్ర',
      '1 गोली',
      'TABLET',
      '#3B82F6', // Blue
      'oval',
      'TWICE_DAILY',
      JSON.stringify(['08:00', '20:00']),
      'AFTER_MEAL',
      'Take 1 tablet after meals with water',
      'భోజనం తర్వాత 1 మాత్ర నీటితో తీసుకోండి',
      'भोजन के बाद 1 गोली पानी के साथ लें',
      60,
      28,
      10,
      'Dr. Ananya Reddy'
    ]
  );

  await db.execute(
    `INSERT INTO medications (id, elderly_id, name, name_te, name_hi, dosage, dosage_te, dosage_hi, form, pill_color, pill_shape, frequency, time_slots, meal_timing, instructions, instructions_te, instructions_hi, total_quantity, remaining_quantity, refill_threshold, doctor_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      med2Id,
      elderlyProfileId,
      'Amlodipine 5mg',
      'అమ్లోడిపైన్ 5mg',
      'एम्लोडिपिन 5mg',
      '1 Tablet (1 మాత్ర)',
      '1 మాత్ర',
      '1 गोली',
      'TABLET',
      '#EAB308', // Yellow
      'round',
      'ONCE_DAILY',
      JSON.stringify(['08:00']),
      'BEFORE_MEAL',
      'Take 1 tablet in morning before breakfast for Blood Pressure',
      'రక్తపోటు నియంత్రణ కోసం ఉదయం అల్పాహారానికి ముందు 1 మాత్ర తీసుకోండి',
      'रक्तचाप नियंत्रण के लिए सुबह नाश्ते से पहले 1 गोली लें',
      30,
      16,
      7,
      'Dr. K. Srinivas'
    ]
  );

  await db.execute(
    `INSERT INTO medications (id, elderly_id, name, name_te, name_hi, dosage, dosage_te, dosage_hi, form, pill_color, pill_shape, frequency, time_slots, meal_timing, instructions, instructions_te, instructions_hi, total_quantity, remaining_quantity, refill_threshold, doctor_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      med3Id,
      elderlyProfileId,
      'Atorvastatin 10mg',
      'అటోర్వాస్టాటిన్ 10mg',
      'एटोरवास्टेटिन 10mg',
      '1 Capsule (1 క్యాప్సూల్)',
      '1 క్యాప్సూల్',
      '1 कैप्सूल',
      'CAPSULE',
      '#EF4444', // Red
      'capsule',
      'ONCE_DAILY',
      JSON.stringify(['21:00']),
      'AFTER_MEAL',
      'Take 1 capsule at night before sleep for cholesterol',
      'కొలెస్ట్రాల్ కోసం రాత్రి పడుకునే ముందు 1 క్యాప్సూల్ తీసుకోండి',
      'कोलेस्ट्रॉल के लिए रात को सोने से पहले 1 कैप्सूल लें',
      30,
      4, // LOW STOCK - REFILL WARNING!
      7,
      'Dr. K. Srinivas'
    ]
  );

  await db.execute(
    `INSERT INTO medications (id, elderly_id, name, name_te, name_hi, dosage, dosage_te, dosage_hi, form, pill_color, pill_shape, frequency, time_slots, meal_timing, instructions, instructions_te, instructions_hi, total_quantity, remaining_quantity, refill_threshold, doctor_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      med4Id,
      elderlyProfileId,
      'Multivitamin Senior',
      'మల్టీవిటమిన్ మాత్రలు',
      'मल्टीविटामिन सीनियर',
      '1 Tablet (1 మాత్ర)',
      '1 మాత్ర',
      '1 गोली',
      'TABLET',
      '#10B981', // Green
      'round',
      'ONCE_DAILY',
      JSON.stringify(['13:00']),
      'WITH_MEAL',
      'Take 1 tablet with lunch for daily energy & immunity',
      'మంచి శక్తి మరియు రోగనిరోధక శక్తి కోసం భోజనంతో 1 మాత్ర తీసుకోండి',
      'दैनिक ऊर्जा और रोग प्रतिरोधक क्षमता के लिए दोपहर के भोजन के साथ 1 गोली लें',
      30,
      22,
      5,
      'Dr. Rajesh Rao'
    ]
  );

  // 5. Generate Past 7 Days Adherence Logs (92% Adherence)
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Metformin Morning (8:00 AM)
    const isToday = (i === 0);
    const med1MorningStatus = isToday ? DOSE_STATUS.TAKEN : (i === 4 ? DOSE_STATUS.MISSED : DOSE_STATUS.TAKEN);
    await db.execute(
      `INSERT INTO adherence_logs (id, medication_id, elderly_id, scheduled_date, scheduled_time, scheduled_datetime, taken_datetime, status, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateId(), med1Id, elderlyProfileId, dateStr, '08:00', `${dateStr} 08:00`,
        med1MorningStatus === DOSE_STATUS.TAKEN ? `${dateStr} 08:12` : null,
        med1MorningStatus, 'SELF'
      ]
    );

    // Amlodipine Morning (8:00 AM)
    const med2Status = isToday ? DOSE_STATUS.TAKEN : DOSE_STATUS.TAKEN;
    await db.execute(
      `INSERT INTO adherence_logs (id, medication_id, elderly_id, scheduled_date, scheduled_time, scheduled_datetime, taken_datetime, status, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateId(), med2Id, elderlyProfileId, dateStr, '08:00', `${dateStr} 08:00`,
        med2Status === DOSE_STATUS.TAKEN ? `${dateStr} 08:05` : null,
        med2Status, 'SELF'
      ]
    );

    // Multivitamin Afternoon (13:00)
    const med4Status = isToday ? DOSE_STATUS.PENDING : (i === 2 ? DOSE_STATUS.SKIPPED : DOSE_STATUS.TAKEN);
    await db.execute(
      `INSERT INTO adherence_logs (id, medication_id, elderly_id, scheduled_date, scheduled_time, scheduled_datetime, taken_datetime, status, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateId(), med4Id, elderlyProfileId, dateStr, '13:00', `${dateStr} 13:00`,
        med4Status === DOSE_STATUS.TAKEN ? `${dateStr} 13:20` : null,
        med4Status, 'SELF'
      ]
    );

    // Metformin Night (20:00)
    if (!isToday) {
      await db.execute(
        `INSERT INTO adherence_logs (id, medication_id, elderly_id, scheduled_date, scheduled_time, scheduled_datetime, taken_datetime, status, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId(), med1Id, elderlyProfileId, dateStr, '20:00', `${dateStr} 20:00`,
          `${dateStr} 20:15`, DOSE_STATUS.TAKEN, 'SELF'
        ]
      );
    } else {
      // Today evening scheduled
      await db.execute(
        `INSERT INTO adherence_logs (id, medication_id, elderly_id, scheduled_date, scheduled_time, scheduled_datetime, status, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId(), med1Id, elderlyProfileId, dateStr, '20:00', `${dateStr} 20:00`,
          DOSE_STATUS.PENDING, 'SELF'
        ]
      );
    }

    // Atorvastatin Night (21:00)
    if (!isToday) {
      await db.execute(
        `INSERT INTO adherence_logs (id, medication_id, elderly_id, scheduled_date, scheduled_time, scheduled_datetime, taken_datetime, status, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId(), med3Id, elderlyProfileId, dateStr, '21:00', `${dateStr} 21:00`,
          `${dateStr} 21:08`, DOSE_STATUS.TAKEN, 'SELF'
        ]
      );
    } else {
      await db.execute(
        `INSERT INTO adherence_logs (id, medication_id, elderly_id, scheduled_date, scheduled_time, scheduled_datetime, status, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId(), med3Id, elderlyProfileId, dateStr, '21:00', `${dateStr} 21:00`,
          DOSE_STATUS.PENDING, 'SELF'
        ]
      );
    }
  }

  // 6. Seed Doctor Appointments
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 4);
  const nextMonth = new Date(now);
  nextMonth.setDate(nextMonth.getDate() + 18);

  await db.execute(
    `INSERT INTO appointments (id, elderly_id, doctor_name, specialty, clinic_address, phone, appointment_date, appointment_time, checklist_notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      generateId(), elderlyProfileId, 'Dr. K. Srinivas', 'Cardiologist (గుండె నిపుణులు)',
      'Apollo Heart Center, Jubilee Hills, Hyderabad', '+91 40 2360 7777',
      nextWeek.toISOString().split('T')[0], '10:30',
      'Bring recent Blood Pressure logs & latest ECG test report.',
      APPOINTMENT_STATUS.UPCOMING,

      generateId(), elderlyProfileId, 'Dr. Ananya Reddy', 'Diabetologist (మధుమేహ నిపుణులు)',
      'Care Hospital, Banjara Hills, Hyderabad', '+91 40 3041 8888',
      nextMonth.toISOString().split('T')[0], '09:00',
      '10-hour fasting required for Fasting Blood Sugar and HbA1c tests.',
      APPOINTMENT_STATUS.UPCOMING
    ]
  );

  // 7. Seed Healthcare Vitals Logs (Past 5 Days)
  const vitalsData = [
    { type: VITAL_TYPES.BLOOD_PRESSURE, val1: 124, val2: 82, unit: 'mmHg', mood: 'GOOD', daysAgo: 0 },
    { type: VITAL_TYPES.GLUCOSE, val1: 118, val2: null, unit: 'mg/dL', mood: 'GOOD', daysAgo: 0 },
    { type: VITAL_TYPES.HEART_RATE, val1: 72, val2: null, unit: 'bpm', mood: 'GREAT', daysAgo: 0 },
    { type: VITAL_TYPES.SPO2, val1: 98, val2: null, unit: '%', mood: 'GREAT', daysAgo: 0 },
    { type: VITAL_TYPES.BLOOD_PRESSURE, val1: 128, val2: 84, unit: 'mmHg', mood: 'GOOD', daysAgo: 1 },
    { type: VITAL_TYPES.GLUCOSE, val1: 126, val2: null, unit: 'mg/dL', mood: 'TIRED', daysAgo: 1 },
    { type: VITAL_TYPES.BLOOD_PRESSURE, val1: 132, val2: 86, unit: 'mmHg', mood: 'TIRED', daysAgo: 2 },
    { type: VITAL_TYPES.BLOOD_PRESSURE, val1: 122, val2: 80, unit: 'mmHg', mood: 'GREAT', daysAgo: 3 },
    { type: VITAL_TYPES.GLUCOSE, val1: 115, val2: null, unit: 'mg/dL', mood: 'GREAT', daysAgo: 3 }
  ];

  for (const v of vitalsData) {
    const vd = new Date(now);
    vd.setDate(vd.getDate() - v.daysAgo);
    await db.execute(
      `INSERT INTO vital_logs (id, elderly_id, type, value_primary, value_secondary, unit, mood_tag, notes, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateId(), elderlyProfileId, v.type, v.val1, v.val2, v.unit, v.mood,
        'Regular morning checkup', vd.toISOString()
      ]
    );
  }

  console.log('[Seed] Database successfully seeded with:');
  console.log(' - 1 Elderly Profile: Lakshmi Devi (PIN: 1234)');
  console.log(' - 1 Caregiver User: Dr. Rajesh Rao (caregiver@eldercare.com / Caregiver@123)');
  console.log(' - 1 Family Member: Suresh Kumar (family@eldercare.com / Family@123)');
  console.log(' - 4 Active Medications (with English & Telugu instructions, refill alert demo)');
  console.log(' - 7 Days of Adherence Logs (92% compliance rate)');
  console.log(' - 2 Upcoming Doctor Appointments with clinical checklists');
  console.log(' - 9 Historical Vitals & Mood logs for analytics');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}

module.exports = seed;
