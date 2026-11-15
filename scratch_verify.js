// Step 1: Verify current DB schema
const db = require('./src/db');

async function inspect() {
  const cols = await db.queryAll("PRAGMA table_info(medications)");
  console.log('\n=== medications columns ===');
  cols.forEach(c => console.log(`  [${c.cid}] ${c.name} (${c.type}) default=${c.dflt_value}`));

  const userCols = await db.queryAll("PRAGMA table_info(users)");
  console.log('\n=== users language_preference column ===');
  const lp = userCols.find(c => c.name === 'language_preference');
  console.log(lp ? `  Found: ${lp.name} default=${lp.dflt_value}` : '  NOT FOUND');

  const count = await db.queryAll("SELECT COUNT(*) as n FROM medications");
  const meds  = await db.queryAll("SELECT name, name_te FROM medications");
  console.log(`\n=== medication rows: ${count[0].n} ===`);
  meds.forEach(m => console.log(`  ${m.name} | te: ${m.name_te || '<null>'}`));

  const hasHi = cols.some(c => c.name === 'name_hi');
  const hasDosageHi = cols.some(c => c.name === 'dosage_hi');
  const hasInstrHi  = cols.some(c => c.name === 'instructions_hi');
  console.log(`\n=== Hindi column check ===`);
  console.log(`  name_hi:         ${hasHi ? 'EXISTS' : 'MISSING'}`);
  console.log(`  dosage_hi:       ${hasDosageHi ? 'EXISTS' : 'MISSING'}`);
  console.log(`  instructions_hi: ${hasInstrHi ? 'EXISTS' : 'MISSING'}`);
  process.exit(0);
}
inspect().catch(e => { console.error(e); process.exit(1); });
