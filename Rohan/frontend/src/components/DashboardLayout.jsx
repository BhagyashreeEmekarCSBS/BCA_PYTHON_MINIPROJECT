import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HiOutlineMenuAlt2, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const getPageInfo = () => {
    const path = location.pathname;
    if (path === '/admin') return { title: 'Admin Overview', portal: 'Admin Portal' };
    if (path === '/admin/users') return { title: 'User Management', portal: 'Admin Portal' };
    if (path === '/admin/stores') return { title: 'Store Management', portal: 'Admin Portal' };
    if (path === '/admin/password' || path === '/owner/password' || path === '/password')
      return { title: 'Account Settings', portal: 'Security' };
    if (path === '/stores') return { title: 'Store Directory', portal: 'Store Explorer' };
    if (path === '/owner') return { title: 'Store Performance', portal: 'Owner Portal' };
    return { title: 'StoreRate Platform', portal: 'Dashboard' };
  };

  const pageInfo = getPageInfo();

  return (
    <div className="app-layout">
      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="main-wrapper">
        <header className="top-bar">
          <div className="top-bar-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open mobile navigation"
            >
              <HiOutlineMenuAlt2 />
            </button>
            <div className="top-bar-title">
              <span style={{ color: 'var(--text-muted)' }}>{pageInfo.portal}</span>
              <span style={{ color: 'var(--border-color)' }}>/</span>
              <span>{pageInfo.title}</span>
            </div>
          </div>

          <div className="top-bar-right">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark Navy' : 'Off-White'} mode`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px' }}
            >
              {theme === 'light' ? <HiOutlineMoon style={{ fontSize: 16 }} /> : <HiOutlineSun style={{ fontSize: 16 }} />}
              <span style={{ fontSize: 12 }}>{theme === 'light' ? 'Dark' : 'Off-White'}</span>
            </button>

            <div className="user-status-pill">
              <span className="status-dot" aria-hidden="true" />
              <span>{user?.name ? user.name.split(' ')[0] : 'User'}</span>
            </div>
          </div>
        </header>

        <main className="main-content page-fade-in" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
