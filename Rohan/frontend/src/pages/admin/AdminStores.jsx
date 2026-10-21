import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import StarRating from '../../components/StarRating';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineX,
  HiOutlineShoppingBag,
  HiStar,
} from 'react-icons/hi';

const AdminStores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ name: '', email: '', address: '' });
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [form, setForm] = useState({ name: '', email: '', address: '', ownerId: '' });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  // Store owners for dropdown
  const [storeOwners, setStoreOwners] = useState([]);

  useEffect(() => {
    fetchStores();
  }, [filters, sortBy, sortOrder]);

  useEffect(() => {
    if (showModal) fetchStoreOwners();
  }, [showModal]);

  const fetchStores = async () => {
    try {
      const params = { ...filters, sortBy, sortOrder };
      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });
      const response = await adminAPI.getStores(params);
      setStores(response.data.stores);
    } catch {
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreOwners = async () => {
    try {
      const response = await adminAPI.getUsers({ role: 'store_owner' });
      setStoreOwners(response.data.users);
    } catch {
      // Silently fail
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

  const hasActiveFilters = Boolean(filters.name || filters.email || filters.address || sortBy);

  const handleClearFilters = () => {
    setFilters({ name: '', email: '', address: '' });
    setSortBy('');
    setSortOrder('asc');
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name) errs.name = 'Store name is required';
    else if (form.name.length < 20) errs.name = 'Minimum 20 characters required';
    else if (form.name.length > 60) errs.name = 'Maximum 60 characters allowed';

    if (!form.email) errs.email = 'Store email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format';

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
      const data = { ...form };
      if (!data.ownerId) delete data.ownerId;
      await adminAPI.createStore(data);
      toast.success('Store registered successfully!');
      setShowModal(false);
      setForm({ name: '', email: '', address: '', ownerId: '' });
      setFormErrors({});
      fetchStores();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create store';
      toast.error(msg);
    } finally {
      setFormLoading(false);
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Stores</h1>
          <p className="page-subtitle">Manage all registered stores, locations, and owners</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <HiOutlinePlus aria-hidden="true" />
          <span>Add Store</span>
        </button>
      </div>

      <div className="table-wrapper">
        {/* Compact Filters Toolbar */}
        <div className="table-toolbar">
          <div className="table-search-input">
            <HiOutlineSearch aria-hidden="true" />
            <input
              id="filter-store-name"
              placeholder="Filter by name..."
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
            />
          </div>

          <div className="table-search-input">
            <HiOutlineSearch aria-hidden="true" />
            <input
              id="filter-store-email"
              placeholder="Filter by email..."
              name="email"
              value={filters.email}
              onChange={handleFilterChange}
            />
          </div>

          <div className="table-search-input">
            <HiOutlineSearch aria-hidden="true" />
            <input
              id="filter-store-address"
              placeholder="Filter by address..."
              name="address"
              value={filters.address}
              onChange={handleFilterChange}
            />
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
                  className={`sortable ${sortBy === 'rating' ? 'sorted' : ''}`}
                  onClick={() => handleSort('rating')}
                >
                  Rating {renderSortIndicator('rating')}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td colSpan="4">
                      <div className="skeleton skeleton-row" />
                    </td>
                  </tr>
                ))
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <HiOutlineShoppingBag />
                      </div>
                      <div className="empty-state-title">No stores found</div>
                      <p className="empty-state-description">
                        No stores matched your current search filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                stores.map((store) => {
                  const avg = store.averageRating ? parseFloat(store.averageRating) : null;
                  return (
                    <tr key={store.id}>
                      <td style={{ fontWeight: 600 }}>{store.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{store.email}</td>
                      <td
                        style={{
                          color: 'var(--text-secondary)',
                          maxWidth: 240,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={store.address}
                      >
                        {store.address || '—'}
                      </td>
                      <td>
                        {avg ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <StarRating rating={Math.round(avg)} readonly size={16} />
                            <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: 13.5 }}>
                              {avg.toFixed(1)}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                              ({store.totalRatings})
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>
                            No ratings yet
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Store Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Register New Store</h2>
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
                  <label className="form-label" htmlFor="store-create-name">Store Name</label>
                  <span className="meta-text">{form.name.length} / 60</span>
                </div>
                <input
                  id="store-create-name"
                  name="name"
                  className={`form-input ${formErrors.name ? 'error' : ''}`}
                  placeholder="Store brand name (min 20 characters)"
                  value={form.name}
                  onChange={handleFormChange}
                />
                {formErrors.name && <div className="form-error">{formErrors.name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="store-create-email">Store Email</label>
                <input
                  id="store-create-email"
                  name="email"
                  type="email"
                  className={`form-input ${formErrors.email ? 'error' : ''}`}
                  placeholder="store@example.com"
                  value={form.email}
                  onChange={handleFormChange}
                />
                {formErrors.email && <div className="form-error">{formErrors.email}</div>}
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="store-create-address">Store Address</label>
                  <span className="meta-text">{form.address.length} / 400</span>
                </div>
                <textarea
                  id="store-create-address"
                  name="address"
                  className={`form-input ${formErrors.address ? 'error' : ''}`}
                  placeholder="Physical street address and postal code"
                  value={form.address}
                  onChange={handleFormChange}
                  rows={2}
                />
                {formErrors.address && <div className="form-error">{formErrors.address}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="store-create-owner">Assign Owner (Optional)</label>
                <select
                  id="store-create-owner"
                  name="ownerId"
                  className="form-input"
                  value={form.ownerId}
                  onChange={handleFormChange}
                >
                  <option value="">No Owner Assigned</option>
                  {storeOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                    </option>
                  ))}
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
                      <span>Creating Store...</span>
                    </>
                  ) : (
                    'Create Store'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStores;
