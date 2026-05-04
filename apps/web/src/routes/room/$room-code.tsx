import { convexQuery } from "@convex-dev/react-query";
import { api } from "@srdl/backend/convex/api";
import { Button } from "@srdl/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@srdl/ui/components/empty";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useParams } from "@tanstack/react-router";
import { ArrowLeftIcon, CircleAlertIcon } from "lucide-react";

const ROOM_CODE_REGEX = /^\d{6}$/;

function RoomCodePage() {
  const { "room-code": roomCode } = useParams({
    from: "/room/$room-code",
  });

  const roomQuery = useQuery({
    ...convexQuery(api.rooms.getByCode, {
      code: roomCode,
    }),
    placeholderData: keepPreviousData,
  });

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

  return <main className="h-full min-h-0" />;
}

export const Route = createFileRoute("/room/$room-code")({
  beforeLoad: ({ params }) => {
    if (!ROOM_CODE_REGEX.test(params["room-code"])) {
      throw redirect({
        replace: true,
        to: "/room",
      });
    }
  },
  component: RoomCodePage,
});
