import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import { setStart, setEnd, clearFilters } from '../store/slices/uiSlice';
import { me, logout } from '../services/auth';
import Dashboard from '../components/Dashboard';
import TransactionForm from '../components/TransactionForm';

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { start, end } = useSelector((s) => s.ui.filters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const u = await me();
        if (!ignore) dispatch(setUser(u));
      } catch (err) {
        if (!ignore) navigate('/login');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [navigate, dispatch]);

  // Scroll to sections based on hash
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatToday = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const today = formatToday();

  const handleStartChange = (value) => {
    // Clamp start to today if user picks a future date
    const clampedStart = value && value > today ? today : value;
    dispatch(setStart(clampedStart));
    // Ensure end is not before start
    if (clampedStart && end && end < clampedStart) {
      dispatch(setEnd(clampedStart));
    }
  };

  const handleEndChange = (value) => {
    // End cannot be before start
    if (start && value && value < start) {
      dispatch(setEnd(start));
    } else {
      // Also clamp to today if future
      const clampedEnd = value && value > today ? today : value;
      dispatch(setEnd(clampedEnd));
    }
  };

  const onTransactionCreated = () => setRefreshToken((x) => x + 1);

  if (loading) return <div className="loading loading-dots" />;
  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
          <p className="text-sm text-base-content/70">Track your finances and stay organized.</p>
        </div>
        <button onClick={handleLogout} className="btn btn-outline btn-sm">Logout</button>
      </div>

      {/* Add Transaction first */}
      <div id="add" className="card bg-base-100 shadow scroll-mt-24">
        <div className="card-body">
          <h2 className="card-title">Add Transaction</h2>
          <TransactionForm onCreated={onTransactionCreated} />
        </div>
      </div>

      {/* Then filter by date range */}
      <div id="filter" className="card bg-base-100 shadow scroll-mt-24">
        <div className="card-body">
          <h3 className="card-title">Filter by Date Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="form-control">
              <label className="label">Start</label>
              <input
                type="date"
                className="input input-bordered"
                value={start}
                max={today}
                onChange={(e) => handleStartChange(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label">End</label>
              <input
                type="date"
                className="input input-bordered"
                value={end}
                min={start || undefined}
                max={today}
                onChange={(e) => handleEndChange(e.target.value)}
              />
            </div>
            <div className="form-control md:col-span-2 flex-row items-end">
              <button className="btn btn-ghost" onClick={() => dispatch(clearFilters())}>Clear</button>
            </div>
          </div>
        </div>
      </div>

      <Dashboard start={start} end={end} refreshToken={refreshToken} />
    </div>
  );
}
