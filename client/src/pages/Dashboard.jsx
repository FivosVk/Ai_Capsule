import { useEffect, useState } from "react";
import { api } from "../api.js";

const EMPTY_FORM = {
  project_name: "",
  prompt_title: "",
  prompt_version: "v1",
  prompt_text: "",
  response_summary: "",
  category: "Coding",
  usefulness: "Good",
  reviewed: false,
  improved: false,
  screenshot_url: "",
  notes: "",
};

export default function Dashboard() {
  const [capsules, setCapsules] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCapsules() {
    try {
      const data = await api.listCapsules();
      setCapsules(data);
    } catch (err) {
      if (err.status === 401) {
        // Not logged in (or session expired) - bounce back to the landing page
        // to sign in again. This is client-side UX only; the real protection
        // is the 401 the server already returned.
        window.location.href = "/";
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCapsules();
  }, []);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startEdit(capsule) {
    setEditingId(capsule.id);
    setForm({
      project_name: capsule.project_name || "",
      prompt_title: capsule.prompt_title || "",
      prompt_version: capsule.prompt_version || "",
      prompt_text: capsule.prompt_text || "",
      response_summary: capsule.response_summary || "",
      category: capsule.category || "",
      usefulness: capsule.usefulness || "",
      reviewed: !!capsule.reviewed,
      improved: !!capsule.improved,
      screenshot_url: capsule.screenshot_url || "",
      notes: capsule.notes || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.updateCapsule(editingId, form);
      } else {
        await api.createCapsule(form);
      }
      cancelEdit();
      await loadCapsules();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this capsule?")) return;
    try {
      await api.deleteCapsule(id);
      await loadCapsules();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="muted">Loading your capsules...</p>;

  return (
    <section className="dashboard">
      <h1>Your Capsules</h1>
      {error && <p className="error">{error}</p>}

      <form className="capsule-form" onSubmit={handleSubmit}>
        <h2>{editingId ? "Edit capsule" : "New capsule"}</h2>

        <div className="grid">
          <label>
            Project name *
            <input
              required
              value={form.project_name}
              onChange={(e) => updateField("project_name", e.target.value)}
            />
          </label>

          <label>
            Prompt title *
            <input
              required
              value={form.prompt_title}
              onChange={(e) => updateField("prompt_title", e.target.value)}
            />
          </label>

          <label>
            Version
            <input
              value={form.prompt_version}
              onChange={(e) => updateField("prompt_version", e.target.value)}
              placeholder="v1"
            />
          </label>

          <label>
            Category
            <select
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
            >
              <option>Coding</option>
              <option>Writing</option>
              <option>Research</option>
              <option>Debugging</option>
              <option>Study</option>
            </select>
          </label>

          <label>
            Usefulness
            <select
              value={form.usefulness}
              onChange={(e) => updateField("usefulness", e.target.value)}
            >
              <option>Good</option>
              <option>Needs Improvement</option>
            </select>
          </label>

          <label>
            Screenshot URL
            <input
              value={form.screenshot_url}
              onChange={(e) => updateField("screenshot_url", e.target.value)}
              placeholder="https://..."
            />
          </label>
        </div>

        <label>
          Prompt text *
          <textarea
            required
            rows={3}
            value={form.prompt_text}
            onChange={(e) => updateField("prompt_text", e.target.value)}
          />
        </label>

        <label>
          Response summary
          <textarea
            rows={2}
            value={form.response_summary}
            onChange={(e) => updateField("response_summary", e.target.value)}
          />
        </label>

        <label>
          Notes
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />
        </label>

        <div className="checkboxes">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.reviewed}
              onChange={(e) => updateField("reviewed", e.target.checked)}
            />
            Reviewed
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.improved}
              onChange={(e) => updateField("improved", e.target.checked)}
            />
            Improved
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn">
            {editingId ? "Save changes" : "Add capsule"}
          </button>
          {editingId && (
            <button type="button" className="btn secondary" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <ul className="capsule-list">
        {capsules.length === 0 && <p className="muted">No capsules yet - add one above.</p>}
        {capsules.map((c) => (
          <li key={c.id} className="capsule-card">
            <div className="capsule-card-header">
              <strong>{c.prompt_title}</strong>
              <span className="tag">{c.prompt_version}</span>
            </div>
            <p className="muted">
              {c.project_name} · {c.category} · {c.usefulness}
            </p>
            <p>{c.prompt_text}</p>
            {c.response_summary && <p className="muted">Summary: {c.response_summary}</p>}
            {c.notes && <p className="muted">Notes: {c.notes}</p>}
            <p className="muted small">
              Reviewed: {c.reviewed ? "Yes" : "No"} · Improved: {c.improved ? "Yes" : "No"} ·
              Created: {c.created_at}
            </p>
            <div className="form-actions">
              <button className="btn secondary" onClick={() => startEdit(c)}>
                Edit
              </button>
              <button className="btn danger" onClick={() => handleDelete(c.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}