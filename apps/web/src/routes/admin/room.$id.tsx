import { convexQuery } from "@convex-dev/react-query";
import { api } from "@srdl/backend/convex/client";
import type { GenericId } from "convex/values";
import { Badge } from "@srdl/ui/components/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@srdl/ui/components/empty";
import { Outlet, createFileRoute, useLocation, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { RoomStateController } from "../../features/admin/room/state-controller";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@srdl/ui/components/card";
import { getRoomStateLabel } from "@/shared/games";

function AdminRoomDetailPage() {
  const { id } = useParams({
    from: "/admin/room/$id",
  });
  const pathname = useLocation({
    select: (state) => state.pathname,
  });
  const roomQuery = useQuery(
    convexQuery(api.games.rooms.getById, {
      id: id as GenericId<"rooms">,
    }),
  );

  if (pathname.endsWith("/projector")) {
    return <Outlet />;
  }

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
    <main className="flex w-full h-full min-h-0 p-4">
      <div className="flex flex-wrap items-center gap-4 h-fit w-full">
        <h3 className="text-3xl">{room.title}</h3>
        <Badge>{room.code}</Badge>
        <Card className="w-full">
          <CardHeader className="justify-center md:justify-start">
            <CardTitle>Room States</CardTitle>
            <CardDescription>
              <span className="pr-2">Currently :</span>
              <Badge variant="secondary">{getRoomStateLabel(room.state)}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RoomStateController roomId={room._id} roomState={room.state} />
          </CardContent>
        </Card>
        <div className="grid grid-cols-[2fr_1fr] gap-4 w-full">
          <Card className="h-fit w-full">
            <CardContent>Tab1</CardContent>
          </Card>
          <Card className="h-fit w-full">
            <CardContent>Tab2</CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/admin/room/$id")({
  component: AdminRoomDetailPage,
});
