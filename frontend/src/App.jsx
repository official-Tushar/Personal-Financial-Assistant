import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { me } from './services/auth';
import { setUser, setInitialized } from './store/slices/authSlice';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

function Navbar() {
  const user = useSelector((s) => s.auth.user);
  const initialized = useSelector((s) => s.auth.initialized);
  const location = useLocation();
  const navigate = useNavigate();

  const goTo = (hash) => {
    if (location.pathname !== '/dashboard') {
      navigate(`/dashboard#${hash}`);
      return;
    }
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="navbar bg-base-100 shadow sticky top-0 z-40">
      <div className="container flex justify-between">
        <div className="flex items-center justify-end gap-6">
          <div>
            <Link to="/" className="btn btn-ghost normal-case">
              <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent">PFA</span>
            </Link>
          </div>
          <div>
            <ul className="menu menu-horizontal px-2 hidden md:flex">
              <li><button className="btn btn-ghost btn-sm" onClick={() => goTo('add')}>Add</button></li>
              <li><button className="btn btn-ghost btn-sm" onClick={() => goTo('filter')}>Filter</button></li>
              <li><button className="btn btn-ghost btn-sm" onClick={() => goTo('transactions')}>Transactions</button></li>
            </ul>
          </div>
        </div>
        <div className="flex gap-3">
          {!initialized ? null : !user ? (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          ) : (
            <NavLink to="/dashboard" className="btn btn-neutral btn-sm">Dashboard</NavLink>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();

  // Initialize auth state on app load so cookie sessions reflect in UI
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const u = await me();
        if (!ignore) dispatch(setUser(u));
      } catch {
        // 401 means not logged in; just proceed
      } finally {
        if (!ignore) dispatch(setInitialized(true));
      }
    })();
    return () => {
      ignore = true;
    };
  }, [dispatch]);
  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <div className="container py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>
    </div>
  );
}
