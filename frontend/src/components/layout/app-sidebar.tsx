"use client"

import * as React from "react"
import { useAppSelector } from "@/store/hooks"
import { selectCurrentUser } from "@/store/slices/authSlice"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { Logo } from "@/components/logo"
import {
  BriefcaseIcon,
  ShieldAlertIcon,
} from "lucide-react"
import { useTheme } from "@/components/shared/theme-provider"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAppSelector(selectCurrentUser)
  const { theme } = useTheme()
  const isStaff =
    user?.role_name?.toLowerCase() === "admin" ||
    user?.role_name?.toLowerCase() === "hr"

  const navRecruitment = [
    {
      title: "Recruitment",
      url: "/dashboard",
      icon: BriefcaseIcon,
      isActive: true,
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
  ]

  const navAdmin = [
    {
      title: "Administration",
      url: "/dashboard/admin",
      icon: ShieldAlertIcon,
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
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Logo variant={theme === "light" ? "dark" : "light"} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navRecruitment} label="Platform" />
        {isStaff && <NavMain items={navAdmin} label="System" />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
