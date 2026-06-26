import { FEEDBACK_STATUSES, screenshotUrl, type Feedback, type FeedbackStatus } from "../api";
import { formatDate, stringify } from "../format";
import "./FeedbackDetail.css";

interface Props {
  feedback: Feedback | null;
  onChangeStatus: (id: string, status: FeedbackStatus) => void;
  onMarkViewed: (id: string) => void;
}

function Section({ title, entries }: { title: string; entries: [string, unknown][] }) {
  if (entries.length === 0) return null;
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      <dl className="detail-grid">
        {entries.map(([key, value]) => (
          <div className="detail-row" key={key}>
            <dt>{key}</dt>
            <dd>{stringify(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ViewScreenshot({ feedback }: { feedback: Feedback }) {
  const url = screenshotUrl(feedback);
  if (!url) return null;
  return (
    <section className="detail-section">
      <h3>Screenshot</h3>
      <a href={url} target="_blank" rel="noreferrer">
        <img className="screenshot" src={url} alt="Feedback screenshot" />
      </a>
    </section>
  );
}

function ViewDeviceInfo({ feedback }: { feedback: Feedback }) {
  return <Section title="Device Info" entries={Object.entries(feedback.deviceInfo ?? {})} />;
}

function ViewAppInfo({ feedback }: { feedback: Feedback }) {
  return <Section title="App Info" entries={Object.entries(feedback.appInfo ?? {})} />;
}

function ViewMetadata({ feedback }: { feedback: Feedback }) {
  return <Section title="Metadata" entries={Object.entries(feedback.metadata)} />;
}

export default function FeedbackDetail({ feedback, onChangeStatus, onMarkViewed }: Props) {
  if (!feedback) {
    return <div className="detail-empty">Select a feedback entry to see details.</div>;
  }

  return (
    <div className="detail">
      <header className="detail-header">
        <div>
          <h2>Feedback</h2>
          <code>{feedback.feedbackId}</code>
        </div>
        <div className="detail-actions">
          <label className="status-control">
            <span>Status</span>
            <select
              className="status-select"
              value={feedback.status}
              onChange={(e) => onChangeStatus(feedback.feedbackId, e.target.value as FeedbackStatus)}
            >
              {FEEDBACK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          {!feedback.viewed && (
            <button className="ghost-btn" onClick={() => onMarkViewed(feedback.feedbackId)}>
              Mark as viewed
            </button>
          )}
        </div>
      </header>

      <Section
        title="Submission"
        entries={[
          ["status", feedback.status],
          ["viewed", feedback.viewed ? "yes" : "no"],
          ["createdAt", formatDate(feedback.createdAt)],
          ["updatedAt", formatDate(feedback.updatedAt)],
          ["userId", feedback.userId],
          ["userEmail", feedback.userEmail],
        ]}
      />

      <ViewScreenshot feedback={feedback} />
      <Section title="Answers" entries={Object.entries(feedback.answers)} />
      <ViewMetadata feedback={feedback} />
      <ViewDeviceInfo feedback={feedback} />
      <ViewAppInfo feedback={feedback} />
    </div>
  );
}
