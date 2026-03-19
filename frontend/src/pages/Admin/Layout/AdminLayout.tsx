/**
 * Admin panel layout component.
 * Provides navigation sidebar and logout functionality for admin pages.
 */

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../../store/hooks";
import { logout } from "../../../store/slices/authSlice";
import "./AdminLayout.css";

const AdminLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
  };

  const goToHome = () => {
    navigate("/");
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2 onClick={goToHome} style={{ cursor: "pointer" }}>
            Hiring Admin
          </h2>
        </div>
        <nav className="sidebar-nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            User Management
          </NavLink>
          <NavLink
            to="/admin/roles"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            Role & Permissions
          </NavLink>
          <NavLink
            to="/admin/audit-logs"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            Audit Logs
          </NavLink>
          <NavLink
            to="/admin/recent-uploads"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            Recent Uploads
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
