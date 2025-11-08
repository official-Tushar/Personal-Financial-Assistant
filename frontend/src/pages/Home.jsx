import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function Home() {
  const user = useSelector((s) => s.auth.user);
  const initialized = useSelector((s) => s.auth.initialized);

  return (
    <div className="text-center space-y-3 xs:space-y-4 sm:space-y-6">
      <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold px-2">Personal Finance Assistant</h1>
      <p className="text-xs xs:text-sm sm:text-base md:text-lg text-base-content/70 mx-auto max-w-2xl px-4">
        Track income and expenses, visualize spending, and stay on budget.
      </p>
      {initialized && !user && <div className="flex flex-col xs:flex-row items-center justify-center gap-2 xs:gap-3 px-4">
        <Link to="/register" className="btn btn-primary btn-sm xs:btn-md w-full xs:w-auto text-xs xs:text-sm">Get Started</Link>
        <Link to="/login" className="btn btn-outline btn-sm xs:btn-md w-full xs:w-auto text-xs xs:text-sm">Login</Link>
      </div>}
      {initialized && user && <Link to="/dashboard" className="btn btn-primary btn-sm xs:btn-md w-full xs:w-auto text-xs xs:text-sm">Go to Dashboard</Link>}
    </div>
  );
}
