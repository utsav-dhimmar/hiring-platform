import { Route, Routes } from "react-router-dom";
import AdminLayout from "../pages/Admin/Layout/AdminLayout";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import AdminUsers from "../pages/Admin/AdminUsers";
import AdminRoles from "../pages/Admin/AdminRoles";
import AdminAuditLogs from "../pages/Admin/AdminAuditLogs";
import AdminRecentUploads from "../pages/Admin/AdminRecentUploads";

/**
 * Administrative routes configuration.
 * Defines all sub-routes under /admin.
 */
const AdminRoutes = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="roles" element={<AdminRoles />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
        <Route path="recent-uploads" element={<AdminRecentUploads />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
