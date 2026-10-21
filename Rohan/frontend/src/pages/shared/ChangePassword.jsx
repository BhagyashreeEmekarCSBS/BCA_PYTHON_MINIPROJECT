import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineShieldCheck } from 'react-icons/hi';

const ChangePassword = () => {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { updatePassword } = useAuth();

  const validate = () => {
    const errs = {};
    if (!form.currentPassword) errs.currentPassword = 'Current password is required';

    if (!form.newPassword) errs.newPassword = 'New password is required';
    else if (form.newPassword.length < 8 || form.newPassword.length > 16)
      errs.newPassword = 'Password must be 8–16 characters';
    else if (!/[A-Z]/.test(form.newPassword))
      errs.newPassword = 'Must contain at least one uppercase letter';
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.newPassword))
      errs.newPassword = 'Must contain at least one special character';

    if (form.newPassword !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await updatePassword(form.currentPassword, form.newPassword);
      toast.success('Password updated successfully!');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update password';
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

  const isPasswordLengthValid = form.newPassword.length >= 8 && form.newPassword.length <= 16;
  const hasUppercase = /[A-Z]/.test(form.newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(form.newPassword);

  return (
    <div className="settings-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Change Password</h1>
          <p className="page-subtitle">Update and manage your account security credentials</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-control)',
              background: 'rgba(108, 99, 255, 0.12)',
              color: 'var(--accent-primary-hover)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            <HiOutlineShieldCheck />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-main)' }}>
              Security Credentials
            </h2>
            <p className="meta-text">Ensure your new password meets complexity rules</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="currentPassword">Current Password</label>
            <div className="password-input-wrapper">
              <input
                id="currentPassword"
                name="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                className={`form-input ${errors.currentPassword ? 'error' : ''}`}
                placeholder="Enter your current password"
                value={form.currentPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
              >
                {showCurrent ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
            </div>
            {errors.currentPassword && (
              <div className="form-error">{errors.currentPassword}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">New Password</label>
            <div className="password-input-wrapper">
              <input
                id="newPassword"
                name="newPassword"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                className={`form-input ${errors.newPassword ? 'error' : ''}`}
                placeholder="8–16 chars, 1 uppercase, 1 special"
                value={form.newPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowNew(!showNew)}
                aria-label={showNew ? 'Hide new password' : 'Show new password'}
              >
                {showNew ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
            </div>
            {errors.newPassword && <div className="form-error">{errors.newPassword}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
            <div className="password-input-wrapper">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Re-enter your new password"
                value={form.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirm ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="form-error">{errors.confirmPassword}</div>
            )}
          </div>

          {/* Password Requirements Box */}
          <div className="form-helper-box" style={{ marginBottom: 20 }}>
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
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner-inline" />
                <span>Updating Password...</span>
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
