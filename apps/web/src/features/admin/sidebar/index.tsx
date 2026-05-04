import AppLogo from "@/components/logo";
import { AdminSidebarFooter } from "@/features/admin/sidebar/footer";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
} from "@srdl/ui/components/sidebar";
import { Link } from "@tanstack/react-router";
import { Layers2Icon } from "lucide-react";

export function AdminSidebar() {
  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <AppLogo className="size-20" />
        <p className="font-heading">Welcome to Console!</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <Link to="/admin/dashboard">
            <SidebarMenuButton className="cursor-pointer">
              <Layers2Icon />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </Link>
        </SidebarGroup>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter>
        <AdminSidebarFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
