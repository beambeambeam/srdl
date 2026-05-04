import { convexQuery } from "@convex-dev/react-query";
import { api } from "@srdl/backend/convex/client";
import { DataTable } from "@srdl/ui/components/data-table";
import { DataTableSkeleton } from "@srdl/ui/components/data-table/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@srdl/ui/components/empty";
import type { ColumnDef } from "@tanstack/react-table";
import { getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import type { GenericId } from "convex/values";
import type { JSX } from "react";
import { useMemo } from "react";

interface WrapUpTableProps {
  roomId: GenericId<"rooms">;
}

interface WrapUpSummaryRow {
  correctCount: number;
  playerId: string;
  playerName: string;
  totalGuesses: number;
  wrongCount: number;
}

export function WrapUpTable({ roomId }: WrapUpTableProps): JSX.Element {
  const wrapUpQuery = useQuery(
    convexQuery(api.games.roomPlayerGuesses.getWrapUpSummaryByRoom, {
      roomId,
    }),
  );

  const rows = useMemo<WrapUpSummaryRow[]>(() => wrapUpQuery.data ?? [], [wrapUpQuery.data]);

  const columns = useMemo<ColumnDef<WrapUpSummaryRow>[]>(
    () => [
      {
        accessorKey: "playerName",
        cell: ({ row }) => <div className="font-medium">{row.original.playerName}</div>,
        enableSorting: false,
        header: () => "Player",
        id: "playerName",
      },
      {
        accessorKey: "correctCount",
        cell: ({ row }) => <div className="font-medium">{row.original.correctCount}</div>,
        enableSorting: false,
        header: () => "Correct",
        id: "correctCount",
      },
      {
        accessorKey: "wrongCount",
        cell: ({ row }) => (
          <div className="text-muted-foreground font-medium">{row.original.wrongCount}</div>
        ),
        enableSorting: false,
        header: () => "Wrong",
        id: "wrongCount",
      },
      {
        accessorKey: "totalGuesses",
        cell: ({ row }) => <div>{row.original.totalGuesses}</div>,
        enableSorting: false,
        header: () => "Total",
        id: "totalGuesses",
      },
    ],
    [],
  );

  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.playerId,
  });

  if (wrapUpQuery.isPending) {
    return (
      <DataTableSkeleton
        cellWidths={["34%", "22%", "22%", "22%"]}
        columnCount={4}
        filterCount={0}
        rowCount={5}
        withPagination={false}
        withViewOptions={false}
      />
    );
  }

  if (wrapUpQuery.error) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Failed to load wrap-up summary</EmptyTitle>
          <EmptyDescription>We could not load guess results for this room.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (rows.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No guess results yet</EmptyTitle>
          <EmptyDescription>
            Players have not completed enough guesses to produce a wrap-up summary yet.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return <DataTable table={table} />;
}
