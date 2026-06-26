import { useState } from "react";
import type { CSSProperties } from "react";
import type { FormField } from "../api";
import "./FormPreview.css";

interface PreviewTheme {
  backgroundColor?: string;
  cardColor?: string;
  titleColor: string;
  primaryColor: string;
}

interface Props {
  title: string;
  description: string;
  fields: FormField[];
  theme?: PreviewTheme;
}

function QuestionTitle({
  index,
  field,
  titleColor,
}: {
  index: number;
  field: FormField;
  titleColor?: string;
}) {
  return (
    <div className="survey-q-title" style={titleColor ? { color: titleColor } : undefined}>
      <span className="survey-q-num">{index + 1}.</span>
      <span>{field.label || "(untitled question)"}</span>
      {field.required && <span className="preview-required"> *</span>}
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="survey-stars" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`survey-star${n <= (hover || value) ? " on" : ""}`}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n === value ? 0 : n)}
          role="button"
          aria-label={`${n} star`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function FormPreview({ title, description, fields, theme }: Props) {
  const [answers, setAnswers] = useState<Record<string, string | number>>({});

  function setAnswer(fieldId: string, value: string | number) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }

  const rootStyle = theme
    ? ({ "--accent": theme.primaryColor } as CSSProperties)
    : undefined;
  const titleStyle = theme ? { color: theme.titleColor } : undefined;
  const bgStyle = theme?.backgroundColor ? { background: theme.backgroundColor } : undefined;
  const cardStyle = theme?.cardColor ? { background: theme.cardColor } : undefined;

  return (
    <div className="survey-bg" style={bgStyle}>
      <div className="survey" style={rootStyle}>
        <div className="survey-card survey-head" style={cardStyle}>
          <div className="survey-accent" />
          <h2 className="survey-title" style={titleStyle}>
            {title.trim() || "Untitled survey"}
          </h2>
          {description.trim() && <p className="survey-desc">{description}</p>}
        </div>

      {fields.length === 0 && (
        <div className="survey-card survey-empty">
          No questions yet. Add a field on the left to build your survey.
        </div>
      )}

      {fields.map((field, index) => (
        <div className="survey-card" key={field.fieldId} style={cardStyle}>
          <QuestionTitle index={index} field={field} titleColor={theme?.titleColor} />

          {field.type === "rating" && (
            <StarRating
              value={Number(answers[field.fieldId] ?? 0)}
              onChange={(v) => setAnswer(field.fieldId, v)}
            />
          )}

          {field.type === "dropdown" && (
            <div className="survey-options">
              {(field.options ?? []).length === 0 && (
                <span className="survey-hint">No options yet</span>
              )}
              {(field.options ?? []).map((opt, i) => (
                <label className="survey-option" key={i}>
                  <input
                    type="radio"
                    name={field.fieldId}
                    checked={answers[field.fieldId] === opt}
                    onChange={() => setAnswer(field.fieldId, opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}

          {field.type === "text" && (
            <>
              <textarea
                className="survey-text"
                rows={3}
                maxLength={field.maxLength ?? undefined}
                value={String(answers[field.fieldId] ?? "")}
                onChange={(e) => setAnswer(field.fieldId, e.target.value)}
                placeholder="Your answer"
              />
              {field.maxLength && (
                <div className="survey-counter">
                  {String(answers[field.fieldId] ?? "").length}/{field.maxLength}
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {fields.length > 0 && (
        <button className="survey-submit" type="button">
          Submit
        </button>
      )}
      </div>
    </div>
  );
}
