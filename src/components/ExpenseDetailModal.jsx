import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { EXPENSE_TYPES } from '../constants/expenseTypes';
import Modal from './Modal';
import { formatDate, formatDateTime, formatMoney, statusBadgeClass, statusIcon } from '../utils/format';

const SPLIT_VIEW_TYPES = ['Regional Trip', 'Plan Trip'];
const SHORT_LABELS = {
  startMeterImage: 'Start', startMeter: 'Start',
  endMeterImage: 'End', endMeter: 'End',
  ticketBill: 'Ticket', receipt: 'Receipt',
};

const FIELD_ICONS = {
  date: 'i-calendar', fromDate: 'i-calendar', toDate: 'i-calendar',
  amount: 'i-rupee', estimatedCost: 'i-calc', items: 'i-list',
  receipt: 'i-receipt', remarks: 'i-comment', from: 'i-pin', to: 'i-flag',
  kilometers: 'i-road', transport: 'i-car', startLocation: 'i-play',
  currentLocation: 'i-pin', endLocation: 'i-stop',
  startMeterImage: 'i-camera', endMeterImage: 'i-camera',
  ticketBill: 'i-ticket', startMeter: 'i-camera', endMeter: 'i-camera',
  eventName: 'i-star', location: 'i-pin', courierService: 'i-truck',
  recipientName: 'i-user', trackingNumber: 'i-barcode', occasion: 'i-gift',
  giftDescription: 'i-tag', description: 'i-doc', distanceKm: 'i-route',
};

