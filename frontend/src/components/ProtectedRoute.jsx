import React from 'react';
import { useAuth } from '../context/AuthContext';
import AccessDenied from '../pages/AccessDenied';

/**
 * Route protection wrapper for admin-only pages.
 * If user is a STUDENT, renders the AccessDenied view instead.
 */
export default function ProtectedRoute({ children }) {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <AccessDenied />;
  }

  return children;
}
