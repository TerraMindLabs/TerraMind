import React, { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: { id: string; username: string }) => void;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onSuccess, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed');
      } else {
        localStorage.setItem('tm_user', JSON.stringify(data.user));
        onSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="brand-logo" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>TM</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {isRegister ? 'Create TerraMind Account' : 'Welcome to TerraMind'}
            </h3>
          </div>
          {onClose && (
            <button className="close-btn" onClick={onClose}>✕</button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error">{error}</div>}

          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.5rem' }}>
              {isRegister ? 'Sign Up' : 'Login'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Hey enter your details to {isRegister ? 'create an' : 'sign in to your'} account
            </p>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username/email"
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                outline: 'none',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                outline: 'none',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading} style={{
            width: '100%',
            padding: '0.75rem',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            {loading ? 'Authenticating...' : isRegister ? 'Sign Up' : 'Login In'}
          </button>

          <div style={{ textAlign: 'center', margin: '1rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>OR</div>

          <div className="sso-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <button type="button" className="sso-btn" style={{ padding: '0.6rem', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 500 }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="#4285F4"/></svg>
              Continue with Google
            </button>
            <button type="button" className="sso-btn" style={{ padding: '0.6rem', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 500 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text-primary)"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              Continue with GitHub
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              className="text-link"
              style={{ color: 'var(--primary)', background: 'transparent', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
            >
              {isRegister ? 'Sign In' : 'Signup Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
