import { convexQuery } from "@convex-dev/react-query";
import { api } from "@srdl/backend/convex/client";
import { DataTable } from "@srdl/ui/components/data-table";
import { DataTableSkeleton } from "@srdl/ui/components/data-table/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@srdl/ui/components/empty";
import { RelativeTimeCard } from "@srdl/ui/components/relative-time-card";
import type { ColumnDef } from "@tanstack/react-table";
import { getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import type { GenericId } from "convex/values";
import type { JSX } from "react";
import { useMemo } from "react";

interface QuestionAnswerTableProps {
  questionIndex: 0 | 1 | 2 | 3;
  questionLabel: string;
  roomId: GenericId<"rooms">;
}

interface QuestionAnswerRow {
  answer: string;
  id: string;
  playerId: string;
  playerName: string;
  submittedAt: number;
}

export function QuestionAnswerTable({
  questionIndex,
  questionLabel,
  roomId,
}: QuestionAnswerTableProps): JSX.Element {
  const submissionsQuery = useQuery(
    convexQuery(api.games.roomPlayerSubmissions.listByRoom, {
      roomId,
    }),
  );

  const rows = useMemo<QuestionAnswerRow[]>(
    () =>
      (submissionsQuery.data ?? []).map((submission) => ({
        answer: submission.answers[questionIndex] ?? "-",
        id: submission._id,
        playerId: submission.playerId,
        playerName: submission.playerName,
        submittedAt: submission.submittedAt,
      })),
    [questionIndex, submissionsQuery.data],
  );

  const columns = useMemo<ColumnDef<QuestionAnswerRow>[]>(
    () => [
      {
        accessorKey: "playerName",
        cell: ({ row }) => <div className="font-medium">{row.original.playerName}</div>,
        enableSorting: false,
        header: () => "Player",
        id: "playerName",
      },
      {
        accessorKey: "answer",
        cell: ({ row }) => (
          <div className="max-w-xl text-sm whitespace-pre-wrap">{row.original.answer || "-"}</div>
        ),
        enableSorting: false,
        header: () => "Answer",
        id: "answer",
      },
      {
        accessorKey: "submittedAt",
        cell: ({ row }) => (
          <RelativeTimeCard
            className="text-muted-foreground text-sm"
            date={row.original.submittedAt}
            variant="muted"
          />
        ),
        enableSorting: false,
        header: () => "Submitted At",
        id: "submittedAt",
      },
    ],
    [],
  );

  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
  });

  if (submissionsQuery.isPending) {
    return (
      <DataTableSkeleton
        cellWidths={["24%", "50%", "26%"]}
        columnCount={3}
        filterCount={0}
        rowCount={5}
        withPagination={false}
        withViewOptions={false}
      />
    );
  }

  if (submissionsQuery.error) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Failed to load answers</EmptyTitle>
          <EmptyDescription>
            We could not load submitted answers for {questionLabel}.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (rows.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No answers yet</EmptyTitle>
          <EmptyDescription>
            No players have submitted an answer for {questionLabel} yet.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return <DataTable table={table} />;
}
