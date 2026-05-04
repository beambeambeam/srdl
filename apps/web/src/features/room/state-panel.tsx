import { convexQuery } from "@convex-dev/react-query";
import { api } from "@srdl/backend/convex/client";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@srdl/ui/components/empty";
import type { GenericId } from "convex/values";
import { useQuery } from "@tanstack/react-query";
import type { JSX } from "react";

import { QuestioningForm } from "@/features/room/questioning-form";
import { ShowStatePanel } from "@/features/room/show-state-panel";

interface RoomStatePanelProps {
  roomId: GenericId<"rooms">;
  roomState: string;
}

const getFutureStateCopy = (
  roomState: string,
): {
  description: string;
  title: string;
} => {
  if (roomState.startsWith("GUESS-")) {
    return {
      description: "Guessing mechanics will be added here for players in a later update.",
      title: "Guessing phase coming next",
    };
  }

  if (roomState.startsWith("ANSWER-")) {
    return {
      description: "Answer reveal mechanics will be added here for players in a later update.",
      title: "Answer reveal phase coming next",
    };
  }

  if (roomState === "WRAP UP") {
    return {
      description: "This game is complete. Wrap-up results and summaries will appear here later.",
      title: "Game complete",
    };
  }

  return {
    description: "This room state does not have a player view yet.",
    title: "State not available",
  };
};

export function RoomStatePanel({ roomId, roomState }: RoomStatePanelProps): JSX.Element {
  const projectorStateQuery = useQuery(
    convexQuery(api.games.rooms.getProjectorState, {
      roomId,
    }),
  );

  if (projectorStateQuery.isPending && !projectorStateQuery.data) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">Loading room state...</p>
      </div>
    );
  }

  if (projectorStateQuery.error) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Failed to load room state</EmptyTitle>
          <EmptyDescription>We could not load the latest room prompt right now.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const projectorState = projectorStateQuery.data;

  if (roomState === "WAITING") {
    return <QuestioningForm roomId={roomId} roomState={roomState} />;
  }

  if (roomState.startsWith("SHOW-")) {
    if (projectorState?.activePrompt === null || projectorState === null) {
      return (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Prompt unavailable</EmptyTitle>
            <EmptyDescription>
              This room is in a show state, but no selected answer is available yet.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }

    return (
      <ShowStatePanel
        answer={projectorState.activePrompt.answer}
        questionIndex={projectorState.questionIndex}
      />
    );
  }

  const stateCopy = getFutureStateCopy(roomState);

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>{stateCopy.title}</EmptyTitle>
        <EmptyDescription>{stateCopy.description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
