/**
 * Admin panel layout component.
 * Provides navigation sidebar and logout functionality for admin pages.
 */

import { useEffect, useState } from "react";
import { Button, Offcanvas } from "react-bootstrap";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../../../apis/services/auth";
import "../../../css/adminLayout.css";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { logout, selectCurrentUser } from "../../../store/slices/authSlice";

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

	const SidebarContent = () => (
		<>
			<div className="sidebar-header">
				<h2 onClick={goToHome} style={{ cursor: "pointer" }}>
					Hiring <span>Admin</span>
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
				{isAdmin && (
					<NavLink
						to="/admin/users"
						className={({ isActive }) =>
							isActive ? "nav-item active" : "nav-item"
						}
					>
						User Management
					</NavLink>
				)}
				<NavLink
					to="/admin/jobs"
					className={({ isActive }) =>
						isActive ? "nav-item active" : "nav-item"
					}
				>
					Job Management
				</NavLink>
				<NavLink
					to="/admin/candidates"
					className={({ isActive }) =>
						isActive ? "nav-item active" : "nav-item"
					}
				>
					Candidate Search
				</NavLink>
				<NavLink
					to="/admin/skills"
					className={({ isActive }) =>
						isActive ? "nav-item active" : "nav-item"
					}
				>
					Skill Management
				</NavLink>
				{isAdmin && (
					<NavLink
						to="/admin/stage-templates"
						className={({ isActive }) =>
							isActive ? "nav-item active" : "nav-item"
						}
					>
						Stage Templates
					</NavLink>
				)}
				{isAdmin && (
					<NavLink
						to="/admin/roles"
						className={({ isActive }) =>
							isActive ? "nav-item active" : "nav-item"
						}
					>
						Role & Permissions
					</NavLink>
				)}
				{isAdmin && (
					<NavLink
						to="/admin/audit-logs"
						className={({ isActive }) =>
							isActive ? "nav-item active" : "nav-item"
						}
					>
						Audit Logs
					</NavLink>
				)}
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
		</>
	);

	return (
		<div
			className={`admin-layout ${isSidebarCollapsed ? "collapsed" : ""}`}
		>
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
					<Offcanvas.Title>Hiring Admin</Offcanvas.Title>
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
						{location.pathname === "/admin"
							? "Dashboard"
							: "Admin Panel"}
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
