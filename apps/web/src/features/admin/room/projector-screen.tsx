import { ProjectorPhasePanel } from "@/features/admin/room/projector-phase-panel";
import { Badge } from "@srdl/ui/components/badge";
import type { JSX } from "react";

interface ProjectorScreenProps {
  projectorState: {
    activePrompt: {
      answer: string;
      playerId: string;
      playerName: string;
      questionIndex: number;
      roomState: string;
      selectedAt: number;
      submissionId: string;
    } | null;
    phase: "answer" | "guess" | "show" | "unknown" | "waiting" | "wrap-up";
    questionIndex: number | null;
    roomCode: string;
    roomState: string;
    roomTitle: string;
  };
}

export function ProjectorScreen({ projectorState }: ProjectorScreenProps): JSX.Element {
  return (
    <div className="p-4 w-full h-full">
      <div className="flex items-center gap-2">
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl">
          {projectorState.roomTitle}
        </h1>
        <Badge>{projectorState.roomCode}</Badge>
      </div>
      <div className="pt-8 w-full h-full flex items-center justify-center">
        <ProjectorPhasePanel
          activePrompt={projectorState.activePrompt}
          phase={projectorState.phase}
          questionIndex={projectorState.questionIndex}
        />
      </div>
    </div>
  );
}
