import type { JSX } from "react";
import { useMutation } from "convex/react";
import type { GenericId } from "convex/values";
import { ChevronLeftIcon, ChevronRightIcon, LockIcon } from "lucide-react";
import { toast } from "sonner";

import { api } from "@srdl/backend/convex/client";
import { Badge } from "@srdl/ui/components/badge";
import { Button } from "@srdl/ui/components/button";
import { getRoomStateLabel, getRoomStatesForQuestionCount } from "@/shared/games";

interface RoomStateControllerProps {
  roomId: GenericId<"rooms">;
  questionCount: number;
  roomState: string;
}

type SegmentVariant = "current" | "passed" | "upcoming";

const getStateIndex = (roomStates: string[], state: string): number => roomStates.indexOf(state);

const getTimelineLabel = (state: string): string => {
  if (state === "WAITING" || state === "WRAP UP") {
    return getRoomStateLabel(state);
  }

  return getRoomStateLabel(state).replace(" Question ", " ");
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

export function RoomStateController({
  questionCount,
  roomId,
  roomState,
}: RoomStateControllerProps): JSX.Element {
  const changeRoomState = useMutation(api.games.rooms.changeStateByDelta);
  const roomStates = getRoomStatesForQuestionCount(questionCount);
  const currentStateIndex = getStateIndex(roomStates, roomState);
  const safeStateIndex = currentStateIndex === -1 ? 0 : currentStateIndex;
  const currentStateLabel = getRoomStateLabel(roomStates[safeStateIndex] ?? roomState);
  const canMoveLeft = safeStateIndex > 0;
  const canMoveRight = safeStateIndex < roomStates.length - 1;

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
        <div className="min-w-max">
          <div
            className="mb-2 grid h-14 min-w-max items-end gap-1 lg:h-16"
            style={{ gridTemplateColumns: `repeat(${roomStates.length}, minmax(0, 1fr))` }}
          >
            {roomStates.map((state, index) => {
              const variant = getSegmentVariant(index, safeStateIndex);

              return (
                <div
                  key={state}
                  className="flex h-full items-end justify-center overflow-visible px-0.5"
                >
                  <span
                    aria-current={variant === "current" ? "step" : undefined}
                    className={`block max-w-14 text-center text-lg leading-none origin-bottom-left -rotate-35 translate-y-0.5 whitespace-nowrap ${getLabelClassName(variant)}`}
                  >
                    {getTimelineLabel(state)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-md border border-border bg-muted">
            <div
              className="grid min-w-max"
              style={{ gridTemplateColumns: `repeat(${roomStates.length}, minmax(0, 1fr))` }}
            >
              {roomStates.map((state, index) => {
                const variant = getSegmentVariant(index, safeStateIndex);
                const isLast = index === roomStates.length - 1;

                return (
                  <div
                    key={state}
                    aria-hidden="true"
                    className={`h-4 ${getSegmentClassName(variant)} ${isLast ? "" : "border-r border-border"}`}
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
