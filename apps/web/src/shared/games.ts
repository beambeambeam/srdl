export const MIN_ROOM_QUESTION_COUNT = 1;
export const MAX_ROOM_QUESTION_COUNT = 10;
export const DEFAULT_NEW_ROOM_QUESTION_COUNT = 1;
export const LEGACY_ROOM_QUESTION_COUNT = 4;

const QUESTION_ORDINALS = [
  "1ST",
  "2ND",
  "3RD",
  "4TH",
  "5TH",
  "6TH",
  "7TH",
  "8TH",
  "9TH",
  "10TH",
] as const;

type QuestionOrdinal = (typeof QUESTION_ORDINALS)[number];
type PromptRoomStatePhase = "SHOW" | "GUESS" | "ANSWER";

export type PromptDrivenRoomState = `${PromptRoomStatePhase}-${QuestionOrdinal}-QUESTION`;
export type RoomState = "WAITING" | "WRAP UP" | PromptDrivenRoomState;

const ROOM_STATE_PHASES = ["SHOW", "GUESS", "ANSWER"] as const;
const ROOM_STATE_PATTERN = /^(SHOW|GUESS|ANSWER)-(\d+)(ST|ND|RD|TH)-QUESTION$/;

const isValidRoomQuestionCount = (questionCount: number): boolean =>
  Number.isInteger(questionCount) &&
  questionCount >= MIN_ROOM_QUESTION_COUNT &&
  questionCount <= MAX_ROOM_QUESTION_COUNT;

export const getRoomQuestionCount = (roomQuestionCount: number | undefined): number => {
  if (roomQuestionCount === undefined) {
    return LEGACY_ROOM_QUESTION_COUNT;
  }

  if (!isValidRoomQuestionCount(roomQuestionCount)) {
    throw new Error(
      `Question count must be an integer between ${MIN_ROOM_QUESTION_COUNT} and ${MAX_ROOM_QUESTION_COUNT}.`,
    );
  }

  return roomQuestionCount;
};

export const getQuestionIndexes = (questionCount: number): number[] =>
  Array.from({ length: getRoomQuestionCount(questionCount) }, (_, index) => index);

export const getQuestionLabel = (questionIndex: number): string => `Question ${questionIndex + 1}`;

const getQuestionOrdinal = (questionIndex: number): QuestionOrdinal => {
  const ordinal = QUESTION_ORDINALS[questionIndex];

  if (ordinal === undefined) {
    throw new Error(`Unsupported question index: ${questionIndex}.`);
  }

  return ordinal;
};

const getPromptDrivenRoomState = (
  phase: PromptRoomStatePhase,
  questionIndex: number,
): PromptDrivenRoomState => `${phase}-${getQuestionOrdinal(questionIndex)}-QUESTION`;

export const getRoomStatesForQuestionCount = (questionCount: number): RoomState[] => {
  const states: RoomState[] = ["WAITING"];

  for (const questionIndex of getQuestionIndexes(questionCount)) {
    for (const phase of ROOM_STATE_PHASES) {
      states.push(getPromptDrivenRoomState(phase, questionIndex));
    }
  }

  states.push("WRAP UP");

  return states;
};

export const ROOM_STATES = getRoomStatesForQuestionCount(MAX_ROOM_QUESTION_COUNT);

const parsePromptDrivenRoomState = (
  state: string,
): {
  phase: "ANSWER" | "GUESS" | "SHOW";
  questionIndex: number;
} | null => {
  const match = ROOM_STATE_PATTERN.exec(state);

  if (!match) {
    return null;
  }

  const [, rawPhase, rawQuestionNumber] = match;
  const questionNumber = Number(rawQuestionNumber);

  if (
    !Number.isInteger(questionNumber) ||
    questionNumber < MIN_ROOM_QUESTION_COUNT ||
    questionNumber > MAX_ROOM_QUESTION_COUNT
  ) {
    return null;
  }

  return {
    phase: rawPhase as "ANSWER" | "GUESS" | "SHOW",
    questionIndex: questionNumber - 1,
  };
};

export const getQuestionIndexFromRoomState = (state: string): number | null =>
  parsePromptDrivenRoomState(state)?.questionIndex ?? null;

export const getRoomStateLabel = (state: string): string => {
  if (state === "WAITING") {
    return "Waiting";
  }

  if (state === "WRAP UP") {
    return "Wrap Up";
  }

  const parsedState = parsePromptDrivenRoomState(state);

  if (parsedState === null) {
    return state;
  }

  return `${parsedState.phase.charAt(0)}${parsedState.phase.slice(1).toLowerCase()} Question ${parsedState.questionIndex + 1}`;
};
