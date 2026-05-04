import { createFileRoute } from "@tanstack/react-router";

function AdminDashboardPage() {
  return <main className="h-full min-h-0" />;
}

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardPage,
});
