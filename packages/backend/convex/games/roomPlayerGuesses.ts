import { v } from "convex/values";

import { query, mutation } from "../_generated/server";
import { getQuestionIndexFromRoomState, isGuessState } from "./roomStatePrompts";

const getTrimmedValue = (value: string): string => value.trim();

export const getForRoomQuestionAndPlayer = query({
  args: {
    guesserPlayerId: v.string(),
    questionIndex: v.number(),
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) =>
    await ctx.db
      .query("roomPlayerGuesses")
      .withIndex("by_room_question_guesser", (queryBuilder) =>
        queryBuilder
          .eq("roomId", args.roomId)
          .eq("questionIndex", args.questionIndex)
          .eq("guesserPlayerId", args.guesserPlayerId),
      )
      .unique(),
});

export const create = mutation({
  args: {
    guessedPlayerId: v.string(),
    guessedPlayerName: v.string(),
    guesserPlayerId: v.string(),
    guesserPlayerName: v.string(),
    questionIndex: v.number(),
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);

    if (room === null) {
      throw new Error("Room not found.");
    }

    if (!isGuessState(room.state)) {
      throw new Error("Room is not accepting guesses right now.");
    }

    const roomQuestionIndex = getQuestionIndexFromRoomState(room.state);

    if (roomQuestionIndex === null || roomQuestionIndex !== args.questionIndex) {
      throw new Error("Guess question does not match the current room state.");
    }

    if (room.activePrompt === undefined || room.activePrompt.questionIndex !== args.questionIndex) {
      throw new Error("No active prompt is available for this guess.");
    }

    const guesserPlayerId = getTrimmedValue(args.guesserPlayerId);
    const guesserPlayerName = getTrimmedValue(args.guesserPlayerName);
    const guessedPlayerId = getTrimmedValue(args.guessedPlayerId);
    const guessedPlayerName = getTrimmedValue(args.guessedPlayerName);

    if (guesserPlayerId === "") {
      throw new Error("Guesser player ID is required.");
    }

    if (guesserPlayerName === "") {
      throw new Error("Guesser player name is required.");
    }

    if (guessedPlayerId === "") {
      throw new Error("Guessed player ID is required.");
    }

    if (guessedPlayerName === "") {
      throw new Error("Guessed player name is required.");
    }

    const guessedSubmission = await ctx.db
      .query("roomPlayerSubmissions")
      .withIndex("by_room_player", (queryBuilder) =>
        queryBuilder.eq("roomId", args.roomId).eq("playerId", guessedPlayerId),
      )
      .unique();

    if (guessedSubmission === null) {
      throw new Error("Selected player is not available for this question.");
    }

    const existingGuess = await ctx.db
      .query("roomPlayerGuesses")
      .withIndex("by_room_question_guesser", (queryBuilder) =>
        queryBuilder
          .eq("roomId", args.roomId)
          .eq("questionIndex", args.questionIndex)
          .eq("guesserPlayerId", guesserPlayerId),
      )
      .unique();

    if (existingGuess !== null) {
      throw new Error("You already locked a guess for this question.");
    }

    return await ctx.db.insert("roomPlayerGuesses", {
      activePromptSubmissionId: room.activePrompt.submissionId,
      createdAt: Date.now(),
      guessedPlayerId,
      guessedPlayerName,
      guesserPlayerId,
      guesserPlayerName,
      questionIndex: args.questionIndex,
      roomId: args.roomId,
    });
  },
});
