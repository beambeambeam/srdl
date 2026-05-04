import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import { ROOM_STATES } from "./roomStates";

const roomStateValidators = ROOM_STATES.map((state) => v.literal(state));

export default defineSchema({
  rooms: defineTable({
    code: v.string(),
    state: v.union(...roomStateValidators),
    title: v.string(),
  }).index("by_code", ["code"]),
});
