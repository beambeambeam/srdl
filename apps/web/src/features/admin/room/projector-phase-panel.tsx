import Showblock from "@/features/admin/room/show-block";
import { Badge } from "@srdl/ui/components/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@srdl/ui/components/empty";
import type { JSX } from "react";

interface ActivePrompt {
  answer: string;
  playerId: string;
  playerName: string;
  questionIndex: number;
  roomState: string;
  selectedAt: number;
  submissionId: string;
}

interface ProjectorPhasePanelProps {
  activePrompt: ActivePrompt | null;
  phase: "answer" | "guess" | "show" | "unknown" | "waiting" | "wrap-up";
  questionIndex: number | null;
}

export function ProjectorPhasePanel({
  activePrompt,
  phase,
}: ProjectorPhasePanelProps): JSX.Element {
  if (phase === "waiting") {
    return (
      <Empty className="border-0">
        <EmptyHeader className="max-w-2xl gap-4">
          <EmptyTitle className="text-4xl sm:text-5xl">Waiting for submissions</EmptyTitle>
          <EmptyDescription className="text-base sm:text-lg">
            Players are filling in their questions. Move to a show state once answers are ready.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (phase === "wrap-up") {
    return (
      <Empty className="border-0">
        <EmptyHeader className="max-w-2xl gap-4">
          <EmptyTitle className="text-4xl sm:text-5xl">Game complete</EmptyTitle>
          <EmptyDescription className="text-base sm:text-lg">
            The room has reached the end of the game. Final recap screens can land here next.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (phase === "unknown") {
    return (
      <Empty className="border-0">
        <EmptyHeader className="max-w-2xl gap-4">
          <EmptyTitle className="text-4xl sm:text-5xl">Projector state unavailable</EmptyTitle>
          <EmptyDescription className="text-base sm:text-lg">
            This room is in a state the projector does not understand yet.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (activePrompt === null) {
    return (
      <Empty className="border-0">
        <EmptyHeader className="max-w-2xl gap-4">
          <Badge className="px-4 py-1 text-sm uppercase tracking-[0.24em]" variant="secondary">
            Prompt Missing
          </Badge>
          <EmptyTitle className="text-4xl sm:text-5xl">Prompt unavailable</EmptyTitle>
          <EmptyDescription className="text-base sm:text-lg">
            This room entered a prompt state without a selected player. Move the room state again to
            regenerate the prompt.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return <Showblock answer={activePrompt.answer} />;
}
