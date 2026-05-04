export const SHOW_STATES = new Set([
  "SHOW-1ST-QUESTION",
  "SHOW-2ND-QUESTION",
  "SHOW-3RD-QUESTION",
  "SHOW-4TH-QUESTION",
]);

export const GUESS_STATES = new Set([
  "GUESS-1ST-QUESTION",
  "GUESS-2ND-QUESTION",
  "GUESS-3RD-QUESTION",
  "GUESS-4TH-QUESTION",
]);

export const ANSWER_STATES = new Set([
  "ANSWER-1ST-QUESTION",
  "ANSWER-2ND-QUESTION",
  "ANSWER-3RD-QUESTION",
  "ANSWER-4TH-QUESTION",
]);

export const isShowState = (state: string): boolean => SHOW_STATES.has(state);

export const isGuessState = (state: string): boolean => GUESS_STATES.has(state);

export const isAnswerState = (state: string): boolean => ANSWER_STATES.has(state);

export const isPromptDrivenState = (state: string): boolean =>
  isShowState(state) || isGuessState(state) || isAnswerState(state);

export const getQuestionIndexFromRoomState = (state: string): 0 | 1 | 2 | 3 | null => {
  switch (state) {
    case "SHOW-1ST-QUESTION":
    case "GUESS-1ST-QUESTION":
    case "ANSWER-1ST-QUESTION": {
      return 0;
    }
    case "SHOW-2ND-QUESTION":
    case "GUESS-2ND-QUESTION":
    case "ANSWER-2ND-QUESTION": {
      return 1;
    }
    case "SHOW-3RD-QUESTION":
    case "GUESS-3RD-QUESTION":
    case "ANSWER-3RD-QUESTION": {
      return 2;
    }
    case "SHOW-4TH-QUESTION":
    case "GUESS-4TH-QUESTION":
    case "ANSWER-4TH-QUESTION": {
      return 3;
    }
    default: {
      return null;
    }
  }
};
