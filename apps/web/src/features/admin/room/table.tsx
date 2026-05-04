import { Text } from "lucide-react";
import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@srdl/ui/components/data-table";
import { DataTableColumnHeader } from "@srdl/ui/components/data-table/column-header";
import { DataTableToolbar } from "@srdl/ui/components/data-table/toolbar";
import { useDataTable } from "@srdl/ui/hooks/use-data-table";

interface RoomRow {
  id: string;
  title: string;
  createdAt: string;
}

const PAGE_SIZE = 10;

const ROOM_ROWS: RoomRow[] = [
  { createdAt: "2026-04-30T08:15:00.000Z", id: "room-01", title: "Sunrise Suite" },
  { createdAt: "2026-04-29T12:10:00.000Z", id: "room-02", title: "Garden View" },
  { createdAt: "2026-04-28T09:45:00.000Z", id: "room-03", title: "River Loft" },
  { createdAt: "2026-04-27T14:20:00.000Z", id: "room-04", title: "City Corner" },
  { createdAt: "2026-04-26T07:30:00.000Z", id: "room-05", title: "Ocean Terrace" },
  { createdAt: "2026-04-25T16:40:00.000Z", id: "room-06", title: "Forest Cabin" },
  { createdAt: "2026-04-24T10:55:00.000Z", id: "room-07", title: "Harbor Deluxe" },
  { createdAt: "2026-04-23T05:25:00.000Z", id: "room-08", title: "Skyline Studio" },
  { createdAt: "2026-04-22T19:05:00.000Z", id: "room-09", title: "Maple Retreat" },
  { createdAt: "2026-04-21T11:35:00.000Z", id: "room-10", title: "Cedar Room" },
  { createdAt: "2026-04-20T13:50:00.000Z", id: "room-11", title: "Palm Residence" },
  { createdAt: "2026-04-19T06:05:00.000Z", id: "room-12", title: "Lagoon Hideaway" },
];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function AdminRoomTable() {
  const columns = React.useMemo<ColumnDef<RoomRow>[]>(
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

          return (
            <div className="text-muted-foreground text-sm">
              {dateFormatter.format(new Date(value))}
            </div>
          );
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

  const { table } = useDataTable({
    columns,
    data: ROOM_ROWS,
    getRowId: (row) => row.id,
    pageCount: Math.ceil(ROOM_ROWS.length / PAGE_SIZE),
  });

  return (
    <section className="flex h-full min-h-0 flex-col">
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </section>
  );
}
