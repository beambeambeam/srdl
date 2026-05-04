import { AdminSidebar } from "@/features/admin/sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@srdl/ui/components/sidebar";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { NO_INDEX_META } from "@/lib/seo";

function AdminLayout() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="min-h-0 overflow-hidden">
        <div className="flex shrink-0 items-start p-4">
          <SidebarTrigger />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
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
  head: () => ({
    meta: [...NO_INDEX_META],
  }),
});
