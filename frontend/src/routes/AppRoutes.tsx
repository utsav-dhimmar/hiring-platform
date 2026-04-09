/**
 * Application route configuration.
 * Defines all routes for the hiring platform with public/protected access control.
 * Lazy loading is applied to large/admin-only sections to reduce initial bundle size.
 */

import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicRoute from "@/components/auth/PublicRoute";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import RoleRoute from "@/components/auth/RoleRoute";
import { PERMISSIONS } from "@/lib/permissions";

// Lazy-loaded route pages 
const LoginPage = lazy(() => import("@/pages/Auth/Login/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/Auth/RegisterPage"));
const DashboardLayout = lazy(() => import("@/pages/dashboard/DashboardLayout"));
const JobBoard = lazy(() => import("@/pages/dashboard/job-board"));

// Lazy-loaded route components
const CreateJob = lazy(() => import("@/pages/dashboard/CreateJob"));
const JobCandidates = lazy(() => import("@/pages/dashboard/JobCandidates"));
const ProfilePage = lazy(() => import("@/pages/Profile"));

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/Admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@/pages/Admin/AdminUsers"));
const AdminRoles = lazy(() => import("@/pages/Admin/AdminRoles"));
const AdminAuditLogs = lazy(() => import("@/pages/Admin/AdminAuditLogs"));
const AdminRecentUploads = lazy(() => import("@/pages/Admin/AdminRecentUploads"));
const AdminJobs = lazy(() => import("@/pages/Admin/AdminJobs"));
const AdminCandidateSearch = lazy(() => import("@/pages/Admin/AdminCandidateSearch"));
const AdminSkills = lazy(() => import("@/pages/Admin/AdminSkills"));
const AdminDepartments = lazy(() => import("@/pages/Admin/AdminDepartments"));

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
          <Route
            path="jobs"
            element={
              <RoleRoute requiredPermissions={PERMISSIONS.JOBS_ACCESS}>
                <JobBoard />
              </RoleRoute>
            }
          />
          <Route
            path="jobs/new"
            element={
              <RoleRoute requiredPermissions={PERMISSIONS.JOBS_MANAGE}>
                <CreateJob />
              </RoleRoute>
            }
          />
          <Route
            path="jobs/:jobSlug/edit"
            element={
              <RoleRoute requiredPermissions={PERMISSIONS.JOBS_MANAGE}>
                <CreateJob />
              </RoleRoute>
            }
          />
          <Route
            path="jobs/:jobSlug/candidates"
            element={
              <RoleRoute requiredPermissions={PERMISSIONS.CANDIDATES_ACCESS}>
                <JobCandidates />
              </RoleRoute>
            }
          />
          <Route path="profile" element={<ProfilePage />} />
          {/* Admin Routes */}
          <Route
            path="admin"
            element={
              <RoleRoute
                requiredPermissions={[
                  PERMISSIONS.ADMIN_ACCESS,
                  PERMISSIONS.ANALYTICS_READ,
                  PERMISSIONS.AUDIT_READ,
                  PERMISSIONS.CANDIDATES_ACCESS,
                  PERMISSIONS.DEPARTMENTS_ACCESS,
                  PERMISSIONS.FILES_READ,
                  PERMISSIONS.JOBS_ACCESS,
                  PERMISSIONS.ROLES_READ,
                  PERMISSIONS.SKILLS_ACCESS,
                  PERMISSIONS.USERS_READ,
                ]}
              >
                <Outlet />
              </RoleRoute>
            }
          >
            <Route
              index
              element={
                <RoleRoute requiredPermissions={PERMISSIONS.ANALYTICS_READ}>
                  <AdminDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="users"
              element={
                <RoleRoute requiredPermissions={PERMISSIONS.USERS_READ}>
                  <AdminUsers />
                </RoleRoute>
              }
            />
            <Route
              path="roles"
              element={
                <RoleRoute requiredPermissions={PERMISSIONS.ROLES_READ}>
                  <AdminRoles />
                </RoleRoute>
              }
            />
            <Route
              path="audit-logs"
              element={
                <RoleRoute requiredPermissions={PERMISSIONS.AUDIT_READ}>
                  <AdminAuditLogs />
                </RoleRoute>
              }
            />
            <Route
              path="recent-uploads"
              element={
                <RoleRoute requiredPermissions={PERMISSIONS.FILES_READ}>
                  <AdminRecentUploads />
                </RoleRoute>
              }
            />
            <Route
              path="jobs"
              element={
                <RoleRoute requiredPermissions={PERMISSIONS.JOBS_ACCESS}>
                  <AdminJobs />
                </RoleRoute>
              }
            />
            <Route
              path="jobs/:jobId/candidates"
              element={
                <RoleRoute requiredPermissions={PERMISSIONS.CANDIDATES_ACCESS}>
                  <AdminCandidateSearch />
                </RoleRoute>
              }
            />
            <Route
              path="skills"
              element={
                <RoleRoute requiredPermissions={PERMISSIONS.SKILLS_ACCESS}>
                  <AdminSkills />
                </RoleRoute>
              }
            />
            <Route
              path="departments"
              element={
                <RoleRoute requiredPermissions={PERMISSIONS.DEPARTMENTS_ACCESS}>
                  <AdminDepartments />
                </RoleRoute>
              }
            />
            {/* <Route
              path="candidates"
              element={
                <RoleRoute requiredPermissions={PERMISSIONS.CANDIDATES_ACCESS}>
                  <AdminCandidateSearch />
                </RoleRoute>
              }
            /> */}
          </Route>
        </Route>


        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
