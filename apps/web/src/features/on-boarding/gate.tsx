"use client";

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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const hasSeenOnboarding = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);

      if (!hasSeenOnboarding && !isPublicPath(pathname)) {
        await navigate({
          replace: true,
          to: ONBOARDING_PATH,
        });
        setIsReady(true);
        return;
      }

      setIsReady(true);
    };

    void checkOnboarding();
  }, [navigate, pathname]);

  if (!isReady) {
    return null;
  }

  return children;
}
