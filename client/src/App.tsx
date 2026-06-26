import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  listFeedback,
  markAsViewed,
  openFeedbackDetails,
  updateFeedbackStatus,
  type Feedback,
  type FeedbackStatus,
} from "./api";
import { EMPTY_FILTERS, feedbackTypes, filterFeedback, searchFeedback } from "./filters";
import { exportFeedback } from "./export";
import { getSession, isAuthenticated, logout } from "./auth";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import FeedbackToolbar from "./components/FeedbackToolbar";
import FeedbackList from "./components/FeedbackList";
import FeedbackDetail from "./components/FeedbackDetail";
import DesignEditor from "./components/DesignEditor";
import DesignList from "./components/DesignList";

type View = "dashboard" | "feedback" | "design" | "designs";

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [view, setView] = useState<View>("dashboard");
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [editingDesignId, setEditingDesignId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listFeedback()
      .then((data) => setItems(data))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load feedback"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  useEffect(() => {
    const handleExpired = () => {
      setAuthed(false);
      setError("Your session expired. Please sign in again.");
    };
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  const visible = useMemo(
    () => filterFeedback(searchFeedback(items, query), filters),
    [items, query, filters],
  );
  const types = useMemo(() => feedbackTypes(items), [items]);
  const selected = useMemo(
    () => items.find((item) => item.feedbackId === selectedId) ?? null,
    [items, selectedId],
  );

  const replaceItem = useCallback((updated: Feedback) => {
    setItems((prev) => prev.map((i) => (i.feedbackId === updated.feedbackId ? updated : i)));
  }, []);

  const openDetails = useCallback(
    async (id: string) => {
      setSelectedId(id);
      try {
        const full = await openFeedbackDetails(id);
        replaceItem(full);
        if (!full.viewed) replaceItem(await markAsViewed(id));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to open feedback");
      }
    },
    [replaceItem],
  );

  const changeStatus = useCallback(
    async (id: string, status: FeedbackStatus) => {
      try {
        replaceItem(await updateFeedbackStatus(id, status));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update status");
      }
    },
    [replaceItem],
  );

  const markViewed = useCallback(
    async (id: string) => {
      try {
        replaceItem(await markAsViewed(id));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to mark as viewed");
      }
    },
    [replaceItem],
  );

  const handleLogout = () => {
    logout();
    setAuthed(false);
  };

  if (!authed) {
    return <Login onLoggedIn={() => setAuthed(true)} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Feedback Portal</h1>
          <nav className="tabs">
            <button
              className={`tab${view === "dashboard" ? " active" : ""}`}
              onClick={() => setView("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={`tab${view === "feedback" ? " active" : ""}`}
              onClick={() => setView("feedback")}
            >
              Feedback
            </button>
            <button
              className={`tab${view === "design" ? " active" : ""}`}
              onClick={() => setView("design")}
            >
              Design Form
            </button>
            <button
              className={`tab${view === "designs" ? " active" : ""}`}
              onClick={() => setView("designs")}
            >
              Designs
            </button>
          </nav>
        </div>
        <div className="header-right">
          {(view === "dashboard" || view === "feedback") && (
            <button className="refresh-btn" onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Refresh"}
            </button>
          )}
          <span className="user-chip">{getSession()?.fullName ?? "Account"}</span>
          <button className="ghost-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          {error}. Is the backend running on the configured API URL?
        </div>
      )}

      {view === "dashboard" && <Dashboard items={items} />}

      {view === "feedback" && (
        <>
          <FeedbackToolbar
            query={query}
            onQueryChange={setQuery}
            filters={filters}
            onFiltersChange={setFilters}
            types={types}
            resultCount={visible.length}
            onExportCsv={() => exportFeedback(visible, "csv")}
            onExportJson={() => exportFeedback(visible, "json")}
          />
          <main className="layout">
            <aside className="sidebar">
              {loading && items.length === 0 ? (
                <p className="empty">Loading…</p>
              ) : (
                <FeedbackList items={visible} selectedId={selectedId} onSelect={openDetails} />
              )}
            </aside>
            <section className="content">
              <FeedbackDetail
                feedback={selected}
                onChangeStatus={changeStatus}
                onMarkViewed={markViewed}
              />
            </section>
          </main>
        </>
      )}

      {view === "design" && (
        <DesignEditor
          key={editingDesignId ?? "new"}
          designId={editingDesignId}
          onSaved={() => setView("designs")}
          onBack={() => setView("designs")}
        />
      )}

      {view === "designs" && (
        <DesignList
          onEdit={(id) => {
            setEditingDesignId(id);
            setView("design");
          }}
          onNew={() => {
            setEditingDesignId(null);
            setView("design");
          }}
        />
      )}
    </div>
  );
}
