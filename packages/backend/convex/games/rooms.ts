import { v } from "convex/values";

import type { Doc } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { DEFAULT_ROOM_STATE, ROOM_STATES } from "../roomStates";
import type { RoomState } from "../roomStates";
import {
  getQuestionIndexFromRoomState,
  isAnswerState,
  isGuessState,
  isPromptDrivenState,
  isShowState,
} from "./roomStatePrompts";

const DEFAULT_SORT = {
  desc: true,
  id: "createdAt",
} as const;
const MAX_PAGE_SIZE = 100;
// This example intentionally bounds reads so it stays safe before moving to a cursor-first design.
const MAX_TABLE_SCAN = 200;
const ROOM_CODE_REGEX = /^\d{6}$/;
const MAX_ROOM_CODE_GENERATION_ATTEMPTS = 20;

interface RoomSort {
  desc: boolean;
  id: "createdAt" | "title";
}

type RoomDocument = Doc<"rooms">;
type RoomPlayerSubmissionDocument = Doc<"roomPlayerSubmissions">;

const getCurrentRoomStateIndex = (state: string): number => ROOM_STATES.indexOf(state as RoomState);

const getNormalizedPage = (page: number): number => Math.max(1, Math.floor(page));

const getNormalizedPerPage = (perPage: number): number =>
  Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(perPage)));

const getNormalizedTitle = (title: string): string => title.trim();
const isValidRoomCode = (code: string): boolean => ROOM_CODE_REGEX.test(code);
const generateSixDigitRoomCode = (): string =>
  Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
const getRandomSubmission = (
  submissions: RoomPlayerSubmissionDocument[],
): RoomPlayerSubmissionDocument =>
  submissions[Math.floor(Math.random() * submissions.length)] as RoomPlayerSubmissionDocument;

const getProjectorPhase = (
  state: string,
): "answer" | "guess" | "show" | "unknown" | "waiting" | "wrap-up" => {
  if (state === "WAITING") {
    return "waiting";
  }

  if (state === "WRAP UP") {
    return "wrap-up";
  }

  if (isShowState(state)) {
    return "show";
  }

  if (isGuessState(state)) {
    return "guess";
  }

  if (isAnswerState(state)) {
    return "answer";
  }

  return "unknown";
};

const shouldPreserveActivePrompt = (
  room: RoomDocument,
  nextState: RoomState,
  nextQuestionIndex: number | null,
): boolean => {
  if (room.activePrompt === undefined || nextQuestionIndex === null) {
    return false;
  }

  return (
    isPromptDrivenState(nextState) &&
    room.activePrompt.questionIndex === nextQuestionIndex &&
    getQuestionIndexFromRoomState(room.activePrompt.roomState) === nextQuestionIndex
  );
};

const buildActivePrompt = (
  submission: RoomPlayerSubmissionDocument,
  nextState: RoomState,
  questionIndex: 0 | 1 | 2 | 3,
) => {
  const answer = submission.answers[questionIndex];

  if (answer === undefined || answer.trim() === "") {
    throw new Error("Selected player is missing an answer for this question.");
  }

  return {
    answer,
    playerId: submission.playerId,
    playerName: submission.playerName,
    questionIndex,
    roomState: nextState,
    selectedAt: Date.now(),
    submissionId: submission._id,
  };
};

const getNormalizedTitleFilter = (title: string | null | undefined): string | null => {
  if (!title) {
    return null;
  }

  const normalizedTitle = getNormalizedTitle(title).toLowerCase();

  return normalizedTitle === "" ? null : normalizedTitle;
};

const getNormalizedStateFilter = (
  state: string | string[] | null | undefined,
): string[] | string | null => {
  if (!state) {
    return null;
  }

  if (typeof state === "string") {
    const normalizedState = state.trim().toLowerCase();

    return normalizedState === "" ? null : normalizedState;
  }

  const normalizedStates = state
    .map((stateValue) => (typeof stateValue === "string" ? stateValue.trim().toLowerCase() : ""))
    .filter((stateValue) => stateValue !== "");

  return normalizedStates.length > 0 ? normalizedStates : null;
};

const getPrimarySort = (sorts: RoomSort[]): RoomSort => sorts[0] ?? DEFAULT_SORT;

const getSortableRoomTitle = (title: string): string => title.toLowerCase();

