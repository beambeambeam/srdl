import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    title: v.string(),
    titleLower: v.string(),
  }).index("by_title_lower", ["titleLower"]),
});
