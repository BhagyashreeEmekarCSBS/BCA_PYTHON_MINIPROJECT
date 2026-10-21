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

const Signup = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};

    if (!form.name) errs.name = 'Full name is required';
    else if (form.name.length < 5) errs.name = 'Name must be at least 5 characters';
    else if (form.name.length > 20) errs.name = 'Name must be at most 20 characters';

    if (!form.email) errs.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';

    if (!form.address) errs.address = 'Address is required';
    else if (form.address.length > 400) errs.address = 'Address must be at most 400 characters';

    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8 || form.password.length > 16)
      errs.password = 'Password must be 8-16 characters';
    else if (!/[A-Z]/.test(form.password))
      errs.password = 'Must contain at least one uppercase letter';
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password))
      errs.password = 'Must contain at least one special character';

    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await signup({
        name: form.name,
        email: form.email,
        address: form.address,
        password: form.password,
      });
      toast.success('Registration successful!');
      navigate('/stores');
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      if (error.response?.data?.errors) {
        const serverErrors = {};
        error.response.data.errors.forEach((e) => {
          serverErrors[e.field] = e.message;
        });
        setErrors(serverErrors);
      }
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

  const isPasswordLengthValid = form.password.length >= 8 && form.password.length <= 16;
  const hasUppercase = /[A-Z]/.test(form.password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(form.password);

  return (
    <div className="auth-page">
      <div className="auth-split-layout" style={{ maxWidth: 1020 }}>
        {/* Left Side: Brand Highlights */}
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
                Join our community of reviewers.
              </h1>
              <p className="auth-brand-subheadline">
                Create an account to browse local stores, submit honest ratings, and discover quality businesses nearby.
              </p>
            </div>

            <div className="auth-features-list">
              <div className="auth-feature-item">
                <span className="auth-feature-bullet"><HiOutlineCheckCircle /></span>
                <span>Simple 1 to 5 star rating interface</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-bullet"><HiOutlineCheckCircle /></span>
                <span>Update and modify your store ratings anytime</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-bullet"><HiOutlineCheckCircle /></span>
                <span>Comprehensive search by name and address</span>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            <span>&copy; {new Date().getFullYear()} StoreRate Platform. All rights reserved.</span>
          </div>
        </div>

        {/* Right Side: Professional Signup Form */}
        <div className="auth-form-side">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Create Account</h2>
            <p className="auth-form-subtitle">Fill in the form to register as a normal user</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="name">Full Name</label>
                <span className="meta-text">{form.name.length} / 20 (min 5)</span>
              </div>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Enter your full name (5–20 chars)"
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

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
                <label className="form-label" htmlFor="address">Address</label>
                <span className="meta-text">{form.address.length} / 400</span>
              </div>
              <textarea
                id="address"
                name="address"
                className={`form-input ${errors.address ? 'error' : ''}`}
                placeholder="Street address, city, and zone"
                value={form.address}
                onChange={handleChange}
                rows={2}
              />
              {errors.address && <div className="form-error">{errors.address}</div>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`form-input ${errors.password ? 'error' : ''}`}
                    placeholder="Enter password"
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

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="form-error">{errors.confirmPassword}</div>
                )}
              </div>
            </div>

            {/* Subtle Password Requirements Box */}
            <div className="form-helper-box" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 2 }}>
                Password Requirements:
              </div>
              <ul>
                <li className={isPasswordLengthValid ? 'valid' : ''}>
                  <span>{isPasswordLengthValid ? '✓' : '•'}</span>
                  <span>8 to 16 characters</span>
                </li>
                <li className={hasUppercase ? 'valid' : ''}>
                  <span>{hasUppercase ? '✓' : '•'}</span>
                  <span>At least one uppercase letter (A-Z)</span>
                </li>
                <li className={hasSpecial ? 'valid' : ''}>
                  <span>{hasSpecial ? '✓' : '•'}</span>
                  <span>At least one special character (!@#$%^&*)</span>
                </li>
              </ul>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner-inline" />
                  <span>Creating Account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-footer-nav">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
