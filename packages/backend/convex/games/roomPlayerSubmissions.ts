import { v } from "convex/values";

import { mutation, query } from "../_generated/server";
import { getRoomQuestionCount } from "../roomStates";

const MAX_ANSWER_LENGTH = 280;

const getTrimmedValue = (value: string): string => value.trim();

const getNormalizedAnswers = (answers: string[]): string[] => answers.map(getTrimmedValue);

const isValidAnswerList = (answers: string[], questionCount: number): boolean =>
  answers.length === questionCount &&
  answers.every((answer) => answer !== "" && answer.length <= MAX_ANSWER_LENGTH);

export const getForRoomAndPlayer = query({
  args: {
    playerId: v.string(),
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) =>
    await ctx.db
      .query("roomPlayerSubmissions")
      .withIndex("by_room_player", (queryBuilder) =>
        queryBuilder.eq("roomId", args.roomId).eq("playerId", args.playerId),
      )
      .unique(),
});

export const listByRoom = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) =>
    await ctx.db
      .query("roomPlayerSubmissions")
      .withIndex("by_room", (queryBuilder) => queryBuilder.eq("roomId", args.roomId))
      .collect(),
});

export const create = mutation({
  args: {
    answers: v.array(v.string()),
    playerId: v.string(),
    playerName: v.string(),
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);

    if (room === null) {
      throw new Error("Room not found.");
    }

    const questionCount = getRoomQuestionCount(room.questionCount);

    const playerId = getTrimmedValue(args.playerId);
    const playerName = getTrimmedValue(args.playerName);
    const answers = getNormalizedAnswers(args.answers);

    if (playerId === "") {
      throw new Error("Player ID is required.");
    }

    if (playerName === "") {
      throw new Error("Player name is required.");
    }

    if (!isValidAnswerList(answers, questionCount)) {
      throw new Error(`Exactly ${questionCount} non-empty answers are required.`);
    }

    const existingSubmission = await ctx.db
      .query("roomPlayerSubmissions")
      .withIndex("by_room_player", (queryBuilder) =>
        queryBuilder.eq("roomId", args.roomId).eq("playerId", playerId),
      )
      .unique();

    if (existingSubmission !== null) {
      throw new Error("You already submitted this form.");
    }

    return await ctx.db.insert("roomPlayerSubmissions", {
      answers,
      playerId,
      playerName,
      roomId: args.roomId,
      submittedAt: Date.now(),
    });
  },
});
