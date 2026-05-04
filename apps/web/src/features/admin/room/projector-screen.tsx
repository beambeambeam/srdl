import { Badge } from "@srdl/ui/components/badge";
import type { JSX } from "react";

import { ProjectorPhasePanel } from "@/features/admin/room/projector-phase-panel";
import { getRoomStateLabel } from "@/shared/games";

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
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-sidebar px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgb(255_255_255_/_0.06),_transparent_45%),linear-gradient(135deg,_rgb(255_255_255_/_0.02),_transparent_55%)]" />
      <div className="relative flex min-h-0 flex-1 flex-col rounded-[2rem] border border-border/60 bg-background/95 p-6 shadow-2xl shadow-black/20 sm:p-8 lg:p-10">
        <header className="flex flex-col gap-4 border-b border-border/60 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.32em]">
              Projector View
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl">
              {projectorState.roomTitle}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="px-3 py-1 text-sm" variant="secondary">
              {getRoomStateLabel(projectorState.roomState)}
            </Badge>
            <Badge className="px-3 py-1 font-mono text-sm" variant="outline">
              {projectorState.roomCode}
            </Badge>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 items-center justify-center py-8 sm:py-10">
          <ProjectorPhasePanel
            activePrompt={projectorState.activePrompt}
            phase={projectorState.phase}
            questionIndex={projectorState.questionIndex}
          />
        </div>
      </div>
    </main>
  );
}
