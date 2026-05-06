import { convexQuery } from "@convex-dev/react-query";
import { api } from "@srdl/backend/convex/client";
import { Button } from "@srdl/ui/components/button";
import { DataTable } from "@srdl/ui/components/data-table";
import { DataTableSkeleton } from "@srdl/ui/components/data-table/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@srdl/ui/components/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@srdl/ui/components/empty";
import { RelativeTimeCard } from "@srdl/ui/components/relative-time-card";
import type { ColumnDef } from "@tanstack/react-table";
import { getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import type { GenericId } from "convex/values";
import type { JSX } from "react";
import { useMemo, useState } from "react";
import type { RoomQuestion } from "@/shared/games";

interface WaitingTableProps {
  questions: RoomQuestion[];
  roomId: GenericId<"rooms">;
}

interface WaitingSubmissionRow {
  answers: string[];
  id: string;
  playerId: string;
  playerName: string;
  submittedAt: number;
}

export function WaitingTable({ questions, roomId }: WaitingTableProps): JSX.Element {
  const [selectedSubmission, setSelectedSubmission] = useState<WaitingSubmissionRow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const submissionsQuery = useQuery(
    convexQuery(api.games.roomPlayerSubmissions.listByRoom, {
      roomId,
    }),
  );

  const rows = useMemo<WaitingSubmissionRow[]>(
    () =>
      (submissionsQuery.data ?? []).map((submission) => ({
        answers: submission.answers,
        id: submission._id,
        playerId: submission.playerId,
        playerName: submission.playerName,
        submittedAt: submission.submittedAt,
      })),
    [submissionsQuery.data],
  );

  const columns = useMemo<ColumnDef<WaitingSubmissionRow>[]>(
    () => [
      {
        accessorKey: "playerName",
        cell: ({ row }) => <div className="font-medium">{row.original.playerName}</div>,
        enableSorting: false,
        header: () => "Player",
        id: "playerName",
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
      {
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedSubmission(row.original);
              setIsDialogOpen(true);
            }}
          >
            View Answers
          </Button>
        ),
        enableSorting: false,
        header: () => <div>Actions</div>,
        id: "actions",
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

  const handleDialogChange = (open: boolean): void => {
    setIsDialogOpen(open);

    if (!open) {
      setSelectedSubmission(null);
    }
  };

  if (submissionsQuery.isPending) {
    return (
      <DataTableSkeleton
        cellWidths={["40%", "35%", "25%"]}
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
          <EmptyTitle>Failed to load submissions</EmptyTitle>
          <EmptyDescription>We could not load waiting submissions for this room.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (rows.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No submissions yet</EmptyTitle>
          <EmptyDescription>
            No players have submitted their mission answers for this room yet.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <DataTable table={table} />
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedSubmission?.playerName ?? "Submitted answers"}</DialogTitle>
            <DialogDescription>
              Review the mission answers submitted during the waiting phase.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {questions.map((question, index) => (
              <div key={question.id} className="flex flex-col gap-1 rounded-lg border p-3">
                <p className="font-medium text-sm">{question.text}</p>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {selectedSubmission?.answers[index] ?? "-"}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
