import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  FileText,
  Settings,
  Plus,
  User,
  GraduationCap,
  X,
  Clock,
  LayoutDashboard,
  Users,
  BarChart3,
  Shield,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({
  isOpen,
  onClose,
  onNewChat,
  chatSessions = [],
  currentSessionId,
  onSelectSession,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, isAdmin, isStudent, isAuthenticated, logout } = useAuth();

  const handleNewChatClick = () => {
    onNewChat();
    if (location.pathname !== '/') {
      navigate('/');
    }
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />

      <aside
        style={{
          width: '260px',
          minWidth: '260px',
          height: '100%',
          backgroundColor: '#0d121f',
          borderRight: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transition: 'transform 0.25s ease',
        }}
        className={`app-sidebar ${isOpen ? 'open' : ''}`}
      >
        {/* Top Header / Project Logo */}
        <div
          style={{
            padding: '18px 16px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: isAdmin ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                border: isAdmin
                  ? '1px solid rgba(139, 92, 246, 0.35)'
                  : '1px solid rgba(59, 130, 246, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isAdmin ? '#a78bfa' : '#3b82f6',
              }}
            >
              {isAdmin ? <ShieldCheck size={20} /> : <GraduationCap size={20} />}
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  color: '#f8fafc',
                  letterSpacing: '-0.01em',
                }}
              >
                Adaptive RAG
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#64748b',
                  letterSpacing: '0.02em',
                }}
              >
                {isAdmin ? 'Admin Console' : 'College Chatbot'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mobile-close-btn"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Action: Start New Chat */}
        <div style={{ padding: '14px 12px 6px 12px' }}>
          <button
            type="button"
            onClick={handleNewChatClick}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: isAdmin ? '#6d28d9' : '#1d4ed8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Navigation Section */}
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div
            style={{
              fontSize: '0.675rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#64748b',
              padding: '6px 10px 4px 10px',
            }}
          >
            {isAdmin ? 'Administration' : 'Portal Navigation'}
          </div>

          {/* ADMIN: Dashboard */}
          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={handleNavClick}
              end
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#f8fafc' : '#94a3b8',
                backgroundColor: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
              })}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </NavLink>
          )}

          {/* ADMIN: Approvals Queue */}
          {isAdmin && (
            <NavLink
              to="/admin/approvals"
              onClick={handleNavClick}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#f8fafc' : '#94a3b8',
                backgroundColor: isActive ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
              })}
            >
              <Clock size={16} />
              <span>Approval Queue</span>
            </NavLink>
          )}

          {/* Chatbot */}
          <NavLink
            to="/"
            onClick={handleNavClick}
            end
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#f8fafc' : '#94a3b8',
              backgroundColor: isActive
                ? isAdmin
                  ? 'rgba(139, 92, 246, 0.15)'
                  : 'rgba(59, 130, 246, 0.15)'
                : 'transparent',
              border: isActive
                ? isAdmin
                  ? '1px solid rgba(139, 92, 246, 0.3)'
                  : '1px solid rgba(59, 130, 246, 0.3)'
                : '1px solid transparent',
            })}
          >
            <MessageSquare size={16} />
            <span>Chatbot</span>
          </NavLink>

          {/* Documents */}
          <NavLink
            to="/documents"
            onClick={handleNavClick}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#f8fafc' : '#94a3b8',
              backgroundColor: isActive
                ? isAdmin
                  ? 'rgba(139, 92, 246, 0.15)'
                  : 'rgba(59, 130, 246, 0.15)'
                : 'transparent',
              border: isActive
                ? isAdmin
                  ? '1px solid rgba(139, 92, 246, 0.3)'
                  : '1px solid rgba(59, 130, 246, 0.3)'
                : '1px solid transparent',
            })}
          >
            <FileText size={16} />
            <span>{isAdmin ? 'Documents' : 'Knowledge Base'}</span>
          </NavLink>

          {/* ADMIN: Analytics */}
          {isAdmin && (
            <NavLink
              to="/admin/analytics"
              onClick={handleNavClick}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#f8fafc' : '#94a3b8',
                backgroundColor: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
              })}
            >
              <BarChart3 size={16} />
              <span>Hallucination Analytics</span>
            </NavLink>
          )}

          {/* ADMIN: Audit Logs */}
          {isAdmin && (
            <NavLink
              to="/admin/audit-logs"
              onClick={handleNavClick}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#f8fafc' : '#94a3b8',
                backgroundColor: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
              })}
            >
              <ShieldAlert size={16} />
              <span>Audit Trail</span>
            </NavLink>
          )}

          {/* ADMIN: Users */}
          {isAdmin && (
            <NavLink
              to="/admin/users"
              onClick={handleNavClick}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#f8fafc' : '#94a3b8',
                backgroundColor: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
              })}
            >
              <Users size={16} />
              <span>User Accounts</span>
            </NavLink>
          )}

          {/* Settings */}
          <NavLink
            to="/settings"
            onClick={handleNavClick}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#f8fafc' : '#94a3b8',
              backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
            })}
          >
            <Settings size={16} />
            <span>Settings</span>
          </NavLink>
        </div>

        {/* Conversations History List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px 10px',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: '0.675rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#64748b',
              padding: '4px 8px 8px 8px',
            }}
          >
            Recent Chats
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {chatSessions.map((session) => {
              const isSelected = session.id === currentSessionId;
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => {
                    onSelectSession(session.id);
                    if (location.pathname !== '/') navigate('/');
                    if (window.innerWidth < 768) onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    textAlign: 'left',
                    color: isSelected ? '#f8fafc' : '#94a3b8',
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <MessageSquare size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {session.title || 'Conversation'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom User / Profile Section */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid #1e293b',
            backgroundColor: '#0a0e18',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {isAuthenticated ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isAdmin ? 'rgba(139, 92, 246, 0.2)' : '#1e293b',
                    border: isAdmin
                      ? '1px solid rgba(139, 92, 246, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isAdmin ? '#c4b5fd' : '#94a3b8',
                    flexShrink: 0,
                  }}
                >
                  {isAdmin ? <Shield size={16} /> : <User size={16} />}
                </div>

                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      color: '#f8fafc',
                      lineHeight: '1.2',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user?.name || 'User'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.675rem',
                      color: '#64748b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user?.email}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Sign out of account"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#f87171';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
