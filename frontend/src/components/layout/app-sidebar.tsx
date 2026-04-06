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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { Logo, LogoIcon } from "@/components/logo"
import { cn } from "@/lib/utils"
import {
  BriefcaseIcon,
  ShieldAlertIcon,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAppSelector(selectCurrentUser)
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

  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem
            className={cn(
              "flex gap-1 px-1.5 py-1 transition-all duration-200",
              isCollapsed
                ? "flex-col items-center justify-center gap-4 py-4"
                : "flex-row items-center justify-between"
            )}
          >
            <SidebarMenuButton
              size="lg"
              className={cn(
                "pointer-events-none data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-none",
                isCollapsed ? "h-auto w-auto p-0 flex justify-center items-center" : "flex-1"
              )}
            >
              {isCollapsed ? <LogoIcon /> : <Logo />}
            </SidebarMenuButton>
            <SidebarTrigger className="h-8 w-8 shrink-0 rounded-xl hover:bg-sidebar-accent">
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </SidebarTrigger>
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
