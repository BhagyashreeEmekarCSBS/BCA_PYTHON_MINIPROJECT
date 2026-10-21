import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineX,
  HiStar,
  HiOutlineUser,
} from 'react-icons/hi';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ name: '', email: '', address: '', role: '' });
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showModal, setShowModal] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Form state for creating user
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    role: 'user',
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filters, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      const params = { ...filters, sortBy, sortOrder };
      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });
      const response = await adminAPI.getUsers(params);
      setUsers(response.data.users);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const renderSortIndicator = (field) => {
    if (sortBy !== field) {
      return <span className="sort-icon" aria-hidden="true">↕</span>;
    }
    return (
      <span className="sort-icon" aria-hidden="true">
        {sortOrder === 'asc' ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
      </span>
    );
  };

  const hasActiveFilters = Boolean(
    filters.name || filters.email || filters.address || filters.role || sortBy
  );

  const handleClearFilters = () => {
    setFilters({ name: '', email: '', address: '', role: '' });
    setSortBy('');
    setSortOrder('asc');
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name) errs.name = 'Full name is required';
    else if (form.name.length < 5) errs.name = 'Minimum 5 characters required';
    else if (form.name.length > 20) errs.name = 'Maximum 20 characters allowed';

    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';

    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8 || form.password.length > 16)
      errs.password = 'Password must be 8–16 characters';
    else if (!/[A-Z]/.test(form.password))
      errs.password = 'Must contain at least one uppercase letter';
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password))
      errs.password = 'Must contain at least one special character';

    if (form.address && form.address.length > 400)
      errs.address = 'Maximum 400 characters allowed';

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      await adminAPI.createUser(form);
      toast.success('User created successfully!');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', address: '', role: 'user' });
      setFormErrors({});
      fetchUsers();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create user';
      toast.error(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const response = await adminAPI.getUserById(id);
      setDetailUser(response.data.user);
      setShowDetailModal(true);
    } catch {
      toast.error('Failed to load user details');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage registered platform accounts and credentials</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <HiOutlinePlus aria-hidden="true" />
          <span>Add User</span>
        </button>
      </div>

      <div className="table-wrapper">
        {/* Simultaneous Filters Toolbar */}
        <div className="table-toolbar">
          <div className="table-search-input">
            <HiOutlineSearch aria-hidden="true" />
            <input
              id="filter-user-name"
              placeholder="Filter by name..."
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
            />
          </div>

          <div className="table-search-input">
            <HiOutlineSearch aria-hidden="true" />
            <input
              id="filter-user-email"
              placeholder="Filter by email..."
              name="email"
              value={filters.email}
              onChange={handleFilterChange}
            />
          </div>

          <div className="table-search-input">
            <HiOutlineSearch aria-hidden="true" />
            <input
              id="filter-user-address"
              placeholder="Filter by address..."
              name="address"
              value={filters.address}
              onChange={handleFilterChange}
            />
          </div>

          <div className="table-filter-select">
            <select
              id="filter-user-role"
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              aria-label="Filter by role"
            >
              <option value="">All Roles</option>
              <option value="admin">System Admin</option>
              <option value="user">Normal User</option>
              <option value="store_owner">Store Owner</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleClearFilters}
              title="Clear all active filters"
            >
              <HiOutlineX aria-hidden="true" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th
                  className={`sortable ${sortBy === 'name' ? 'sorted' : ''}`}
                  onClick={() => handleSort('name')}
                >
                  Name {renderSortIndicator('name')}
                </th>
                <th
                  className={`sortable ${sortBy === 'email' ? 'sorted' : ''}`}
                  onClick={() => handleSort('email')}
                >
                  Email {renderSortIndicator('email')}
                </th>
                <th
                  className={`sortable ${sortBy === 'address' ? 'sorted' : ''}`}
                  onClick={() => handleSort('address')}
                >
                  Address {renderSortIndicator('address')}
                </th>
                <th
                  className={`sortable ${sortBy === 'role' ? 'sorted' : ''}`}
                  onClick={() => handleSort('role')}
                >
                  Role {renderSortIndicator('role')}
                </th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td colSpan="5">
                      <div className="skeleton skeleton-row" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <HiOutlineUser />
                      </div>
                      <div className="empty-state-title">No users found</div>
                      <p className="empty-state-description">
                        No user records matched your search or filter criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td
                      style={{
                        color: 'var(--text-secondary)',
                        maxWidth: 240,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={u.address}
                    >
                      {u.address || '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${u.role}`}>
                        {u.role === 'store_owner' ? 'Store Owner' : u.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleViewDetail(u.id)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New User</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} noValidate>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="user-create-name">Full Name</label>
                  <span className="meta-text">{form.name.length} / 20 (min 5)</span>
                </div>
                <input
                  id="user-create-name"
                  name="name"
                  className={`form-input ${formErrors.name ? 'error' : ''}`}
                  placeholder="Full name (5–20 characters)"
                  value={form.name}
                  onChange={handleFormChange}
                />
                {formErrors.name && <div className="form-error">{formErrors.name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="user-create-email">Email Address</label>
                <input
                  id="user-create-email"
                  name="email"
                  type="email"
                  className={`form-input ${formErrors.email ? 'error' : ''}`}
                  placeholder="user@example.com"
                  value={form.email}
                  onChange={handleFormChange}
                />
                {formErrors.email && <div className="form-error">{formErrors.email}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="user-create-password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="user-create-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input ${formErrors.password ? 'error' : ''}`}
                    placeholder="8-16 chars, 1 uppercase, 1 special"
                    value={form.password}
                    onChange={handleFormChange}
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
                {formErrors.password && <div className="form-error">{formErrors.password}</div>}
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="user-create-address">Address</label>
                  <span className="meta-text">{form.address.length} / 400</span>
                </div>
                <textarea
                  id="user-create-address"
                  name="address"
                  className={`form-input ${formErrors.address ? 'error' : ''}`}
                  placeholder="Street address, city"
                  value={form.address}
                  onChange={handleFormChange}
                  rows={2}
                />
                {formErrors.address && <div className="form-error">{formErrors.address}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="user-create-role">Assigned Role</label>
                <select
                  id="user-create-role"
                  name="role"
                  className="form-input"
                  value={form.role}
                  onChange={handleFormChange}
                >
                  <option value="user">Normal User</option>
                  <option value="admin">System Administrator</option>
                  <option value="store_owner">Store Owner</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <span className="loading-spinner-inline" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailModal && detailUser && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">User Profile Details</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowDetailModal(false)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="user-detail-card">
              <div className="user-detail-avatar" aria-hidden="true">
                {getInitials(detailUser.name)}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
                  {detailUser.name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {detailUser.email}
                </div>
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">Assigned Role</div>
                <div className="detail-value">
                  <span className={`badge badge-${detailUser.role}`}>
                    {detailUser.role === 'store_owner' ? 'Store Owner' : detailUser.role === 'admin' ? 'Admin' : 'Normal User'}
                  </span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-label">User ID</div>
                <div className="detail-value" style={{ fontFamily: 'monospace', fontSize: 13 }}>
                  #{detailUser.id}
                </div>
              </div>

              <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                <div className="detail-label">Address</div>
                <div className="detail-value">{detailUser.address || 'No address provided'}</div>
              </div>

              {detailUser.role === 'store_owner' && (
                detailUser.ownedStore ? (
                  <>
                    <div className="detail-item">
                      <div className="detail-label">Owned Store</div>
                      <div className="detail-value" style={{ fontWeight: 600 }}>
                        {detailUser.ownedStore.name}
                      </div>
                    </div>

                    <div className="detail-item">
                      <div className="detail-label">Store Rating</div>
                      <div className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: 'var(--star-rating)' }}><HiStar /></span>
                        <span style={{ fontWeight: 700 }}>
                          {detailUser.ownedStore.averageRating
                            ? parseFloat(detailUser.ownedStore.averageRating).toFixed(1)
                            : 'No ratings'}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          ({detailUser.ownedStore.totalRatings || 0} reviews)
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                    <div className="detail-label">Store Assignment</div>
                    <div className="detail-value" style={{ color: 'var(--text-muted)' }}>
                      No store registered or assigned to this owner yet
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
