"use client";

import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import type { GenericId } from "convex/values";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { JSX } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import Showblock from "@/features/admin/room/show-block";
import { api } from "@srdl/backend/convex/client";
import { Button } from "@srdl/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@srdl/ui/components/dialog";
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

interface GuessStatePanelProps {
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

interface GuessCandidate {
  playerId: string;
  playerName: string;
  submittedAt: number;
}

const sortCandidates = (candidates: GuessCandidate[]): GuessCandidate[] =>
  // `toSorted` is unavailable under the repo's current ES2022 target.
  // eslint-disable-next-line unicorn/no-array-sort
  [...candidates].sort((left, right) => {
    const leftName = left.playerName.toLowerCase();
    const rightName = right.playerName.toLowerCase();

    if (leftName !== rightName) {
      return leftName > rightName ? 1 : -1;
    }

    if (left.submittedAt !== right.submittedAt) {
      return left.submittedAt > right.submittedAt ? 1 : -1;
    }

    if (left.playerId === right.playerId) {
      return 0;
    }

    return left.playerId > right.playerId ? 1 : -1;
  });

export function GuessStatePanel({
  activePrompt,
  questionIndex,
  roomId,
}: GuessStatePanelProps): JSX.Element {
  const [playerId] = useLocalStorage(ONBOARDING_ID_STORAGE_KEY, stringLocalStorageOptions);
  const [playerName] = useLocalStorage(ONBOARDING_NICKNAME_STORAGE_KEY, stringLocalStorageOptions);
  const [selectedCandidate, setSelectedCandidate] = useState<GuessCandidate | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSubmittingGuess, setIsSubmittingGuess] = useState(false);
  const normalizedPlayerId = playerId.trim();
  const normalizedPlayerName = playerName.trim();
  const hasIdentity = normalizedPlayerId !== "" && normalizedPlayerName !== "";
  const queryClient = useQueryClient();
  const createGuess = useMutation(api.games.roomPlayerGuesses.create);
  const candidatesQueryOptions = convexQuery(api.games.roomPlayerSubmissions.listByRoom, {
    roomId,
  });
  const playerGuessQueryOptions = convexQuery(
    api.games.roomPlayerGuesses.getForRoomQuestionAndPlayer,
    {
      guesserPlayerId: normalizedPlayerId,
      questionIndex,
      roomId,
    },
  );

  const candidatesQuery = useQuery(candidatesQueryOptions);
  const playerGuessQuery = useQuery({
    ...playerGuessQueryOptions,
    enabled: hasIdentity,
  });

  const sortedCandidates = useMemo(
    () =>
      sortCandidates(
        (candidatesQuery.data ?? []).map((candidate) => ({
          playerId: candidate.playerId,
          playerName: candidate.playerName,
          submittedAt: candidate.submittedAt,
        })),
      ),
    [candidatesQuery.data],
  );

  const lockedGuess = playerGuessQuery.data ?? null;
  const hasLockedGuess = lockedGuess !== null;

  const handleConfirmGuess = async (): Promise<void> => {
    if (selectedCandidate === null) {
      return;
    }

    try {
      setIsSubmittingGuess(true);
      await createGuess({
        guessedPlayerId: selectedCandidate.playerId,
        guessedPlayerName: selectedCandidate.playerName,
        guesserPlayerId: normalizedPlayerId,
        guesserPlayerName: normalizedPlayerName,
        questionIndex,
        roomId,
      });
      toast.success("Guess locked successfully.");
      setIsConfirmDialogOpen(false);
      setSelectedCandidate(null);
      await queryClient.fetchQuery(playerGuessQueryOptions);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to lock your guess.";

      toast.error(message);

      if (message === "You already locked a guess for this question.") {
        await queryClient.fetchQuery(playerGuessQueryOptions);
      }
    } finally {
      setIsSubmittingGuess(false);
    }
  };

  if (!hasIdentity) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Complete onboarding first</EmptyTitle>
          <EmptyDescription>
            We need your saved player identity before you can submit a guess.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (candidatesQuery.isPending || playerGuessQuery.isPending) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">Loading guessing options...</p>
      </div>
    );
  }

  if (candidatesQuery.error || playerGuessQuery.error) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Failed to load guessing options</EmptyTitle>
          <EmptyDescription>
            We could not load the player choices for this question.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (sortedCandidates.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No players available</EmptyTitle>
          <EmptyDescription>
            No submitted players are available to guess from for this question yet.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <section className="flex w-full max-w-6xl flex-col items-center gap-8 py-4">
        <div className="space-y-3 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl">Guessing Time!</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Who wrote this answer?</p>
        </div>

        <Showblock answer={activePrompt.answer} />

        <div className="grid w-full max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCandidates.map((candidate) => {
            const isSelected = lockedGuess?.guessedPlayerId === candidate.playerId;
            const buttonClassName = isSelected
              ? "border-primary bg-primary text-primary-foreground hover:bg-primary disabled:opacity-100"
              : "disabled:border-border disabled:bg-background disabled:text-muted-foreground disabled:opacity-100";

            return (
              <Button
                key={candidate.playerId}
                className={buttonClassName}
                disabled={hasLockedGuess}
                onClick={() => {
                  setSelectedCandidate(candidate);
                  setIsConfirmDialogOpen(true);
                }}
                size="lg"
                type="button"
                variant={isSelected ? "default" : "outline"}
              >
                {candidate.playerName}
              </Button>
            );
          })}
        </div>
      </section>

      <Dialog onOpenChange={setIsConfirmDialogOpen} open={isConfirmDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Lock this guess?</DialogTitle>
            <DialogDescription>You can only guess once for this question.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={isSubmittingGuess}
              onClick={() => {
                setIsConfirmDialogOpen(false);
                setSelectedCandidate(null);
              }}
              type="button"
              variant="outline"
            >
              Go back
            </Button>
            <Button
              disabled={isSubmittingGuess || selectedCandidate === null}
              onClick={() => {
                void handleConfirmGuess();
              }}
              type="button"
            >
              {isSubmittingGuess ? "Locking..." : "Lock guess"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
