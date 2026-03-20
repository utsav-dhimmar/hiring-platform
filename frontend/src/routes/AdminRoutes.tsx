/**
 * Administrative routes configuration.
 * Defines all sub-routes under /admin with role-based access control.
 */

import { Route, Routes } from "react-router-dom";
import AdminLayout from "../pages/Admin/Layout/AdminLayout";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import AdminUsers from "../pages/Admin/AdminUsers";
import AdminRoles from "../pages/Admin/AdminRoles";
import AdminAuditLogs from "../pages/Admin/AdminAuditLogs";
import AdminRecentUploads from "../pages/Admin/AdminRecentUploads";
import AdminJobs from "../pages/Admin/AdminJobs";
import AdminSkills from "../pages/Admin/AdminSkills";
import AdminStageTemplates from "../pages/Admin/AdminStageTemplates";
import AdminCandidateSearch from "../pages/Admin/AdminCandidateSearch";
import RoleRoute from "../components/auth/RoleRoute";

/**
 * Router configuration for admin section.
 * Maps /admin subpaths to admin pages with permission-based guards.
 */
const AdminRoutes = () => {
  return (
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
  );
};

export default AdminRoutes;
