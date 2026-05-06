import { v } from "convex/values";

import type { Doc } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import {
  DEFAULT_NEW_ROOM_QUESTION_COUNT,
  DEFAULT_ROOM_STATE,
  getQuestionIndexes,
  getResolvedRoomQuestionCount,
  getResolvedRoomQuestions,
  getRoomStatesForQuestionCount,
  MAX_ROOM_QUESTION_COUNT,
  MIN_ROOM_QUESTION_COUNT,
} from "../roomStates";
import type { RoomState, StoredRoomQuestion } from "../roomStates";
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

interface PromptSelection {
  answer: string;
  playerId: string;
  playerName: string;
  questionIndex: number;
  selectedAt: number;
  submissionId: RoomPlayerSubmissionDocument["_id"];
}

interface RoomQuestionInput {
  id: string;
  text: string;
}

const getNormalizedPage = (page: number): number => Math.max(1, Math.floor(page));

const getNormalizedPerPage = (perPage: number): number =>
  Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(perPage)));

const getNormalizedTitle = (title: string): string => title.trim();
const getNormalizedQuestionId = (questionId: string): string => questionId.trim();
const getNormalizedQuestionText = (questionText: string): string => questionText.trim();
const isValidRoomCode = (code: string): boolean => ROOM_CODE_REGEX.test(code);
const isValidQuestionCount = (questionCount: number): boolean =>
  Number.isInteger(questionCount) &&
  questionCount >= MIN_ROOM_QUESTION_COUNT &&
  questionCount <= MAX_ROOM_QUESTION_COUNT;
const isValidQuestionList = (questions: RoomQuestionInput[]): boolean =>
  questions.length >= MIN_ROOM_QUESTION_COUNT &&
  questions.length <= MAX_ROOM_QUESTION_COUNT &&
  questions.every(
    (question) =>
      getNormalizedQuestionId(question.id) !== "" &&
      getNormalizedQuestionText(question.text) !== "",
  );
const generateSixDigitRoomCode = (): string =>
  Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
const getRandomSubmission = (
  submissions: RoomPlayerSubmissionDocument[],
): RoomPlayerSubmissionDocument =>
  submissions[Math.floor(Math.random() * submissions.length)] as RoomPlayerSubmissionDocument;

const getNormalizedStoredQuestions = (questions: RoomQuestionInput[]): StoredRoomQuestion[] =>
  questions.map((question) => ({
    id: getNormalizedQuestionId(question.id),
    text: getNormalizedQuestionText(question.text),
  }));

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

const buildPromptSelection = (
  submission: RoomPlayerSubmissionDocument,
  questionIndex: number,
): PromptSelection => {
  const answer = submission.answers[questionIndex];

  if (answer === undefined || answer.trim() === "") {
    throw new Error("Selected player is missing an answer for this question.");
  }

  return {
    answer,
    playerId: submission.playerId,
    playerName: submission.playerName,
    questionIndex,
    selectedAt: Date.now(),
    submissionId: submission._id,
  };
};

const buildActivePromptFromSelection = (selection: PromptSelection, roomState: RoomState) => ({
  ...selection,
  roomState,
});

const getPromptSelectionByQuestionIndex = (
  promptSelections: PromptSelection[] | undefined,
  questionIndex: number,
): PromptSelection | null =>
  promptSelections?.find(
    (promptSelection: PromptSelection) => promptSelection.questionIndex === questionIndex,
  ) ?? null;

const setPromptSelectionForQuestionIndex = (
  promptSelections: PromptSelection[] | undefined,
  selection: PromptSelection,
): PromptSelection[] => {
  const nextPromptSelections = (promptSelections ?? []).filter(
    (promptSelection: PromptSelection) => promptSelection.questionIndex !== selection.questionIndex,
  );

  nextPromptSelections.push(selection);
  nextPromptSelections.sort(
    (left: PromptSelection, right: PromptSelection) => left.questionIndex - right.questionIndex,
  );

  return nextPromptSelections;
};

const getLegacyPromptSelection = (
  room: RoomDocument,
  questionIndex: number,
): PromptSelection | null => {
  if (room.activePrompt === undefined || room.activePrompt.questionIndex !== questionIndex) {
    return null;
  }

  return {
    answer: room.activePrompt.answer,
    playerId: room.activePrompt.playerId,
    playerName: room.activePrompt.playerName,
    questionIndex: room.activePrompt.questionIndex,
    selectedAt: room.activePrompt.selectedAt,
    submissionId: room.activePrompt.submissionId,
  };
};

const getPersistedPromptSelection = (
  room: RoomDocument,
  questionIndex: number,
): PromptSelection | null =>
  getPromptSelectionByQuestionIndex(room.promptSelections, questionIndex) ??
  getLegacyPromptSelection(room, questionIndex);

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

const getRoomView = (room: RoomDocument) => {
  const questions = getResolvedRoomQuestions(room);

  return {
    _id: room._id,
    code: room.code,
    questionCount: questions.length,
    questions,
    state: room.state,
    title: room.title,
  };
};

