import { convexQuery } from "@convex-dev/react-query";
import { api } from "@srdl/backend/convex/client";
import type { GenericId } from "convex/values";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@srdl/ui/components/empty";
import { Outlet, createFileRoute, useLocation, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@srdl/ui/components/badge";

function AdminRoomDetailPage() {
  const { id } = useParams({
    from: "/admin/room/$id",
  });
  const pathname = useLocation({
    select: (state) => state.pathname,
  });

  if (pathname.endsWith("/projector")) {
    return <Outlet />;
  }

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

  return (
    <main className="flex h-full min-h-0 p-4">
      <div className="flex gap-2 items-center h-fit">
        <h3 className="text-3xl">{roomQuery.data.title}</h3>
        <Badge>{roomQuery.data.code}</Badge>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/admin/room/$id")({
  component: AdminRoomDetailPage,
});
