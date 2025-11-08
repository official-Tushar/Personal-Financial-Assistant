import { useNavigate, Link } from 'react-router-dom';
import AuthForm from '../components/AuthForm';

export default function Login() {
  const navigate = useNavigate();
  return (
    <div className="max-w-md mx-auto">
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 xs:p-6">
          <h2 className="card-title text-lg xs:text-xl sm:text-2xl">Login</h2>
          <AuthForm mode="login" onSuccess={() => navigate('/dashboard')} />
          <div className="text-xs xs:text-sm">
            No account? <Link to="/register" className="link">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