export const create = mutation({
  args: {
    code: v.optional(v.string()),
    questionCount: v.optional(v.number()),
    questions: v.optional(
      v.array(
        v.object({
          id: v.string(),
          text: v.string(),
        }),
      ),
    ),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const title = getNormalizedTitle(args.title);

    if (title === "") {
      throw new Error("Room title is required.");
    }

    const normalizedQuestions =
      args.questions === undefined ? undefined : getNormalizedStoredQuestions(args.questions);
    const questionCount =
      args.questionCount ?? normalizedQuestions?.length ?? DEFAULT_NEW_ROOM_QUESTION_COUNT;

    if (!isValidQuestionCount(questionCount)) {
      throw new Error(
        `Question count must be an integer between ${MIN_ROOM_QUESTION_COUNT} and ${MAX_ROOM_QUESTION_COUNT}.`,
      );
    }

    if (normalizedQuestions !== undefined) {
      if (!isValidQuestionList(normalizedQuestions)) {
        throw new Error("Room questions must contain between 1 and 10 non-empty prompts.");
      }

      if (normalizedQuestions.length !== questionCount) {
        throw new Error("Question count must match the number of question rows.");
      }
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
      questionCount,
      questions: normalizedQuestions,
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
        questionCount: getResolvedRoomQuestionCount(room),
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

export const getByIdForView = query({
  args: {
    id: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.id);

    return room === null ? null : getRoomView(room);
  },
});

export const getByCodeForView = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (indexQuery) => indexQuery.eq("code", args.code))
      .unique();

    return room === null ? null : getRoomView(room);
  },
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

    const questions = getResolvedRoomQuestions(room);
    const questionIndex = getQuestionIndexFromRoomState(room.state);
    const phase = getProjectorPhase(room.state);
    const isPromptState = isPromptDrivenState(room.state);
    const persistedSelection =
      isPromptState && questionIndex !== null
        ? getPersistedPromptSelection(room, questionIndex)
        : null;
    let activePrompt = null;

    if (isPromptState) {
      if (room.activePrompt !== undefined) {
        ({ activePrompt } = room);
      } else if (persistedSelection !== null) {
        activePrompt = buildActivePromptFromSelection(persistedSelection, room.state);
      }
    }

    return {
      activePrompt,
      phase,
      questionIndex,
      questionText: questionIndex === null ? null : (questions[questionIndex]?.text ?? null),
      questions,
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

    const questionCount = getResolvedRoomQuestionCount(room);
    const roomStates = getRoomStatesForQuestionCount(questionCount);
    const currentStateIndex = roomStates.indexOf(room.state as RoomState);

    if (currentStateIndex === -1) {
      throw new Error(`Invalid room state: ${room.state}.`);
    }

    const stateDelta = args.direction === "right" ? 1 : -1;
    const nextStateIndex = currentStateIndex + stateDelta;

    if (nextStateIndex < 0 || nextStateIndex >= roomStates.length) {
      return room.state;
    }

    const nextState = roomStates[nextStateIndex];
    const nextQuestionIndex = getQuestionIndexFromRoomState(nextState);

    if (nextState === "WAITING" || nextState === "WRAP UP") {
      await ctx.db.patch(args.id, {
        activePrompt: undefined,
        state: nextState,
      });

      return nextState;
    }

    if (isPromptDrivenState(nextState)) {
      if (nextQuestionIndex === null) {
        throw new Error(`Unable to determine question index for state ${nextState}.`);
      }

      const questionIndexes = getQuestionIndexes(questionCount);

      if (!questionIndexes.includes(nextQuestionIndex)) {
        throw new Error(`Question ${nextQuestionIndex + 1} is not available for this room.`);
      }

      const persistedSelection = getPersistedPromptSelection(room, nextQuestionIndex);

      if (persistedSelection !== null) {
        const currentSelection = getPromptSelectionByQuestionIndex(
          room.promptSelections,
          nextQuestionIndex,
        );
        const promptSelections =
          currentSelection === null
            ? setPromptSelectionForQuestionIndex(room.promptSelections, persistedSelection)
            : room.promptSelections;

        await ctx.db.patch(args.id, {
          activePrompt: buildActivePromptFromSelection(persistedSelection, nextState),
          promptSelections,
          state: nextState,
        });

        return nextState;
      }
    }

    if (isShowState(nextState)) {
      if (nextQuestionIndex === null) {
        throw new Error(`Unable to determine question index for state ${nextState}.`);
      }

      const questionIndexes = getQuestionIndexes(questionCount);

      if (!questionIndexes.includes(nextQuestionIndex)) {
        throw new Error(`Question ${nextQuestionIndex + 1} is not available for this room.`);
      }

      const submissions = await ctx.db
        .query("roomPlayerSubmissions")
        .withIndex("by_room", (queryBuilder) => queryBuilder.eq("roomId", args.id))
        .collect();

      if (submissions.length === 0) {
        throw new Error("Cannot enter show state without player submissions.");
      }

      const selectedSubmission = getRandomSubmission(submissions);
      const promptSelection = buildPromptSelection(selectedSubmission, nextQuestionIndex);

      await ctx.db.patch(args.id, {
        activePrompt: buildActivePromptFromSelection(promptSelection, nextState),
        promptSelections: setPromptSelectionForQuestionIndex(
          room.promptSelections,
          promptSelection,
        ),
        state: nextState,
      });

      return nextState;
    }

    if (isPromptDrivenState(nextState)) {
      throw new Error("Missing persisted prompt selection for prompt-driven state transition.");
    }

    return await ctx.db.patch(args.id, {
      state: nextState,
    });
  },
});
