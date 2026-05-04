import Showblock from "@/features/admin/room/show-block";
import type { JSX } from "react";

interface ShowStatePanelProps {
  answer: string;
  questionIndex: number | null;
}

export function ShowStatePanel({ answer }: ShowStatePanelProps): JSX.Element {
  return (
    <section className="flex w-full items-center justify-center h-full">
      <Showblock answer={answer} />
    </section>
  );
}
