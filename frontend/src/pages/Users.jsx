import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  Search,
  Shield,
  User,
  CheckCircle2,
  Menu,
  ShieldCheck,
} from 'lucide-react';
import { getUsers } from '../services/api';

export default function Users({ onToggleSidebar }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getUsers().then((res) => {
      if (isMounted) {
        if (res.success && res.data) {
          setUsers(res.data);
        }
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: '#090d16',
        overflow: 'hidden',
      }}
    >
      {/* Top Bar */}
      <header
        style={{
          height: '60px',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#0d121f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation sidebar"
            className="mobile-hamburger"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UsersIcon size={18} style={{ color: '#8b5cf6' }} />
            <h1 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
              User Management
            </h1>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.725rem',
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: 'rgba(139, 92, 246, 0.12)',
            color: '#c4b5fd',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            fontWeight: 500,
          }}
        >
          Frontend RBAC Preparation
        </span>
      </header>

      {/* Main Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#f8fafc',
                letterSpacing: '-0.02em',
                marginBottom: '4px',
              }}
            >
              System Users & Roles
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
              Institutional user roles defining access to chatbot interactions and administrative document controls.
            </p>
          </div>

          {/* Search bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#111726',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '8px 14px',
              marginBottom: '20px',
              maxWidth: '480px',
            }}
          >
            <Search size={16} style={{ color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search users by name, email, department, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#f8fafc',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Users Table */}
          <div
            style={{
              backgroundColor: '#111726',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div
              className="table-header-row"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(220px, 1.8fr) minmax(200px, 1.5fr) 140px 100px 100px',
                padding: '12px 18px',
                backgroundColor: '#0d121f',
                borderBottom: '1px solid #1e293b',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <div>User</div>
              <div>Department</div>
              <div>Role</div>
              <div>Status</div>
              <div>Joined</div>
            </div>

            {isLoading ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                Loading registered users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                No matching users found.
              </div>
            ) : (
              filteredUsers.map((u, i) => (
                <div
                  key={u.id || i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(220px, 1.8fr) minmax(200px, 1.5fr) 140px 100px 100px',
                    padding: '14px 18px',
                    borderBottom: i === filteredUsers.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: u.role === 'ADMIN' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: u.role === 'ADMIN' ? '#a78bfa' : '#60a5fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f8fafc' }}>
                        {u.name}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                        {u.email}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>
                    {u.department}
                  </div>

                  <div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.725rem',
                        fontWeight: 600,
                        backgroundColor:
                          u.role === 'ADMIN' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                        color: u.role === 'ADMIN' ? '#c4b5fd' : '#93c5fd',
                        border:
                          u.role === 'ADMIN'
                            ? '1px solid rgba(139, 92, 246, 0.3)'
                            : '1px solid rgba(59, 130, 246, 0.25)',
                      }}
                    >
                      {u.role === 'ADMIN' ? <ShieldCheck size={12} /> : <User size={12} />}
                      <span>{u.role}</span>
                    </span>
                  </div>

                  <div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.725rem',
                        color: '#34d399',
                      }}
                    >
                      <CheckCircle2 size={12} />
                      <span>{u.status}</span>
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {u.createdAt}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
