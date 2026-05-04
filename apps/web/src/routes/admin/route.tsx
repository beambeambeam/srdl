import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

function AdminLayout() {
  return <Outlet />;
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
