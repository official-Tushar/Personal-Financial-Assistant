import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { me, logout } from './services/auth';
import { setUser, setInitialized, clearUser } from './store/slices/authSlice';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

function Navbar() {
  const user = useSelector((s) => s.auth.user);
  const initialized = useSelector((s) => s.auth.initialized);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const goTo = (hash) => {
    setDropdownOpen(false);
    if (location.pathname !== '/dashboard') {
      navigate(`/dashboard#${hash}`);
      return;
    }
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    dispatch(clearUser());
    navigate('/login');
  };

  const handleNavLinkClick = () => {
    setDropdownOpen(false);
  };

  return (
    <div className="navbar bg-base-100 shadow sticky top-0 z-40">
      <div className="container px-2 xs:px-3 sm:px-4 md:px-6 flex justify-between mx-0 max-w-full">
        {/* Logo - always visible */}
        <div>
          <Link to="/" className="btn btn-ghost normal-case p-1 xs:p-2">
            <span className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent">PFA</span>
          </Link>
        </div>

        {/* Desktop menu - hidden on mobile, visible on md and up */}
        <div className="hidden md:flex items-center gap-6">
          {user && (
            <ul className="menu menu-horizontal px-1 md:px-2">
              <li><button className="btn btn-ghost btn-xs md:btn-sm text-xs md:text-sm" onClick={() => goTo('add')}>Add</button></li>
              <li><button className="btn btn-ghost btn-xs md:btn-sm text-xs md:text-sm" onClick={() => goTo('filter')}>Filter</button></li>
              <li><button className="btn btn-ghost btn-xs md:btn-sm text-xs md:text-sm" onClick={() => goTo('transactions')}>Transactions</button></li>
            </ul>
          )}
        </div>

        {/* Desktop auth buttons - hidden on mobile, visible on md and up */}
        <div className="hidden md:flex gap-2 sm:gap-3">
          {!initialized ? null : !user ? (
            <>
              <Link to="/login" className="btn btn-outline btn-xs sm:btn-sm text-xs md:text-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-xs sm:btn-sm text-xs md:text-sm">Register</Link>
            </>
          ) : (
            <div className="flex gap-2">
              <NavLink to="/dashboard" className="btn btn-neutral btn-xs sm:btn-sm text-xs md:text-sm">Dashboard</NavLink>
              <button type="button" onClick={handleLogout} className="btn btn-outline btn-xs sm:btn-sm text-xs md:text-sm">Logout</button>
            </div>
          )}
        </div>

        {/* Mobile hamburger menu - visible only on mobile, hidden on md and up */}
        <div className="md:hidden relative" ref={dropdownRef}>
          <button 
            type="button"
            className="btn btn-ghost btn-xs xs:btn-sm p-1 xs:p-2"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="Toggle menu"
            aria-expanded={dropdownOpen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 xs:h-5 xs:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {dropdownOpen && (
            <ul className="absolute right-0 top-full mt-2 menu bg-base-100 rounded-box z-50 w-44 xs:w-52 shadow-lg border border-base-300 p-2">
              {!initialized ? null : !user ? (
                <>
                  <li>
                    <Link to="/login" className="text-xs xs:text-sm sm:text-base rounded-lg py-1.5 xs:py-2" onClick={handleNavLinkClick}>Login</Link>
                  </li>
                  <li>
                    <Link to="/register" className="text-xs xs:text-sm sm:text-base rounded-lg py-1.5 xs:py-2" onClick={handleNavLinkClick}>Register</Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <NavLink to="/dashboard" className="text-xs xs:text-sm sm:text-base rounded-lg py-1.5 xs:py-2" onClick={handleNavLinkClick}>Dashboard</NavLink>
                  </li>
                  <li>
                    <button type="button" className="text-xs xs:text-sm sm:text-base text-left rounded-lg py-1.5 xs:py-2" onClick={() => goTo('add')}>Add</button>
                  </li>
                  <li>
                    <button type="button" className="text-xs xs:text-sm sm:text-base text-left rounded-lg py-1.5 xs:py-2" onClick={() => goTo('filter')}>Filter</button>
                  </li>
                  <li>
                    <button type="button" className="text-xs xs:text-sm sm:text-base text-left rounded-lg py-1.5 xs:py-2" onClick={() => goTo('transactions')}>Transaction</button>
                  </li>
                  <li>
                    <button type="button" className="text-xs xs:text-sm sm:text-base text-left rounded-lg py-1.5 xs:py-2 text-error hover:bg-error/10" onClick={handleLogout}>Logout</button>
                  </li>
                </>
              )}
            </ul>
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
