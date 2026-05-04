import { convexQuery } from "@convex-dev/react-query";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@srdl/ui/components/empty";
import type { GenericId } from "convex/values";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { api } from "@srdl/backend/convex/client";
import { Badge } from "@srdl/ui/components/badge";
import { useQuery } from "@tanstack/react-query";
import { getRoomStateLabel } from "@/shared/games";

function AdminRoomProjectorPage() {
  const { id } = useParams({
    from: "/admin/room/$id/projector",
  });

  const roomQuery = useQuery(
    convexQuery(api.games.rooms.getById, {
      id: id as GenericId<"rooms">,
    }),
  );

  if (roomQuery.isPending && !roomQuery.data) {
    return (
      <main className="flex h-full min-h-0 items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Loading room...</p>
      </main>
    );
  }

  if (roomQuery.error) {
    return (
      <main className="flex h-full min-h-0 items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Failed to load room.</p>
      </main>
    );
  }

  if (roomQuery.data === null) {
    return (
      <main className="flex h-full min-h-0 items-center justify-center p-4">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Room not found</EmptyTitle>
            <EmptyDescription>The requested room could not be found.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    );
  }

  const room = roomQuery.data;

  return (
    <main className="flex h-full min-h-0 items-center justify-center p-4">
      <div className="space-y-3 text-center">
        <h1 className="font-heading text-4xl">{room.title}</h1>
        <Badge variant="secondary">{getRoomStateLabel(room.state)}</Badge>
        <p className="font-mono text-muted-foreground text-xl">{room.code}</p>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/admin/room/$id/projector")({
  component: AdminRoomProjectorPage,
});
