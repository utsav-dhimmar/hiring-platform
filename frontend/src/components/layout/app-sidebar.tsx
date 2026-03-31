import * as React from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { LogOut, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { authService } from "@/apis/auth";
import { logout, selectCurrentUser } from "@/store/slices/authSlice";
import { Logo } from "../shared";

const data = {
  navMain: [
    {
      title: "Recruitment",
      url: "/dashboard",
      items: [
        {
          title: "Job Board",
          url: "/dashboard/jobs",
        },
        {
          title: "Candidates",
          url: "/dashboard/candidates",
        },

      ],
    },
  ],
  navAdmin: [
    {
      title: "Administration",
      url: "/dashboard/admin",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard/admin",
        },
        {
          title: "Users",
          url: "/dashboard/admin/users",
        },
        {
          title: "Roles",
          url: "/dashboard/admin/roles",
        },
        {
          title: "Jobs",
          url: "/dashboard/admin/jobs",
        },
        {
          title: "Candidates",
          url: "/dashboard/admin/candidates",
        },
        {
          title: "Skills",
          url: "/dashboard/admin/skills",
        },
        {
          title: "Audit Logs",
          url: "/dashboard/admin/audit-logs",
        },
        {
          title: "Recent Uploads",
          url: "/dashboard/admin/recent-uploads",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const isStaff =
    user?.role_name?.toLowerCase() === "admin" ||
    user?.role_name?.toLowerCase() === "hr";

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

  return (
    <Sidebar {...props} className="w-52">
      <SidebarHeader className="flex-row items-center justify-between py-4">
        <Link to="/dashboard" className="flex-1">
          <Logo variant="dark" />
        </Link>
        <SidebarTrigger className="h-8 w-8 ml-auto" />
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((subItem) => (
                  <SidebarMenuItem key={subItem.title}>
                    <SidebarMenuButton
                      isActive={location.pathname === subItem.url}
                      render={<Link to={subItem.url} />}
                    >
                      {subItem.title}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {isStaff &&
          data.navAdmin.map((item) => (
            <SidebarGroup key={item.title}>
              <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {item.items.map((subItem) => (
                    <SidebarMenuItem key={subItem.title}>
                      <SidebarMenuButton
                        isActive={location.pathname === subItem.url}
                        render={<Link to={subItem.url} />}
                      >
                        {subItem.title}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="outline"
              onClick={() => navigate('/dashboard/profile')}
              isActive={location.pathname === '/dashboard/profile'}
              className="text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
            >
              <User className="h-4 w-4" />
              <span>{user?.full_name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="outline"
              onClick={() => setIsLogoutDialogOpen(true)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl p-6">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <LogOut className="h-5 w-5 text-red-500" />
              Confirm Logout
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to log out? You will need to log in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="ghost"
              onClick={() => setIsLogoutDialogOpen(false)}
              className="rounded-xl font-semibold"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="rounded-xl font-semibold"
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
