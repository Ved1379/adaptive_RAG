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
  ArrowLeftRight,
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
  const { user, role, isAdmin, isStudent, toggleRole } = useAuth();

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

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />

      <aside
        style={{
          width: '250px',
          minWidth: '250px',
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Adaptive RAG
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#94a3b8',
                  fontWeight: 500,
                }}
              >
                {isAdmin ? 'Admin Console' : 'College Assistant'}
              </div>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="mobile-close-btn"
            style={{
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

        {/* Action Button: + New Chat */}
        <div style={{ padding: '12px 14px 6px 14px' }}>
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
              border: isAdmin
                ? '1px solid rgba(139, 92, 246, 0.4)'
                : '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isAdmin ? '#7c3aed' : '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isAdmin ? '#6d28d9' : '#1d4ed8';
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Navigation Section - Role Based */}
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
            {isAdmin ? 'Admin Navigation' : 'Navigation'}
          </div>

          {/* ADMIN ONLY: Dashboard */}
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
                transition: 'all 0.15s ease',
              })}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </NavLink>
          )}

          {/* BOTH: Chats */}
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
              transition: 'all 0.15s ease',
            })}
          >
            <MessageSquare size={16} />
            <span>Chats</span>
          </NavLink>

          {/* BOTH: Documents */}
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
              transition: 'all 0.15s ease',
            })}
          >
            <FileText size={16} />
            <span>Documents</span>
          </NavLink>

          {/* ADMIN ONLY: Users */}
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
                transition: 'all 0.15s ease',
              })}
            >
              <Users size={16} />
              <span>Users</span>
            </NavLink>
          )}

          {/* ADMIN ONLY: Analytics */}
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
                transition: 'all 0.15s ease',
              })}
            >
              <BarChart3 size={16} />
              <span>Analytics</span>
            </NavLink>
          )}

          {/* BOTH: Settings */}
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
              transition: 'all 0.15s ease',
            })}
          >
            <Settings size={16} />
            <span>Settings</span>
          </NavLink>
        </div>

        {/* Chat History Section */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 10px',
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
              padding: '6px 10px 4px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>Chat History</span>
            <Clock size={12} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
            {chatSessions && chatSessions.length > 0 ? (
              chatSessions.map((session) => {
                const isSelected = session.id === currentSessionId && location.pathname === '/';
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
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      textAlign: 'left',
                      color: isSelected ? '#f8fafc' : '#94a3b8',
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      transition: 'all 0.15s ease',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.color = '#e2e8f0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                      }
                    }}
                  >
                    <MessageSquare size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1,
                      }}
                    >
                      {session.title || 'Untitled conversation'}
                    </span>
                  </button>
                );
              })
            ) : (
              <div
                style={{
                  padding: '12px 10px',
                  fontSize: '0.75rem',
                  color: '#64748b',
                  fontStyle: 'italic',
                }}
              >
                No previous conversations yet.
              </div>
            )}
          </div>
        </div>

        {/* Development Role Switcher Pill */}
        <div style={{ padding: '6px 12px', borderTop: '1px solid #1e293b', backgroundColor: '#090d16' }}>
          <button
            type="button"
            onClick={toggleRole}
            title="Switch active role between Student and Admin for presentation testing"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              color: '#94a3b8',
              fontSize: '0.725rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeftRight size={12} />
              <span>Dev Role: <strong style={{ color: isAdmin ? '#c4b5fd' : '#93c5fd' }}>{role}</strong></span>
            </div>
            <span style={{ fontSize: '0.675rem', opacity: 0.7 }}>Switch</span>
          </button>
        </div>

        {/* Bottom User / Profile Section */}
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid #1e293b',
            backgroundColor: '#0a0e18',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              }}
            >
              {isAdmin ? <Shield size={16} /> : <User size={16} />}
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#f8fafc',
                  lineHeight: '1.2',
                }}
              >
                {user.name}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#64748b',
                }}
              >
                {user.department}
              </div>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.65rem',
              backgroundColor: isAdmin ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              color: isAdmin ? '#c4b5fd' : '#60a5fa',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 600,
            }}
          >
            {role}
          </span>
        </div>
      </aside>
    </>
  );
}
