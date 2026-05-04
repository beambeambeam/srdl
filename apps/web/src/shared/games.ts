export const ROOM_STATES = [
  "WAITING",
  "SHOW-1ST-QUESTION",
  "GUESS-1ST-QUESTION",
  "ANSWER-1ST-QUESTION",
  "SHOW-2ND-QUESTION",
  "GUESS-2ND-QUESTION",
  "ANSWER-2ND-QUESTION",
  "SHOW-3RD-QUESTION",
  "GUESS-3RD-QUESTION",
  "ANSWER-3RD-QUESTION",
  "SHOW-4TH-QUESTION",
  "GUESS-4TH-QUESTION",
  "ANSWER-4TH-QUESTION",
  "WRAP UP",
] as const;

export type RoomState = (typeof ROOM_STATES)[number];

export const ROOM_STATE_LABELS: Record<RoomState, string> = {
  "ANSWER-1ST-QUESTION": "Answer Question 1",
  "ANSWER-2ND-QUESTION": "Answer Question 2",
  "ANSWER-3RD-QUESTION": "Answer Question 3",
  "ANSWER-4TH-QUESTION": "Answer Question 4",
  "GUESS-1ST-QUESTION": "Guess Question 1",
  "GUESS-2ND-QUESTION": "Guess Question 2",
  "GUESS-3RD-QUESTION": "Guess Question 3",
  "GUESS-4TH-QUESTION": "Guess Question 4",
  "SHOW-1ST-QUESTION": "Show Question 1",
  "SHOW-2ND-QUESTION": "Show Question 2",
  "SHOW-3RD-QUESTION": "Show Question 3",
  "SHOW-4TH-QUESTION": "Show Question 4",
  WAITING: "Waiting",
  "WRAP UP": "Wrap Up",
};

export const getRoomStateLabel = (state: string): string =>
  ROOM_STATE_LABELS[state as RoomState] ?? state;
