import { v } from "convex/values";

import { query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

const ROOM_CODE_REGEX = /^\d{6}$/;

type RoomDocument = Doc<"rooms">;

const isValidRoomCode = (code: string): boolean => ROOM_CODE_REGEX.test(code);

export const getByCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args): Promise<RoomDocument | null> => {
    if (!isValidRoomCode(args.code)) {
      throw new Error("Room code must be 6 digits.");
    }

    return await ctx.db
      .query("rooms")
      .withIndex("by_code", (indexQuery) => indexQuery.eq("code", args.code))
      .unique();
  },
});
