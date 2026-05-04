import { createFileRoute } from "@tanstack/react-router";

function AdminRoomPage() {
  return <main className="h-full min-h-0" />;
}

export const Route = createFileRoute("/admin/room")({
  component: AdminRoomPage,
});
