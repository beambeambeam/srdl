import type { JSX } from "react";
import { useMutation } from "convex/react";
import type { GenericId } from "convex/values";
import { Button } from "@srdl/ui/components/button";
import { Badge } from "@srdl/ui/components/badge";
import { ChevronLeftIcon, ChevronRightIcon, LockIcon } from "lucide-react";
import { toast } from "sonner";

import { api } from "@srdl/backend/convex/client";

const ROOM_STATE_SEQUENCE = [
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

const getRoomStateIndex = (state: string): number =>
  ROOM_STATE_SEQUENCE.indexOf(state as (typeof ROOM_STATE_SEQUENCE)[number]);

const getRoomStateLabel = (state: string): string => ROOM_STATE_LABELS[state] ?? state;

export function RoomStateController({ roomId, roomState }: RoomStateControllerProps): JSX.Element {
  const roomStateIndex = getRoomStateIndex(roomState);
  const canMoveLeft = roomStateIndex > 0;
  const canMoveRight = roomStateIndex >= 0 && roomStateIndex < ROOM_STATE_SEQUENCE.length - 1;
  const changeRoomState = useMutation(api.games.rooms.changeStateByDelta);

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
    <>
      <Button
        disabled={!canMoveLeft}
        onClick={() => {
          void handleStateChange("left");
        }}
        size="icon"
        variant="outline"
      >
        {canMoveLeft ? <ChevronLeftIcon /> : <LockIcon />}
      </Button>
      <Badge variant="secondary">{getRoomStateLabel(roomState)}</Badge>
      <Button
        disabled={!canMoveRight}
        onClick={() => {
          void handleStateChange("right");
        }}
        size="icon"
        variant="outline"
      >
        {canMoveRight ? <ChevronRightIcon /> : <LockIcon />}
      </Button>
    </>
  );
}
