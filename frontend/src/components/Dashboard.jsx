import { useEffect, useState } from 'react';
import { getSummary, getByCategory, getTimeline } from '../services/reports';
import TransactionList from './TransactionList';
import { CategoryPie, ComposedIncomeExpenseChart } from './ChartWrapper';

export default function Dashboard({ start, end, refreshToken = 0 }) {
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 });
  const [byCategory, setByCategory] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (start) params.start = start;
        if (end) params.end = end;
        const [s, c, t] = await Promise.all([
          getSummary(params),
          getByCategory(params),
          getTimeline(params),
        ]);
        if (!ignore) {
          setSummary(s);
          setByCategory(c);
          setTimeline(t);
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
  }, [start, end, refreshToken]);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="loading loading-dots" />
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <>
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">Total Income</div>
              <div className="stat-value text-success">₹{summary.income.toFixed(2)}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Total Expense</div>
              <div className="stat-value text-error">₹{summary.expense.toFixed(2)}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Net</div>
              <div className={`stat-value ${summary.net >= 0 ? 'text-success' : 'text-error'}`}>
                ₹{summary.net.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">Expenses by Category</h3>
                <CategoryPie data={byCategory} />
              </div>
            </div>
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">Income and Stacked Expenses</h3>
                <ComposedIncomeExpenseChart data={timeline} />
              </div>
            </div>
          </div>
        </>
      )}

      <div id="transactions" className="card bg-base-100 shadow scroll-mt-24">
        <div className="card-body">
          <h2 className="card-title">Transactions</h2>
          <TransactionList start={start} end={end} refreshToken={refreshToken} />
        </div>
      </div>
    </div>
  );
}
