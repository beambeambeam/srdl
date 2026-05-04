"use client";

import { useLocalStorage } from "@srdl/ui/hooks/use-local-storage";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const ONBOARDING_PATH = "/onboarding";
const ONBOARDING_STORAGE_KEY = "onboardingSeen";
const PUBLIC_PATHS = new Set(["/", "/onboarding", "/sign-in"]);

const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.has(pathname) || pathname.startsWith("/admin");

interface OnboardingGateProps {
  children: ReactNode;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [hasSeenOnboarding] = useLocalStorage<boolean>(ONBOARDING_STORAGE_KEY, {
    defaultValue: false,
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || hasSeenOnboarding || isPublicPath(pathname)) {
      return;
    }

    void navigate({
      replace: true,
      to: ONBOARDING_PATH,
    });
  }, [hasSeenOnboarding, isReady, navigate, pathname]);

  if (!isReady || (!hasSeenOnboarding && !isPublicPath(pathname))) {
    return null;
  }

  return children;
}
