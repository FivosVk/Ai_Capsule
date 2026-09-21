// db/db.js
// Minimal SQLite setup using better-sqlite3 (synchronous, no callbacks/promises needed).
// NOTE: on an ephemeral filesystem (e.g. Render free tier) this capsules.db file
// can be wiped on restart/redeploy - fine for this assignment, just say so honestly
// in the README. For real persistence, swap this for Postgres or a mounted disk.

const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "capsules.db");
const db = new Database(dbPath);

// Exact schema from the assignment spec.
db.exec(`
  CREATE TABLE IF NOT EXISTS capsules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    project_name TEXT NOT NULL,
    prompt_title TEXT NOT NULL,
    prompt_version TEXT,
    prompt_text TEXT NOT NULL,
    response_summary TEXT,
    category TEXT,
    usefulness TEXT,
    reviewed INTEGER DEFAULT 0,
    improved INTEGER DEFAULT 0,
    screenshot_url TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;