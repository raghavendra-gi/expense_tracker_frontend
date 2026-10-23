import PlaceInput from './PlaceInput';
import RoutePanel from './RoutePanel';
// ── Wrapper is now OUTSIDE FieldRenderer ──
function FieldWrapper({ field, children }) {
  const id = `f_${field.key}`;
  const req = field.required ? <span className="req">*</span> : null;
  return (
    <div className="form-group" id={`wrap_${field.key}`}>
      {field.label && <label htmlFor={id}>{field.label}{req}</label>}
      {children}
    </div>
  );
}

export default function FieldRenderer({ field, value, onChange, allValues = {} }) {
  const id = `f_${field.key}`;

  switch (field.type) {
    // ──────── TEXT ────────
    case 'text':
      return (
        <FieldWrapper field={field}>
          <input
            type="text"
            id={id}
            placeholder={field.placeholder || ''}
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            maxLength={120}
          />
        </FieldWrapper>
      );

    // ──────── PLACE (with Google Places autocomplete) ────────
case 'place':
  return (
    <FieldWrapper field={field}>
      <PlaceInput
        id={id}
        field={field}
        value={value}
        onChange={onChange}
        placeholder={field.placeholder}
      />
    </FieldWrapper>
  );

  // ──────── ROUTE (distance + map) ────────
case 'route':
  return (
    <RoutePanel
      field={field}
      allValues={allValues}
      onKmUpdate={(km) => onChange(field.kmKey, km)}
    />
  );

    // ──────── NUMBER ────────
    case 'number':
      return (
        <FieldWrapper field={field}>
          {field.money ? (
            <span className="input-affix">
              <span className="affix" aria-hidden="true">₹</span>
              <input
                type="number"
                id={id}
                step="0.01"
                min={field.min}
                placeholder={field.placeholder || ''}
                value={value ?? ''}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            </span>
          ) : (
            <input
              type="number"
              id={id}
              step="0.01"
              min={field.min}
              placeholder={field.placeholder || ''}
              value={value ?? ''}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          )}
        </FieldWrapper>
      );

    // ──────── DATE ────────
    case 'date':
      return (
        <FieldWrapper field={field}>
          <input
            type="date"
            id={id}
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        </FieldWrapper>
      );

    // ──────── TEXTAREA ────────
    case 'textarea':
      return (
        <FieldWrapper field={field}>
          <textarea
            id={id}
            rows="3"
            maxLength={600}
            placeholder={field.placeholder || ''}
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        </FieldWrapper>
      );

    // ──────── SELECT ────────
    case 'select':
      return (
        <FieldWrapper field={field}>
          <select
            id={id}
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
          >
            <option value="">{field.placeholder || 'Select…'}</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </FieldWrapper>
      );

    // ──────── CHIPS ────────
    case 'chips':
      return (
        <FieldWrapper field={field}>
          <div className="chip-row" role="group">
            {field.options.map((opt) => (
              <button
                key={opt}
                type="button"
                className="chip"
                aria-pressed={value === opt}
                onClick={() => onChange(field.key, value === opt ? '' : opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </FieldWrapper>
      );

    // ──────── CHECKBOXES ────────
    case 'checkboxes': {
      const selected = Array.isArray(value) ? value : [];
      const known = new Set(field.options);
      const extras = selected.filter((v) => !known.has(v));
      const hasOther = extras.length > 0;

      const toggleOption = (opt) => {
        const next = selected.includes(opt)
          ? selected.filter((v) => v !== opt)
          : [...selected, opt];
        onChange(field.key, next);
      };

      const toggleOther = () => {
        if (hasOther) {
          onChange(field.key, selected.filter((v) => known.has(v)));
        } else {
          onChange(field.key, [...selected, '']);
        }
      };

      const handleOtherText = (text) => {
        const parts = text.split(',').map((s) => s.trim()).filter(Boolean);
        const next = [...selected.filter((v) => known.has(v)), ...parts];
        onChange(field.key, next);
      };

      return (
        <FieldWrapper field={field}>
          <div className="items-grid" role="group">
            {field.options.map((opt) => (
              <label className="item-label" key={opt}>
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                />
                {opt}
              </label>
            ))}
            {field.allowOther && (
              <label className="item-label">
                <input type="checkbox" checked={hasOther} onChange={toggleOther} />
                Other
              </label>
            )}
          </div>

          {field.allowOther && hasOther && (
            <div className="other-input visible" style={{ marginTop: '6px' }}>
              <input
                type="text"
                placeholder="Specify other item(s), comma separated"
                value={extras.join(', ')}
                onChange={(e) => handleOtherText(e.target.value)}
                maxLength={160}
              />
            </div>
          )}

          {selected.length > 0 && (
            <div className="selected-summary visible">
              <strong>{selected.length} selected:</strong> {selected.filter(Boolean).join(', ')}
            </div>
          )}
        </FieldWrapper>
      );
    }

    // ──────── FILE ────────
    case 'file': {
      const fileList = Array.isArray(value) ? value : [];

      const handleFilePick = (e) => {
        const picked = Array.from(e.target.files || []);
        const next = field.multiple ? [...fileList, ...picked] : picked.slice(0, 1);
        onChange(field.key, next);
        e.target.value = '';
      };

      const removeFile = (index) => {
        onChange(field.key, fileList.filter((_, i) => i !== index));
      };

      const isSaved = (f) => !!f.dataUrl;

      return (
        <FieldWrapper field={field}>
          <div className="upload-box has-file" style={{ minHeight: fileList.length ? 'auto' : '180px' }}>
            {fileList.length === 0 ? (
              <div className="upload-box-empty">
                <div className="upload-box-title">{field.title || 'Upload ' + field.label}</div>
                <div className="upload-box-sub">Tap to upload image</div>
                <div className="upload-box-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => document.getElementById(`file_${field.key}`)?.click()}
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => document.getElementById(`file_${field.key}`)?.click()}
                  >
                    📷
                  </button>
                </div>
              </div>
            ) : (
              <div className="file-thumb" style={{ width: '100%' }}>
                {fileList.map((file, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', marginBottom: '6px' }}
                  >
                    <span className="file-thumb-text" style={{ flex: 1, textAlign: 'left' }}>
                      {file.name}
                      {isSaved(file) && (
                        <span style={{ color: 'var(--st-good-ink)', marginLeft: 8, fontSize: 11 }}>
                          ✓ saved
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => removeFile(i)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {field.multiple && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '8px' }}
                    onClick={() => document.getElementById(`file_${field.key}`)?.click()}
                  >
                    + Add more
                  </button>
                )}
              </div>
            )}
          </div>
          <input
            type="file"
            id={`file_${field.key}`}
            hidden
            accept="image/png,image/jpeg,application/pdf"
            multiple={field.multiple}
            onChange={handleFilePick}
          />
        </FieldWrapper>
      );
    }

    // ──────── FALLBACK ────────
    default:
      return (
        <FieldWrapper field={field}>
          <p className="muted">Unknown field type: {field.type}</p>
        </FieldWrapper>
      );
  }
}