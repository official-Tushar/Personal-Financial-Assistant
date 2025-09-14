import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { listTransactions, updateTransaction, deleteTransaction } from '../services/transactions';
import { nextPage, prevPage, resetPagination } from '../store/slices/transactionsSlice';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';

export default function TransactionList({ start, end, refreshToken }) {
  const dispatch = useDispatch();
  const { page, limit } = useSelector((s) => s.transactions);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, hasPrev: false, hasNext: false, total: 0 });
  const [localRefresh, setLocalRefresh] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({ _id: '', type: 'expense', category: '', amount: '', date: '', description: '' });

  // Reset to first page when filters change
  useEffect(() => {
    dispatch(resetPagination());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (start) params.start = start;
        if (end) params.end = end;
        params.page = page;
        params.limit = limit;
        const data = await listTransactions(params);
        if (!ignore) {
          setItems(data.transactions || []);
          setMeta({
            page: data.page,
            totalPages: data.totalPages,
            hasPrev: data.hasPrev,
            hasNext: data.hasNext,
            total: data.total,
          });
        }
      } catch (err) {
        if (!ignore) setError(err?.response?.data?.message || 'Failed to load');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [start, end, refreshToken, localRefresh, page, limit]);

  if (loading) return <div className="loading loading-spinner" />;
  if (error) return <div className="alert alert-error text-sm">{error}</div>;

  const openEdit = (tx) => {
    setEditForm({
      _id: tx._id,
      type: tx.type,
      category: tx.category,
      amount: String(tx.amount),
      date: new Date(tx.date).toISOString().slice(0, 10),
      description: tx.description || '',
    });
    setEditError('');
    setEditOpen(true);
  };

  const closeEdit = () => setEditOpen(false);

  const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const saveEdit = async (e) => {
    e?.preventDefault?.();
    setEditSaving(true);
    setEditError('');
    try {
      const payload = {
        type: editForm.type,
        category: editForm.category,
        amount: Number(editForm.amount),
        date: editForm.date,
        description: editForm.description,
      };
      await updateTransaction(editForm._id, payload);
      setEditOpen(false);
      setLocalRefresh((x) => x + 1);
    } catch (err) {
      setEditError(err?.response?.data?.message || 'Failed to update');
    } finally {
      setEditSaving(false);
    }
  };

  const onDelete = async (id) => {
    const ok = window.confirm('Delete this transaction? This cannot be undone.');
    if (!ok) return;
    try {
      await deleteTransaction(id);
      setLocalRefresh((x) => x + 1);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete');
    }
  };

  const allowedEditCategories = editForm.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Category</th>
            <th className="text-right">Amount</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((tx) => (
            <tr key={tx._id}>
              <td>{new Date(tx.date).toLocaleDateString()}</td>
              <td>
                <span className={`badge ${tx.type === 'income' ? 'badge-success' : 'badge-error'} badge-outline`}>{tx.type}</span>
              </td>
              <td>{tx.category}</td>
              <td className={`text-right ${tx.type === 'income' ? 'text-success' : 'text-error'}`}>₹{tx.amount.toFixed(2)}</td>
              <td>{tx.description}</td>
              <td className="space-x-2 whitespace-nowrap">
                <button className="btn btn-xs" onClick={() => openEdit(tx)}>Edit</button>
                <button className="btn btn-xs btn-error" onClick={() => onDelete(tx._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm opacity-70">Page {meta.page} of {meta.totalPages} • {meta.total} total</div>
        <div className="join">
          <button className="btn join-item" disabled={!meta.hasPrev} onClick={() => dispatch(prevPage())}>Previous</button>
          <button className="btn join-item" disabled={!meta.hasNext} onClick={() => dispatch(nextPage())}>Next</button>
        </div>
      </div>

      {editOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card bg-base-100 shadow max-w-lg w-full">
            <div className="card-body">
              <h3 className="card-title">Edit Transaction</h3>
              <form onSubmit={saveEdit} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <div className="form-control md:col-span-2">
                  <label className="label">Type</label>
                  <select name="type" className="select select-bordered" value={editForm.type} onChange={handleEditChange}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div className="form-control md:col-span-2">
                  <label className="label">Category</label>
                  <select name="category" className="select select-bordered" required value={editForm.category} onChange={handleEditChange}>
                    <option value="" disabled>Select a category</option>
                    {allowedEditCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-control md:col-span-2">
                  <label className="label">Amount</label>
                  <input name="amount" type="number" min="0" step="0.01" className="input input-bordered" required value={editForm.amount} onChange={handleEditChange} />
                </div>
                <div className="form-control md:col-span-3">
                  <label className="label">Date</label>
                  <input name="date" type="date" className="input input-bordered" required value={editForm.date} onChange={handleEditChange} />
                </div>
                <div className="form-control md:col-span-3">
                  <label className="label">Description</label>
                  <input name="description" className="input input-bordered" value={editForm.description} onChange={handleEditChange} />
                </div>
                {editError && <div className="md:col-span-6 alert alert-error text-sm">{editError}</div>}
                <div className="md:col-span-6 flex gap-2 justify-end">
                  <button type="button" className="btn" onClick={closeEdit}>Cancel</button>
                  <button className="btn btn-primary" disabled={editSaving}>{editSaving ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
