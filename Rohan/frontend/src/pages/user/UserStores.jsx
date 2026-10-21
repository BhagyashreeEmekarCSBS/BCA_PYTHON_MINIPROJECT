import { useState, useEffect } from 'react';
import { storeAPI } from '../../services/api';
import toast from 'react-hot-toast';
import StarRating from '../../components/StarRating';
import {
  HiOutlineSearch,
  HiOutlineLocationMarker,
  HiStar,
  HiOutlineShoppingBag,
} from 'react-icons/hi';

const UserStores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState({ name: '', address: '' });
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => {
    fetchStores();
  }, [search, sortBy, sortOrder]);

  const fetchStores = async () => {
    try {
      const params = { ...search, sortBy, sortOrder };
      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });
      const response = await storeAPI.getStores(params);
      setStores(response.data.stores);
    } catch {
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (storeId, rating, hasExisting) => {
    setSubmittingId(storeId);
    try {
      if (hasExisting) {
        await storeAPI.updateRating(storeId, { rating });
        toast.success('Rating updated!');
      } else {
        await storeAPI.submitRating(storeId, { rating });
        toast.success('Rating submitted!');
      }
      await fetchStores();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to submit rating';
      toast.error(msg);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearch((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Browse Stores</h1>
          <p className="page-subtitle">Discover and rate stores on the platform</p>
        </div>
      </div>

      {/* Clean Horizontal Toolbar */}
      <div className="stores-toolbar">
        <div className="table-search-input" style={{ flex: 1.2, minWidth: 220 }}>
          <HiOutlineSearch aria-hidden="true" />
          <input
            id="search-store-name"
            aria-label="Search by store name"
            placeholder="Search by store name..."
            name="name"
            value={search.name}
            onChange={handleSearchChange}
          />
        </div>

        <div className="table-search-input" style={{ flex: 1.2, minWidth: 220 }}>
          <HiOutlineSearch aria-hidden="true" />
          <input
            id="search-store-address"
            aria-label="Search by address"
            placeholder="Search by address..."
            name="address"
            value={search.address}
            onChange={handleSearchChange}
          />
        </div>

        <div className="table-filter-select" style={{ minWidth: 200 }}>
          <select
            id="sort-stores"
            aria-label="Sort stores"
            className="form-input"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field || '');
              setSortOrder(order || 'asc');
            }}
          >
            <option value="-">Sort By (Default)</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
            <option value="address-asc">Address: A to Z</option>
            <option value="address-desc">Address: Z to A</option>
            <option value="rating-desc">Rating: Highest First</option>
            <option value="rating-asc">Rating: Lowest First</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="stores-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="store-card">
              <div className="store-card-top">
                <div className="skeleton skeleton-title" style={{ width: '70%' }} />
                <div className="skeleton skeleton-text" style={{ width: '90%' }} />
                <div className="skeleton skeleton-text" style={{ width: '40%' }} />
              </div>
              <div className="skeleton skeleton-row" style={{ height: 48 }} />
            </div>
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <HiOutlineShoppingBag />
          </div>
          <div className="empty-state-title">No stores found</div>
          <p className="empty-state-description">
            Try adjusting your search filters or clear your search terms to explore available stores.
          </p>
        </div>
      ) : (
        <div className="stores-grid">
          {stores.map((store) => {
            const hasUserRating = !!store.userRating;
            const avgRating = store.averageRating ? parseFloat(store.averageRating).toFixed(1) : null;
            const isSubmittingThis = submittingId === store.id;

            return (
              <div key={store.id} className="store-card">
                <div className="store-card-top">
                  <div className="store-card-header">
                    <h2 className="store-name">{store.name}</h2>
                    <div className="overall-rating-badge" title="Overall Store Rating">
                      <span className="overall-rating-star"><HiStar /></span>
                      <span className="overall-rating-number">{avgRating || '—'}</span>
                    </div>
                  </div>

                  <div className="store-address">
                    <HiOutlineLocationMarker aria-hidden="true" />
                    <span>{store.address}</span>
                  </div>

                  <div className="store-rating-count">
                    {store.totalRatings} {store.totalRatings === 1 ? 'rating' : 'ratings'} overall
                  </div>
                </div>

                <div className="store-divider" />

                {/* Visually Distinct User Rating Section */}
                <div className="store-user-rating-section">
                  <div className="store-user-rating-label">
                    <span>{hasUserRating ? 'Your Rating' : 'Rate this store'}</span>
                    {hasUserRating && (
                      <span className="store-user-rating-status">
                        ✓ {store.userRating} / 5 stars
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StarRating
                      rating={store.userRating || 0}
                      onRate={(r) => handleRate(store.id, r, hasUserRating)}
                      size={22}
                    />
                    {isSubmittingThis && <span className="loading-spinner-inline" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserStores;
