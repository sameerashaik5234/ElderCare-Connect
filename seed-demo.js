
const db = require('./index');
const { generateId, hashPasscode } = require('../utils/crypto');
const { ROLES } = require('../config/constants');

async function seedDemo() {
  console.log('[Demo Seed] Checking database...');

  // Never overwrite or duplicate existing patient data.
  const existing = await db.queryOne(
    'SELECT id FROM elderly_profiles LIMIT 1'
  );

  if (existing) {
    console.log('[Demo Seed] Patient data already exists. Skipping.');
    return;
  }

  const userId = generateId();
  const profileId = generateId();

  await db.execute(
    `INSERT INTO users (id, email, name, role, passcode_hash)
     VALUES (?, ?, ?, ?, ?)`,
    [
      userId,
      'lakshmi.demo@eldercare.test',
      'Lakshmi Devi',
      ROLES.ELDERLY,
      hashPasscode('1234')
    ]
  );

  await db.execute(
    `INSERT INTO elderly_profiles
     (id, user_id, full_name, age, blood_group, allergies,
      medical_conditions, emergency_contact_name, emergency_contact_email)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      profileId,
      userId,
      'Lakshmi Devi',
      72,
      'O+',
      'Demo information only',
      'Demo profile - not real medical data',
      'Demo Caregiver',
      'caregiver.demo@eldercare.test'
    ]
  );

  // Fictional demo records only. These are NOT prescriptions.
  const demoMeds = [
    ['Demo Medicine A', 'Demo dosage', 'TWICE_DAILY', ['08:00', '20:00']],
    ['Demo Medicine B', 'Demo dosage', 'ONCE_DAILY', ['08:00']],
    ['Demo Medicine C', 'Demo dosage', 'ONCE_DAILY', ['21:00']]
  ];

  for (const [name, dosage, frequency, times] of demoMeds) {
    await db.execute(
      `INSERT INTO medications
       (id, elderly_id, name, dosage, form, frequency, time_slots,
        meal_timing, instructions, total_quantity, remaining_quantity,
        refill_threshold, doctor_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateId(),
        profileId,
        name,
        dosage,
        'TABLET',
        frequency,
        JSON.stringify(times),
        'ANYTIME',
        'FICTIONAL DEMO ONLY - NOT A PRESCRIPTION',
        30,
        30,
        7,
        'Demo doctor'
      ]
    );
  }

  console.log('[Demo Seed] Demo patient and 3 demo medicines created.');
}

if (require.main === module) {
  seedDemo()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('[Demo Seed] Failed:', error);
      process.exit(1);
    });
}

module.exports = seedDemo;
