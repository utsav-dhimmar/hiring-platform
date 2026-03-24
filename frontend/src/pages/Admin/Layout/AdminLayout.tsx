/**
 * Admin panel layout component.
 * Provides navigation sidebar and logout functionality for admin pages.
 */

import { useEffect, useState } from "react";
import { Button, Offcanvas } from "react-bootstrap";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { authService } from "@/apis/auth";
import "@/css/adminLayout.css";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout, selectCurrentUser } from "@/store/slices/authSlice";

const AdminLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector(selectCurrentUser);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const isAdmin = user?.role_name?.toLowerCase() === "admin";

  // Close mobile sidebar on route change
  useEffect(() => {
    setShowMobileSidebar(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Backend logout failed:", error);
    } finally {
      dispatch(logout());
      navigate("/login");
    }
  };

  const goToHome = () => {
    navigate("/");
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const navItems = [
    { to: "/admin", label: "Dashboard", end: true },
    { to: "/admin/users", label: "Users", adminOnly: true },
    { to: "/admin/jobs", label: "Jobs" },
    { to: "/admin/candidates", label: "Candidates" },
    { to: "/admin/skills", label: "Skills" },
    { to: "/admin/stage-templates", label: "Templates", adminOnly: true },
  ];

  const SidebarContent = () => (
    <>
      <div className="sidebar-header">
        <div
          className="d-flex align-items-center mb-0"
          onClick={goToHome}
          style={{ cursor: "pointer" }}
        >
          <h2 className="mb-0">
            Hiring <span>Panel</span>
          </h2>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
            >
              {item.label}
            </NavLink>
          );
        })}
        <div className="nav-divider my-2"></div>
        <NavLink to="/" className="nav-item back-link">
          Back to Site
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className={`admin-layout ${isSidebarCollapsed ? "collapsed" : ""}`}>
      {/* Desktop Sidebar */}
      <aside className="admin-sidebar d-none d-lg-flex">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Offcanvas) */}
      <Offcanvas
        show={showMobileSidebar}
        onHide={() => setShowMobileSidebar(false)}
        className="admin-offcanvas d-lg-none"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Hiring Panel</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <SidebarContent />
        </Offcanvas.Body>
      </Offcanvas>

      <div className="admin-main">
        <header className="admin-header d-flex align-items-center">
          <Button
            variant="link"
            className="sidebar-toggle-btn me-3"
            onClick={() => {
              if (window.innerWidth < 992) {
                setShowMobileSidebar(true);
              } else {
                toggleSidebar();
              }
            }}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </Button>
          <div className="header-breadcrumbs d-none d-sm-block">
            {location.pathname === "/admin" ? "Dashboard" : "Panel"}
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
