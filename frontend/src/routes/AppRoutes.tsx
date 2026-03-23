/**
 * Application route configuration.
 * Defines all routes for the hiring platform with public/protected access control.
 * Lazy loading is applied to large/admin-only sections to reduce initial bundle size.
 */

import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/Home/HomePage";
import LoginPage from "../pages/Login/LoginPage";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import RoleRoute from "../components/auth/RoleRoute";
import PublicRoute from "../components/auth/PublicRoute";
import LoadingSpinner from "../components/common/LoadingSpinner";

// Lazy-loaded route components (code-split for performance)
const JobCandidatesPage = lazy(
  () => import("../pages/JobCandidates/JobCandidatesPage")
);
const CandidateEvaluationPage = lazy(
  () => import("../pages/JobCandidates/CandidateEvaluationPage")
);
const AdminRoutes = lazy(() => import("./AdminRoutes"));

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
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:jobId"
          element={
            <RoleRoute allowedRoles={[]} requiredPermissions={["jobs:access"]}>
              <JobCandidatesPage />
            </RoleRoute>
          }
        />

        {/* Admin Routes — lazy loaded (only downloaded when user navigates to /admin) */}
        <Route
          path="/admin/*"
          element={
            <RoleRoute allowedRoles={[]} requiredPermissions={["admin:access"]}>
              <AdminRoutes />
            </RoleRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
