import { useNavigate, Link } from 'react-router-dom';
import AuthForm from '../components/AuthForm';

export default function Login() {
  const navigate = useNavigate();
  return (
    <div className="max-w-md mx-auto">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Login</h2>
          <AuthForm mode="login" onSuccess={() => navigate('/dashboard')} />
          <div className="text-sm">
            No account? <Link to="/register" className="link">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

