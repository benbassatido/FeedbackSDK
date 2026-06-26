import type { Feedback } from "../api";
import { formatDate, previewText } from "../format";
import "./FeedbackList.css";

interface Props {
  items: Feedback[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{status.replace("_", " ")}</span>;
}

export default function FeedbackList({ items, selectedId, onSelect }: Props) {
  if (items.length === 0) {
    return <p className="empty">No feedback matches the current filters.</p>;
  }

  return (
    <ul className="feedback-list">
      {items.map((item) => {
        const type = item.answers["feedback_type"];
        const rating = item.answers["rating"];
        const message = item.answers["message"];
        return (
          <li
            key={item.feedbackId}
            className={`feedback-item${item.feedbackId === selectedId ? " selected" : ""}${item.viewed ? "" : " unviewed"}`}
            onClick={() => onSelect(item.feedbackId)}
          >
            <div className="feedback-item-top">
              {!item.viewed && <span className="unread-dot" title="Unread" />}
              <span className="feedback-type">{previewText(type, 24)}</span>
              {rating != null && <span className="feedback-rating">{"★".repeat(Math.round(Number(rating)))}</span>}
              {item.screenshotUrl && <span className="feedback-camera" title="Has screenshot">📷</span>}
              <StatusBadge status={item.status} />
            </div>
            <div className="feedback-message">{previewText(message, 80)}</div>
            <div className="feedback-meta">
              <span>{item.userEmail ?? item.userId ?? "anonymous"}</span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
