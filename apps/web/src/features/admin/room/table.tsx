import { convexQuery } from "@convex-dev/react-query";
import { Button, buttonVariants } from "@srdl/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@srdl/ui/components/dialog";
import { Monitor, Presentation, Text } from "lucide-react";
import { api } from "@srdl/backend/convex/client";
import { DataTableSkeleton } from "@srdl/ui/components/data-table/skeleton";
import { RelativeTimeCard } from "@srdl/ui/components/relative-time-card";
import { Badge } from "@srdl/ui/components/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { DataTable } from "@srdl/ui/components/data-table";
import { DataTableColumnHeader } from "@srdl/ui/components/data-table/column-header";
import { DataTableToolbar } from "@srdl/ui/components/data-table/toolbar";
import { useDataTable, useDataTableQueryState } from "@srdl/ui/hooks/use-data-table";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import CreateRoomForm from "@/features/admin/room/create-room-form";
import { ROOM_STATES, getRoomStateLabel } from "@/shared/games";

const generatePreviewRoomCode = (): string =>
  Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");

interface RoomRow {
  code: string;
  createdAt: string;
  id: string;
  questionCount: number;
  state: string;
  title: string;
}

const getTitleFilter = (value: string | string[] | null | undefined): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const title = value.trim();

  return title === "" ? null : title;
};

const getStateFilter = (value: string | string[] | null | undefined): string | string[] | null => {
  if (typeof value === "string") {
    const filterValue = value.trim().toLowerCase();

    return filterValue === "" ? null : filterValue;
  }

  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const normalizedValues = value
    .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
    .filter((item) => item !== "");

  return normalizedValues.length > 0 ? normalizedValues : null;
};

export function AdminRoomTable() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createRoomCode, setCreateRoomCode] = useState(generatePreviewRoomCode);

  const columns = useMemo<ColumnDef<RoomRow>[]>(
    () => [
      {
        accessorKey: "title",
        cell: ({ row }) => (
          <Link
            className="font-medium hover:underline"
            params={{ id: row.original.id }}
            to="/admin/room/$id"
          >
            {row.getValue("title")}
          </Link>
        ),
        enableColumnFilter: true,
        header: ({ column }) => <DataTableColumnHeader column={column} label="Title" />,
        id: "title",
        meta: {
          icon: Text,
          label: "Title",
          placeholder: "Search titles...",
          variant: "text",
        },
      },
      {
        accessorKey: "code",
        cell: ({ row }) => <div className="font-mono text-sm">{row.getValue("code")}</div>,
        enableColumnFilter: false,
        enableSorting: false,
        header: () => "Code",
        id: "code",
        meta: {
          label: "Code",
        },
      },
      {
        accessorKey: "state",
        cell: ({ row }) => {
          const state = row.getValue("state");
          const normalizedState = typeof state === "string" ? state : "";

          return <Badge variant="secondary">{getRoomStateLabel(normalizedState)}</Badge>;
        },
        enableColumnFilter: true,
        enableSorting: true,
        header: () => "State",
        id: "state",
        meta: {
          icon: Text,
          label: "State",
          options: ROOM_STATES.map((stateValue) => ({
            label: getRoomStateLabel(stateValue),
            value: stateValue,
          })),
          placeholder: "Filter states...",
          variant: "select",
        },
      },
      {
        accessorKey: "questionCount",
        cell: ({ row }) => <Badge variant="outline">{row.original.questionCount}</Badge>,
        enableColumnFilter: false,
        enableSorting: false,
        header: () => "Questions",
        id: "questionCount",
        meta: {
          label: "Questions",
        },
      },
      {
        accessorKey: "createdAt",
        cell: ({ row }) => {
          const createdAt = row.getValue("createdAt");
          const value = typeof createdAt === "string" || createdAt instanceof Date ? createdAt : "";

          return (
            <RelativeTimeCard
              className="text-muted-foreground text-sm"
              date={value}
              variant="muted"
            />
          );
        },
        header: ({ column }) => <DataTableColumnHeader column={column} label="Created At" />,
        id: "createdAt",
        meta: {
          label: "Created At",
        },
      },
      {
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Link
              aria-label={`Open ${row.original.title} room page`}
              className={buttonVariants({ size: "icon-sm", variant: "outline" })}
              params={{ id: row.original.id }}
              to="/admin/room/$id"
            >
              <Monitor />
            </Link>
            <Link
              aria-label={`Open ${row.original.title} projector page`}
              className={buttonVariants({ size: "icon-sm", variant: "outline" })}
              params={{ id: row.original.id }}
              to="/admin/room/$id/projector"
            >
              <Presentation />
            </Link>
          </div>
        ),
        enableColumnFilter: false,
        enableSorting: false,
        header: () => <div className="text-right">Actions</div>,
        id: "actions",
        meta: {
          label: "Actions",
        },
      },
    ],
    [],
  );

  const queryState = useDataTableQueryState({
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  const roomTableArgs = useMemo(
    () => ({
      filters: {
        state: getStateFilter(queryState.filterValues.state),
        title: getTitleFilter(queryState.filterValues.title),
      },
      page: queryState.page,
      perPage: queryState.perPage,
      sort:
        queryState.sorting.length > 0
          ? queryState.sorting.map(({ desc, id }) => ({
              desc,
              id: id as "createdAt" | "title",
            }))
          : [],
    }),
    [
      queryState.filterValues.title,
      queryState.filterValues.state,
      queryState.page,
      queryState.perPage,
      queryState.sorting,
    ],
  );

  const roomPage = useQuery({
    ...convexQuery(api.games.rooms.getTablePage, roomTableArgs),
    placeholderData: keepPreviousData,
  });

  const handleCreateDialogChange = (open: boolean): void => {
    setIsCreateDialogOpen(open);

    if (open) {
      setCreateRoomCode(generatePreviewRoomCode());
    }
  };

  const handleCreateSuccess = (): void => {
    setIsCreateDialogOpen(false);
    setCreateRoomCode(generatePreviewRoomCode());
    void roomPage.refetch();
  };

  const handleCreateCancel = (): void => {
    setIsCreateDialogOpen(false);
    setCreateRoomCode(generatePreviewRoomCode());
  };

  const { table } = useDataTable({
    columns,
    data: roomPage.data?.rows ?? [],
    getRowId: (row) => row.id,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
      sorting: [],
    },
    pageCount: roomPage.data?.pageCount ?? 0,
  });

  if (roomPage.isPending && !roomPage.data) {
    return <DataTableSkeleton columnCount={5} filterCount={1} />;
  }

  if (roomPage.error) {
    return (
      <section className="flex h-full min-h-0 items-center justify-center rounded-md border border-dashed">
        <p className="text-muted-foreground text-sm">Failed to load rooms.</p>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <Dialog onOpenChange={handleCreateDialogChange} open={isCreateDialogOpen}>
        <DialogContent className="w-full max-w-[calc(100%-1rem)] sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create room</DialogTitle>
            <DialogDescription>
              Add a room title, choose the question count, and review the generated 6-digit room
              code.
            </DialogDescription>
          </DialogHeader>
          <CreateRoomForm
            initialCode={createRoomCode}
            key={createRoomCode}
            onCancel={handleCreateCancel}
            onSuccess={handleCreateSuccess}
          />
        </DialogContent>
      </Dialog>
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <Button onClick={() => handleCreateDialogChange(true)}>Create Room</Button>
        </DataTableToolbar>
      </DataTable>
    </section>
  );
}
