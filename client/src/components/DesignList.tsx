import { useEffect, useState } from "react";
import { deleteDesign, listDesigns, type Design } from "../api";
import "./DesignList.css";

interface Props {
  onEdit: (id: number) => void;
  onNew: () => void;
}

export default function DesignList({ onEdit, onNew }: Props) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDesigns()
      .then(setDesigns)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load designs"))
      .finally(() => setLoading(false));
  }, []);

  async function remove(id: number, name: string) {
    if (!window.confirm(`Delete design "${name}"? This cannot be undone.`)) return;
    try {
      await deleteDesign(id);
      setDesigns((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete design");
    }
  }

  return (
    <div className="designs-page">
      <div className="builder-toolbar">
        <h2>Designs</h2>
        <button className="refresh-btn" onClick={onNew}>
          + New design
        </button>
      </div>

      <p className="builder-hint">
        Each design is a complete feedback form (title, questions and colors). Reference one by name
        from the SDK, e.g. <code>showFeedbackDialog(activity, "game_over")</code>, so different
        screens can show different forms.
      </p>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p className="empty">Loading designs…</p>
      ) : designs.length === 0 ? (
        <p className="empty">No designs yet. Create one.</p>
      ) : (
        <div className="design-grid">
          {designs.map((d) => (
            <div className="design-card" key={d.id}>
              <div
                className="design-card-preview"
                style={{ background: d.backgroundColor }}
                onClick={() => onEdit(d.id)}
              >
                <span className="design-card-surface" style={{ background: d.cardColor }}>
                  <span className="design-card-title" style={{ color: d.titleColor }}>
                    {d.title || "Untitled"}
                  </span>
                </span>
                <span className="design-card-button" style={{ background: d.buttonColor }}>
                  Submit
                </span>
              </div>
              <div className="design-card-body">
                <div className="design-card-meta">
                  <span className="design-card-name">{d.name}</span>
                  <span className="design-card-count">
                    {d.fields.length} field{d.fields.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="design-card-actions">
                  <button className="add-btn" onClick={() => onEdit(d.id)}>
                    Edit
                  </button>
                  <button className="ghost-btn" onClick={() => remove(d.id, d.name)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
