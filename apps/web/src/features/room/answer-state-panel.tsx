"use client";

import { convexQuery } from "@convex-dev/react-query";
import type { GenericId } from "convex/values";
import { useQuery } from "@tanstack/react-query";
import type { JSX } from "react";

import Showblock from "@/features/admin/room/show-block";
import { api } from "@srdl/backend/convex/client";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@srdl/ui/components/empty";
import type { LocalStorageOptions } from "@srdl/ui/hooks/use-local-storage";
import { useLocalStorage } from "@srdl/ui/hooks/use-local-storage";

const ONBOARDING_ID_STORAGE_KEY = "id";
const ONBOARDING_NICKNAME_STORAGE_KEY = "nickname";
const stringLocalStorageOptions: LocalStorageOptions<string> = {
  defaultValue: "",
  deserializer: (value) => value,
  serializer: (value) => value,
};

interface AnswerStatePanelProps {
  activePrompt: {
    answer: string;
    playerId: string;
    playerName: string;
    questionIndex: number;
    roomState: string;
    selectedAt: number;
    submissionId: string;
  };
  questionIndex: number;
  roomId: GenericId<"rooms">;
}

export function AnswerStatePanel({
  activePrompt,
  questionIndex,
  roomId,
}: AnswerStatePanelProps): JSX.Element {
  const [playerId] = useLocalStorage(ONBOARDING_ID_STORAGE_KEY, stringLocalStorageOptions);
  const [playerName] = useLocalStorage(ONBOARDING_NICKNAME_STORAGE_KEY, stringLocalStorageOptions);
  const normalizedPlayerId = playerId.trim();
  const normalizedPlayerName = playerName.trim();
  const hasIdentity = normalizedPlayerId !== "" && normalizedPlayerName !== "";

  const playerGuessQuery = useQuery({
    ...convexQuery(api.games.roomPlayerGuesses.getForRoomQuestionAndPlayer, {
      guesserPlayerId: normalizedPlayerId,
      questionIndex,
      roomId,
    }),
    enabled: hasIdentity,
  });

  if (!hasIdentity) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Complete onboarding first</EmptyTitle>
          <EmptyDescription>
            We need your saved player identity before we can show your answer result.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (playerGuessQuery.isPending) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">Loading your result...</p>
      </div>
    );
  }

  if (playerGuessQuery.error) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Failed to load answer result</EmptyTitle>
          <EmptyDescription>We could not load your saved guess for this question.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const isCorrect = playerGuessQuery.data?.guessedPlayerId === activePrompt.playerId;
  const resultCopy = isCorrect ? "Yes, you got it right." : "No, that was not your guess.";

  return (
    <section className="flex w-full max-w-6xl flex-col items-center gap-8 py-4 text-center">
      <div className="space-y-3">
        <h2 className="font-heading text-3xl sm:text-4xl">Answer Reveal</h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Here is how your guess turned out.
        </p>
      </div>

      <Showblock answer={activePrompt.answer} />

      <p className="font-heading text-3xl leading-tight sm:text-4xl lg:text-5xl">{resultCopy}</p>
    </section>
  );
}
