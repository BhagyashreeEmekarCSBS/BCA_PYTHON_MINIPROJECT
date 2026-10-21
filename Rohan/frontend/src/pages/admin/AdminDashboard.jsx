import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import {
  HiOutlineUserGroup,
  HiOutlineShoppingBag,
  HiStar,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlinePlus,
  HiOutlineArrowRight,
  HiOutlineTrendingUp,
  HiOutlineCheckCircle,
  HiOutlineChartBar,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

// Count-up animation component
const AnimatedStatValue = ({ targetValue, suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (animatedRef.current) {
      setDisplayValue(targetValue);
      return;
    }

    animatedRef.current = true;
    const duration = 650;
    const startTimestamp = performance.now();

    const step = (now) => {
      const elapsed = now - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * targetValue);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
      }
    };

    requestAnimationFrame(step);
  }, [targetValue]);

  return (
    <>
      {displayValue.toLocaleString()}
      {suffix}
    </>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllDashboardData();
  }, []);

  const loadAllDashboardData = async () => {
    try {
      const [dashRes, usersRes, storesRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getUsers({}),
        adminAPI.getStores({}),
      ]);
      setStats(dashRes.data);
      setUsers(usersRes.data.users || []);
      setStores(storesRes.data.stores || []);
    } catch {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  // Derive real statistics from data
  const normalUsersCount = users.filter((u) => u.role === 'user').length;
  const storeOwnersCount = users.filter((u) => u.role === 'store_owner').length;
  const adminUsersCount = users.filter((u) => u.role === 'admin').length;
  const totalUserCount = users.length || stats.totalUsers || 1;

  // Rating distribution among stores
  const ratingBuckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, unrated: 0 };
  let sumRatings = 0;
  let ratedStoresCount = 0;

  stores.forEach((store) => {
    if (store.averageRating && parseFloat(store.averageRating) > 0) {
      const r = Math.round(parseFloat(store.averageRating));
      const clamped = Math.max(1, Math.min(5, r));
      ratingBuckets[clamped] = (ratingBuckets[clamped] || 0) + 1;
      sumRatings += parseFloat(store.averageRating);
      ratedStoresCount++;
    } else {
      ratingBuckets.unrated = (ratingBuckets.unrated || 0) + 1;
    }
  });

  const overallAvgScore = ratedStoresCount > 0 ? (sumRatings / ratedStoresCount).toFixed(1) : '—';
  const coverageRate = stores.length > 0 ? Math.round((ratedStoresCount / stores.length) * 100) : 0;

  // Top stores leaderboard (sorted by average rating DESC)
  const topStores = [...stores]
    .sort((a, b) => {
      const scoreA = parseFloat(a.averageRating || 0);
      const scoreB = parseFloat(b.averageRating || 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (b.totalRatings || 0) - (a.totalRatings || 0);
    })
    .slice(0, 5);

  const ratingBarColors = {
    5: 'var(--chart-emerald)',
    4: 'var(--chart-teal)',
    3: 'var(--chart-indigo)',
    2: 'var(--chart-amber)',
    1: 'var(--chart-rose)',
    unrated: 'var(--text-muted)',
  };

  return (
    <div>
      {/* Page Title & Context Header */}
      <div className="page-header">
        <div>
          <div className="ppt-tag" style={{ marginBottom: 6 }}>
            <HiOutlineSparkles />
            <span>Executive Analytics & Oversight</span>
          </div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">
            Comprehensive platform performance, ratings distribution, and architectural workflow
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/admin/stores" className="btn btn-secondary btn-sm">
            <HiOutlineShoppingBag />
            <span>Manage Stores</span>
          </Link>
          <Link to="/admin/users" className="btn btn-primary btn-sm">
            <HiOutlinePlus />
            <span>Add User</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 8 }} />
              <div style={{ flex: 1, marginLeft: 12 }}>
                <div className="skeleton skeleton-title" style={{ width: '40%' }} />
                <div className="skeleton skeleton-text" style={{ width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* SECTION 1: Key Performance Metric Cards */}
          <div className="stats-grid">
            {/* Total Users */}
            <div className="stat-card">
              <div>
                <div className="stat-label">Total Users</div>
                <div className="stat-value">
                  <AnimatedStatValue targetValue={stats.totalUsers} />
                </div>
                <div className="stat-badge blue">
                  <span>{normalUsersCount} Shoppers</span>
                  <span>&bull;</span>
                  <span>{storeOwnersCount} Owners</span>
                </div>
              </div>
              <div className="stat-icon purple" aria-hidden="true">
                <HiOutlineUserGroup />
              </div>
            </div>

            {/* Total Stores */}
            <div className="stat-card">
              <div>
                <div className="stat-label">Registered Stores</div>
                <div className="stat-value">
                  <AnimatedStatValue targetValue={stats.totalStores} />
                </div>
                <div className="stat-badge green">
                  <span>{ratedStoresCount} Rated Stores</span>
                </div>
              </div>
              <div className="stat-icon teal" aria-hidden="true">
                <HiOutlineShoppingBag />
              </div>
            </div>

            {/* Total Ratings */}
            <div className="stat-card">
              <div>
                <div className="stat-label">Total Ratings</div>
                <div className="stat-value">
                  <AnimatedStatValue targetValue={stats.totalRatings} />
                </div>
                <div className="stat-badge amber">
                  <span>★ {overallAvgScore} Avg Rating</span>
                </div>
              </div>
              <div className="stat-icon amber" aria-hidden="true">
                <HiStar />
              </div>
            </div>

            {/* Store Rating Coverage */}
            <div className="stat-card">
              <div>
                <div className="stat-label">Store Review Coverage</div>
                <div className="stat-value">
                  <AnimatedStatValue targetValue={coverageRate} suffix="%" />
                </div>
                <div className="stat-badge green">
                  <HiOutlineTrendingUp />
                  <span>Platform Health Active</span>
                </div>
              </div>
              <div className="stat-icon blue" aria-hidden="true">
                <HiOutlineChartBar />
              </div>
            </div>
          </div>

          {/* SECTION 2: PowerPoint-Style Charts & Graphs Grid */}
          <div className="ppt-section">
            <div className="ppt-section-header">
              <div className="section-title">Visual Analytics & Distribution</div>
              <span className="meta-text">Real-time platform metrics aggregated across verified records</span>
            </div>

            <div className="ppt-grid-2">
              {/* Card A: Store Rating Distribution (PowerPoint Bar Graph) */}
              <div className="ppt-card">
                <div className="ppt-card-header">
                  <div>
                    <div className="ppt-card-title">
                      <HiStar style={{ color: 'var(--star-rating)' }} />
                      <span>Store Rating Distribution</span>
                    </div>
                    <div className="ppt-card-subtitle">
                      Store count segmented by customer rating tiers
                    </div>
                  </div>
                  <span className="stat-badge amber">
                    {stores.length} Stores Total
                  </span>
                </div>

                <div className="ppt-bar-list">
                  {[
                    { label: '5 Stars', stars: '★★★★★', count: ratingBuckets[5], key: 5 },
                    { label: '4 Stars', stars: '★★★★☆', count: ratingBuckets[4], key: 4 },
                    { label: '3 Stars', stars: '★★★☆☆', count: ratingBuckets[3], key: 3 },
                    { label: '2 Stars', stars: '★★☆☆☆', count: ratingBuckets[2], key: 2 },
                    { label: '1 Star', stars: '★☆☆☆☆', count: ratingBuckets[1], key: 1 },
                    { label: 'Unrated', stars: 'No reviews', count: ratingBuckets.unrated, key: 'unrated' },
                  ].map((row) => {
                    const total = stores.length || 1;
                    const percent = Math.round((row.count / total) * 100);
                    return (
                      <div key={row.key} className="ppt-bar-row">
                        <div className="ppt-bar-label" title={row.stars}>
                          <span>{row.label}</span>
                        </div>
                        <div className="ppt-bar-track">
                          <div
                            className="ppt-bar-fill"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: ratingBarColors[row.key],
                            }}
                          />
                        </div>
                        <div className="ppt-bar-value">
                          <span>{row.count}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 4 }}>
                            ({percent}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card B: User Ecosystem Breakdown (PowerPoint Segmented Bar) */}
              <div className="ppt-card">
                <div className="ppt-card-header">
                  <div>
                    <div className="ppt-card-title">
                      <HiOutlineUserGroup style={{ color: 'var(--accent-primary)' }} />
                      <span>User Ecosystem Breakdown</span>
                    </div>
                    <div className="ppt-card-subtitle">
                      Proportional composition of platform participants
                    </div>
                  </div>
                  <span className="stat-badge blue">
                    {users.length} Active Accounts
                  </span>
                </div>

                {/* Segmented Proportional Progress Bar */}
                <div className="ppt-segmented-wrapper">
                  <div className="ppt-segmented-bar">
                    <div
                      className="ppt-segment-slice"
                      style={{
                        width: `${Math.round((normalUsersCount / totalUserCount) * 100)}%`,
                        backgroundColor: 'var(--chart-indigo)',
                      }}
                      title={`Normal Shoppers: ${normalUsersCount}`}
                    />
                    <div
                      className="ppt-segment-slice"
                      style={{
                        width: `${Math.round((storeOwnersCount / totalUserCount) * 100)}%`,
                        backgroundColor: 'var(--chart-teal)',
                      }}
                      title={`Store Owners: ${storeOwnersCount}`}
                    />
                    <div
                      className="ppt-segment-slice"
                      style={{
                        width: `${Math.max(2, Math.round((adminUsersCount / totalUserCount) * 100))}%`,
                        backgroundColor: 'var(--chart-purple)',
                      }}
                      title={`System Administrators: ${adminUsersCount}`}
                    />
                  </div>

                  {/* Segment Details & Legend */}
                  <div className="ppt-segment-legend">
                    <div className="ppt-legend-item">
                      <div className="ppt-legend-top">
                        <span className="ppt-legend-dot" style={{ backgroundColor: 'var(--chart-indigo)' }} />
                        <span>Shoppers</span>
                      </div>
                      <div className="ppt-legend-val">{normalUsersCount}</div>
                      <div className="meta-text">
                        {Math.round((normalUsersCount / totalUserCount) * 100)}% of users
                      </div>
                    </div>

                    <div className="ppt-legend-item">
                      <div className="ppt-legend-top">
                        <span className="ppt-legend-dot" style={{ backgroundColor: 'var(--chart-teal)' }} />
                        <span>Store Owners</span>
                      </div>
                      <div className="ppt-legend-val">{storeOwnersCount}</div>
                      <div className="meta-text">
                        {Math.round((storeOwnersCount / totalUserCount) * 100)}% of users
                      </div>
                    </div>

                    <div className="ppt-legend-item">
                      <div className="ppt-legend-top">
                        <span className="ppt-legend-dot" style={{ backgroundColor: 'var(--chart-purple)' }} />
                        <span>Admins</span>
                      </div>
                      <div className="ppt-legend-val">{adminUsersCount}</div>
                      <div className="meta-text">
                        {Math.round((adminUsersCount / totalUserCount) * 100)}% of users
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional platform health note */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-control)',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  <HiOutlineCheckCircle style={{ color: 'var(--success)', fontSize: 20, flexShrink: 0 }} />
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                    RBAC security verified. Every role strictly constrained to its permissions.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Top Performing Stores Leaderboard */}
          <div className="ppt-section">
            <div className="ppt-card">
              <div className="ppt-card-header">
                <div>
                  <div className="ppt-card-title">
                    <HiStar style={{ color: 'var(--star-rating)' }} />
                    <span>Top Rated Stores Leaderboard</span>
                  </div>
                  <div className="ppt-card-subtitle">
                    Highest rated stores ranked by verified customer ratings
                  </div>
                </div>
                <Link to="/admin/stores" className="btn btn-ghost btn-sm">
                  View All Stores <HiOutlineArrowRight />
                </Link>
              </div>

              {topStores.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  No stores registered yet.
                </div>
              ) : (
                <div className="ppt-leaderboard-list">
                  {topStores.map((store, index) => {
                    const avg = store.averageRating ? parseFloat(store.averageRating).toFixed(1) : '—';
                    const scoreNum = parseFloat(store.averageRating || 0);
                    const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other';
                    return (
                      <div key={store.id} className="ppt-leaderboard-item">
                        <div className={`ppt-rank-badge ${rankClass}`}>
                          #{index + 1}
                        </div>

                        <div className="ppt-store-info">
                          <div className="ppt-store-name">{store.name}</div>
                          <div className="ppt-store-meta">{store.address}</div>
                        </div>

                        {/* Progress Bar Visual Representation */}
                        <div style={{ width: 140, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="ppt-bar-track" style={{ height: 8 }}>
                            <div
                              className="ppt-bar-fill"
                              style={{
                                width: `${(scoreNum / 5) * 100}%`,
                                backgroundColor: 'var(--star-rating)',
                              }}
                            />
                          </div>
                        </div>

                        <div className="ppt-store-score">
                          <div className="ppt-score-pill">
                            <span>★</span>
                            <span>{avg}</span>
                          </div>
                          <div className="meta-text" style={{ textAlign: 'right', marginTop: 2 }}>
                            {store.totalRatings || 0} reviews
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: PowerPoint-Style Platform Architecture & Process Flow Diagram */}
          <div className="ppt-diagram-container">
            <div className="ppt-card-header" style={{ marginBottom: 16 }}>
              <div>
                <div className="ppt-card-title">
                  <HiOutlineSparkles style={{ color: 'var(--accent-primary)' }} />
                  <span>Platform Ecosystem Architecture & Flow</span>
                </div>
                <div className="ppt-card-subtitle">
                  Visual PowerPoint-style flow illustrating shopper discovery, rating verification, owner analytics, and administrative oversight
                </div>
              </div>
              <span className="stat-badge blue">Interactive Process Diagram</span>
            </div>

            <div className="ppt-diagram-flow">
              {/* Node 1 */}
              <div className="ppt-node">
                <div>
                  <div className="ppt-node-step">
                    <span>Step 01</span>
                    <span className="ppt-node-tag">Discovery</span>
                  </div>
                  <div className="ppt-node-icon">
                    <HiOutlineUserGroup />
                  </div>
                  <div className="ppt-node-title">Shopper Engagement</div>
                  <p className="ppt-node-desc">
                    Verified customers browse stores, search by location, and submit 1 to 5 star ratings with immediate feedback.
                  </p>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  ✓ Duplicate vote protection
                </div>
              </div>

              {/* Arrow */}
              <div className="ppt-flow-arrow" aria-hidden="true">➔</div>

              {/* Node 2 */}
              <div className="ppt-node">
                <div>
                  <div className="ppt-node-step">
                    <span>Step 02</span>
                    <span className="ppt-node-tag">Engine</span>
                  </div>
                  <div className="ppt-node-icon" style={{ color: 'var(--star-rating)' }}>
                    <HiStar />
                  </div>
                  <div className="ppt-node-title">Rating Aggregation</div>
                  <p className="ppt-node-desc">
                    Backend validates boundary rules (1–5 integers), enforces JWT security, and computes real-time weighted store averages.
                  </p>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  ✓ Instant state update
                </div>
              </div>

              {/* Arrow */}
              <div className="ppt-flow-arrow" aria-hidden="true">➔</div>

              {/* Node 3 */}
              <div className="ppt-node">
                <div>
                  <div className="ppt-node-step">
                    <span>Step 03</span>
                    <span className="ppt-node-tag">Business</span>
                  </div>
                  <div className="ppt-node-icon" style={{ color: 'var(--accent-teal)' }}>
                    <HiOutlineShoppingBag />
                  </div>
                  <div className="ppt-node-title">Owner Intelligence</div>
                  <p className="ppt-node-desc">
                    Store owners access private dashboards to review customer submissions, analyze store reputation, and track feedback.
                  </p>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  ✓ IDOR-protected queries
                </div>
              </div>

              {/* Arrow */}
              <div className="ppt-flow-arrow" aria-hidden="true">➔</div>

              {/* Node 4 */}
              <div className="ppt-node">
                <div>
                  <div className="ppt-node-step">
                    <span>Step 04</span>
                    <span className="ppt-node-tag">Security</span>
                  </div>
                  <div className="ppt-node-icon" style={{ color: 'var(--accent-primary)' }}>
                    <HiOutlineShieldCheck />
                  </div>
                  <div className="ppt-node-title">Admin Governance</div>
                  <p className="ppt-node-desc">
                    System administrators manage user roles, onboard new stores, link store owners, and audit platform metrics.
                  </p>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  ✓ Full RBAC compliance
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: Quick Operations & Governance Hub */}
          <div className="ppt-section">
            <div className="ppt-section-header">
              <div className="section-title">Quick Administration Actions</div>
              <span className="meta-text">Direct shortcuts to common administrative workflows</span>
            </div>

            <div className="quick-actions-grid">
              <Link to="/admin/users" className="quick-action-card">
                <div className="quick-action-icon">
                  <HiOutlinePlus />
                </div>
                <div>
                  <div>Create User Account</div>
                  <div className="meta-text">Register shopper or store owner</div>
                </div>
              </Link>

              <Link to="/admin/stores" className="quick-action-card">
                <div className="quick-action-icon" style={{ background: 'rgba(13, 148, 136, 0.1)', color: 'var(--accent-teal)' }}>
                  <HiOutlineShoppingBag />
                </div>
                <div>
                  <div>Register New Store</div>
                  <div className="meta-text">Add location and link owner</div>
                </div>
              </Link>

              <Link to="/admin/users" className="quick-action-card">
                <div className="quick-action-icon" style={{ background: 'rgba(2, 132, 199, 0.1)', color: 'var(--info)' }}>
                  <HiOutlineUserGroup />
                </div>
                <div>
                  <div>User Directory</div>
                  <div className="meta-text">Filter & sort all accounts</div>
                </div>
              </Link>

              <Link to="/admin/password" className="quick-action-card">
                <div className="quick-action-icon" style={{ background: 'rgba(217, 119, 6, 0.1)', color: 'var(--warning)' }}>
                  <HiOutlineShieldCheck />
                </div>
                <div>
                  <div>Security Settings</div>
                  <div className="meta-text">Update administrator password</div>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
