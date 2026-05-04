import { createFileRoute } from "@tanstack/react-router";

import Form from "@/features/on-boarding/form";

function OnboardingPage() {
  return (
    <main className="min-h-svh">
      <Form />
    </main>
  );
}

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});
