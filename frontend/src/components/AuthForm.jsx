import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import { login as loginApi, register as registerApi } from '../services/auth';

export default function AuthForm({ mode = 'login', onSuccess }) {
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let user;
      if (isRegister) {
        user = await registerApi({ name: form.name, email: form.email, password: form.password });
      } else {
        user = await loginApi({ email: form.email, password: form.password });
      }
      dispatch(setUser(user));
      onSuccess?.(user);
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isRegister && (
        <div className="form-control">
          <label className="label">Name</label>
          <input name="name" className="input input-bordered" required value={form.name} onChange={handleChange} />
        </div>
      )}
      <div className="form-control">
        <label className="label">Email</label>
        <input name="email" type="email" className="input input-bordered" required value={form.email} onChange={handleChange} />
      </div>
      <div className="form-control">
        <label className="label">Password</label>
        <input name="password" type="password" className="input input-bordered" required value={form.password} onChange={handleChange} />
      </div>
      {error && <div className="alert alert-error text-sm">{error}</div>}
      <button className={`btn btn-primary w-full`} disabled={loading}>
        {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
      </button>
    </form>
  );
}
