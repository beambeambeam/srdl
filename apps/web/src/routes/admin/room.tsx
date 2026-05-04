import { createFileRoute } from "@tanstack/react-router";
import { AdminRoomTable } from "@/features/admin/room/table";

function AdminRoomPage() {
  return (
    <main className="h-full min-h-0 overflow-hidden p-4">
      <AdminRoomTable />
    </main>
  );
}

export const Route = createFileRoute("/admin/room")({
  component: AdminRoomPage,
});
