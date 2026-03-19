/**
 * Application route configuration.
 * Defines all routes for the hiring platform with public/protected access control.
 */

import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/Home/HomePage";
import JobCandidatesPage from "../pages/JobCandidates/JobCandidatesPage";
import CandidateEvaluationPage from "../pages/JobCandidates/CandidateEvaluationPage";
import AdminRoutes from "./AdminRoutes";
import LoginPage from "../pages/Login/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import RoleRoute from "../components/auth/RoleRoute";
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
          <RoleRoute allowedRoles={[]} requiredPermissions={["jobs:access"]}>
            <JobCandidatesPage />
          </RoleRoute>
        }
      />
      <Route
        path="/jobs/:jobId/candidates/:candidateId/evaluation"
        element={
          <RoleRoute allowedRoles={[]} requiredPermissions={["candidates:access"]}>
            <CandidateEvaluationPage />
          </RoleRoute>
        }
      />

      {/* Admin Routes  */}
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
  );
};

export default AppRoutes;
