import { createFileRoute } from "@tanstack/react-router";

function OnboardingPage() {
  return <main />;
}

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});
