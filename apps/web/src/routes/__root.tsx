import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { Toaster } from "@srdl/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";

import { ThemeShell } from "@/components/theme-shell";
import { OnboardingGate } from "@/features/on-boarding/gate";
import { NuqsTanstackRouterAdapter } from "@/lib/nuqs-tanstack-router";
import { authClient } from "@/lib/auth-client";
import { getToken } from "@/lib/auth-server";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, THEME_COLOR } from "@/lib/seo";

import appCss from "../index.css?url";

const getAuth = createServerFn({ method: "GET" }).handler(async () => await getToken());

export interface RouterAppContext {
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
}

function RootDocument() {
  const context = useRouteContext({ from: "__root__" });
  return (
    <ConvexBetterAuthProvider
      client={context.convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={context.token}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <HeadContent />
        </head>
        <body>
          <ThemeShell>
            <div className="grid h-svh grid-rows-[auto_1fr]">
              <NuqsTanstackRouterAdapter>
                <OnboardingGate>
                  <Outlet />
                </OnboardingGate>
              </NuqsTanstackRouterAdapter>
            </div>
            <Toaster richColors />
          </ThemeShell>
          <TanStackRouterDevtools position="bottom-left" />
          <Scripts />
        </body>
      </html>
    </ConvexBetterAuthProvider>
  );
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  beforeLoad: async (ctx) => {
    const token = await getAuth();
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }
    return {
      isAuthenticated: !!token,
      token,
    };
  },

  component: RootDocument,
  head: () => ({
    links: [
      {
        href: appCss,
        rel: "stylesheet",
      },
      {
        href: "/favicon/favicon.svg",
        rel: "icon",
        type: "image/svg+xml",
      },
      {
        href: "/favicon/favicon-96x96.png",
        rel: "icon",
        sizes: "96x96",
        type: "image/png",
      },
      {
        href: "/favicon/favicon.ico",
        rel: "shortcut icon",
      },
      {
        href: "/favicon/apple-touch-icon.png",
        rel: "apple-touch-icon",
        sizes: "180x180",
      },
      {
        href: "/favicon/site.webmanifest",
        rel: "manifest",
      },
    ],
    meta: [
      {
        charSet: "utf-8",
      },
      {
        content: "width=device-width, initial-scale=1",
        name: "viewport",
      },
      {
        title: DEFAULT_TITLE,
      },
      {
        content: DEFAULT_DESCRIPTION,
        name: "description",
      },
      {
        content: THEME_COLOR,
        name: "theme-color",
      },
      {
        content: SITE_NAME,
        name: "application-name",
      },
      {
        content: SITE_NAME,
        name: "apple-mobile-web-app-title",
      },
    ],
  }),
});
