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
  if (error) return <div className="alert alert-error text-xs xs:text-sm">{error}</div>;

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
      <table className="table table-zebra table-xs xs:table-sm md:table-md text-xs xs:text-sm">
        <thead>
          <tr>
            <th className="text-xs xs:text-sm">Date</th>
            <th className="text-xs xs:text-sm">Type</th>
            <th className="text-xs xs:text-sm">Category</th>
            <th className="text-right text-xs xs:text-sm">Amount</th>
            <th className="text-xs xs:text-sm">Description</th>
            <th className="text-xs xs:text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((tx) => (
            <tr key={tx._id}>
              <td className="text-xs xs:text-sm">{new Date(tx.date).toLocaleDateString()}</td>
              <td>
                <span className={`badge ${tx.type === 'income' ? 'badge-success' : 'badge-error'} badge-outline badge-xs xs:badge-sm`}>{tx.type}</span>
              </td>
              <td className="text-xs xs:text-sm">{tx.category}</td>
              <td className={`text-right text-xs xs:text-sm ${tx.type === 'income' ? 'text-success' : 'text-error'}`}>₹{tx.amount.toFixed(2)}</td>
              <td className="max-w-[8rem] xs:max-w-[12rem] md:max-w-none truncate text-xs xs:text-sm" title={tx.description}>{tx.description}</td>
              <td className="space-x-1 xs:space-x-2 whitespace-nowrap">
                <button className="btn btn-ghost btn-xs text-xs" onClick={() => openEdit(tx)}>Edit</button>
                <button className="btn btn-error btn-xs text-xs" onClick={() => onDelete(tx._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-col xs:flex-row gap-2 xs:gap-0 items-stretch xs:items-center justify-between mt-4">
        <div className="text-xs xs:text-sm opacity-70">Page {meta.page} of {meta.totalPages} • {meta.total} total</div>
        <div className="join self-end xs:self-auto">
          <button className="btn btn-xs xs:btn-sm join-item text-xs xs:text-sm" disabled={!meta.hasPrev} onClick={() => dispatch(prevPage())}>Previous</button>
          <button className="btn btn-xs xs:btn-sm join-item text-xs xs:text-sm" disabled={!meta.hasNext} onClick={() => dispatch(nextPage())}>Next</button>
        </div>
      </div>

      {editOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 xs:p-3">
          <div className="card bg-base-100 shadow max-w-lg w-full">
            <div className="card-body p-3 xs:p-4 sm:p-6">
              <h3 className="card-title text-sm xs:text-base sm:text-lg">Edit Transaction</h3>
              <form onSubmit={saveEdit} className="grid grid-cols-1 md:grid-cols-6 gap-3 xs:gap-4 items-end">
                <div className="form-control md:col-span-2">
                  <label className="label text-xs xs:text-sm">Type</label>
                  <select name="type" className="select select-bordered select-xs xs:select-sm md:select-md text-xs xs:text-sm" value={editForm.type} onChange={handleEditChange}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div className="form-control md:col-span-2">
                  <label className="label text-xs xs:text-sm">Category</label>
                  <select name="category" className="select select-bordered select-xs xs:select-sm md:select-md text-xs xs:text-sm" required value={editForm.category} onChange={handleEditChange}>
                    <option value="" disabled>Select a category</option>
                    {allowedEditCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-control md:col-span-2">
                  <label className="label text-xs xs:text-sm">Amount</label>
                  <input name="amount" type="number" min="0" step="0.01" className="input input-bordered input-xs xs:input-sm md:input-md text-xs xs:text-sm" required value={editForm.amount} onChange={handleEditChange} />
                </div>
                <div className="form-control md:col-span-3">
                  <label className="label text-xs xs:text-sm">Date</label>
                  <input name="date" type="date" className="input input-bordered input-xs xs:input-sm md:input-md text-xs xs:text-sm" required value={editForm.date} onChange={handleEditChange} />
                </div>
                <div className="form-control md:col-span-3">
                  <label className="label text-xs xs:text-sm">Description</label>
                  <input name="description" className="input input-bordered input-xs xs:input-sm md:input-md text-xs xs:text-sm" value={editForm.description} onChange={handleEditChange} />
                </div>
                {editError && <div className="md:col-span-6 alert alert-error text-xs xs:text-sm">{editError}</div>}
                <div className="md:col-span-6 flex gap-2 justify-end">
                  <button type="button" className="btn btn-xs xs:btn-sm md:btn-md text-xs xs:text-sm" onClick={closeEdit}>Cancel</button>
                  <button className="btn btn-primary btn-xs xs:btn-sm md:btn-md text-xs xs:text-sm" disabled={editSaving}>{editSaving ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