const compareRoomTitles = (
  left: { title: string },
  right: { title: string },
  desc: boolean,
): number => {
  const direction = desc ? -1 : 1;
  const leftTitle = getSortableRoomTitle(left.title);
  const rightTitle = getSortableRoomTitle(right.title);

  if (leftTitle === rightTitle) {
    return 0;
  }

  return leftTitle > rightTitle ? direction : -direction;
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

function sortRoomDocumentsByCreationTime(
  roomDocuments: RoomDocument[],
  desc: boolean,
): RoomDocument[] {
  // `toSorted` is unavailable under the repo's current ES2022 target.
  // eslint-disable-next-line unicorn/no-array-sort
  return [...roomDocuments].sort((left: RoomDocument, right: RoomDocument) =>
    compareRoomCreationTime(left, right, desc),
  );
}

export const create = mutation({
  args: {
    code: v.optional(v.string()),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const title = getNormalizedTitle(args.title);

    if (title === "") {
      throw new Error("Room title is required.");
    }

    let code: string;

    if (args.code === undefined) {
      let uniqueCode: string | null = null;

      for (let attempt = 0; attempt < MAX_ROOM_CODE_GENERATION_ATTEMPTS; attempt += 1) {
        const candidateCode = generateSixDigitRoomCode();
        const existingRoom = await ctx.db
          .query("rooms")
          .withIndex("by_code", (indexQuery) => indexQuery.eq("code", candidateCode))
          .unique();

        if (!existingRoom) {
          uniqueCode = candidateCode;
          break;
        }
      }

      if (uniqueCode === null) {
        throw new Error("Failed to generate a unique room code.");
      }

      code = uniqueCode;
    } else {
      const providedCode = args.code;

      if (!isValidRoomCode(providedCode)) {
        throw new Error("Room code must be 6 digits.");
      }

      const existingRoom = await ctx.db
        .query("rooms")
        .withIndex("by_code", (indexQuery) => indexQuery.eq("code", providedCode))
        .unique();

      if (existingRoom) {
        throw new Error("Room code already exists.");
      }

      code = providedCode;
    }

    return await ctx.db.insert("rooms", {
      code,
      state: DEFAULT_ROOM_STATE,
      title,
    });
  },
});

export const getTablePage = query({
  args: {
    filters: v.object({
      state: v.optional(v.union(v.string(), v.array(v.string()), v.null())),
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
    const roomDocuments = await ctx.db.query("rooms").take(MAX_TABLE_SCAN);
    const stateFilter = getNormalizedStateFilter(args.filters.state);
    const stateFilterValues = typeof stateFilter === "string" ? [stateFilter] : stateFilter;
    const filteredRoomDocuments = titleFilter
      ? roomDocuments.filter((room: RoomDocument) =>
          getSortableRoomTitle(room.title).startsWith(titleFilter),
        )
      : roomDocuments;
    const stateFilteredRoomDocuments =
      stateFilterValues === null
        ? filteredRoomDocuments
        : filteredRoomDocuments.filter((room: RoomDocument) =>
            stateFilterValues.includes(room.state.toLowerCase()),
          );
    const sortedRoomDocuments =
      titleFilter || primarySort.id === "title"
        ? sortFilteredRoomDocuments(stateFilteredRoomDocuments, primarySort)
        : sortRoomDocumentsByCreationTime(stateFilteredRoomDocuments, primarySort.desc);

    const totalCount = sortedRoomDocuments.length;
    const pageCount = Math.ceil(totalCount / perPage);
    const pageStartIndex = (page - 1) * perPage;
    const pagedRows = sortedRoomDocuments.slice(pageStartIndex, pageStartIndex + perPage);

    return {
      page,
      pageCount,
      perPage,
      rows: pagedRows.map((room: RoomDocument) => ({
        code: room.code,
        createdAt: new Date(room._creationTime).toISOString(),
        id: room._id,
        state: room.state,
        title: room.title,
      })),
      totalCount,
    };
  },
});

export const getById = query({
  args: {
    id: v.id("rooms"),
  },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getByCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) =>
    await ctx.db
      .query("rooms")
      .withIndex("by_code", (indexQuery) => indexQuery.eq("code", args.code))
      .unique(),
});

export const getProjectorState = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);

    if (room === null) {
      return null;
    }

    const questionIndex = getQuestionIndexFromRoomState(room.state);
    const phase = getProjectorPhase(room.state);
    const isPromptState = isPromptDrivenState(room.state);
    const activePrompt =
      isPromptState && room.activePrompt !== undefined ? room.activePrompt : null;

    return {
      activePrompt,
      phase,
      questionIndex,
      roomCode: room.code,
      roomId: room._id,
      roomState: room.state,
      roomTitle: room.title,
    };
  },
});

export const changeStateByDelta = mutation({
  args: {
    direction: v.union(v.literal("left"), v.literal("right")),
    id: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.id);

    if (room === null) {
      throw new Error("Room not found.");
    }

    const currentStateIndex = getCurrentRoomStateIndex(room.state);

    if (currentStateIndex === -1) {
      throw new Error(`Invalid room state: ${room.state}.`);
    }

    const stateDelta = args.direction === "right" ? 1 : -1;
    const nextStateIndex = currentStateIndex + stateDelta;

    if (nextStateIndex < 0 || nextStateIndex >= ROOM_STATES.length) {
      return room.state;
    }

    const nextState = ROOM_STATES[nextStateIndex];
    const nextQuestionIndex = getQuestionIndexFromRoomState(nextState);

    if (nextState === "WAITING" || nextState === "WRAP UP") {
      await ctx.db.patch(args.id, {
        activePrompt: undefined,
        state: nextState,
      });

      return nextState;
    }

    if (shouldPreserveActivePrompt(room, nextState, nextQuestionIndex)) {
      const { activePrompt } = room;

      if (activePrompt === undefined) {
        throw new Error("Missing active prompt for prompt-driven state transition.");
      }

      await ctx.db.patch(args.id, {
        activePrompt: {
          ...activePrompt,
          roomState: nextState,
        },
        state: nextState,
      });

      return nextState;
    }

    if (isShowState(nextState)) {
      const submissions = await ctx.db
        .query("roomPlayerSubmissions")
        .withIndex("by_room", (queryBuilder) => queryBuilder.eq("roomId", args.id))
        .collect();

      if (submissions.length === 0) {
        throw new Error("Cannot enter show state without player submissions.");
      }

      if (nextQuestionIndex === null) {
        throw new Error(`Unable to determine question index for state ${nextState}.`);
      }

      const selectedSubmission = getRandomSubmission(submissions);

      await ctx.db.patch(args.id, {
        activePrompt: buildActivePrompt(selectedSubmission, nextState, nextQuestionIndex),
        state: nextState,
      });

      return nextState;
    }

    return await ctx.db.patch(args.id, {
      state: nextState,
    });
  },
});
