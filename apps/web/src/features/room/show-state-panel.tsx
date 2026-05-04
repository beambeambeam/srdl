import Showblock from "@/features/admin/room/show-block";
import { Badge } from "@srdl/ui/components/badge";
import type { JSX } from "react";

interface ShowStatePanelProps {
  answer: string;
  questionIndex: number | null;
}

const getQuestionLabel = (questionIndex: number | null): string => {
  if (questionIndex === null) {
    return "Question";
  }

  return `Question ${questionIndex + 1}`;
};

export function ShowStatePanel({ answer, questionIndex }: ShowStatePanelProps): JSX.Element {
  return (
    <section className="flex w-full max-w-6xl flex-col items-center gap-6 text-center">
      <div className="space-y-3">
        <Badge className="px-4 py-1 text-sm uppercase tracking-[0.24em]" variant="secondary">
          {getQuestionLabel(questionIndex)}
        </Badge>
        <p className="text-muted-foreground text-sm sm:text-base">Read the answer on screen.</p>
      </div>
      <Showblock answer={answer} />
    </section>
  );
}
