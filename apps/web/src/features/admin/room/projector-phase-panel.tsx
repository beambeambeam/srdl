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

const getQuestionLabel = (questionIndex: number | null): string => {
  if (questionIndex === null) {
    return "Question";
  }

  return `Question ${questionIndex + 1}`;
};

const getPhaseCopy = (
  phase: ProjectorPhasePanelProps["phase"],
): {
  description: string;
  eyebrow: string;
  identityLabel: string;
  title: string;
} => {
  switch (phase) {
    case "show": {
      return {
        description: "Read carefully before guessing.",
        eyebrow: "Featured Answer",
        identityLabel: "From",
        title: "Show the answer",
      };
    }
    case "guess": {
      return {
        description: "Who wrote this answer?",
        eyebrow: "Guessing Time",
        identityLabel: "Player",
        title: "Who wrote this?",
      };
    }
    case "answer": {
      return {
        description: "Here is the player behind this answer.",
        eyebrow: "Answer Reveal",
        identityLabel: "Written by",
        title: "The reveal",
      };
    }
    default: {
      return {
        description: "",
        eyebrow: "",
        identityLabel: "",
        title: "",
      };
    }
  }
};

export function ProjectorPhasePanel({
  activePrompt,
  phase,
  questionIndex,
}: ProjectorPhasePanelProps): JSX.Element {
  if (phase === "waiting") {
    return (
      <Empty className="border-0">
        <EmptyHeader className="max-w-2xl gap-4">
          <Badge className="px-4 py-1 text-sm uppercase tracking-[0.24em]" variant="secondary">
            Waiting
          </Badge>
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
          <Badge className="px-4 py-1 text-sm uppercase tracking-[0.24em]" variant="secondary">
            Wrap Up
          </Badge>
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
          <Badge className="px-4 py-1 text-sm uppercase tracking-[0.24em]" variant="secondary">
            Unknown
          </Badge>
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

  const phaseCopy = getPhaseCopy(phase);

  return (
    <section className="flex w-full max-w-6xl flex-col items-center gap-8 text-center">
      <div className="space-y-4">
        <Badge className="px-4 py-1 text-sm uppercase tracking-[0.24em]" variant="secondary">
          {getQuestionLabel(questionIndex)}
        </Badge>
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm uppercase tracking-[0.3em]">
            {phaseCopy.eyebrow}
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl">{phaseCopy.title}</h2>
        </div>
      </div>

      <div className="w-full max-w-5xl rounded-[2rem] border border-border/60 bg-card/80 px-6 py-10 shadow-2xl shadow-black/20 backdrop-blur-sm sm:px-10 sm:py-14 lg:px-16">
        <blockquote className="font-heading text-3xl leading-tight text-balance sm:text-4xl lg:text-6xl">
          “{activePrompt.answer}”
        </blockquote>
      </div>

      <div className="space-y-3">
        <p className="text-muted-foreground text-sm uppercase tracking-[0.3em]">
          {phaseCopy.identityLabel}
        </p>
        <p className="text-2xl font-semibold sm:text-3xl">{activePrompt.playerName}</p>
        <p className="text-muted-foreground text-sm sm:text-base">{phaseCopy.description}</p>
      </div>
    </section>
  );
}
