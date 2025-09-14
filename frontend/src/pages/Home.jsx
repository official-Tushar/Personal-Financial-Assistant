import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function Home() {
  const user = useSelector((s) => s.auth.user);
  const initialized = useSelector((s) => s.auth.initialized);

  return (
    <div className="text-center space-y-4">
      <h1 className="text-3xl font-bold">Personal Finance Assistant</h1>
      <p className="text-base-content/70">Track income and expenses, visualize spending, and stay on budget.</p>
      {initialized && !user && <div className="space-x-2">
        <Link to="/register" className="btn btn-primary">Get Started</Link>
        <Link to="/login" className="btn btn-outline">Login</Link>
      </div>}
      {initialized && user && <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>}
    </div>
  );
}
