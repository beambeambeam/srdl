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
import { Link, useRouterState } from "@tanstack/react-router";
import { DoorOpenIcon, Layers2Icon } from "lucide-react";
import type { JSX } from "react";

interface AdminNavItem {
  activeRegex: RegExp;
  icon: () => JSX.Element;
  label: string;
  to: "/admin/dashboard" | "/admin/room";
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    activeRegex: /^\/admin\/dashboard(?:\/.*)?$/,
    icon: Layers2Icon,
    label: "Dashboard",
    to: "/admin/dashboard",
  },
  {
    activeRegex: /^\/admin\/room(?:\/.*)?$/,
    icon: DoorOpenIcon,
    label: "Room",
    to: "/admin/room",
  },
];

export function AdminSidebar() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <AppLogo className="size-20" />
        <p className="font-heading">Welcome to Console!</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = item.activeRegex.test(pathname);
            const Icon = item.icon;

            return (
              <Link key={item.to} to={item.to}>
                <SidebarMenuButton className="cursor-pointer" isActive={isActive}>
                  <Icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            );
          })}
        </SidebarGroup>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter>
        <AdminSidebarFooter />
      </SidebarFooter>
    </Sidebar>
  );
}
