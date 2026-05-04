import type { JSX } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import type { GenericId } from "convex/values";
import { ChevronLeftIcon, ChevronRightIcon, CircleHelp, LockIcon } from "lucide-react";

import { api } from "@srdl/backend/convex/client";
import { Badge } from "@srdl/ui/components/badge";
import { Button } from "@srdl/ui/components/button";

const ROOM_STATES = [
  "WAITING",
  "SHOW-1ST-QUESTION",
  "GUESS-1ST-QUESTION",
  "ANSWER-1ST-QUESTION",
  "SHOW-2ND-QUESTION",
  "GUESS-2ND-QUESTION",
  "ANSWER-2ND-QUESTION",
  "SHOW-3RD-QUESTION",
  "GUESS-3RD-QUESTION",
  "ANSWER-3RD-QUESTION",
  "SHOW-4TH-QUESTION",
  "GUESS-4TH-QUESTION",
  "ANSWER-4TH-QUESTION",
  "WRAP UP",
] as const;

const ROOM_STATE_LABELS: Record<string, string> = {
  "ANSWER-1ST-QUESTION": "Answer Question 1",
  "ANSWER-2ND-QUESTION": "Answer Question 2",
  "ANSWER-3RD-QUESTION": "Answer Question 3",
  "ANSWER-4TH-QUESTION": "Answer Question 4",
  "GUESS-1ST-QUESTION": "Guess Question 1",
  "GUESS-2ND-QUESTION": "Guess Question 2",
  "GUESS-3RD-QUESTION": "Guess Question 3",
  "GUESS-4TH-QUESTION": "Guess Question 4",
  "SHOW-1ST-QUESTION": "Show Question 1",
  "SHOW-2ND-QUESTION": "Show Question 2",
  "SHOW-3RD-QUESTION": "Show Question 3",
  "SHOW-4TH-QUESTION": "Show Question 4",
  WAITING: "Waiting",
  "WRAP UP": "Wrap Up",
};

interface RoomStateControllerProps {
  roomId: GenericId<"rooms">;
  roomState: string;
}

const getStateIndex = (state: string): number =>
  ROOM_STATES.indexOf(state as (typeof ROOM_STATES)[number]);

const getRoomStateLabel = (state: string): string => ROOM_STATE_LABELS[state] ?? state;

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
    <div className="relative overflow-hidden rounded-lg border border-border bg-card text-foreground ring-1 ring-border shadow-sm">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card">
        <CircleHelp
          aria-label="State controller help"
          className="size-4 text-muted-foreground"
          title="State controller"
        />
      </div>
      <div className="flex items-center gap-2 px-2 py-2">
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
        <span aria-atomic="true" aria-live="polite" className="text-sm font-medium">
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
    </div>
  );
}
