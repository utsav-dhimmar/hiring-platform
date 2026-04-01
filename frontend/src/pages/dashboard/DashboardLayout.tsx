import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { INFO } from "@/constants";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

function MobileHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/30 px-4 md:hidden">
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>
    </header>
  );
}

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar className="w-52" />
      <SidebarInset className="flex flex-col min-h-screen">
        {/* Mobile Header */}
        <MobileHeader />

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


