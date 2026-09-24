import React, { useState, useEffect } from 'react';
import { Project } from './Sidebar';

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  username: string;
  role: 'owner' | 'editor' | 'viewer';
  added_at: string;
}

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  currentUserId?: string;
}

export const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  currentUserId: _currentUserId
}) => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchMembers = async () => {
    if (!project) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (e: any) {
      console.error('Failed to fetch members:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && project) {
      setError('');
      setSuccessMsg('');
      setUsername('');
      fetchMembers();
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/projects/${project.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), role })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to share project');
      }

      setSuccessMsg(`Successfully shared with @${username.trim()}!`);
      setUsername('');
      fetchMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to share project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberUsername: string) => {
    if (!confirm(`Remove @${memberUsername} from this workspace?`)) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/members/${memberId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        setSuccessMsg(`Removed @${memberUsername}`);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to remove member');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '24px',
          background: 'var(--bg)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div className="modal-header" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>{project.icon || '📁'}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>Share Workspace</h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted)' }}>
                {project.name}
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: 0 }}>
          {error && (
            <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '13px' }}>
              ⚠️ {error}
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px', fontSize: '13px' }}>
              ✓ {successMsg}
            </div>
          )}

          {/* Add member form */}
          <form onSubmit={handleShare} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Enter username (e.g. alex_dev)..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '13.5px'
              }}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '13px'
              }}
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={submitting || !username.trim()}
              className="submit-btn"
              style={{ width: 'auto', marginTop: 0, padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}
            >
              {submitting ? 'Adding...' : 'Invite'}
            </button>
          </form>

          {/* Members list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Workspace Collaborators ({members.length})
            </span>

            {loading ? (
              <div style={{ fontSize: '13px', color: 'var(--muted)', padding: '10px 0' }}>Loading members...</div>
            ) : members.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--muted)', padding: '10px 0', fontStyle: 'italic' }}>
                No external collaborators invited yet. Anyone you invite will share files, manifests, and cross-agent conversations in this project.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {members.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--hover)',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="av user-av" style={{ width: '26px', height: '26px', fontSize: '11px' }}>
                        {m.username[0]?.toUpperCase() || 'U'}
                      </span>
                      <span style={{ fontWeight: 500 }}>@{m.username}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: m.role === 'owner' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                          color: m.role === 'owner' ? '#3b82f6' : 'var(--muted)'
                        }}
                      >
                        {m.role}
                      </span>
                      {m.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(m.id, m.username)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--muted)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            padding: '2px 4px'
                          }}
                          title="Remove collaborator"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="cancel-btn" onClick={onClose} style={{ padding: '8px 20px', fontSize: '13px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
