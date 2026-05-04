import { convexQuery } from "@convex-dev/react-query";
import { api } from "@srdl/backend/convex/client";
import type { GenericId } from "convex/values";
import { Badge } from "@srdl/ui/components/badge";
import { Button } from "@srdl/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@srdl/ui/components/empty";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeftIcon, CircleAlertIcon } from "lucide-react";

import { RoomStatePanel } from "@/features/room/state-panel";

const ROOM_CODE_PATTERN = /^\d{6}$/;

function RouteComponent() {
  const { id } = useParams({
    from: "/room/$id",
  });
  const navigate = useNavigate({
    from: "/room/$id",
  });
  const isRoomCode = ROOM_CODE_PATTERN.test(id);

  const roomByIdQuery = useQuery({
    ...convexQuery(api.games.rooms.getById, {
      id: id as GenericId<"rooms">,
    }),
    enabled: !isRoomCode,
  });
  const roomByCodeQuery = useQuery({
    ...convexQuery(api.games.rooms.getByCode, {
      code: id,
    }),
    enabled: isRoomCode,
  });

  useEffect(() => {
    if (!roomByCodeQuery.data) {
      return;
    }

    void navigate({
      params: {
        id: roomByCodeQuery.data._id,
      },
      replace: true,
      to: "/room/$id",
    });
  }, [navigate, roomByCodeQuery.data]);

  const roomQuery = isRoomCode ? roomByCodeQuery : roomByIdQuery;

  if (roomQuery.isPending && !roomQuery.data) {
    return (
      <main className="flex h-full min-h-0 items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Loading room...</p>
      </main>
    );
  }

  if (roomQuery.error) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <Empty>
          <EmptyMedia className="size-10" variant="icon">
            <CircleAlertIcon className="size-7" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle className="text-4xl">Failed to load room</EmptyTitle>
            <EmptyDescription>We could not load that room right now.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/room">
              <Button>
                <ArrowLeftIcon />
                Go Back
              </Button>
            </Link>
          </EmptyContent>
        </Empty>
      </main>
    );
  }

  if (roomQuery.data === null) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <Empty>
          <EmptyMedia className="size-10" variant="icon">
            <CircleAlertIcon className="size-7" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle className="text-4xl">Room not found</EmptyTitle>
            <EmptyDescription>
              {isRoomCode
                ? "We could not find that room code. Please make sure the code is correct!."
                : "The requested room could not be found."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/room">
              <Button>
                <ArrowLeftIcon />
                Go Back
              </Button>
            </Link>
          </EmptyContent>
        </Empty>
      </main>
    );
  }

  if (isRoomCode) {
    return (
      <main className="flex h-full min-h-0 items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Redirecting to room...</p>
      </main>
    );
  }

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-sidebar p-2">
      <div className="flex items-center gap-2 text-xs">
        <p className="font-heading">{roomQuery.data.title}</p>
        <Badge className="text-xs" variant="outline">
          {roomQuery.data.code}
        </Badge>
      </div>
      <div className="relative flex h-full w-full flex-1 flex-col items-center rounded-xl bg-background p-4 shadow-sm">
        <RoomStatePanel roomId={roomQuery.data._id} roomState={roomQuery.data.state} />
      </div>
    </main>
  );
}

export const Route = createFileRoute("/room/$id")({
  component: RouteComponent,
});
