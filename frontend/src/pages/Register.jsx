import { useNavigate, Link } from 'react-router-dom';
import AuthForm from '../components/AuthForm';

export default function Register() {
  const navigate = useNavigate();
  return (
    <div className="max-w-md mx-auto">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Create Account</h2>
          <AuthForm mode="register" onSuccess={() => navigate('/dashboard')} />
          <div className="text-sm">
            Already have an account? <Link to="/login" className="link">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

