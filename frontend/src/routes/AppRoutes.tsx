/**
 * Application route configuration.
 * Defines all routes for the hiring platform with public/protected access control.
 * Lazy loading is applied to large/admin-only sections to reduce initial bundle size.
 */

import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import LoginPage from "@/pages/Auth/Login/LoginPage";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicRoute from "@/components/auth/PublicRoute";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import JobBoard from "@/pages/dashboard/JobBoard";
import RoleRoute from "@/components/auth/RoleRoute";
import RegisterPage from "@/pages/Auth/RegisterPage";

// Lazy-loaded route components
const CreateJob = lazy(() => import("@/pages/dashboard/CreateJob"));
const JobCandidates = lazy(() => import("@/pages/dashboard/JobCandidates"));

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/Admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@/pages/Admin/AdminUsers"));
const AdminRoles = lazy(() => import("@/pages/Admin/AdminRoles"));
const AdminAuditLogs = lazy(() => import("@/pages/Admin/AdminAuditLogs"));
const AdminRecentUploads = lazy(() => import("@/pages/Admin/AdminRecentUploads"));
const AdminJobs = lazy(() => import("@/pages/Admin/AdminJobs"));
const AdminCandidateSearch = lazy(() => import("@/pages/Admin/AdminCandidateSearch"));
const AdminSkills = lazy(() => import("@/pages/Admin/AdminSkills"));
const AdminStats = lazy(() => import("@/pages/dashboard/AdminStats"));

/**
 * Main routing component for the application.
 * Defines public routes (login, register) and protected routes (home, job candidates, admin).
 * Unmatched routes redirect to home.
 */
const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="jobs" replace />} />
          <Route path="jobs" element={<JobBoard />} />
          <Route path="jobs/new" element={<CreateJob />} />
          <Route path="jobs/:jobSlug/edit" element={<CreateJob />} />
          <Route path="jobs/:jobSlug/candidates" element={<JobCandidates />} />
          {/* Admin Routes */}
          <Route
            path="admin"
            element={
              <RoleRoute allowedRoles={["admin", "hr"]} requiredPermissions={["admin:access"]}>
                <Outlet />
              </RoleRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route
              path="users"
              element={
                <RoleRoute allowedRoles={[]} requiredPermissions={["users:read"]}>
                  <AdminUsers />
                </RoleRoute>
              }
            />
            <Route
              path="roles"
              element={
                <RoleRoute allowedRoles={[]} requiredPermissions={["roles:read"]}>
                  <AdminRoles />
                </RoleRoute>
              }
            />
            <Route
              path="audit-logs"
              element={
                <RoleRoute allowedRoles={[]} requiredPermissions={["audit:read"]}>
                  <AdminAuditLogs />
                </RoleRoute>
              }
            />
            <Route
              path="recent-uploads"
              element={
                <RoleRoute allowedRoles={[]} requiredPermissions={["files:read"]}>
                  <AdminRecentUploads />
                </RoleRoute>
              }
            />
            <Route path="stats" element={<AdminStats />} />
            <Route
              path="jobs"
              element={
                <RoleRoute allowedRoles={[]} requiredPermissions={["jobs:access"]}>
                  <AdminJobs />
                </RoleRoute>
              }
            />
            <Route
              path="jobs/:jobId/candidates"
              element={
                <RoleRoute allowedRoles={[]} requiredPermissions={["jobs:access"]}>
                  <AdminCandidateSearch />
                </RoleRoute>
              }
            />
            <Route
              path="skills"
              element={
                <RoleRoute allowedRoles={[]} requiredPermissions={["skills:access"]}>
                  <AdminSkills />
                </RoleRoute>
              }
            />
            <Route
              path="candidates"
              element={
                <RoleRoute allowedRoles={[]} requiredPermissions={["jobs:access"]}>
                  <AdminCandidateSearch />
                </RoleRoute>
              }
            />
          </Route>
          <Route
            path="candidates"
            element={
              <RoleRoute allowedRoles={["admin", "hr"]} requiredPermissions={["jobs:access"]}>
                <AdminCandidateSearch />
              </RoleRoute>
            }
          />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
