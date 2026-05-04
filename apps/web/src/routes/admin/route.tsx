import { AdminSidebar } from "@/features/admin/sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@srdl/ui/components/sidebar";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

function AdminLayout() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <div className="m-1">
          <SidebarTrigger />
        </div>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({
        replace: true,
        to: "/",
      });
    }
  },
  component: AdminLayout,
});
