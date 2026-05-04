import type { JSX } from "react";
import { useMutation } from "convex/react";
import type { GenericId } from "convex/values";
import { ChevronLeftIcon, ChevronRightIcon, LockIcon } from "lucide-react";
import { toast } from "sonner";

import { api } from "@srdl/backend/convex/client";
import { Badge } from "@srdl/ui/components/badge";
import { Button } from "@srdl/ui/components/button";
import { ROOM_STATES, getRoomStateLabel } from "@/shared/games";

interface RoomStateControllerProps {
  roomId: GenericId<"rooms">;
  roomState: string;
}

type SegmentVariant = "current" | "passed" | "upcoming";

const getStateIndex = (state: string): number =>
  ROOM_STATES.indexOf(state as (typeof ROOM_STATES)[number]);

const getTimelineLabel = (state: string): string => {
  switch (state) {
    case "SHOW-1ST-QUESTION": {
      return "Show 1";
    }
    case "GUESS-1ST-QUESTION": {
      return "Guess 1";
    }
    case "ANSWER-1ST-QUESTION": {
      return "Answer 1";
    }
    case "SHOW-2ND-QUESTION": {
      return "Show 2";
    }
    case "GUESS-2ND-QUESTION": {
      return "Guess 2";
    }
    case "ANSWER-2ND-QUESTION": {
      return "Answer 2";
    }
    case "SHOW-3RD-QUESTION": {
      return "Show 3";
    }
    case "GUESS-3RD-QUESTION": {
      return "Guess 3";
    }
    case "ANSWER-3RD-QUESTION": {
      return "Answer 3";
    }
    case "SHOW-4TH-QUESTION": {
      return "Show 4";
    }
    case "GUESS-4TH-QUESTION": {
      return "Guess 4";
    }
    case "ANSWER-4TH-QUESTION": {
      return "Answer 4";
    }
    default: {
      return getRoomStateLabel(state);
    }
  }
};

const getSegmentVariant = (index: number, currentIndex: number): SegmentVariant => {
  if (index < currentIndex) {
    return "passed";
  }

  if (index === currentIndex) {
    return "current";
  }

  return "upcoming";
};

const getSegmentClassName = (variant: SegmentVariant): string => {
  // oxlint-disable-next-line default-case
  switch (variant) {
    case "passed": {
      return "bg-secondary";
    }
    case "current": {
      return "bg-accent-foreground";
    }
    case "upcoming": {
      return "bg-muted";
    }
  }
};

const getLabelClassName = (variant: SegmentVariant): string => {
  // oxlint-disable-next-line default-case
  switch (variant) {
    case "passed": {
      return "text-secondary-foreground";
    }
    case "current": {
      return "font-semibold text-foreground";
    }
    case "upcoming": {
      return "text-muted-foreground";
    }
  }
};

export function RoomStateController({ roomId, roomState }: RoomStateControllerProps): JSX.Element {
  const changeRoomState = useMutation(api.games.rooms.changeStateByDelta);
  const currentStateIndex = getStateIndex(roomState);
  const safeStateIndex = currentStateIndex === -1 ? 0 : currentStateIndex;
  const currentStateLabel = getRoomStateLabel(ROOM_STATES[safeStateIndex] ?? roomState);
  const canMoveLeft = safeStateIndex > 0;
  const canMoveRight = safeStateIndex < ROOM_STATES.length - 1;

  const handleStateChange = async (direction: "left" | "right"): Promise<void> => {
    try {
      await changeRoomState({
        direction,
        id: roomId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to change room state.";
      toast.error(message);
    }
  };

  return (
    <section className="w-full rounded-lg text-foreground">
      <div className="overflow-x-auto pb-1 hidden lg:block">
        <div className="min-w-208">
          <div className="mb-2 grid h-14 grid-cols-14 items-end gap-1 lg:h-16">
            {ROOM_STATES.map((state, index) => {
              const variant = getSegmentVariant(index, safeStateIndex);

              return (
                <div
                  key={state}
                  className="flex h-full items-end justify-center overflow-visible px-0.5"
                >
                  <span
                    aria-current={variant === "current" ? "step" : undefined}
                    className={`block max-w-14 text-center text-xs leading-none origin-bottom-left -rotate-35 translate-y-0.5 whitespace-nowrap ${getLabelClassName(variant)}`}
                  >
                    {getTimelineLabel(state)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-md border border-border bg-muted">
            <div className="grid grid-cols-14">
              {ROOM_STATES.map((state, index) => {
                const variant = getSegmentVariant(index, safeStateIndex);
                const isLast = index === ROOM_STATES.length - 1;

                return (
                  <div
                    key={state}
                    aria-hidden="true"
                    className={`h-20 ${getSegmentClassName(variant)} ${isLast ? "" : "border-r border-border"}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex w-full items-center justify-center gap-2">
        <Button
          aria-label="Go to previous room state"
          disabled={!canMoveLeft}
          onClick={() => {
            void handleStateChange("left");
          }}
          size="icon"
          variant="outline"
        >
          {canMoveLeft ? (
            <ChevronLeftIcon className="size-4 text-foreground" />
          ) : (
            <LockIcon className="size-4 text-muted-foreground" />
          )}
        </Button>
        <span aria-atomic="true" aria-live="polite" className="text-sm font-medium ">
          <Badge variant="secondary" className="text-sm text-foreground/90">
            {currentStateLabel}
          </Badge>
        </span>
        <Button
          aria-label="Go to next room state"
          disabled={!canMoveRight}
          onClick={() => {
            void handleStateChange("right");
          }}
          size="icon"
          variant="outline"
        >
          {canMoveRight ? (
            <ChevronRightIcon className="size-4 text-foreground" />
          ) : (
            <LockIcon className="size-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    </section>
  );
}
