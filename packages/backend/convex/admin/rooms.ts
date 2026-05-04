import { v } from "convex/values";

import type { Doc } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";

const DEFAULT_SORT = {
  desc: true,
  id: "createdAt",
} as const;
const MAX_PAGE_SIZE = 100;
// This example intentionally bounds reads so it stays safe before moving to a cursor-first design.
const MAX_TABLE_SCAN = 200;
const ROOM_TITLE_RANGE_SUFFIX = "\uFFFF";

interface RoomSort {
  desc: boolean;
  id: "createdAt" | "title";
}

type RoomDocument = Doc<"rooms">;

const getNormalizedPage = (page: number): number => Math.max(1, Math.floor(page));

const getNormalizedPerPage = (perPage: number): number =>
  Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(perPage)));

const getNormalizedTitle = (title: string): string => title.trim();

const getNormalizedTitleFilter = (title: string | null | undefined): string | null => {
  if (!title) {
    return null;
  }

  const normalizedTitle = getNormalizedTitle(title).toLowerCase();

  return normalizedTitle === "" ? null : normalizedTitle;
};

const getPrimarySort = (sorts: RoomSort[]): RoomSort => sorts[0] ?? DEFAULT_SORT;

const compareRoomTitles = (
  left: { titleLower: string },
  right: { titleLower: string },
  desc: boolean,
): number => {
  const direction = desc ? -1 : 1;

  if (left.titleLower === right.titleLower) {
    return 0;
  }

  return left.titleLower > right.titleLower ? direction : -direction;
};

const compareRoomCreationTime = (
  left: { _creationTime: number },
  right: { _creationTime: number },
  desc: boolean,
): number => {
  if (left._creationTime === right._creationTime) {
    return 0;
  }

  if (desc) {
    return left._creationTime < right._creationTime ? 1 : -1;
  }

  return left._creationTime > right._creationTime ? 1 : -1;
};

function sortFilteredRoomDocuments(
  roomDocuments: RoomDocument[],
  primarySort: RoomSort,
): RoomDocument[] {
  // `toSorted` is unavailable under the repo's current ES2022 target.
  // eslint-disable-next-line unicorn/no-array-sort
  return [...roomDocuments].sort((left: RoomDocument, right: RoomDocument) =>
    primarySort.id === "title"
      ? compareRoomTitles(left, right, primarySort.desc)
      : compareRoomCreationTime(left, right, primarySort.desc),
  );
}

export const create = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const title = getNormalizedTitle(args.title);

    if (title === "") {
      throw new Error("Room title is required.");
    }

    return await ctx.db.insert("rooms", {
      title,
      titleLower: title.toLowerCase(),
    });
  },
});

export const getTablePage = query({
  args: {
    filters: v.object({
      title: v.optional(v.union(v.string(), v.null())),
    }),
    page: v.number(),
    perPage: v.number(),
    sort: v.array(
      v.object({
        desc: v.boolean(),
        id: v.union(v.literal("createdAt"), v.literal("title")),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const page = getNormalizedPage(args.page);
    const perPage = getNormalizedPerPage(args.perPage);
    const primarySort = getPrimarySort(args.sort);
    const titleFilter = getNormalizedTitleFilter(args.filters.title);
    let roomDocuments: RoomDocument[];

    if (titleFilter) {
      roomDocuments = await ctx.db
        .query("rooms")
        .withIndex("by_title_lower", (queryBuilder) =>
          queryBuilder
            .gte("titleLower", titleFilter)
            .lt("titleLower", `${titleFilter}${ROOM_TITLE_RANGE_SUFFIX}`),
        )
        .take(MAX_TABLE_SCAN);
    } else if (primarySort.id === "title") {
      roomDocuments = await ctx.db
        .query("rooms")
        .withIndex("by_title_lower")
        .order(primarySort.desc ? "desc" : "asc")
        .take(MAX_TABLE_SCAN);
    } else {
      roomDocuments = await ctx.db
        .query("rooms")
        .order(primarySort.desc ? "desc" : "asc")
        .take(MAX_TABLE_SCAN);
    }

    const sortedRoomDocuments = titleFilter
      ? sortFilteredRoomDocuments(roomDocuments, primarySort)
      : roomDocuments;

    const totalCount = sortedRoomDocuments.length;
    const pageCount = Math.ceil(totalCount / perPage);
    const pageStartIndex = (page - 1) * perPage;
    const pagedRows = sortedRoomDocuments.slice(pageStartIndex, pageStartIndex + perPage);

    return {
      page,
      pageCount,
      perPage,
      rows: pagedRows.map((room: RoomDocument) => ({
        createdAt: new Date(room._creationTime).toISOString(),
        id: room._id,
        title: room.title,
      })),
      totalCount,
    };
  },
});
