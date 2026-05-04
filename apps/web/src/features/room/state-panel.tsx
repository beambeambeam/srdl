import type { GenericId } from "convex/values";
import type { JSX } from "react";

import { QuestioningForm } from "@/features/room/questioning-form";

interface RoomStatePanelProps {
  roomId: GenericId<"rooms">;
  roomState: string;
}

export function RoomStatePanel({ roomId, roomState }: RoomStatePanelProps): JSX.Element {
  return <QuestioningForm roomId={roomId} roomState={roomState} />;
}
