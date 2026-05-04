import { convexQuery } from "@convex-dev/react-query";
import { Text } from "lucide-react";
import { api } from "@srdl/backend/convex/api";
import { DataTableSkeleton } from "@srdl/ui/components/data-table/skeleton";
import type { ColumnDef } from "@tanstack/react-table";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { DataTable } from "@srdl/ui/components/data-table";
import { DataTableColumnHeader } from "@srdl/ui/components/data-table/column-header";
import { DataTableToolbar } from "@srdl/ui/components/data-table/toolbar";
import { useDataTable, useDataTableQueryState } from "@srdl/ui/hooks/use-data-table";
import { useMemo } from "react";

interface RoomRow {
  id: string;
  title: string;
  createdAt: string;
}

interface RoomTablePage {
  rows: RoomRow[];
  totalCount: number;
  pageCount: number;
  page: number;
  perPage: number;
}

const getTitleFilter = (value: string | string[] | null | undefined): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const title = value.trim();

  return title === "" ? null : title;
};

export function AdminRoomTable() {
  const columns = useMemo<ColumnDef<RoomRow>[]>(
    () => [
      {
        accessorKey: "title",
        cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
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
        accessorKey: "createdAt",
        cell: ({ row }) => {
          const createdAt = row.getValue("createdAt");
          const value = typeof createdAt === "string" || createdAt instanceof Date ? createdAt : "";

          return <div className="text-muted-foreground text-sm">{value.toLocaleString()}</div>;
        },
        header: ({ column }) => <DataTableColumnHeader column={column} label="Created At" />,
        id: "createdAt",
        meta: {
          label: "Created At",
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
    [queryState.filterValues.title, queryState.page, queryState.perPage, queryState.sorting],
  );

  const roomPage = useQuery<RoomTablePage>({
    ...convexQuery(api.admin.rooms.getTablePage, roomTableArgs),
    placeholderData: keepPreviousData,
  });

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
    return <DataTableSkeleton columnCount={2} filterCount={1} />;
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
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </section>
  );
}
