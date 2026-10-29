import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { expenseAPI } from '../api/client';
import Layout from '../components/Layout';
import ExpenseDetailModal from '../components/ExpenseDetailModal';
import PromptModal from '../components/PromptModal';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { formatMoney, formatDate, formatDateTimeParts, statusBadgeClass, statusIcon } from '../utils/format';
import { useNavigate } from 'react-router-dom';
import DistributionCard from '../components/DistributionCard';

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); 

  const isApprover = user?.role === 'head' || user?.role === 'hr';

  const loadExpenses = useCallback(async () => {
    try {
      const data = await expenseAPI('/expenses');
      const visible = isApprover
        ? data
        : data.filter(e => e.employee_name === user?.display_name || e.employee_name === user?.username);
      setExpenses(visible || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }, [user, isApprover]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  const openDetail = (expense) => setSelectedExpense(expense);
  const closeDetail = () => setSelectedExpense(null);

  const handleAction = (action, expense) => {
    if (action === 'approve' || action === 'reject') {
      setPrompt({ action, expense });
      return;
    }
    if (action === 'edit') {
      closeDetail();
      navigate('/form', { state: { editingExpense: expense } });
      return;
    }
    if (action === 'resubmit') {
      closeDetail();
      navigate('/form', { state: { editingExpense: expense, resubmit: true } });
      return;
    }
    if (action === 'endTrip') {
      closeDetail();
      navigate('/form', { state: { editingExpense: expense, stage: 'end' } });
      return;
    }
    if (action === 'delete') {
      setConfirmDelete(expense); 
      return;
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
      closeDetail();
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
      closeDetail();
      await loadExpenses();
    } catch (err) {
      console.error(err);
      toast(err.message || 'Failed to delete expense.', 'error');
    }
  };

  // Calculate Approved Sum and Limit to Recent 8
  const approvedSum = expenses
    .filter(e => e.status === 'Approved')
    .reduce((s, e) => s + (Number(e.data?.amount) || 0), 0);

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 8);

  // Header button for employees
  const headerRight = !isApprover ? (
    <button className="btn btn-primary btn-sm" onClick={() => navigate('/expenses')} style={{ marginRight: '10px' }}>
      <svg className="icon"><use href="#i-list" /></svg> <span className="btn-text">View Expenses</span>
    </button>
  ) : null;

  return (
    // 👇 FIXED: Now uses dynamic title and header button
    <Layout title={isApprover ? 'Dashboard' : 'My Dashboard'} headerRight={headerRight}>
      {loading ? (
        <div className="card">Loading dashboard...</div>
      ) : errorMsg ? (
        <div className="card" style={{ color: 'red' }}>
          <strong>Error:</strong> {errorMsg}
        </div>
      ) : (
        <>
          <DistributionCard expenses={expenses} />
          
          <div className="card">
            <div className="card-title">
              Recent Expenses 
              {/* 👇 FIXED: Dynamic subtitle based on role */}
              <span className="sub">
                {isApprover ? 'Latest activity' : `${formatMoney(approvedSum)} approved so far`}
              </span>
            </div>

            <div className="table-wrap">
              <table className="table" id="recentTable">
                <thead>
                  <tr>
                    <th>#</th>
                    {/* 👇 FIXED: Hide Employee column for employees */}
                    {isApprover && <th>Employee</th>}
                    <th>Type</th>
                    <th className="num">Amount</th>
                    <th>Date &amp; time</th>
                    <th>Status</th>
                    <th><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {recentExpenses.length === 0 ? (
                    <tr className="empty-row">
                      <td colSpan={isApprover ? 7 : 6} style={{ textAlign: 'center' }}>No expenses found.</td>
                    </tr>
                  ) : (
                    recentExpenses.map((e) => (
                      <tr key={e.id}>
                        <td data-label="#">#{e.id}</td>
                        {/* 👇 FIXED: Hide Employee data for employees */}
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
                              onClick={() => openDetail(e)}
                              aria-label={`View request ${e.id}`}
                            >
                              <svg className="icon"><use href="#i-eye" /></svg> View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedExpense && (
        <ExpenseDetailModal
          expense={selectedExpense}
          onClose={closeDetail}
          onAction={handleAction}
        />
      )}

      <PromptModal
        isOpen={!!prompt}
        title={prompt?.action === 'approve' ? 'Approve expense' : 'Reject expense'}
        body={
          prompt
            ? `#${prompt.expense.id} · ${prompt.expense.type} · ${prompt.expense.employee_name} · ${formatMoney(prompt.expense.data?.amount)}`
            : ''
        }
        inputLabel={prompt?.action === 'approve' ? 'Approval comments' : 'Reason for rejection'}
        placeholder={prompt?.action === 'approve' ? 'Write your approval comments here' : 'Write the reason for rejection'}
        required
        okLabel={prompt?.action === 'approve' ? 'Approve' : 'Reject'}
        okClass={prompt?.action === 'approve' ? 'btn-success' : 'btn-danger'}
        onCancel={() => setPrompt(null)}
        onSubmit={submitDecision}
      />

      <ConfirmModal
        isOpen={!!confirmDelete}
        title={`Delete request #${confirmDelete?.id}?`}
        body={`This removes the ${confirmDelete?.type} expense and its attachments. It cannot be undone.`}
        okLabel="Delete"
        okClass="btn-danger"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          const exp = confirmDelete;
          setConfirmDelete(null);
          doDelete(exp);
        }}
      />
    </Layout>
  );
}