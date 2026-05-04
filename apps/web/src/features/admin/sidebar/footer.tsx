"use client";

import type { JSX } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@srdl/ui/components/button";

import { authClient } from "@/lib/auth-client";
import { LogOutIcon } from "lucide-react";
import Loader from "@/components/loader";

const FALLBACK_USERNAME = "Unknown user";

export function AdminSidebarFooter(): JSX.Element {
  const { data: session, isPending } = authClient.useSession();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigate = useNavigate();

  const username = session?.user.name?.trim() || session?.user.email?.trim() || FALLBACK_USERNAME;

  const isButtonDisabled = isPending || isSigningOut;

  const handleSignOut = async (): Promise<void> => {
    try {
      setIsSigningOut(true);

      await authClient.signOut();
      await navigate({
        to: "/",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign out";

      toast.error(message);
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex justify-between gap-3 items-center">
      <div className="flex gap-1">
        <p className="truncate text-sm font-medium text-sidebar-foreground">
          {isPending ? "Loading..." : username}
        </p>
      </div>

      <Button
        disabled={isButtonDisabled}
        onClick={() => {
          void handleSignOut();
        }}
        type="button"
        variant="ghost"
        size="icon"
      >
        {isSigningOut ? <Loader /> : <LogOutIcon />}
      </Button>
    </div>
  );
}
