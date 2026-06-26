import { FEEDBACK_STATUSES } from "../api";
import type { FeedbackFilters } from "../filters";
import "./FeedbackToolbar.css";

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  filters: FeedbackFilters;
  onFiltersChange: (f: FeedbackFilters) => void;
  types: string[];
  resultCount: number;
  onExportCsv: () => void;
  onExportJson: () => void;
}

export default function FeedbackToolbar({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  types,
  resultCount,
  onExportCsv,
  onExportJson,
}: Props) {
  const update = (patch: Partial<FeedbackFilters>) => onFiltersChange({ ...filters, ...patch });

  return (
    <div className="toolbar">
      <input
        className="search-input"
        type="search"
        placeholder="Search feedback…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />

      <select
        className="filter-select"
        value={filters.status}
        onChange={(e) => update({ status: e.target.value })}
      >
        <option value="">All statuses</option>
        {FEEDBACK_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ")}
          </option>
        ))}
      </select>

      <select
        className="filter-select"
        value={filters.type}
        onChange={(e) => update({ type: e.target.value })}
      >
        <option value="">All types</option>
        {types.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <label className="filter-check">
        <input
          type="checkbox"
          checked={filters.onlyUnviewed}
          onChange={(e) => update({ onlyUnviewed: e.target.checked })}
        />
        Unread
      </label>

      <label className="filter-check">
        <input
          type="checkbox"
          checked={filters.onlyWithScreenshot}
          onChange={(e) => update({ onlyWithScreenshot: e.target.checked })}
        />
        Screenshot
      </label>

      <span className="result-count">{resultCount} result{resultCount === 1 ? "" : "s"}</span>

      <div className="export-group">
        <button className="add-btn" onClick={onExportCsv}>
          Export CSV
        </button>
        <button className="add-btn" onClick={onExportJson}>
          Export JSON
        </button>
      </div>
    </div>
  );
}
