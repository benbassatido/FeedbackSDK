import { useEffect, useState } from "react";
import {
  createDesign,
  listDesigns,
  updateDesign,
  type Design,
  type DesignInput,
  type FieldType,
  type FormField,
} from "../api";
import FormPreview from "./FormPreview";
import "./DesignEditor.css";

interface Props {
  designId: number | null;
  onSaved: () => void;
  onBack: () => void;
}

interface EditableField {
  key: string;
  fieldId: string;
  idEdited: boolean;
  type: FieldType;
  label: string;
  required: boolean;
  options: string[];
  maxLength: number | null;
}

const FIELD_TYPES: FieldType[] = ["text", "dropdown", "rating"];

const DEFAULT_COLORS = {
  backgroundColor: "#F4F5FB",
  cardColor: "#FFFFFF",
  titleColor: "#15172B",
  buttonColor: "#4F46E5",
};

let keyCounter = 0;
function nextKey(): string {
  keyCounter += 1;
  return `f${keyCounter}`;
}

function slugify(label: string): string {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "field";
}

function uniqueId(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}_${i}`)) i += 1;
  return `${base}_${i}`;
}

function toEditable(field: FormField): EditableField {
  return {
    key: nextKey(),
    fieldId: field.fieldId,
    idEdited: true,
    type: field.type,
    label: field.label,
    required: field.required,
    options: field.options ?? [],
    maxLength: field.maxLength,
  };
}

function defaultFields(): EditableField[] {
  return [
    { key: nextKey(), fieldId: "rating", idEdited: true, type: "rating", label: "Rating", required: true, options: [], maxLength: null },
    { key: nextKey(), fieldId: "message", idEdited: true, type: "text", label: "Message", required: true, options: [], maxLength: 500 },
  ];
}

function validate(name: string, title: string, fields: EditableField[]): string | null {
  if (!name.trim()) return "Design name must not be empty.";
  if (!title.trim()) return "Form title must not be empty.";
  if (fields.length === 0) return "Add at least one field.";
  const ids = new Set<string>();
  for (const f of fields) {
    if (!f.label.trim()) return "Every field needs a label.";
    if (!f.fieldId.trim()) return "Every field needs an id.";
    if (ids.has(f.fieldId)) return `Duplicate field id: ${f.fieldId}`;
    ids.add(f.fieldId);
    if (f.type === "dropdown" && f.options.filter((o) => o.trim()).length === 0) {
      return `Dropdown "${f.label}" needs at least one option.`;
    }
  }
  return null;
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="color-field field-col">
      <span className="field-label">{label}</span>
      <div className="color-field-row">
        <input type="color" className="color-swatch" value={value} onChange={(e) => onChange(e.target.value)} />
        <input
          type="text"
          className="text-input color-hex"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  );
}

export default function DesignEditor({ designId, onSaved, onBack }: Props) {
  const [existingId, setExistingId] = useState<number | null>(designId);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("Send Feedback");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<EditableField[]>([]);
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    function applyDesign(d: Design) {
      setExistingId(d.id);
      setName(d.name);
      setTitle(d.title);
      setDescription(d.description ?? "");
      setFields([...d.fields].sort((a, b) => a.order - b.order).map(toEditable));
      setColors({
        backgroundColor: d.backgroundColor,
        cardColor: d.cardColor,
        titleColor: d.titleColor,
        buttonColor: d.buttonColor,
      });
    }

    if (designId == null) {
      setExistingId(null);
      setName("");
      setTitle("Send Feedback");
      setDescription("We'd love to hear from you. Please fill out the form below.");
      setFields(defaultFields());
      setColors(DEFAULT_COLORS);
      setLoading(false);
      return;
    }

    setLoading(true);
    listDesigns()
      .then((all) => {
        const found = all.find((d) => d.id === designId);
        if (found) applyDesign(found);
        else setError("Design not found.");
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load design"))
      .finally(() => setLoading(false));
  }, [designId]);

  function updateField(key: string, patch: Partial<EditableField>) {
    setFields((prev) =>
      prev.map((f) => {
        if (f.key !== key) return f;
        const updated = { ...f, ...patch };
        if (patch.label !== undefined && !f.idEdited) {
          const taken = new Set(prev.filter((x) => x.key !== key).map((x) => x.fieldId));
          updated.fieldId = uniqueId(slugify(patch.label), taken);
        }
        return updated;
      }),
    );
  }

  function addField() {
    setFields((prev) => {
      const taken = new Set(prev.map((x) => x.fieldId));
      return [
        ...prev,
        {
          key: nextKey(),
          fieldId: uniqueId("field", taken),
          idEdited: false,
          type: "text",
          label: "",
          required: false,
          options: [],
          maxLength: null,
        },
      ];
    });
  }

  function removeField(key: string) {
    setFields((prev) => prev.filter((f) => f.key !== key));
  }

  function move(index: number, direction: -1 | 1) {
    setFields((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  function handleSave() {
    const validationError = validate(name, title, fields);
    if (validationError) {
      setMessage(null);
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);
    setMessage(null);

    const payload: DesignInput = {
      name: name.trim(),
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      fields: fields.map((f, index) => ({
        fieldId: f.fieldId.trim(),
        type: f.type,
        label: f.label.trim(),
        required: f.required,
        order: index,
        options: f.type === "dropdown" ? f.options.filter((o) => o.trim()) : null,
        maxLength: f.type === "text" ? f.maxLength : null,
      })),
      backgroundColor: colors.backgroundColor,
      cardColor: colors.cardColor,
      titleColor: colors.titleColor,
      buttonColor: colors.buttonColor,
    };

    const action = existingId == null ? createDesign(payload) : updateDesign(existingId, payload);
    action
      .then((saved) => {
        setExistingId(saved.id);
        setMessage(`Design "${saved.name}" saved.`);
        onSaved();
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to save design"))
      .finally(() => setSaving(false));
  }

  if (loading) return <div className="builder-status">Loading design…</div>;

  const previewFields: FormField[] = fields.map((f, index) => ({
    fieldId: f.fieldId,
    type: f.type,
    label: f.label || "(untitled)",
    required: f.required,
    order: index,
    options: f.type === "dropdown" ? f.options.filter((o) => o.trim()) : null,
    maxLength: f.type === "text" ? f.maxLength : null,
  }));

  return (
    <div className="builder-layout">
      <div className="builder">
        <div className="builder-toolbar">
          <div className="builder-title-group">
            <button className="ghost-btn" onClick={onBack}>
              ← Designs
            </button>
            <h2>{existingId == null ? "New design" : "Edit design"}</h2>
          </div>
          <button className="refresh-btn" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : existingId == null ? "Create design" : "Save changes"}
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {message && <div className="success-banner">{message}</div>}

        <label className="field-label">Design name (used by the SDK)</label>
        <input
          className="text-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. game_over"
        />

        <label className="field-label">Form title</label>
        <input
          className="text-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Form title"
        />

        <label className="field-label">Description</label>
        <textarea
          className="text-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description shown above the form"
          rows={2}
        />

        <div className="fields-header">
          <h3>Theme</h3>
        </div>
        <div className="field-row">
          <ColorField
            label="Background"
            value={colors.backgroundColor}
            onChange={(v) => setColors({ ...colors, backgroundColor: v })}
          />
          <ColorField
            label="Card"
            value={colors.cardColor}
            onChange={(v) => setColors({ ...colors, cardColor: v })}
          />
        </div>
        <div className="field-row">
          <ColorField
            label="Title color"
            value={colors.titleColor}
            onChange={(v) => setColors({ ...colors, titleColor: v })}
          />
          <ColorField
            label="Button color"
            value={colors.buttonColor}
            onChange={(v) => setColors({ ...colors, buttonColor: v })}
          />
        </div>

        <div className="fields-header">
          <h3>Fields</h3>
          <button className="add-btn" onClick={addField}>+ Add field</button>
        </div>

        {fields.map((field, index) => (
          <div className="field-card" key={field.key}>
            <div className="field-card-top">
              <span className="field-index">#{index + 1}</span>
              <div className="field-card-actions">
                <button onClick={() => move(index, -1)} disabled={index === 0} title="Move up">↑</button>
                <button onClick={() => move(index, 1)} disabled={index === fields.length - 1} title="Move down">↓</button>
                <button onClick={() => removeField(field.key)} title="Remove" className="remove">✕</button>
              </div>
            </div>

            <div className="field-row">
              <div className="field-col">
                <label className="field-label">Label</label>
                <input
                  className="text-input"
                  value={field.label}
                  onChange={(e) => updateField(field.key, { label: e.target.value })}
                  placeholder="Field label"
                />
              </div>
              <div className="field-col">
                <label className="field-label">Type</label>
                <select
                  className="text-input"
                  value={field.type}
                  onChange={(e) => updateField(field.key, { type: e.target.value as FieldType })}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field-row">
              <div className="field-col">
                <label className="field-label">Field id</label>
                <input
                  className="text-input"
                  value={field.fieldId}
                  onChange={(e) => updateField(field.key, { fieldId: e.target.value, idEdited: true })}
                />
              </div>
              <div className="field-col field-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(field.key, { required: e.target.checked })}
                  />
                  Required
                </label>
              </div>
            </div>

            {field.type === "dropdown" && (
              <div>
                <label className="field-label">Options (one per line)</label>
                <textarea
                  className="text-input"
                  value={field.options.join("\n")}
                  onChange={(e) => updateField(field.key, { options: e.target.value.split("\n") })}
                  rows={3}
                  placeholder={"Bug\nFeature Request\nGeneral"}
                />
              </div>
            )}

            {field.type === "text" && (
              <div>
                <label className="field-label">Max length (optional)</label>
                <input
                  className="text-input"
                  type="number"
                  min={1}
                  value={field.maxLength ?? ""}
                  onChange={(e) =>
                    updateField(field.key, {
                      maxLength: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="e.g. 500"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="builder-preview">
        <h3 className="preview-heading">Live preview</h3>
        <FormPreview
          title={title}
          description={description}
          fields={previewFields}
          theme={{
            backgroundColor: colors.backgroundColor,
            cardColor: colors.cardColor,
            titleColor: colors.titleColor,
            primaryColor: colors.buttonColor,
          }}
        />
      </div>
    </div>
  );
}
