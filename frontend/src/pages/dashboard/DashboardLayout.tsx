import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { INFO } from "@/constants";

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar className="w-52" />
      <SidebarInset className="flex flex-col min-h-screen">
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-1 md:p-2 bg-background">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="h-14 border-t px-6 flex items-center justify-center text-sm text-muted-foreground bg-muted/30">
          <div className="border rounded-full px-8 py-1">{INFO.copyright}</div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
