"use client";

import { ThemeSwitch } from "@srdl/ui/components/theme-switch";
import { ThemeProvider } from "next-themes";

interface ThemeShellProps {
  children: React.ReactNode;
}

function ThemeShell({ children }: ThemeShellProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
      <div className="fixed top-4 right-4 z-50 sm:top-6 sm:right-6">
        <ThemeSwitch />
      </div>
      {children}
    </ThemeProvider>
  );
}

export { ThemeShell };
