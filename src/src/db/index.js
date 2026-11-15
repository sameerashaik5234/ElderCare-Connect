// Database Adapter: Supports PostgreSQL (Production) and SQLite (Local Development)
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const env = require('../config/env');

let sqliteDb = null;
let pgPool = null;
let isPostgres = false;

// Check if PostgreSQL is configured
if (env.DATABASE_URL && (env.DATABASE_URL.startsWith('postgres://') || env.DATABASE_URL.startsWith('postgresql://'))) {
  try {
    const { Pool } = require('pg');
    pgPool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    isPostgres = true;
    console.log('[Database] Configured for PostgreSQL (Production)');
  } catch (err) {
    console.warn('[Database] PostgreSQL driver not found or failed, falling back to SQLite:', err.message);
    isPostgres = false;
  }
}

if (!isPostgres) {
  // Ensure data directory exists
  const dbDir = path.dirname(env.SQLITE_DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  sqliteDb = new DatabaseSync(env.SQLITE_DB_PATH);
  console.log(`[Database] Initialized SQLite at: ${env.SQLITE_DB_PATH}`);
}

/**
 * Initialize Schema
 */
function initSchema() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) return;

  let schemaSql = fs.readFileSync(schemaPath, 'utf8');

  if (isPostgres && pgPool) {
    // Adapt SQLite syntax for PostgreSQL if needed (e.g. datetime('now') -> CURRENT_TIMESTAMP)
    const pgSql = schemaSql
      .replace(/datetime\('now'\)/g, 'CURRENT_TIMESTAMP')
      .replace(/INTEGER PRIMARY KEY/g, 'SERIAL PRIMARY KEY');
    pgPool.query(pgSql).catch(err => {
      console.error('[Database] PostgreSQL schema migration error:', err);
    });
  } else if (sqliteDb) {
    sqliteDb.exec(schemaSql);
    console.log('[Database] SQLite tables verified & ready.');
  }
}

// Auto-run schema on import
try {
  initSchema();
} catch (e) {
  console.error('[Database] Error initializing schema:', e);
}

/**
 * Run a query that returns multiple rows
 */
async function queryAll(sql, params = []) {
  if (isPostgres && pgPool) {
    // Convert ? parameters to $1, $2, ...
    let idx = 1;
    const pgSql = sql.replace(/\?/g, () => `$${idx++}`);
    const res = await pgPool.query(pgSql, params);
    return res.rows;
  }

  // SQLite synchronous
  const stmt = sqliteDb.prepare(sql);
  return stmt.all(...params);
}

/**
 * Run a query that returns a single row
 */
async function queryOne(sql, params = []) {
  if (isPostgres && pgPool) {
    let idx = 1;
    const pgSql = sql.replace(/\?/g, () => `$${idx++}`);
    const res = await pgPool.query(pgSql, params);
    return res.rows[0] || null;
  }

  const stmt = sqliteDb.prepare(sql);
  return stmt.get(...params) || null;
}

/**
 * Run an INSERT / UPDATE / DELETE command
 */
async function execute(sql, params = []) {
  if (isPostgres && pgPool) {
    let idx = 1;
    const pgSql = sql.replace(/\?/g, () => `$${idx++}`);
    const res = await pgPool.query(pgSql, params);
    return { changes: res.rowCount, lastInsertRowid: null };
  }

  const stmt = sqliteDb.prepare(sql);
  const result = stmt.run(...params);
  return result;
}

/**
 * Execute raw multi-statement SQL script
 */
function execScript(sql) {
  if (isPostgres && pgPool) {
    return pgPool.query(sql);
  }
  return sqliteDb.exec(sql);
}

module.exports = {
  isPostgres: () => isPostgres,
  initSchema,
  queryAll,
  queryOne,
  execute,
  execScript,
  getRawDb: () => sqliteDb
};
