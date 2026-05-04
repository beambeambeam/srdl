import AppLogo from "@/components/logo";
import { AdminSidebarFooter } from "@/features/admin/sidebar/footer";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@srdl/ui/components/sidebar";

export function AdminSidebar() {
  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <AppLogo className="size-20" />
        <p className="font-heading">Welcome to Console!</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter>
        <AdminSidebarFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
