import React from 'react';

interface ThemePillToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
  className?: string;
}

export const ThemePillToggle: React.FC<ThemePillToggleProps> = ({
  theme,
  onToggle,
  className = ''
}) => {
  const isLight = theme === 'light';

  return (
    <div
      className={`theme-pill-toggle ${className}`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
      aria-label={`Current theme: ${theme}. Click to switch to ${isLight ? 'Dark' : 'Light'} Mode`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      style={{
        position: 'relative',
        width: '32px',
        height: '64px',
        borderRadius: '9999px',
        background: isLight ? '#2563eb' : '#1e293b',
        border: isLight ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: isLight
          ? '0 2px 8px rgba(37, 99, 235, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.25)'
          : '0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.05)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '3px',
        userSelect: 'none',
        transition: 'background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
        flexShrink: 0
      }}
    >
      {/* Sliding Active White/Light Indicator Chip */}
      <div
        style={{
          position: 'absolute',
          top: '3px',
          left: '3px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: '#ffffff',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.22)',
          transform: isLight ? 'translateY(0px)' : 'translateY(32px)',
          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Sun Icon (Top) */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isLight ? '#2563eb' : 'rgba(255, 255, 255, 0.45)',
          transition: 'color 0.25s ease'
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M4.93 4.93l1.41 1.41" />
          <path d="M17.66 17.66l1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="M6.34 17.66l-1.41 1.41" />
          <path d="M19.07 4.93l-1.41 1.41" />
        </svg>
      </div>

      {/* Moon Icon (Bottom) */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: !isLight ? '#0f172a' : 'rgba(255, 255, 255, 0.65)',
          transition: 'color 0.25s ease'
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </div>
    </div>
  );
};
