import React from 'react';
import { ThemePillToggle } from './ThemePillToggle';

export type RailTab = 'projects' | 'chats' | 'agents' | 'audit' | 'settings';

interface PrimaryRailProps {
  activeTab: RailTab;
  onSelectTab: (tab: RailTab) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  currentUser?: { username: string } | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onNewChat: () => void;
}

export const PrimaryRail: React.FC<PrimaryRailProps> = ({
  activeTab,
  onSelectTab,
  theme,
  onToggleTheme,
  currentUser,
  onOpenAuth,
  onLogout,
  onNewChat
}) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const navItems: Array<{ id: RailTab; label: string; icon: React.ReactNode }> = [
    {
      id: 'projects',
      label: 'Workspaces & Projects',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    },
    {
      id: 'chats',
      label: 'Conversations & History',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    {
      id: 'agents',
      label: 'AI DevOps Architects',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
          <rect x="4" y="8" width="16" height="12" rx="3" />
          <circle cx="9" cy="14" r="1.5" fill="currentColor" />
          <circle cx="15" cy="14" r="1.5" fill="currentColor" />
          <path d="M9 18h6" />
        </svg>
      )
    },
    {
      id: 'audit',
      label: 'One-Click Fix & Validate',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings & Cloud Engines',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    }
  ];

  return (
    <nav className="primary-rail" aria-label="Main Navigation">
      {/* Top: Brand Logo */}
      <div className="rail-top">
        <button
          type="button"
          className="rail-logo-btn"
          onClick={() => {
            onSelectTab('chats');
            onNewChat();
          }}
          title="TerraMind Home (New Architecture Session)"
        >
          <img
            src="/logo/logo.svg"
            alt="TerraMind Logo"
            className="rail-logo-img"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo/only_logo.png';
            }}
          />
        </button>
      </div>

      {/* Middle: Vertical Navigation Stack */}
      <div className="rail-menu">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <div key={item.id} className="rail-item-wrapper">
              {/* Active Blue Indicator Pill */}
              {isActive && <div className="rail-active-pill" />}
              <button
                type="button"
                className={`rail-icon-btn ${isActive ? 'active' : ''}`}
                onClick={() => onSelectTab(item.id)}
                title={item.label}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.icon}
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom: Profile Avatar & Vertical Dark Mode Pill */}
      <div className="rail-bottom">
        {/* User Avatar with Green Online Status Dot */}
        <div className="rail-avatar-container">
          <button
            type="button"
            className="rail-avatar-btn"
            onClick={() => {
              if (currentUser) {
                setShowUserMenu(!showUserMenu);
              } else {
                onOpenAuth();
              }
            }}
            title={currentUser ? `@${currentUser.username} (Account Options)` : 'Sign In / SSO'}
            aria-label="User Account"
          >
            <span className="rail-avatar-text">
              {currentUser?.username ? currentUser.username[0].toUpperCase() : 'U'}
            </span>
            <span className="rail-online-dot" />
          </button>

          {/* User popup menu */}
          {showUserMenu && currentUser && (
            <div
              className="rail-user-menu"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rail-user-menu-header">
                <strong>@{currentUser.username}</strong>
                <span className="rail-user-role">Cloud Architect</span>
              </div>
              <div className="rail-user-menu-divider" />
              <button
                type="button"
                className="rail-user-menu-item"
                onClick={() => {
                  setShowUserMenu(false);
                  onSelectTab('settings');
                }}
              >
                <span>⚙️</span> Workspace Settings
              </button>
              <button
                type="button"
                className="rail-user-menu-item danger"
                onClick={() => {
                  setShowUserMenu(false);
                  onLogout();
                }}
              >
                <span>🚪</span> Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Vertical Dark Mode Pill Toggle Switch */}
        <ThemePillToggle
          theme={theme}
          onToggle={onToggleTheme}
        />
      </div>
    </nav>
  );
};
