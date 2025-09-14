import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { resetPagination } from '../store/slices/transactionsSlice';
import { createTransaction, createTransactionsBulk } from '../services/transactions';
import { analyzeReceipt } from '../services/receipts';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';

export default function TransactionForm({ onCreated }) {
  const [form, setForm] = useState({ type: 'expense', category: '', amount: '', date: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const fileRef = useRef(null);
  const [items, setItems] = useState([]); // parsed items for multi-add: { include, description, amount, category, date }
  const [pendingCategoryFromReceipt, setPendingCategoryFromReceipt] = useState(false);
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category' && value) {
      setPendingCategoryFromReceipt(false);
    }
    setForm({ ...form, [name]: value });
  };

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

  const allowedCategories = form.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const guessCategory = ({ merchantName = '', items = [] }) => {
    const text = [merchantName, ...items.map((i) => i.description || '')].join(' ').toLowerCase();
    const tests = [
      { k: 'fuel petrol diesel gas shell indian oil hpcl toll parking', c: 'Transportation – Fuel/Tolls/Parking' },
      { k: 'uber ola cab auto metro bus', c: 'Public Transport and Ride-hailing' },
      { k: 'doctor hospital clinic pharmacy medical chemist lab test', c: 'Medical and Pharmacy' },
      { k: 'amazon flipkart myntra store mall apparel fashion clothes shoes electronics', c: 'Shopping' },
      { k: 'restaurant cafe takeaway takeaway dine food pizza burger zomato swiggy', c: 'Dining and Takeaway' },
      { k: 'grocery supermarket bigbasket grofers more dmart reliance fresh', c: 'Groceries' },
      { k: 'netflix prime hotstar spotify youtube book bookmyshow game subscription', c: 'Entertainment and Subscriptions' },
      { k: 'vi airtel jio broadband wifi internet mobile dth cable', c: 'Internet and Mobile' },
      { k: 'electricity water gas utility bescom torrent mseb bses bill', c: 'Utilities' },
      { k: 'hotel flight airline irctc travel trip oyo makemytrip yatra goibibo', c: 'Travel and Vacations' },
      { k: 'insurance health life auto car bike premium', c: 'Insurance' },
      { k: 'salon spa grooming beauty cosmetics', c: 'Personal Care' },
      { k: 'maintenance repair service appliance electrician plumber', c: 'Household and Services' },
      { k: 'tuition course online education exam', c: 'Education and Courses' },
      { k: 'gift donation charity festival wedding', c: 'Gifts, Festivals and Charity' },
      { k: 'tax fee surcharge charge gst bank fee', c: 'Fees, Taxes and Charges' },
      { k: 'emi loan credit-card interest principal', c: 'Debt Payments' },
      { k: 'society hoa rent landlord property tax', c: 'Housing' },
      { k: 'tyre tyre service puc insurance motor', c: 'Vehicle - Maintenance and Insurance' },
    ];
    const match = tests.find((t) => t.k.split(/\s+/).some((kw) => kw && text.includes(kw)));
    return match?.c || 'Other';
  };

  const handleReceiptClick = () => fileRef.current?.click();

  const onFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiLoading(true);
    setError('');
    try {
      const data = await analyzeReceipt(file);
      const date = data.transactionDate ? String(data.transactionDate).slice(0, 10) : '';
      const merchantName = data.merchantName || '';
      const receiptItems = Array.isArray(data.items) ? data.items : [];

      if (receiptItems.length > 0) {
        const mapped = receiptItems.map((it) => {
          const desc = (it.description || '').trim();
          const amt = typeof it.amount === 'number' ? it.amount : Number(it.amount);
          return {
            include: true,
            type: 'expense',
            date: date || form.date,
            description: desc || form.description,
            amount: isNaN(amt) ? '' : String(amt),
            category: '',
          };
        });
        setItems(mapped);
        // Also set top form fields with first item for convenience
        const first = mapped[0];
        setForm((prev) => ({
          ...prev,
          type: 'expense',
          date: first.date,
          amount: first.amount,
          category: '',
          description: first.description,
        }));
        setPendingCategoryFromReceipt(true);
      } else {
        const amount = data.total != null ? String(data.total) : '';
        setForm((prev) => ({
          ...prev,
          type: 'expense',
          date: date || prev.date,
          amount: amount || prev.amount,
          category: '',
          description: prev.description, // do not set merchant; prefer product description
        }));
        setPendingCategoryFromReceipt(true);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to analyze receipt');
    } finally {
      setAiLoading(false);
      if (fileRef.current) fileRef.current.value = '';
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
      <div className="form-control md:col-span-2">
        <label className="label">Category</label>
        <select
          name="category"
          className={`select select-bordered ${pendingCategoryFromReceipt && !form.category ? 'select-warning' : ''}`}
          required
          value={form.category}
          onChange={handleChange}
        >
          <option value="" disabled>Select a category</option>
          {allowedCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
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
        <div className="flex gap-2">
          <button type="button" className="btn" disabled={aiLoading} onClick={handleReceiptClick}>
            {aiLoading ? 'Analyzing...' : 'Upload Receipt (PDF/Image)'}
          </button>
          <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={onFileSelected} />
          <button className="btn btn-secondary" disabled={loading}>
            {loading ? 'Saving...' : 'Add Transaction'}
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div className="md:col-span-6">
          <div className="divider">Items found in receipt</div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Include</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td>
                      <input type="checkbox" className="checkbox" checked={it.include} onChange={(e) => setItems((arr) => arr.map((x, i) => i === idx ? { ...x, include: e.target.checked } : x))} />
                    </td>
                    <td>
                      <input type="date" className="input input-bordered input-sm" value={it.date} onChange={(e) => setItems((arr) => arr.map((x, i) => i === idx ? { ...x, date: e.target.value } : x))} />
                    </td>
                    <td>
                      <input type="text" className="input input-bordered input-sm w-full" value={it.description} onChange={(e) => setItems((arr) => arr.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} />
                    </td>
                    <td>
                      <select
                        className={`select select-bordered select-sm ${it.category ? '' : 'select-warning'}`}
                        value={it.category}
                        onChange={(e) => setItems((arr) => arr.map((x, i) => i === idx ? { ...x, category: e.target.value } : x))}
                      >
                        <option value="" disabled>Select</option>
                        {EXPENSE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="text-right">
                      ₹
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input input-bordered input-sm w-28 text-right"
                        value={it.amount}
                        onChange={(e) => setItems((arr) => arr.map((x, i) => i === idx ? { ...x, amount: e.target.value } : x))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn" onClick={() => { setItems([]); setPendingCategoryFromReceipt(false); }}>Clear Items</button>
            <button type="button" className="btn btn-primary" onClick={async () => {
              setLoading(true);
              setError('');
              const selected = items.filter((x) => x.include);
              if (selected.some((x) => !x.category)) {
                setError('Please choose a category for all selected items');
                setLoading(false);
                return;
              }
              const toCreate = selected.map((x) => ({
                type: 'expense',
                date: x.date,
                description: x.description,
                amount: Number(x.amount),
                category: x.category,
              }));
              if (toCreate.length === 0) {
                setError('No items selected');
                setLoading(false);
                return;
              }
              let res;
              try {
                res = await createTransactionsBulk(toCreate);
              } catch (err) {
                setError(err?.response?.data?.message || 'Failed to add items');
                setLoading(false);
                return;
              }
              // If at least one item was created, treat as success
              if (res.createdCount > 0) {
                setItems([]);
                setPendingCategoryFromReceipt(false);
                dispatch(resetPagination());
                onCreated?.();
                // If some failed, optionally surface a subtle note instead of an error banner
                if (res.failedCount > 0) {
                  // Use console/info for now; could be replaced with a toast component
                  console.info(`${res.createdCount} item(s) added, ${res.failedCount} failed`);
                }
                setLoading(false);
                return;
              }
              // No items created at all
              setError('No items created. Some may be duplicates or invalid.');
              setLoading(false);
            }}>
              Add Selected Items
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
