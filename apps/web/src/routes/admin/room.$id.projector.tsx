import { convexQuery } from "@convex-dev/react-query";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@srdl/ui/components/empty";
import type { GenericId } from "convex/values";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { api } from "@srdl/backend/convex/client";
import { useQuery } from "@tanstack/react-query";

import { ProjectorScreen } from "@/features/admin/room/projector-screen";

function AdminRoomProjectorPage() {
  const { id } = useParams({
    from: "/admin/room/$id/projector",
  });

  const roomQuery = useQuery(
    convexQuery(api.games.rooms.getProjectorState, {
      roomId: id as GenericId<"rooms">,
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

  return <ProjectorScreen projectorState={roomQuery.data} />;
}

export const Route = createFileRoute("/admin/room/$id/projector")({
  component: AdminRoomProjectorPage,
});
