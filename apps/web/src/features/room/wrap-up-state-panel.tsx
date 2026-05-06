"use client";

import { convexQuery } from "@convex-dev/react-query";
import { api } from "@srdl/backend/convex/client";
import { Button } from "@srdl/ui/components/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@srdl/ui/components/empty";
import type { LocalStorageOptions } from "@srdl/ui/hooks/use-local-storage";
import { useLocalStorage } from "@srdl/ui/hooks/use-local-storage";
import type { GenericId } from "convex/values";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { JSX } from "react";

const ONBOARDING_ID_STORAGE_KEY = "id";
const ONBOARDING_NICKNAME_STORAGE_KEY = "nickname";
const stringLocalStorageOptions: LocalStorageOptions<string> = {
  defaultValue: "",
  deserializer: (value) => value,
  serializer: (value) => value,
};

interface WrapUpStatePanelProps {
  roomId: GenericId<"rooms">;
}

export function WrapUpStatePanel({ roomId }: WrapUpStatePanelProps): JSX.Element {
  const [playerId] = useLocalStorage(ONBOARDING_ID_STORAGE_KEY, stringLocalStorageOptions);
  const [playerName] = useLocalStorage(ONBOARDING_NICKNAME_STORAGE_KEY, stringLocalStorageOptions);
  const normalizedPlayerId = playerId.trim();
  const normalizedPlayerName = playerName.trim();
  const hasIdentity = normalizedPlayerId !== "" && normalizedPlayerName !== "";
  const wrapUpQuery = useQuery({
    ...convexQuery(api.games.roomPlayerGuesses.getWrapUpSummaryByRoom, {
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
            We need your saved player identity before we can show your wrap-up score.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (wrapUpQuery.isPending) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">Loading your wrap-up score...</p>
      </div>
    );
  }

  if (wrapUpQuery.error) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Failed to load wrap-up score</EmptyTitle>
          <EmptyDescription>We could not load your final score for this room.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const playerSummary =
    wrapUpQuery.data?.find((row) => row.playerId === normalizedPlayerId) ?? null;

  if (playerSummary === null) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Wrap-up score unavailable</EmptyTitle>
          <EmptyDescription>
            We could not find any completed guess results for {normalizedPlayerName} yet.
          </EmptyDescription>
        </EmptyHeader>
        <div className="mt-4">
          <Link to="/room">
            <Button type="button">Go to rooms</Button>
          </Link>
        </div>
      </Empty>
    );
  }

  return (
    <section className="flex w-full max-w-4xl flex-col items-center gap-8 py-4 text-center">
      <div className="space-y-3">
        <h2 className="font-heading text-3xl sm:text-4xl">Wrap Up</h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Here is how you finished this room.
        </p>
      </div>

      <div className="rounded-2xl border bg-background px-8 py-6 shadow-sm">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">Score</p>
        <p className="mt-2 font-heading text-5xl leading-none sm:text-6xl">
          {playerSummary.correctCount}/{playerSummary.totalGuesses}
        </p>
      </div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-background p-4 text-left">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Correct</p>
          <p className="mt-2 font-heading text-3xl">{playerSummary.correctCount}</p>
        </div>
        <div className="rounded-xl border bg-background p-4 text-left">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Wrong</p>
          <p className="mt-2 font-heading text-3xl">{playerSummary.wrongCount}</p>
        </div>
      </div>

      <Link to="/room">
        <Button type="button">Go to rooms</Button>
      </Link>
    </section>
  );
}
