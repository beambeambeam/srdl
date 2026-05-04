import { createFileRoute } from "@tanstack/react-router";

import SignInForm from "@/features/sign-in/form";

function SignInPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-8">
      <SignInForm />
    </main>
  );
}

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});
