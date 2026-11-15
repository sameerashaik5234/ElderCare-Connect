// Safe migration: adds name_hi, dosage_hi, instructions_hi to medications table.
// Preserves ALL existing data. Uses ADD COLUMN (SQLite ALTER TABLE is safe).
const db = require('./index');

const HINDI_DATA = {
  'Metformin 500mg': {
    name_hi:         'मेटफॉर्मिन 500mg',
    dosage_hi:       '1 गोली',
    instructions_hi: 'भोजन के बाद 1 गोली पानी के साथ लें'
  },
  'Amlodipine 5mg': {
    name_hi:         'एम्लोडिपिन 5mg',
    dosage_hi:       '1 गोली',
    instructions_hi: 'रक्तचाप नियंत्रण के लिए सुबह नाश्ते से पहले 1 गोली लें'
  },
  'Atorvastatin 10mg': {
    name_hi:         'एटोरवास्टेटिन 10mg',
    dosage_hi:       '1 कैप्सूल',
    instructions_hi: 'कोलेस्ट्रॉल के लिए रात को सोने से पहले 1 कैप्सूल लें'
  },
  'Multivitamin Senior': {
    name_hi:         'मल्टीविटामिन सीनियर',
    dosage_hi:       '1 गोली',
    instructions_hi: 'दैनिक ऊर्जा और रोग प्रतिरोधक क्षमता के लिए दोपहर के भोजन के साथ 1 गोली लें'
  }
};

async function migrate() {
  console.log('[Migration] Starting safe Hindi column migration...\n');

  // ── Step 1: Check which columns already exist ──────────────────────────────
  const cols = await db.queryAll("PRAGMA table_info(medications)");
  const existing = new Set(cols.map(c => c.name));
  console.log('[Migration] Existing columns:', [...existing].join(', '));

  const toAdd = [];
  if (!existing.has('name_hi'))         toAdd.push({ col: 'name_hi',         sql: 'ALTER TABLE medications ADD COLUMN name_hi TEXT' });
  if (!existing.has('dosage_hi'))       toAdd.push({ col: 'dosage_hi',       sql: 'ALTER TABLE medications ADD COLUMN dosage_hi TEXT' });
  if (!existing.has('instructions_hi')) toAdd.push({ col: 'instructions_hi', sql: 'ALTER TABLE medications ADD COLUMN instructions_hi TEXT' });

  if (toAdd.length === 0) {
    console.log('[Migration] All Hindi columns already exist. Checking data...');
  } else {
    for (const { col, sql } of toAdd) {
      await db.execute(sql);
      console.log(`[Migration] Added column: ${col}`);
    }
  }

  // ── Step 2: Backfill Hindi data for each medication ─────────────────────────
  console.log('\n[Migration] Backfilling Hindi translations...');
  const meds = await db.queryAll('SELECT id, name, name_hi, dosage_hi, instructions_hi FROM medications');

  for (const med of meds) {
    const hindi = HINDI_DATA[med.name];
    if (!hindi) {
      console.log(`  [Skip] No Hindi data for: "${med.name}"`);
      continue;
    }

    // Only update if still NULL/empty (preserves any manually entered data)
    const needsName  = !med.name_hi;
    const needsDosage = !med.dosage_hi;
    const needsInstr  = !med.instructions_hi;

    if (!needsName && !needsDosage && !needsInstr) {
      console.log(`  [Skip] "${med.name}" already has Hindi data`);
      continue;
    }

    await db.execute(
      `UPDATE medications SET
        name_hi         = COALESCE(NULLIF(name_hi, ''),         ?),
        dosage_hi       = COALESCE(NULLIF(dosage_hi, ''),       ?),
        instructions_hi = COALESCE(NULLIF(instructions_hi, ''), ?)
       WHERE id = ?`,
      [hindi.name_hi, hindi.dosage_hi, hindi.instructions_hi, med.id]
    );
    console.log(`  [Updated] "${med.name}" → name_hi="${hindi.name_hi}", dosage_hi="${hindi.dosage_hi}"`);
  }

  // ── Step 3: Verify the migration ──────────────────────────────────────────
  console.log('\n[Migration] Verification:');
  const result = await db.queryAll(
    'SELECT name, name_hi, dosage_hi, instructions_hi FROM medications'
  );
  let allOk = true;
  for (const r of result) {
    const ok = r.name_hi && r.dosage_hi && r.instructions_hi;
    console.log(`  ${ok ? '✅' : '❌'} ${r.name}`);
    console.log(`       name_hi:         ${r.name_hi || '<NULL>'}`);
    console.log(`       dosage_hi:       ${r.dosage_hi || '<NULL>'}`);
    console.log(`       instructions_hi: ${r.instructions_hi || '<NULL>'}`);
    if (!ok) allOk = false;
  }

  console.log(`\n[Migration] ${allOk ? '✅ COMPLETE — all Hindi data present.' : '❌ INCOMPLETE — some rows missing data.'}`);
  process.exit(allOk ? 0 : 1);
}

migrate().catch(e => { console.error('[Migration Error]:', e.message); process.exit(1); });
