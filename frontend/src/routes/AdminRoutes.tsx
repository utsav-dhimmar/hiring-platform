/**
 * Administrative routes configuration.
 * Defines all sub-routes under /admin with role-based access control.
 * Heavy admin pages are lazy-loaded to reduce the admin bundle's initial size.
 */

import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import AdminLayout from "../pages/Admin/Layout/AdminLayout";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import AdminUsers from "../pages/Admin/AdminUsers";
import AdminRoles from "../pages/Admin/AdminRoles";
import AdminAuditLogs from "../pages/Admin/AdminAuditLogs";
import AdminRecentUploads from "../pages/Admin/AdminRecentUploads";
import AdminSkills from "../pages/Admin/AdminSkills";
import AdminStageTemplates from "../pages/Admin/AdminStageTemplates";
import RoleRoute from "../components/auth/RoleRoute";
import LoadingSpinner from "../components/common/LoadingSpinner";

// Lazy-loaded heavy admin pages
const AdminJobs = lazy(() => import("../pages/Admin/AdminJobs"));
const AdminCandidateSearch = lazy(
  () => import("../pages/Admin/AdminCandidateSearch")
);

/**
 * Router configuration for admin section.
 * Maps /admin subpaths to admin pages with permission-based guards.
 */
const AdminRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route element={<AdminLayout />}>
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
          {/* Lazy-loaded heavy admin pages */}
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
            path="stage-templates"
            element={
              <RoleRoute allowedRoles={[]} requiredPermissions={["jobs:manage"]}>
                <AdminStageTemplates />
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
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;
