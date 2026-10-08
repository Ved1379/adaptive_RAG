import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Authentication & Role-Based Access Control (RBAC) Context
 *
 * NOTE: This is a frontend role abstraction for development and presentation.
 * In production, real authorization is enforced by the FastAPI backend.
 * This context is structured to easily integrate with FastAPI JWT/OAuth tokens later.
 */

const AuthContext = createContext(null);

const STORAGE_KEY = 'adaptive_rag_user_role';

const MOCK_USERS = {
  STUDENT: {
    id: 'usr-student-01',
    name: 'Student',
    email: 'student@college.edu',
    role: 'STUDENT',
    department: 'BE / Computer Engg',
    avatar: 'ST',
  },
  ADMIN: {
    id: 'usr-admin-01',
    name: 'Admin',
    email: 'admin.rag@college.edu',
    role: 'ADMIN',
    department: 'Academic Administration',
    avatar: 'AD',
  },
};

export function AuthProvider({ children }) {
  // Default to STUDENT role, restored from localStorage if previously chosen
  const [role, setRoleState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ADMIN' || saved === 'STUDENT') {
        return saved;
      }
    } catch (e) {
      console.warn('Could not read auth role from localStorage:', e);
    }
    return 'STUDENT';
  });

  const user = MOCK_USERS[role] || MOCK_USERS.STUDENT;

  const setRole = (newRole) => {
    if (newRole === 'ADMIN' || newRole === 'STUDENT') {
      setRoleState(newRole);
      try {
        localStorage.setItem(STORAGE_KEY, newRole);
      } catch (e) {
        console.warn('Could not save auth role to localStorage:', e);
      }
    }
  };

  const toggleRole = () => {
    setRole(role === 'STUDENT' ? 'ADMIN' : 'STUDENT');
  };

  const isAdmin = role === 'ADMIN';
  const isStudent = role === 'STUDENT';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isStudent,
        setRole,
        toggleRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
