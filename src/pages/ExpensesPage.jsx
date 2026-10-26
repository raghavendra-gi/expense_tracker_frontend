import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { expenseAPI } from '../api/client';
import { useToast } from '../context/ToastContext';
import Layout from '../components/Layout';
import ExpenseDetailModal from '../components/ExpenseDetailModal';
import PromptModal from '../components/PromptModal';
import { formatMoney, formatDate, formatDateTimeParts, statusBadgeClass, statusIcon } from '../utils/format';

const PAGE_SIZE = 10;

export default function ExpensesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [selectedExpense, setSelectedExpense] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const isApprover = user?.role === 'head' || user?.role === 'hr';

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await expenseAPI('/expenses');
      const visible = isApprover
        ? data
        : data.filter(
            (e) =>
              e.employee_name === user?.display_name ||
              e.employee_name === user?.username
          );
      setExpenses(visible || []);
    } catch (err) {
      console.error(err);
      toast(err.message || 'Failed to load expenses.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, isApprover]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  const statusForTab = {
    all: '',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    inprogress: 'In Progress',
  }[activeTab] || '';

  const filtered = statusForTab
    ? expenses.filter((e) => e.status === statusForTab)
    : expenses;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const slice = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const counts = {
    all: expenses.length,
    pending: expenses.filter((e) => e.status === 'Pending').length,
    approved: expenses.filter((e) => e.status === 'Approved').length,
    rejected: expenses.filter((e) => e.status === 'Rejected').length,
    inprogress: expenses.filter((e) => e.status === 'In Progress').length,
  };

  const toggleSelect = (id, on) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  const handleAction = (action, expense) => {
    if (action === 'approve' || action === 'reject') {
      setPrompt({ action, expense });
      return;
    }
    if (action === 'edit') {
      setSelectedExpense(null);
      navigate('/form', { state: { editingExpense: expense } });
      return;
    }
    if (action === 'resubmit') {
      setSelectedExpense(null);
      navigate('/form', { state: { editingExpense: expense, resubmit: true } });
      return;
    }
    if (action === 'endTrip') {
      setSelectedExpense(null);
      navigate('/form', { state: { editingExpense: expense, stage: 'end' } });
      return;
    }
    if (action === 'delete') {
      if (!window.confirm(`Delete expense #${expense.id}? This cannot be undone.`)) return;
      doDelete(expense);
    }
  };

  const submitDecision = async (comment) => {
    const { action, expense } = prompt;
    const status = action === 'approve' ? 'Approved' : 'Rejected';
    setPrompt(null);
    try {
      await expenseAPI(`/expenses/${expense.id}/decide`, {
        method: 'POST',
        body: JSON.stringify({ status, reason: comment }),
      });
      toast(`Expense #${expense.id} ${status.toLowerCase()}.`, action === 'approve' ? 'success' : 'error');
      setSelectedExpense(null);
      await loadExpenses();
    } catch (err) {
      console.error(err);
      toast(err.message || 'Failed to update expense.', 'error');
    }
  };

  const doDelete = async (expense) => {
    try {
      await expenseAPI(`/expenses/${expense.id}`, { method: 'DELETE' });
      toast('Expense deleted.', 'success');
      setSelectedExpense(null);
      await loadExpenses();
    } catch (err) {
      console.error(err);
      toast(err.message || 'Failed to delete expense.', 'error');
    }
  };

  const bulkDecide = async (status) => {
    const ids = [...selectedIds].filter((id) => {
      const e = expenses.find((x) => x.id === id);
      return e && e.status !== 'In Progress' && e.status !== status;
    });
    if (!ids.length) {
      toast('Nothing to update in the selection.', 'info');
      return;
    }
    setPrompt({
      action: status === 'Approved' ? 'approve' : 'reject',
      bulk: true,
      ids,
      count: ids.length,
    });
  };

  const submitBulkDecision = async (comment) => {
    const { action, ids } = prompt;
    const status = action === 'approve' ? 'Approved' : 'Rejected';
    setPrompt(null);
    try {
      await expenseAPI('/expenses/bulk-decide', {
        method: 'POST',
        body: JSON.stringify({ ids, status, reason: comment }),
      });
      toast(`${ids.length} expense${ids.length === 1 ? '' : 's'} ${status.toLowerCase()}.`, action === 'approve' ? 'success' : 'error');
      clearSelection();
      await loadExpenses();
    } catch (err) {
      console.error(err);
      toast(err.message || 'Failed to update selection.', 'error');
    }
  };

  const totalAmount = filtered.reduce((s, e) => s + (Number(e.data?.amount) || 0), 0);

  return (
    <Layout title="View Expenses">
      <div className="card">
        <div className="tabs" role="tablist" aria-label="Expense status">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'inprogress', label: 'In Progress' },
          ].map((t) => (
            <button
              key={t.key}
              role="tab"
              className="tab-btn"
              aria-selected={activeTab === t.key}
              onClick={() => { setActiveTab(t.key); setPage(1); clearSelection(); }}
            >
              {t.label} <span className="tab-count">{counts[t.key]}</span>
            </button>
          ))}
        </div>

        {isApprover && selectedIds.size > 0 && (
          <div className="bulk-bar show">
            <span className="count">{selectedIds.size} selected</span>
            <div className="btn-row" style={{ marginLeft: 'auto' }}>
              <button className="btn btn-success btn-sm" onClick={() => bulkDecide('Approved')}>
                <svg className="icon"><use href="#i-check" /></svg> Approve selected
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => bulkDecide('Rejected')}>
                <svg className="icon"><use href="#i-x" /></svg> Reject selected
              </button>
              <button className="btn btn-ghost btn-sm" onClick={clearSelection}>Clear</button>
            </div>
          </div>
        )}

        <div className="result-meta">
          <div>
            <strong>{filtered.length}</strong>{' '}
            {filtered.length === 1 ? 'expense' : 'expenses'} ·{' '}
            <strong>{formatMoney(totalAmount)}</strong> total
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 20 }}>Loading…</div>
          ) : (
            <table className="table" id="listTable">
              <thead>
                <tr>
                  {isApprover && <th className="check-cell"><span className="sr-only">Select</span></th>}
                  <th>#</th>
                  {/* 👇 Hide Employee column for non-approvers 👇 */}
                  {isApprover && <th>Employee</th>}
                  <th>Type</th>
                  <th className="num">Amount</th>
                  <th>Date &amp; time</th>
                  <th>Status</th>
                  <th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {slice.length === 0 ? (
                  <tr className="empty-row">
                    <td colSpan={isApprover ? 8 : 6} style={{ textAlign: 'center' }}>
                      {activeTab === 'all' ? 'No expenses yet.' : `No ${activeTab} expenses.`}
                    </td>
                  </tr>
                ) : (
                  slice.map((e) => {
                    const sel = selectedIds.has(e.id);
                    return (
                      <tr key={e.id} className={sel ? 'is-selected' : ''}>
                        {isApprover && (
                          <td className="check-cell" data-label="Select">
                            <input
                              type="checkbox"
                              checked={sel}
                              onChange={(ev) => toggleSelect(e.id, ev.target.checked)}
                              aria-label={`Select request ${e.id}`}
                            />
                          </td>
                        )}
                        <td data-label="#">#{e.id}</td>
                        {/* 👇 Hide Employee data for non-approvers 👇 */}
                        {isApprover && <td data-label="Employee">{e.employee_name || 'Unknown'}</td>}
                        <td data-label="Type">{e.type || '—'}</td>
                        <td className="num" data-label="Amount">{formatMoney(e.data?.amount)}</td>
                        <td data-label="Date & time">
                          <span className="cell-datetime">
                            {formatDate(e.data?.date)}
                            <span className="cell-sub">
                              <span className="sub-line">
                                Submitted {formatDateTimeParts(e.submitted_date || e.created_date).date}
                              </span>
                              <span className="sub-line">
                                {formatDateTimeParts(e.submitted_date || e.created_date).time}
                              </span>
                            </span>
                          </span>
                        </td>
                        <td data-label="Status">
                          <span className={`badge ${statusBadgeClass(e.status)}`}>
                            <svg className="icon"><use href={`#${statusIcon(e.status)}`} /></svg>
                            {e.status}
                          </span>
                        </td>
                        <td data-label="Actions">
                          <div className="row-actions">
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => setSelectedExpense(e)}
                              aria-label={`View request ${e.id}`}
                            >
                              <svg className="icon"><use href="#i-eye" /></svg> View
                            </button>

                                                        {isApprover && e.status === 'Pending' && (
                              <>
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleAction('approve', e)}
                                  title="Approve"
                                >
                                  <svg className="icon"><use href="#i-check" /></svg>
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleAction('reject', e)}
                                  title="Reject"
                                >
                                  <svg className="icon"><use href="#i-x" /></svg>
                                </button>
                              </>
                            )}

                            {isApprover && e.status === 'Pending' && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleAction('reject', e)}
                                aria-label={`Reject request ${e.id}`}
                              >
                                <svg className="icon"><use href="#i-x" /></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pager">
            <button onClick={() => setPage(pageSafe - 1)} disabled={pageSafe === 1} aria-label="Previous page">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)} aria-current={n === pageSafe ? 'page' : undefined}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(pageSafe + 1)} disabled={pageSafe === totalPages} aria-label="Next page">›</button>
            <span className="pager-info">{filtered.length} total</span>
          </div>
        )}
      </div>

      {selectedExpense && (
        <ExpenseDetailModal
          expense={selectedExpense}
          onClose={() => setSelectedExpense(null)}
          onAction={handleAction}
        />
      )}

      <PromptModal
        isOpen={!!prompt}
        title={prompt?.bulk ? (prompt.action === 'approve' ? 'Approve selected' : 'Reject selected') : (prompt?.action === 'approve' ? 'Approve expense' : 'Reject expense')}
        body={prompt?.bulk ? `This comment will apply to ${prompt.count} selected expense${prompt.count === 1 ? '' : 's'}.` : prompt ? `#${prompt.expense.id} · ${prompt.expense.type} · ${prompt.expense.employee_name} · ${formatMoney(prompt.expense.data?.amount)}` : ''}
        inputLabel={prompt?.action === 'approve' ? 'Approval comments' : 'Reason for rejection'}
        placeholder={prompt?.action === 'approve' ? 'Write your approval comments here' : 'Write the reason for rejection'}
        required
        okLabel={prompt?.action === 'approve' ? 'Approve' : 'Reject'}
        okClass={prompt?.action === 'approve' ? 'btn-success' : 'btn-danger'}
        onCancel={() => setPrompt(null)}
        onSubmit={prompt?.bulk ? submitBulkDecision : submitDecision}
      />
    </Layout>
  );
}