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
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-sidebar p-2">
      <div className="flex gap-2 text-xs items-center">
        <p className="font-heading">{roomQuery.data.title}</p>
        <Badge className="text-xs" variant="outline">
          {roomQuery.data.code}
        </Badge>
      </div>
      <div className="relative flex h-full w-full flex-1 flex-col rounded-xl bg-background shadow-sm"></div>
    </main>
  );
}

export const Route = createFileRoute("/room/$code")({
  component: RouteComponent,
});
