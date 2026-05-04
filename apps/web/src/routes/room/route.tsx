import { createFileRoute } from "@tanstack/react-router";

import JoinRoomForm from "@/features/room/join-form";

function RoomPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-8">
      <JoinRoomForm />
    </main>
  );
}

export const Route = createFileRoute("/room")({
  component: RoomPage,
});
