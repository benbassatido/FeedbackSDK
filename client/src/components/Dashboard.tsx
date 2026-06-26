import { useMemo, useState, type ReactNode } from "react";
import { FEEDBACK_STATUSES, type Feedback } from "../api";
import { feedbackTypes } from "../filters";
import { getSession } from "../auth";
import "./Dashboard.css";

interface Props {
  items: Feedback[];
}

function ApiKeyCard() {
  const apiKey = getSession()?.apiKey ?? "";
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  if (!apiKey) return null;

  return (
    <section className="api-key-card">
      <div className="api-key-text">
        <h3 className="api-key-title">Your SDK API key</h3>
        <p className="api-key-hint">
          Initialize the SDK with this key so feedback and designs are tied to your account:
          <code>FeedbackSDK.init(context, "YOUR_KEY")</code>
        </p>
        <code className="api-key-value">{apiKey}</code>
      </div>
      <button className="copy-btn" onClick={copy}>
        {copied ? "Copied!" : "Copy key"}
      </button>
    </section>
  );
}

const IconUser = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconMail = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const IconStar = (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.8 6.1 21l1.1-6.5L2.5 9.3l6.5-.9z" />
  </svg>
);

const IconCamera = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

function StatCard({
  label,
  value,
  hint,
  icon,
  tint,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tint?: string;
}) {
  return (
    <div className="stat-card">
      {icon && <span className={`stat-icon ${tint ?? ""}`}>{icon}</span>}
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}

export default function Dashboard({ items }: Props) {
  const stats = useMemo(() => {
    const total = items.length;
    const unviewed = items.filter((i) => !i.viewed).length;
    const withScreenshot = items.filter((i) => i.screenshotUrl).length;

    const ratings = items
      .map((i) => Number(i.answers["rating"]))
      .filter((n) => Number.isFinite(n) && n > 0);
    const avgRating = ratings.length
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : "–";

    const byStatus: Record<string, number> = {};
    for (const status of FEEDBACK_STATUSES) byStatus[status] = 0;
    for (const item of items) byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;

    const byType: { type: string; count: number }[] = feedbackTypes(items).map((type) => ({
      type,
      count: items.filter((i) => String(i.answers["feedback_type"] ?? "") === type).length,
    }));

    return { total, unviewed, withScreenshot, avgRating, byStatus, byType };
  }, [items]);

  const maxStatus = Math.max(1, ...Object.values(stats.byStatus));

  return (
    <div className="dashboard">
      <h2 className="dashboard-title">Overview</h2>

      <ApiKeyCard />

      <div className="stat-grid">
        <StatCard label="Total feedback" value={stats.total} icon={IconUser} tint="tint-indigo" />
        <StatCard
          label="Unread"
          value={stats.unviewed}
          hint={`${stats.total - stats.unviewed} read`}
          icon={IconMail}
          tint="tint-green"
        />
        <StatCard label="Avg. rating" value={stats.avgRating} hint="out of 5" icon={IconStar} tint="tint-amber" />
        <StatCard label="With screenshot" value={stats.withScreenshot} icon={IconCamera} tint="tint-blue" />
      </div>

      <div className="dashboard-panels">
        <section className="panel">
          <h3 className="panel-title">By status</h3>
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div className="bar-row" key={status}>
              <span className={`bar-label badge badge-${status}`}>{status.replace("_", " ")}</span>
              <div className="bar-track">
                <div
                  className={`bar-fill bar-${status}`}
                  style={{ width: `${(count / maxStatus) * 100}%` }}
                />
              </div>
              <span className="bar-count">{count}</span>
            </div>
          ))}
        </section>

        <section className="panel">
          <h3 className="panel-title">By type</h3>
          {stats.byType.length === 0 ? (
            <p className="empty">No feedback yet.</p>
          ) : (
            stats.byType.map(({ type, count }) => (
              <div className="bar-row" key={type}>
                <span className="bar-label">{type}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill bar-type"
                    style={{ width: `${(count / stats.total) * 100}%` }}
                  />
                </div>
                <span className="bar-count">{count}</span>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
