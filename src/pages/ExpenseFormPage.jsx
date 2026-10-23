import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { EXPENSE_TYPES } from '../constants/expenseTypes';
import { expenseAPI } from '../api/client';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import FieldRenderer from '../components/FieldRenderer';
import { fileToDataUrl, compressImage, newFileId } from '../utils/fileUtils';

/**
 * Guard component. With no expense type there is no form to show.
 * This check lives in its own component so the form below never calls a hook
 * conditionally (an early `return` before `useState` breaks React's rules of hooks
 * and can crash with "rendered fewer hooks than expected").
 * `key={location.key}` also resets the form when you open another expense.
 */
export default function ExpenseFormPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const expenseType = location.state?.editingExpense?.type || location.state?.expenseType;

  if (!expenseType) {
    return (
      <Layout>
        <div className="card">
          <p>No expense type selected.</p>
          <button className="btn btn-primary" onClick={() => navigate('/new')}>
            Pick a category
          </button>
        </div>
      </Layout>
    );
  }
  return <ExpenseForm key={location.key} />;
}

function ExpenseForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  // Mode detection
  const editingExpense = location.state?.editingExpense || null;
  const resubmitMode  = location.state?.resubmit === true;
  const expenseType   = editingExpense?.type || location.state?.expenseType;

  const config = EXPENSE_TYPES[expenseType];
  const isEditing = !!editingExpense;

  // ── Figure out the current stage ──
  //   • New two-stage trip → 'start'
  //   • Existing two-stage trip (edit or End trip) → 'end'
  //   • Any other type → null
  const initialStage = (() => {
    if (!config.twoStage) return null;
    if (location.state?.stage) return location.state.stage;   // dashboard "End trip"
    if (editingExpense) return 'end';                         // editing existing trip
    return 'start';                                           // brand new
  })();

  const [currentStage] = useState(initialStage);

  // Filter visible fields by stage
  const visibleFields = config.twoStage
    ? config.fields.filter((f) => f.stage === currentStage)
    : config.fields;

  // Initial values (pre-fill if editing)
  const [values, setValues] = useState(() => editingExpense?.data || {});
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const handleChange = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  // ── Validation (only for visible fields) ──
  const validate = () => {
    const newErrors = {};
    for (const field of visibleFields) {
      if (field.showIf && !field.showIf(values)) continue;
      const v = values[field.key];

      if (field.required) {
        if (field.type === 'checkboxes' || field.type === 'file') {
          if (!v || !v.length) {
            newErrors[field.key] = field.type === 'file'
              ? 'Please attach at least one file.'
              : 'Please select at least one.';
          }
        } else if (v === '' || v === null || v === undefined) {
          newErrors[field.key] = 'This field is required.';
        }
      }

      if (field.type === 'number' && v !== '' && v !== undefined) {
        const n = Number(v);
        if (isNaN(n)) newErrors[field.key] = 'Enter a valid number.';
        else if (field.min !== undefined && n < field.min) {
          newErrors[field.key] = `Must be at least ${field.min}.`;
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── File handling ──
  const prepareFilesForSubmit = async () => {
    const dataWithFiles = { ...values };
    for (const field of visibleFields) {
      if (field.type !== 'file') continue;
      const fileList = values[field.key];
      if (!Array.isArray(fileList) || !fileList.length) {
        dataWithFiles[field.key] = [];
        continue;
      }
      const uploaded = [];
      for (const file of fileList) {
        if (file.dataUrl) {
          // Already saved — keep as-is
          uploaded.push({
            id: file.id || newFileId(),
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: file.dataUrl,
          });
          continue;
        }
        const processed = await compressImage(file);
        const dataUrl = await fileToDataUrl(processed);
        uploaded.push({
          id: newFileId(),
          name: file.name,
          type: processed.type || file.type,
          size: processed.size,
          dataUrl,
        });
      }
      dataWithFiles[field.key] = uploaded;
    }
    return dataWithFiles;
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) {
      setFormError('Please fix the highlighted fields.');
      return;
    }

    setIsBusy(true);
    try {
      // Merge with existing data so we don't lose stage-1 fields when PUT-ing stage-2
      const stageData = await prepareFilesForSubmit();
      const mergedData = isEditing ? { ...editingExpense.data, ...stageData } : stageData;

      if (isEditing) {
        // ── UPDATE / END TRIP ──
        await expenseAPI(`/expenses/${editingExpense.id}`, {
          method: 'PUT',
          body: JSON.stringify({ data: mergedData }),
        });

        if (config.twoStage && currentStage === 'end') {
          toast('Trip ended and submitted.', 'success');
        } else if (resubmitMode) {
          toast('Expense resubmitted.', 'success');
        } else {
          toast('Expense updated.', 'success');
        }
      } else {
        // ── CREATE NEW ──
        await expenseAPI('/expenses', {
          method: 'POST',
          body: JSON.stringify({
            type: expenseType,
            data: mergedData,
            stage: currentStage || 'submit',   // 'start' for Regional Trip, 'submit' otherwise
          }),
        });

        if (config.twoStage && currentStage === 'start') {
          toast('Trip started. End it from the dashboard when you arrive.', 'success', { duration: 6000 });
        } else {
          toast('Expense submitted.', 'success');
        }
      }

      navigate('/my');
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Failed to save expense.');
    } finally {
      setIsBusy(false);
    }
  };

  // ── Labels ──
  const backTarget = isEditing ? '/my' : '/new';

  const pageTitle = config.twoStage
    ? (currentStage === 'start' ? config.startTitle || `Start ${expenseType}` : config.endTitle || `End ${expenseType}`)
    : resubmitMode
      ? `Resubmit · ${expenseType}`
      : isEditing
        ? `Edit · ${expenseType}`
        : config.title || expenseType;

  const submitLabel = config.twoStage
    ? (currentStage === 'start' ? 'Start trip' : 'End trip & submit')
    : resubmitMode
      ? 'Resubmit for approval'
      : isEditing
        ? 'Save changes'
        : 'Submit request';

  // ── Regional Trip summary card (stage 2 only) ──
  const startLocation = editingExpense?.data?.startLocation || '';
  const showTripSummary = config.twoStage && currentStage === 'end';

  return (
    <Layout title={pageTitle}>
      <div className="card">
        <div className="card-title">
          {config.icon} {pageTitle}
                     
        </div>

        {resubmitMode && editingExpense?.rejection_reason && (
          <div className="form-banner banner-warn">
            <svg className="icon"><use href="#i-alert" /></svg>
            <span>
              Fix what was flagged and resubmit. Reason: “{editingExpense.rejection_reason}”
            </span>
          </div>
        )}

        {config.twoStage && currentStage === 'start' && (
          <div className="form-banner banner-info">
            <svg className="icon"><use href="#i-info" /></svg>
            <span>Fill in where you're starting and upload the start meter. You'll add the destination and end meter later.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Trip Summary Card — shown only on stage 'end' */}
          {showTripSummary && (
            <div className="trip-summary-card">
              <div className="trip-summary-heading">Trip Details</div>
              <div className="trip-summary-grid">
                <div className="trip-summary-item">
                  <div className="trip-summary-label">Start Location</div>
                  <div className="trip-summary-value">{startLocation || '—'}</div>
                </div>
                <div className="trip-summary-item">
                  {/* End location field goes here */}
                  {visibleFields
                    .filter((f) => f.key === 'endLocation')
                    .map((field) => (
                      <FieldRenderer
                        key={field.key}
                        field={field}
                        value={values[field.key]}
                        onChange={handleChange}
                        allValues={values}  
                      />
                    ))}
                </div>
              </div>

              <div className="trip-summary-divider" />

              {/* Distance field */}
              {visibleFields
                .filter((f) => f.key === 'distanceKm')
                .map((field) => (
                  <FieldRenderer
                    key={field.key}
                    field={field}
                    value={values[field.key]}
                    onChange={handleChange}
                  />
                ))}
            </div>
          )}

          {/* Remaining fields */}
          {visibleFields
            .filter((f) => !(showTripSummary && ['endLocation', 'distanceKm'].includes(f.key)))
            .map((field) => {
              if (field.showIf && !field.showIf(values)) return null;
              return (
                <div key={field.key}>
                  <FieldRenderer
                    field={field}
                    value={values[field.key]}
                    onChange={handleChange}
                    allValues={values}  
                  />
                  {errors[field.key] && (
                    <div className="field-error" role="alert">
                      {errors[field.key]}
                    </div>
                  )}
                </div>
              );
            })}

          {formError && (
            <div className="form-banner banner-error" role="alert">
              {formError}
            </div>
          )}

          <div className="btn-row btn-row-end">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate(backTarget)}
            >
              {isEditing ? 'Cancel' : 'Back'}
            </button>
            <button
              type="submit"
              className={`btn ${config.twoStage && currentStage === 'start' ? 'btn-success' : 'btn-primary'} ${isBusy ? 'is-busy' : ''}`}
              disabled={isBusy}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}