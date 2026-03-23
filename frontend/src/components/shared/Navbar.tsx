/**
 * Global Navbar component for the hiring platform.
 * Provides navigation, user profile, and responsive layout.
 */

import { Container, Nav, Navbar, NavDropdown, Badge } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout, selectCurrentUser } from "@/store/slices/authSlice";
import { authService } from "@/apis/auth";
import "@/components/shared/Navbar.css";

const AppNavbar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector(selectCurrentUser);

  const isAuthorized =
    user?.role_name?.toLowerCase() === "admin" ||
    user?.role_name?.toLowerCase() === "hr" ||
    user?.permissions?.includes("admin:access") ||
    user?.permissions?.includes("admin:all");

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      dispatch(logout());
      navigate("/login");
    }
  };

  if (!user) return null;

  return (
    <Navbar bg="white" expand="lg" sticky="top" className="main-navbar py-3 shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold text-primary brand-logo">
          <span className="logo-icon me-2">🚀</span>
          Hiring Platform
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-nav" border-0 />

        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto ms-lg-4 mt-2 mt-lg-0">
            <Nav.Link as={Link} to="/" active={location.pathname === "/"} className="px-3">
              Browse Jobs
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/about"
              active={location.pathname === "/about"}
              className="px-3"
            >
              About Us
            </Nav.Link>
          </Nav>

          <Nav className="mt-3 mt-lg-0 align-items-center">
            {isAuthorized && (
              <Nav.Link
                as={Link}
                to="/admin"
                className="admin-link me-lg-3 py-2 px-3 rounded-pill bg-primary-subtle text-primary fw-semibold mb-3 mb-lg-0"
              >
                Panel
              </Nav.Link>
            )}

            <NavDropdown
              title={
                <div className="d-inline-flex align-items-center">
                  <div className="avatar me-2 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold">
                    {user.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || user.email[0].toUpperCase()}
                  </div>
                  <span className="d-none d-md-inline">{user.full_name || user.email}</span>
                </div>
              }
              id="user-dropdown"
              align="end"
              className="user-nav-dropdown mt-2 mt-lg-0"
            >
              <NavDropdown.Header className="px-3 py-2">
                <div className="fw-bold">{user.full_name || "User"}</div>
                <div className="small text-muted">{user.email}</div>
                <Badge bg="info" className="mt-1">
                  {user.role_name}
                </Badge>
              </NavDropdown.Header>
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} to="/profile">
                My Profile
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/applications">
                My Applications
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout} className="text-danger">
                Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
