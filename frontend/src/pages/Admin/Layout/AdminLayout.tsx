/**
 * Admin panel layout component.
 * Provides navigation sidebar and logout functionality for admin pages.
 */

import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
  ];


  const SidebarContent = () => (
    <>
      <div className="sidebar-header">
        <div
          className="flex items-center mb-0"
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

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="lg:hidden"
            onClick={() => setShowMobileSidebar(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <div className="flex justify-end p-2">
            <Button variant="ghost" size="icon" onClick={() => setShowMobileSidebar(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <div className="admin-main">
        <header className="admin-header flex items-center">
          <Button
            variant="ghost"
            className="sidebar-toggle-btn mr-3"
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
          <div className="header-breadcrumbs hidden sm:block">
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
