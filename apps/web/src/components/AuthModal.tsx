import React, { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: { id: string; username: string; fullName?: string; role?: string }) => void;
  onClose?: () => void;
  isMandatory?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
  isMandatory = false
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Cloud Platform Architect');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister) {
      if (!fullName.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister
        ? { username: username.trim(), password, fullName: fullName.trim(), role }
        : { username: username.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Server response error (${res.status}). Verify server is running on port 3080.`);
      }

      if (!res.ok) {
        setError(data.error || (isRegister ? 'Registration failed' : 'Authentication failed'));
      } else {
        localStorage.setItem('tm_user', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('tm_token', data.token);
        }
        onSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Network error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  const handleSsoClick = async (provider: 'okta' | 'google' | 'github') => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`SSO failed (${res.status}). Verify backend on port 3080.`);
      }

      if (!res.ok || !data.user) {
        setError(data.error || `${provider.toUpperCase()} SSO sign-in failed`);
      } else {
        localStorage.setItem('tm_user', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('tm_token', data.token);
        }
        onSuccess(data.user);
      }
    } catch (e: any) {
      setError(e.message || `${provider} authentication failed`);
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div
      className="modal-backdrop"
      onClick={() => {
        if (!isMandatory && onClose) onClose();
      }}
    >
      <div
        className={`modal-card ${isRegister ? 'modal-card-wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/logo/only_logo.png"
              alt="TerraMind"
              style={{ width: '28px', height: '28px', objectFit: 'contain' }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <strong style={{ fontSize: '16px', letterSpacing: '-0.02em' }}>
              {isRegister ? 'Create TerraMind Account' : 'Welcome to TerraMind'}
            </strong>
          </div>
          {!isMandatory && onClose && (
            <button className="close-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error">{error}</div>}

          <div style={{ textAlign: 'center', margin: '4px 0 16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 4px', color: 'var(--text)' }}>
              {isRegister ? 'Create Your Architect Account' : 'Sign In to Workspace'}
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0, lineHeight: 1.4 }}>
              {isRegister
                ? 'Join TerraMind to orchestrate multi-cloud architecture with local AI agents'
                : 'Choose an SSO provider or enter your credentials to proceed'}
            </p>
          </div>

          {/* SSO Options: Contextualized label for Sign Up vs Sign In */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            {/* 1. Okta SSO */}
            <button
              type="button"
              className="sso-btn"
              onClick={() => handleSsoClick('okta')}
              disabled={loading}
              title={isRegister ? 'Sign up with Enterprise Okta SSO' : 'Sign in with Enterprise Okta SSO'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#007dc1">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4.5" fill="#fff" />
              </svg>
              <span>{isRegister ? 'Sign up with Okta SSO' : 'Sign in with Okta SSO'}</span>
            </button>

            {/* 2. Google SSO */}
            <button
              type="button"
              className="sso-btn"
              onClick={() => handleSsoClick('google')}
              disabled={loading}
              title={isRegister ? 'Sign up with Google' : 'Sign in with Google'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="#4285F4"
                />
              </svg>
              <span>{isRegister ? 'Sign up with Google' : 'Sign in with Google'}</span>
            </button>

            {/* 3. GitHub SSO */}
            <button
              type="button"
              className="sso-btn"
              onClick={() => handleSsoClick('github')}
              disabled={loading}
              title={isRegister ? 'Sign up with GitHub' : 'Sign in with GitHub'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              <span>{isRegister ? 'Sign up with GitHub' : 'Sign in with GitHub'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 14px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isRegister ? 'or register with credentials' : 'or with password'}
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          </div>

          {/* Form Fields: Tailored for Sign Up vs Sign In */}
          {isRegister ? (
            <>
              {/* Row 1: Full Name & Primary Role */}
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Primary Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="Cloud Platform Architect">Cloud Architect</option>
                    <option value="DevOps / SRE Engineer">DevOps / SRE Engineer</option>
                    <option value="Infrastructure Engineer">Infrastructure Engineer</option>
                    <option value="Cloud Security Engineer">Security & Compliance</option>
                    <option value="FinOps Specialist">FinOps Specialist</option>
                    <option value="Full-Stack Developer">Software Engineer</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Work Email / Username */}
              <div className="form-group">
                <label>Work Email or Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="alex@company.com"
                />
              </div>

              {/* Row 3: Password & Confirm Password */}
              <div className="form-row">
                <div className="form-group">
                  <label>Password <span style={{ fontSize: '11px', color: 'var(--muted)' }}>(min 6 chars)</span></label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      borderColor: passwordsMismatch ? '#ef4444' : passwordsMatch ? '#10b981' : undefined
                    }}
                  />
                </div>
              </div>

              {/* Live Password Match Feedback */}
              {passwordsMismatch && (
                <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '-6px', marginBottom: '10px' }}>
                  ✕ Passwords do not match
                </div>
              )}
              {passwordsMatch && (
                <div style={{ fontSize: '12px', color: '#10b981', marginTop: '-6px', marginBottom: '10px' }}>
                  ✓ Passwords match
                </div>
              )}

              {/* Local Security Assurance Callout */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(15, 23, 42, 0.04)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  color: 'var(--muted)',
                  marginBottom: '10px'
                }}
              >
                <span>🔒</span>
                <span>All credentials & project states are stored locally in your private SQLite database.</span>
              </div>
            </>
          ) : (
            <>
              {/* Sign In Fields: Quick & Simple */}
              <div className="form-group">
                <label>Username / Email</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="name@example.com"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading
              ? 'Processing...'
              : isRegister
              ? 'Create Account & Start Building ➔'
              : 'Log In with Password'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '13px', color: 'var(--muted)' }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              style={{ color: 'var(--text)', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
            >
              {isRegister ? 'Log in' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
