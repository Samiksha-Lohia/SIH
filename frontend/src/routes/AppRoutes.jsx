import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES, ROLE_HOME_ROUTES } from '../lib/constants.js';

import { RoleGuard } from '../shared/components/RoleGuard.jsx';
import { AppLayout } from '../shared/components/AppLayout.jsx';
import { UnauthorizedPage } from '../shared/components/UnauthorizedPage.jsx';
import { LoginPage } from '../auth/LoginPage.jsx';

import { StudentHome } from '../student/StudentHome.jsx';
import { FacultyHome } from '../faculty/FacultyHome.jsx';
import { InstitutionHome } from '../institution/InstitutionHome.jsx';
import { IndustryHome } from '../industry/IndustryHome.jsx';
import { AdminHome } from '../admin/AdminHome.jsx';

/**
 * Root index redirector: sends authenticated users to their respective home portal,
 * or unauthenticated users to /login.
 */
function RootRedirect() {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const target = (role && ROLE_HOME_ROUTES[role]) || '/unauthorized';
  return <Navigate to={target} replace />;
}

/**
 * Public route helper: redirects authenticated users away from the login screen.
 */
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && role) {
    return <Navigate to={ROLE_HOME_ROUTES[role] || '/'} replace />;
  }

  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Root redirector */}
      <Route path="/" element={<RootRedirect />} />

      {/* Protected role-specific routes wrapped in AppLayout */}
      <Route element={<RoleGuard />}>
        <Route element={<AppLayout />}>
          {/* Student Portal */}
          <Route
            path="/student"
            element={
              <RoleGuard allowedRoles={[ROLES.STUDENT, ROLES.ADMIN]}>
                <StudentHome />
              </RoleGuard>
            }
          />

          {/* Faculty Portal */}
          <Route
            path="/faculty"
            element={
              <RoleGuard allowedRoles={[ROLES.FACULTY, ROLES.ADMIN]}>
                <FacultyHome />
              </RoleGuard>
            }
          />

          {/* Institution Portal */}
          <Route
            path="/institution"
            element={
              <RoleGuard allowedRoles={[ROLES.INSTITUTION, ROLES.ADMIN]}>
                <InstitutionHome />
              </RoleGuard>
            }
          />

          {/* Industry Portal */}
          <Route
            path="/industry"
            element={
              <RoleGuard allowedRoles={[ROLES.INDUSTRY, ROLES.ADMIN]}>
                <IndustryHome />
              </RoleGuard>
            }
          />

          {/* Admin Portal */}
          <Route
            path="/admin"
            element={
              <RoleGuard allowedRoles={[ROLES.ADMIN]}>
                <AdminHome />
              </RoleGuard>
            }
          />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
