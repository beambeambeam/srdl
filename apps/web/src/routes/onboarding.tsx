import { createFileRoute } from "@tanstack/react-router";

import Form from "@/features/on-boarding/form";
import { NO_INDEX_META } from "@/lib/seo";

function OnboardingPage() {
  return (
    <main className="min-h-svh">
      <Form />
    </main>
  );
}

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({
    meta: [...NO_INDEX_META],
  }),
});
