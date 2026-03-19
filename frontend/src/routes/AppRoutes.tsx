/**
 * Application route configuration.
 * Defines all routes for the hiring platform with public/protected access control.
 */

import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/Home/HomePage";
import JobCandidatesPage from "../pages/JobCandidates/JobCandidatesPage";
import AdminRoutes from "./AdminRoutes";
import LoginPage from "../pages/Login/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AdminRoute from "../components/auth/AdminRoute";
import PublicRoute from "../components/auth/PublicRoute";

/**
 * Main routing component for the application.
 * Defines public routes (login, register) and protected routes (home, job candidates, admin).
 * Unmatched routes redirect to home.
 */
const AppRoutes = () => {
  return (
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
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
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
          <ProtectedRoute>
            <JobCandidatesPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes  */}
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <AdminRoutes />
          </AdminRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
