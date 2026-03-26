/**
 * Global Navbar component for the hiring platform.
 * Provides navigation, user profile, and responsive layout.
 */

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout, selectCurrentUser } from "@/store/slices/authSlice";
import { authService } from "@/apis/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

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
    <header className="sticky top-0 z-50 w-full border-b bg-white py-3 shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-primary">
          <span className="text-xl">🚀</span>
          Hiring Platform
        </Link>

        <nav className="hidden items-center gap-4 lg:flex">
          <Link
            to="/"
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              location.pathname === "/"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Browse Jobs
          </Link>
          <Link
            to="/about"
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              location.pathname === "/about"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            About Us
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthorized && (
            <Link
              to="/admin"
              className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20"
            >
              Panel
            </Link>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {user.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || user.email[0].toUpperCase()}
                </div>
                <span className="hidden md:inline">{user.full_name || user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <div className="font-semibold">{user.full_name || "User"}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
                <Badge variant="secondary" className="mt-1">
                  {user.role_name}
                </Badge>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link to="/profile" className="w-full">My Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/applications" className="w-full">My Applications</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AppNavbar;
