import { AdminRoomTable } from "@/features/admin/room/table";
import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";

function AdminRoomPage() {
  const isRoomListPage = useRouterState({
    select: (state) => state.location.pathname === "/admin/room",
  });

  if (!isRoomListPage) {
    return <Outlet />;
  }

  return (
    <main className="flex h-full min-h-0 flex-col gap-8 overflow-hidden p-4">
      <h1 className="font-heading text-3xl">Rooms</h1>
      <AdminRoomTable />
    </main>
  );
}

export const Route = createFileRoute("/admin/room")({
  component: AdminRoomPage,
});
