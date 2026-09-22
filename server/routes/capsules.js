// routes/capsules.js
// All four CRUD routes required by the spec, at the exact paths required.
// Every route is protected by authenticateJWT (mounted in server.js), and every
// query is scoped to req.userId - never to anything the client sends.

const express = require("express");
const db = require("../db/db");

const router = express.Router();

// GET /api/capsules - read only the authenticated user's records
router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM capsules WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.userId);
  res.json(rows);
});

// POST /api/capsules - create a record owned by the authenticated user
router.post("/", (req, res) => {
  const {
    project_name,
    prompt_title,
    prompt_version,
    prompt_text,
    response_summary,
    category,
    usefulness,
    reviewed,
    improved,
    screenshot_url,
    notes,
  } = req.body;

  if (!project_name || !prompt_title || !prompt_text) {
    return res.status(400).json({
      error: "project_name, prompt_title and prompt_text are required",
    });
  }

  const stmt = db.prepare(`
    INSERT INTO capsules
      (user_id, project_name, prompt_title, prompt_version, prompt_text,
       response_summary, category, usefulness, reviewed, improved,
       screenshot_url, notes)
    VALUES (@user_id, @project_name, @prompt_title, @prompt_version, @prompt_text,
            @response_summary, @category, @usefulness, @reviewed, @improved,
            @screenshot_url, @notes)
  `);

  const info = stmt.run({
    user_id: req.userId, // <-- from the verified JWT, never from the browser
    project_name,
    prompt_title,
    prompt_version: prompt_version || null,
    prompt_text,
    response_summary: response_summary || null,
    category: category || null,
    usefulness: usefulness || null,
    reviewed: reviewed ? 1 : 0,
    improved: improved ? 1 : 0,
    screenshot_url: screenshot_url || null,
    notes: notes || null,
  });

  const created = db.prepare("SELECT * FROM capsules WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/capsules/:id - update, but ONLY if this user owns the record
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const existing = db
    .prepare("SELECT * FROM capsules WHERE id = ? AND user_id = ?")
    .get(id, req.userId);

  if (!existing) {
    // Either it doesn't exist, or it belongs to someone else - same response either way
    // so we don't leak which records exist.
    return res.status(404).json({ error: "Record not found" });
  }

  const merged = { ...existing, ...req.body };

  db.prepare(`
    UPDATE capsules SET
      project_name = @project_name,
      prompt_title = @prompt_title,
      prompt_version = @prompt_version,
      prompt_text = @prompt_text,
      response_summary = @response_summary,
      category = @category,
      usefulness = @usefulness,
      reviewed = @reviewed,
      improved = @improved,
      screenshot_url = @screenshot_url,
      notes = @notes
    WHERE id = @id AND user_id = @user_id
  `).run({
    ...merged,
    reviewed: merged.reviewed ? 1 : 0,
    improved: merged.improved ? 1 : 0,
    id,
    user_id: req.userId,
  });

  const updated = db.prepare("SELECT * FROM capsules WHERE id = ?").get(id);
  res.json(updated);
});

// DELETE /api/capsules/:id - delete, but ONLY if this user owns the record
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const info = db
    .prepare("DELETE FROM capsules WHERE id = ? AND user_id = ?")
    .run(id, req.userId);

  if (info.changes === 0) {
    return res.status(404).json({ error: "Record not found" });
  }

  res.json({ ok: true, deletedId: Number(id) });
});

module.exports = router;