import { MAX_ROOM_QUESTION_COUNT, MIN_ROOM_QUESTION_COUNT } from "../roomStates";

const ROOM_STATE_PATTERN = /^(SHOW|GUESS|ANSWER)-(\d+)(ST|ND|RD|TH)-QUESTION$/;

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

export const isShowState = (state: string): boolean =>
  parsePromptDrivenRoomState(state)?.phase === "SHOW";

export const isGuessState = (state: string): boolean =>
  parsePromptDrivenRoomState(state)?.phase === "GUESS";

export const isAnswerState = (state: string): boolean =>
  parsePromptDrivenRoomState(state)?.phase === "ANSWER";

export const isPromptDrivenState = (state: string): boolean =>
  parsePromptDrivenRoomState(state) !== null;

export const getQuestionIndexFromRoomState = (state: string): number | null =>
  parsePromptDrivenRoomState(state)?.questionIndex ?? null;
