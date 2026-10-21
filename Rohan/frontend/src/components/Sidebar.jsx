import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineUserGroup,
  HiOutlineShoppingBag,
  HiOutlineLockClosed,
  HiOutlineLogout,
  HiOutlineChartBar,
  HiOutlineX,
  HiStar,
} from 'react-icons/hi';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    if (onClose) onClose();
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'System Admin';
      case 'user': return 'Normal User';
      case 'store_owner': return 'Store Owner';
      default: return role;
    }
  };

  const adminLinks = [
    { to: '/admin', icon: <HiOutlineHome />, label: 'Dashboard', end: true },
    { to: '/admin/users', icon: <HiOutlineUserGroup />, label: 'Users' },
    { to: '/admin/stores', icon: <HiOutlineShoppingBag />, label: 'Stores' },
  ];

  const userLinks = [
    { to: '/stores', icon: <HiOutlineShoppingBag />, label: 'Browse Stores', end: true },
  ];

  const ownerLinks = [
    { to: '/owner', icon: <HiOutlineChartBar />, label: 'Dashboard', end: true },
  ];

  const links =
    user?.role === 'admin' ? adminLinks :
    user?.role === 'store_owner' ? ownerLinks : userLinks;

  const passwordPath =
    user?.role === 'admin' ? '/admin/password' :
    user?.role === 'store_owner' ? '/owner/password' :
    '/password';

  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`} aria-label="Main Navigation">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <HiStar />
            </div>
            <span className="sidebar-logo-text">StoreRate</span>
            <span className="sidebar-logo-tag">Pro</span>
          </div>
          <button
            type="button"
            className="sidebar-close-mobile"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <HiOutlineX />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu</div>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}

          <div className="sidebar-section-label">Account</div>
          <NavLink
            to={passwordPath}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <HiOutlineLockClosed />
            <span>Change Password</span>
          </NavLink>
          <button
            type="button"
            className="sidebar-link"
            onClick={handleLogout}
            style={{ width: '100%', textAlign: 'left' }}
          >
            <HiOutlineLogout />
            <span>Logout</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar" aria-hidden="true">
              {getInitials(user?.name)}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name" title={user?.name}>{user?.name}</div>
              <div className="sidebar-user-role">{getRoleLabel(user?.role)}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
