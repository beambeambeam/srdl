import { createFileRoute } from "@tanstack/react-router";
import AppLogo from "@/components/logo";

function HomeComponent() {
  // const healthCheck = useQuery(convexQuery(api.healthCheck.get, {}));
  // let statusClassName = "bg-red-500";
  // let statusText = "Error";

  // if (healthCheck.isLoading) {
  //   statusClassName = "bg-orange-400";
  //   statusText = "Checking...";
  // } else if (healthCheck.data === "OK") {
  //   statusClassName = "bg-green-500";
  //   statusText = "Connected";
  // }

  return (
    <div className="flex h-screen w-full items-center justify-center flex-col gap-2">
      <AppLogo className="size-100" />
      {/* <Card className="w-fit min-w-2xl">
        <CardHeader>
          <CardTitle>API Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${statusClassName}`} />
            <span className="text-muted-foreground text-sm">{statusText}</span>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: HomeComponent,
});
