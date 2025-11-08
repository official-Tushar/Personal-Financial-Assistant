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
    <div className="space-y-4 xs:space-y-6">
      {loading ? (
        <div className="loading loading-dots" />
      ) : error ? (
        <div className="alert alert-error text-xs xs:text-sm">{error}</div>
      ) : (
        <>
          <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
            <div className="stat py-3 xs:py-4">
              <div className="stat-title text-xs xs:text-sm">Total Income</div>
              <div className="stat-value text-success text-xl xs:text-2xl sm:text-3xl md:text-4xl">₹{summary.income.toFixed(2)}</div>
            </div>
            <div className="stat py-3 xs:py-4">
              <div className="stat-title text-xs xs:text-sm">Total Expense</div>
              <div className="stat-value text-error text-xl xs:text-2xl sm:text-3xl md:text-4xl">₹{summary.expense.toFixed(2)}</div>
            </div>
            <div className="stat py-3 xs:py-4">
              <div className="stat-title text-xs xs:text-sm">Net</div>
              <div className={`stat-value ${summary.net >= 0 ? 'text-success' : 'text-error'} text-xl xs:text-2xl sm:text-3xl md:text-4xl`}>
                ₹{summary.net.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xs:gap-6">
            <div className="card bg-base-100 shadow">
              <div className="card-body p-3 xs:p-4 sm:p-6">
                <h3 className="card-title text-sm xs:text-base sm:text-lg">Expenses by Category</h3>
                <CategoryPie data={byCategory} />
              </div>
            </div>
            <div className="card bg-base-100 shadow">
              <div className="card-body p-3 xs:p-4 sm:p-6">
                <h3 className="card-title text-sm xs:text-base sm:text-lg">Income and Stacked Expenses</h3>
                <ComposedIncomeExpenseChart data={timeline} />
              </div>
            </div>
          </div>
        </>
      )}

      <div id="transactions" className="card bg-base-100 shadow scroll-mt-24">
        <div className="card-body p-3 xs:p-4 sm:p-6">
          <h2 className="card-title text-base xs:text-lg sm:text-xl">Transactions</h2>
          <TransactionList start={start} end={end} refreshToken={refreshToken} />
        </div>
      </div>
    </div>
  );
}
