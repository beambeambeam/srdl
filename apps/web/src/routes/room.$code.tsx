import { convexQuery } from "@convex-dev/react-query";
import { api } from "@srdl/backend/convex/client";
import { Badge } from "@srdl/ui/components/badge";
import { Button } from "@srdl/ui/components/button";
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@srdl/ui/components/empty";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeftIcon, CircleAlertIcon } from "lucide-react";
import { getRoomStateLabel } from "@/shared/games";

function RouteComponent() {
  const { code } = useParams({
    from: "/room/$code",
  });

  const roomQuery = useQuery(
    convexQuery(api.games.rooms.getByCode, {
      code,
    }),
  );

  if (roomQuery.data === null) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <Empty>
          <EmptyMedia variant="icon" className="size-10">
            <CircleAlertIcon className="size-7" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle className="text-4xl">Room not found</EmptyTitle>
            <EmptyDescription>
              We could not find that room code. Please make sure the code is correct!.
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
    <main className="flex h-full min-h-0 items-center justify-center p-4">
      <div className="space-y-3 text-center">
        <h1 className="font-heading text-4xl">{roomQuery.data.title}</h1>
        <Badge variant="secondary">{getRoomStateLabel(roomQuery.data.state)}</Badge>
        <p className="font-mono text-muted-foreground text-xl">{roomQuery.data.code}</p>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/room/$code")({
  component: RouteComponent,
});