export default function ExpenseDetailModal({ expense, onClose, onAction }) {
  const { user } = useAuth();
  const [previewFiles, setPreviewFiles] = useState(null);

  if (!expense) return null;

  const config = EXPENSE_TYPES[expense.type] || { fields: [], icon: '📋', title: expense.type };
  const isApprover = user?.role === 'head' || user?.role === 'hr';
  const isOwner = expense.employee_name === user?.display_name || expense.employee_name === user?.username;
  const canDecide = isApprover && expense.status === 'Pending';
  const isSplitView = SPLIT_VIEW_TYPES.includes(expense.type);

  const fileFields = config.fields.filter(f =>
    f.type === 'file' &&
    Array.isArray(expense.data[f.key]) &&
    expense.data[f.key].length > 0 &&
    (!f.showIf || f.showIf(expense.data))
  );

  const tripOrigin = expense.data.from || expense.data.startLocation || '';
  const tripDestination = expense.data.to || expense.data.endLocation || '';
  const showTripLink = tripOrigin && tripDestination;

  const latestNote = (() => {
    if (!Array.isArray(expense.history)) return '';
    for (let i = expense.history.length - 1; i >= 0; i--) {
      const h = expense.history[i];
      if (/Approved|Rejected/.test(h.action)) return h.note || '';
    }
    return '';
  })();

  const HIDDEN = ['date', 'amount', 'remarks'];

  const showFieldFiles = (f) => {
    const files = expense.data[f.key].map((file) => ({ ...file, label: f.label }));
    setPreviewFiles({ files, title: f.label || 'Attachments' });
  };

  const showAllFiles = () => {
    const all = [];
    fileFields.forEach(f => {
      expense.data[f.key].forEach(file => all.push({ ...file, label: f.label }));
    });
    setPreviewFiles({ files: all, title: 'Attachments' });
  };

  const mapsLink = showTripLink
    ? `https://www.google.com/maps/dir/?api=1` +
      `&origin=${encodeURIComponent(tripOrigin)}` +
      `&destination=${encodeURIComponent(tripDestination)}` +
      `&travelmode=driving`
    : '';

  // 👇 PRINT & DOWNLOAD BUTTONS ADDED HERE 👇
  const headerButtons = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '4px' }}>
      {fileFields.length > 0 && (
        isSplitView ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {fileFields.map((f) => (
              <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                
                <button type="button" className="peek-btn" onClick={() => showFieldFiles(f)} title={`View ${f.label}`}>
                  <svg className="icon"><use href="#i-eye" /></svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <button type="button" className="peek-btn" onClick={showAllFiles} title="View attachments">
            <svg className="icon"><use href="#i-eye" /></svg>
          </button>
        )
      )}
      
      <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }}></div>

      <button type="button" className="peek-btn" onClick={() => window.print()} title="Print">
        <svg className="icon"><use href="#i-print" /></svg>
      </button>
             <button type="button" className="peek-btn" onClick={async () => {
        try {
          if (!window.html2pdf) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
              script.onload = resolve;
              script.onerror = () => reject(new Error("Failed to load PDF library. Check your internet."));
              document.head.appendChild(script);
            });
          }

          const originalElement = document.querySelector('.modal-content');
          if (!originalElement) throw new Error("Could not find modal content.");

          const clone = originalElement.cloneNode(true);
          
          // Remove action buttons
          const btnRows = clone.querySelectorAll('.btn-row');
          btnRows.forEach(row => row.remove());

          const container = document.createElement('div');
          container.style.position = 'absolute';
          container.style.top = '-9999px';
          container.style.width = '800px';
          container.appendChild(clone);
          document.body.appendChild(container);

          const opt = {
            margin:       10,
            filename:     `Expense-${expense.id}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
              scale: 2, 
              useCORS: true, 
              logging: false,
              // 👇 THIS FIXES THE COLOR ERROR 👇
              onclone: (clonedDoc) => {
                const style = clonedDoc.createElement('style');
                style.innerHTML = `
                  /* Override unsupported color-mix functions with standard hex colors */
                  .modal-banner { border: 1px solid #e0e0e0 !important; }
                  .badge { border: 1px solid transparent !important; }
                  .reason-box { border: 1px solid #e0e0e0 !important; }
                  .badge-approved { border-color: #0ca30c !important; }
                  .badge-pending { border-color: #fab219 !important; }
                  .badge-rejected { border-color: #d03b3b !important; }
                `;
                clonedDoc.head.appendChild(style);
              }
            },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };

          await window.html2pdf().set(opt).from(clone).save();
          document.body.removeChild(container);
          
        } catch (err) {
          console.error('PDF generation failed:', err);
          alert(err.message || 'Could not generate PDF. Please use the Print button and select "Save as PDF" instead.');
        }
      }} title="Download as PDF">
        <svg className="icon"><use href="#i-download" /></svg>
      </button>    
    </div>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title={`${expense.type} · #${expense.id}`} size="lg" headerRight={headerButtons}>
      
      {/* ... Banner, Meta, Details, Timeline, Action Buttons ... (same as before) */}
      <div className="modal-banner">
        <div className="banner-main">
          <div className="banner-title-row">
            <span className="banner-emoji">{config.icon}</span>
            <span className="banner-title">{config.title || expense.type}</span>
          </div>
          <div className="banner-sub">
            Submitted by {expense.employee_name} · {formatDateTime(expense.submitted_date || expense.created_date)}
          </div>
        </div>
        <div className="banner-center">
          {config.fields.some(f => f.key === 'amount') && (
            <div className="hero-figure">{formatMoney(expense.data.amount)}</div>
          )}
          <div className="banner-actions">
            <span className={`badge ${statusBadgeClass(expense.status)}`}>
              <svg className="icon"><use href={`#${statusIcon(expense.status)}`} /></svg>
              {expense.status}
            </span>
          </div>
        </div>
      </div>

      {expense.status === 'Rejected' && (latestNote || expense.rejection_reason) && (
        <div className="reason-box">
          <strong>Reason for rejection</strong>
          {latestNote || expense.rejection_reason}
        </div>
      )}
      {expense.status === 'Approved' && latestNote && (
        <div className="reason-box is-approved">
          <strong>Approval comment</strong>
          {latestNote}
        </div>
      )}

      <div className="meta-row">
        <div className="meta-card">
          <div className="meta-label"><svg className="icon"><use href="#i-user" /></svg> Employee</div>
          <div className="meta-value">{expense.employee_name}</div>
        </div>
        <div className="meta-card">
          <div className="meta-label"><svg className="icon"><use href="#i-calendar" /></svg> Date</div>
          <div className="meta-value">{formatDate(expense.data[config.dateField || 'date'])}</div>
        </div>
        <div className="meta-card">
          <div className="meta-label"><svg className="icon"><use href="#i-check" /></svg> Decision</div>
          <div className="meta-value">
            {expense.decided_by ? (
              <>
                {expense.decided_by}
                <div style={{ fontWeight: 400, fontSize: 'var(--fs-sm)', color: 'var(--ink-3)' }}>
                  {formatDateTime(expense.decided_date)}
                </div>
              </>
            ) : (
              <span className="muted">Not decided yet</span>
            )}
          </div>
        </div>
      </div>

      {showTripLink && (
        <>
          <div className="section-title">Route</div>
          <div className="route-detail">
            <div className="rd-line"><svg className="icon"><use href="#i-pin" /></svg><span>{tripOrigin}</span></div>
            <div className="rd-line"><svg className="icon"><use href="#i-flag" /></svg><span>{tripDestination}</span></div>
            <div className="rd-line">
              <svg className="icon"><use href="#i-route" /></svg>
              <span className="rd-figures">
                {expense.data.kilometers ? `${expense.data.kilometers} km` : expense.data.distanceKm ? `${expense.data.distanceKm} km` : 'Distance not recorded'}
              </span>
            </div>
            <a className="rd-map-link" href={mapsLink} target="_blank" rel="noopener noreferrer">
              <svg className="icon"><use href="#i-external" /></svg> Open in Google Maps
            </a>
          </div>
        </>
      )}

      <div className="section-title">Details</div>
      <div className="detail-grid">
        {config.fields.map((f) => {
          if (HIDDEN.includes(f.key) || f.type === 'file' || f.type === 'route') return null;
          if (showTripLink && ['from', 'to', 'startLocation', 'endLocation'].includes(f.key)) return null;

          const v = expense.data[f.key];
          if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) return null;

          return (
            <div className="detail-row" key={f.key}>
              <div className="detail-icon"><svg className="icon"><use href={`#${FIELD_ICONS[f.key] || 'i-info'}`} /></svg></div>
              <div className="detail-text">
                <div className="detail-label">{f.label || f.title || f.key}</div>
                <div className="detail-value">
                  {f.type === 'date' ? formatDate(v)
                    : f.type === 'number' ? (f.money ? formatMoney(v) : String(v) + (f.unit ? ' ' + f.unit : ''))
                    : f.type === 'checkboxes' ? (
                      <div className="items-list">
                        {v.map((item, i) => <span key={i} className="item-chip">{item}</span>)}
                      </div>
                    )
                    : String(v)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {Array.isArray(expense.history) && expense.history.length > 0 && (
        <>
          <div className="section-title">Activity</div>
          <ul className="timeline">
            {expense.history.map((h, i) => (
              <li key={i}>
                <span className={`dot ${/Approved/.test(h.action) ? 'good' : /Rejected/.test(h.action) ? 'bad' : ''}`}></span>
                <span className="tl-card">
                  <strong>{h.action}</strong> — {h.by}
                  {h.note && <><br /><span style={{ color: 'var(--ink-2)' }}>“{h.note}”</span></>}
                  <span className="when">{formatDateTime(h.at)}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="btn-row" style={{ marginTop: 'var(--sp-5)' }}>
        {canDecide && (
          <>
            <button className="btn btn-success" onClick={() => onAction('approve', expense)}>
              <svg className="icon"><use href="#i-check" /></svg> Approve
            </button>
            <button className="btn btn-danger" onClick={() => onAction('reject', expense)}>
              <svg className="icon"><use href="#i-x" /></svg> Reject
            </button>
          </>
        )}

        {isOwner && !isApprover && (
          <>
            {expense.status === 'In Progress' && (
              <button className="btn btn-success" onClick={() => onAction('endTrip', expense)}>
                <svg className="icon"><use href="#i-stop" /></svg> End trip
              </button>
            )}
            {expense.status === 'Pending' && (
              <button className="btn btn-secondary" onClick={() => onAction('edit', expense)}>
                <svg className="icon"><use href="#i-pencil" /></svg> Edit
              </button>
            )}
            {expense.status === 'Rejected' && (
              <button className="btn btn-primary" onClick={() => onAction('resubmit', expense)}>
                <svg className="icon"><use href="#i-copy" /></svg> Fix &amp; resubmit
              </button>
            )}
            {expense.status !== 'Approved' && (
              <button className="btn btn-ghost" onClick={() => onAction('delete', expense)}>
                <svg className="icon"><use href="#i-trash" /></svg> Delete
              </button>
            )}
          </>
        )}
      </div>

      {previewFiles && (
        <FilePreviewModal files={previewFiles.files} title={previewFiles.title} onClose={() => setPreviewFiles(null)} />
      )}
    </Modal>
  );
}

function FilePreviewModal({ files, title, onClose }) {
  return (
    <Modal isOpen={true} onClose={onClose} title={title}>
      <div className="preview-strip">
        {files.map((file, i) => {
          if (!file.dataUrl) return <p key={i} className="preview-cap">{file.name} — no preview available</p>;
          return file.type === 'application/pdf' ? (
            <iframe key={i} src={file.dataUrl} className="image-preview-pdf" title={file.name} />
          ) : (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {file.label && <p style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--ink-2)', marginBottom: 2 }}>{file.label}</p>}
              <img src={file.dataUrl} alt={file.name} />
            </div>
          );
        })}
      </div>
    </Modal>
  );
}