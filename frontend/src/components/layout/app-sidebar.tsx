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
} from "@/components/ui/sidebar";
import { LogOut, User, Mail, Shield } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { authService } from "@/apis/auth";
import { logout, selectCurrentUser } from "@/store/slices/authSlice";
import { Logo } from "../shared";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
          title: "Departments",
          url: "/dashboard/admin/departments",
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
  const [showProfileCard, setShowProfileCard] = useState(false);
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
      <SidebarFooter className="relative">
        {showProfileCard && (
          <div className="absolute bottom-full left-2 right-2 mb-2 p-4 rounded-2xl bg-popover border border-border shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarFallback className="bg-green-100 text-green-700 font-bold">
                  {user?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.role_name || "User"}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3 shrink-0" />
                <span className="truncate">{user?.role_name}</span>
              </div>
            </div>

            <Button
              variant="destructive"
              size="sm"
              className="w-full rounded-xl font-bold gap-2 text-xs"
              onClick={() => setIsLogoutDialogOpen(true)}
            >
              <LogOut className="h-3 w-3" />
              Logout
            </Button>
          </div>
        )}

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="outline"
              onClick={() => {
                // navigate('/dashboard/profile')
                setShowProfileCard(!showProfileCard);
              }}
              isActive={showProfileCard || location.pathname === '/dashboard/profile'}
              className="text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
            >
              <User className="h-4 w-4" />
              <span>{user?.full_name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] p-6 border-none ring-1 ring-border/50 shadow-2xl">
          <DialogHeader className="gap-3">
            <div className="h-12 w-12 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500 mx-auto">
              <LogOut className="h-6 w-6" />
            </div>
            <div className="space-y-1 text-center">
              <DialogTitle className="text-xl font-black tracking-tight text-foreground">
                Confirm Logout
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs leading-relaxed">
                Are you sure you want to sign out?
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-6">
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="h-10 rounded-xl font-bold text-sm"
            >
              Confirm Logout
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsLogoutDialogOpen(false)}
              className="h-10 rounded-xl font-bold text-muted-foreground text-sm"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}


