import { useState, useEffect } from 'react';
import { storeOwnerAPI } from '../../services/api';
import toast from 'react-hot-toast';
import StarRating from '../../components/StarRating';
import {
  HiStar,
  HiOutlineUserGroup,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineShoppingBag,
  HiOutlineChatAlt2,
} from 'react-icons/hi';

const StoreOwnerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await storeOwnerAPI.getDashboard();
      setData(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load store overview');
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
    if (sortBy !== field) return <span className="sort-icon" aria-hidden="true">↕</span>;
    return (
      <span className="sort-icon" aria-hidden="true">
        {sortOrder === 'asc' ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
      </span>
    );
  };

  const getSortedRatings = () => {
    if (!data?.ratings) return [];
    const sorted = [...data.ratings];
    if (sortBy) {
      sorted.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];
        if (typeof valA === 'string') {
          return sortOrder === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
    }
    return sorted;
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <div className="skeleton skeleton-title" style={{ width: 220 }} />
            <div className="skeleton skeleton-text" style={{ width: 140 }} />
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 8 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-title" style={{ width: '40%' }} />
              <div className="skeleton skeleton-text" style={{ width: '60%' }} />
            </div>
          </div>
          <div className="stat-card">
            <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 8 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-title" style={{ width: '40%' }} />
              <div className="skeleton skeleton-text" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.store) {
    return (
      <div className="card empty-state" style={{ margin: '40px auto', maxWidth: 540 }}>
        <div className="empty-state-icon">
          <HiOutlineShoppingBag />
        </div>
        <div className="empty-state-title">No Store Assigned</div>
        <p className="empty-state-description">
          There is currently no store assigned to your account. Please contact a system administrator to link your store.
        </p>
      </div>
    );
  }

  const sortedRatings = getSortedRatings();
  const numericAvg = data.store.averageRating ? parseFloat(data.store.averageRating) : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Store Overview</h1>
          <p className="page-subtitle">{data.store.name} &bull; {data.store.address}</p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon amber" aria-hidden="true">
            <HiStar />
          </div>
          <div>
            <div className="stat-label">Average Rating</div>
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>{numericAvg ? numericAvg.toFixed(1) : '—'}</span>
              {numericAvg && (
                <StarRating rating={Math.round(numericAvg)} readonly size={18} />
              )}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon teal" aria-hidden="true">
            <HiOutlineUserGroup />
          </div>
          <div>
            <div className="stat-label">Total Reviews</div>
            <div className="stat-value">{data.store.totalRatings}</div>
          </div>
        </div>
      </div>

      {/* Ratings / Reviews Table */}
      <div className="table-wrapper">
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HiOutlineChatAlt2 style={{ fontSize: 18, color: 'var(--accent-teal)' }} />
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-main)' }}>
              Recent Customer Ratings
            </h2>
          </div>
          <span className="meta-text">{sortedRatings.length} submissions</span>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th
                  className={`sortable ${sortBy === 'userName' ? 'sorted' : ''}`}
                  onClick={() => handleSort('userName')}
                >
                  Customer {renderSortIndicator('userName')}
                </th>
                <th
                  className={`sortable ${sortBy === 'userEmail' ? 'sorted' : ''}`}
                  onClick={() => handleSort('userEmail')}
                >
                  Email {renderSortIndicator('userEmail')}
                </th>
                <th
                  className={`sortable ${sortBy === 'rating' ? 'sorted' : ''}`}
                  onClick={() => handleSort('rating')}
                >
                  Rating {renderSortIndicator('rating')}
                </th>
                <th
                  className={`sortable ${sortBy === 'submittedAt' ? 'sorted' : ''}`}
                  onClick={() => handleSort('submittedAt')}
                >
                  Submitted Date {renderSortIndicator('submittedAt')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRatings.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    <div className="empty-state">
                      <div className="empty-state-title">No customer ratings yet</div>
                      <p className="empty-state-description">
                        When customers submit ratings for your store, they will appear here in real-time.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedRatings.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.userName}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.userEmail}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <StarRating rating={r.rating} readonly size={16} />
                        <span style={{ fontWeight: 700, color: 'var(--star-rating)', fontSize: 13.5 }}>
                          {r.rating}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {new Date(r.submittedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StoreOwnerDashboard;
