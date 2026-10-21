import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineEye,
  HiOutlineEyeOff,
  HiStar,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success('Login successful!');

      const routes = {
        admin: '/admin',
        user: '/stores',
        store_owner: '/owner',
      };
      navigate(routes[user.role] || '/login');
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  return (
    <div className="auth-page">
      <div className="auth-split-layout">
        {/* Left Side: Professional Branding & Pitch */}
        <div className="auth-brand-side">
          <div>
            <div className="auth-brand-logo">
              <div className="sidebar-logo-icon" style={{ width: 38, height: 38 }}>
                <HiStar />
              </div>
              <span className="sidebar-logo-text" style={{ fontSize: 20 }}>StoreRate</span>
            </div>

            <div className="auth-brand-pitch">
              <h1 className="auth-brand-headline">
                Discover stores.<br />Share your experience.
              </h1>
              <p className="auth-brand-subheadline">
                A verified rating platform designed for real customer reviews, transparent feedback, and trustworthy store discovery.
              </p>
            </div>

            <div className="auth-features-list">
              <div className="auth-feature-item">
                <span className="auth-feature-bullet"><HiOutlineCheckCircle /></span>
                <span>Transparent 1 to 5 star ratings submitted by authentic users</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-bullet"><HiOutlineCheckCircle /></span>
                <span>Dedicated owner dashboards with granular review analytics</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-bullet"><HiOutlineCheckCircle /></span>
                <span>Role-based access security and audited platform metrics</span>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            <span>&copy; {new Date().getFullYear()} StoreRate Platform. All rights reserved.</span>
          </div>
        </div>

        {/* Right Side: Clean Surface Login Form */}
        <div className="auth-form-side">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Welcome back</h2>
            <p className="auth-form-subtitle">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="password">Password</label>
              </div>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? (
                <>
                  <span className="loading-spinner-inline" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="auth-footer-nav">
            Don't have an account? <Link to="/signup">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
