import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { resetPagination } from '../store/slices/transactionsSlice';
import { createTransaction } from '../services/transactions';

export default function TransactionForm({ onCreated }) {
  const [form, setForm] = useState({ type: 'expense', category: '', amount: '', date: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form, amount: Number(form.amount) };
      await createTransaction(payload);
      setForm({ type: form.type, category: '', amount: '', date: '', description: '' });
      dispatch(resetPagination());
      onCreated?.();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
      <div className="form-control md:col-span-1">
        <label className="label">Type</label>
        <select name="type" className="select select-bordered" value={form.type} onChange={handleChange}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>
      <div className="form-control md:col-span-1">
        <label className="label">Category</label>
        <input name="category" className="input input-bordered" required value={form.category} onChange={handleChange} placeholder="e.g., Food" />
      </div>
      <div className="form-control md:col-span-1">
        <label className="label">Amount</label>
        <input name="amount" type="number" min="0" step="0.01" className="input input-bordered" required value={form.amount} onChange={handleChange} />
      </div>
      <div className="form-control md:col-span-1">
        <label className="label">Date</label>
        <input
          name="date"
          type="date"
          className="input input-bordered"
          required
          max={new Date().toISOString().slice(0, 10)}
          value={form.date}
          onChange={handleChange}
        />
      </div>
      <div className="form-control md:col-span-2">
        <label className="label">Description</label>
        <input name="description" className="input input-bordered" value={form.description} onChange={handleChange} placeholder="Optional" />
      </div>
      {error && <div className="md:col-span-6 alert alert-error text-sm">{error}</div>}
      <div className="md:col-span-6">
        <button className="btn btn-secondary" disabled={loading}>
          {loading ? 'Saving...' : 'Add Transaction'}
        </button>
      </div>
    </form>
  );
}
