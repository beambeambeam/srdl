import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import { ROOM_STATES } from "./roomStates";

const roomStateValidators = ROOM_STATES.map((state) => v.literal(state));

export default defineSchema({
  roomPlayerSubmissions: defineTable({
    answers: v.array(v.string()),
    playerId: v.string(),
    playerName: v.string(),
    roomId: v.id("rooms"),
    submittedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_player", ["roomId", "playerId"]),
  rooms: defineTable({
    code: v.string(),
    state: v.union(...roomStateValidators),
    title: v.string(),
  }).index("by_code", ["code"]),
});
