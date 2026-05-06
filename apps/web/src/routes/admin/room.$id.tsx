import { convexQuery } from "@convex-dev/react-query";
import { api } from "@srdl/backend/convex/client";
import type { GenericId } from "convex/values";
import { Badge } from "@srdl/ui/components/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@srdl/ui/components/empty";
import { Outlet, createFileRoute, useLocation, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { RoomStateController } from "../../features/admin/room/state-controller";
import { QuestionAnswerTable } from "../../features/admin/room/question-answer-table";
import { Timer } from "../../features/admin/room/timer";
import { WaitingTable } from "../../features/admin/room/waiting-table";
import { WrapUpTable } from "../../features/admin/room/wrap-up-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@srdl/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@srdl/ui/components/tabs";
import {
  getQuestionIndexes,
  getQuestionLabel,
  getRoomQuestionCount,
  getRoomStateLabel,
} from "@/shared/games";

function AdminRoomDetailPage() {
  const { id } = useParams({
    from: "/admin/room/$id",
  });
  const pathname = useLocation({
    select: (state) => state.pathname,
  });
  const roomQuery = useQuery(
    convexQuery(api.games.rooms.getById, {
      id: id as GenericId<"rooms">,
    }),
  );

  if (pathname.endsWith("/projector")) {
    return <Outlet />;
  }

  if (roomQuery.isPending && !roomQuery.data) {
    return (
      <main className="flex h-full min-h-0 items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Loading room...</p>
      </main>
    );
  }

  if (roomQuery.error) {
    return (
      <main className="flex h-full min-h-0 items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Failed to load room.</p>
      </main>
    );
  }

  if (roomQuery.data === null) {
    return (
      <main className="flex h-full min-h-0 items-center justify-center p-4">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Room not found</EmptyTitle>
            <EmptyDescription>The requested room could not be found.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    );
  }

  const room = roomQuery.data;
  const questionCount = getRoomQuestionCount(room.questionCount);
  const questionIndexes = getQuestionIndexes(questionCount);

  return (
    <main className="flex w-full h-full min-h-0 p-4">
      <div className="flex flex-wrap items-center gap-4 h-fit w-full">
        <h3 className="text-3xl">{room.title}</h3>
        <Badge>{room.code}</Badge>
        <Card className="w-full">
          <CardHeader className="justify-center md:justify-start">
            <CardTitle>Room States</CardTitle>
            <CardDescription>
              <span className="pr-2">Currently :</span>
              <Badge variant="secondary">{getRoomStateLabel(room.state)}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RoomStateController
              questionCount={questionCount}
              roomId={room._id}
              roomState={room.state}
            />
          </CardContent>
        </Card>
        <div className="grid w-full gap-4 lg:grid-cols-[2fr_1fr]">
          <Card className="h-fit w-full">
            <CardHeader>
              <CardTitle>Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="waiting" className="flex w-full flex-col gap-2">
                <div className="w-full overflow-x-auto pb-1">
                  <TabsList className="h-auto w-max min-w-full justify-start gap-2">
                    <TabsTrigger value="waiting" className="shrink-0">
                      Waiting
                    </TabsTrigger>
                    {questionIndexes.map((questionIndex) => (
                      <TabsTrigger
                        key={questionIndex}
                        value={`question-${questionIndex + 1}`}
                        className="shrink-0"
                      >
                        {getQuestionLabel(questionIndex)}
                      </TabsTrigger>
                    ))}
                    <TabsTrigger value="wrap-up" className="shrink-0">
                      Wrap up
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="waiting" className="pt-2">
                  <WaitingTable questionCount={questionCount} roomId={room._id} />
                </TabsContent>
                {questionIndexes.map((questionIndex) => (
                  <TabsContent
                    key={questionIndex}
                    value={`question-${questionIndex + 1}`}
                    className="pt-2"
                  >
                    <QuestionAnswerTable
                      questionIndex={questionIndex}
                      questionLabel={getQuestionLabel(questionIndex)}
                      roomId={room._id}
                    />
                  </TabsContent>
                ))}
                <TabsContent value="wrap-up" className="pt-2">
                  <WrapUpTable roomId={room._id} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <Card className="h-fit w-full">
            <CardContent>
              <Timer />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/admin/room/$id")({
  component: AdminRoomDetailPage,
});
