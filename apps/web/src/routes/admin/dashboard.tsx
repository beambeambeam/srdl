import { createFileRoute } from "@tanstack/react-router";

function AdminDashboardPage() {
  return <main className="min-h-svh" />;
}

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardPage,
});
