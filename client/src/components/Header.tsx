import React, { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Sparkles, PlusCircle, LayoutDashboard, Compass, Github, LogOut, User, LogIn } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StudentSwitcher from './StudentSwitcher';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isLive, setIsLive] = useState<boolean>(true);

  useEffect(() => {
    apiClient.getHealth()
      .then(() => setIsLive(true))
      .catch(() => setIsLive(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="header-brand" aria-label="AI Career Coach Home">
          <div className="brand-icon">
            <Sparkles size={20} />
          </div>
          <span style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>AI Career Coach</span>
        </Link>

        <nav className="header-nav" aria-label="Main Navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Compass size={16} />
              <span>Overview</span>
            </span>
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </span>
          </NavLink>

          <NavLink
            to="/new"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PlusCircle size={16} />
              <span>New Analysis</span>
            </span>
          </NavLink>

          {/* Engine Status Indicator */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              backgroundColor: isLive ? '#f0fdf4' : '#fffbeb',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: isLive ? '#15803d' : '#b45309',
              border: `1px solid ${isLive ? '#bbf7d0' : '#fde68a'}`,
            }}
            title={isLive ? 'Backend server connected' : 'Connecting to backend...'}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isLive ? '#22c55e' : '#f59e0b',
              }}
            />
            <span>{isLive ? 'Engine active' : 'Connecting...'}</span>
          </div>

          {/* Auth Controls */}
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Profile & Switcher */}
              <StudentSwitcher />

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-ghost btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: '#64748b',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
                title="Log out of account"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link
                to="/login"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </Link>
              <Link
                to="/signup"
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.8rem', padding: '6px 14px', backgroundColor: '#4f46e5' }}
              >
                <span>Get Started</span>
              </Link>
            </div>
          )}

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
            aria-label="GitHub Repository"
            title="GitHub"
          >
            <Github size={18} />
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
