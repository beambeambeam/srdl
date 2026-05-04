import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router";

import JoinRoomForm from "@/features/room/join-form";

function RoomPage() {
  const pathname = useLocation({
    select: (state) => state.pathname,
  });

  if (pathname === "/room") {
    return (
      <main className="flex min-h-svh items-center justify-center px-4 py-8">
        <JoinRoomForm />
      </main>
    );
  }

  return (
    <div className="min-h-svh">
      <Outlet />
    </div>
  );
}

export const Route = createFileRoute("/room")({
  component: RoomPage,
});
