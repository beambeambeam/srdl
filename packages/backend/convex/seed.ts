import { APIError, isAPIError } from "better-auth/api";
import { v } from "convex/values";

import { env } from "../env";
import { internalAction } from "./_generated/server";
import { createAuth } from "./auth";

const isDuplicateUserError = (error: unknown): boolean => {
  if (isAPIError(error)) {
    return (
      error.status === "UNPROCESSABLE_ENTITY" &&
      (error.body?.code === "USER_ALREADY_EXISTS" ||
        error.body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL")
    );
  }

  if (error instanceof Error) {
    return error.message.toLowerCase().includes("already exists");
  }

  return false;
};

const createSeedHeaders = (): Headers => {
  const siteUrl = new URL(env.SITE_URL);

  return new Headers({
    host: siteUrl.host,
    origin: siteUrl.origin,
  });
};

export const createRootAdmin = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = createAuth(ctx);

    try {
      await auth.api.signUpEmail({
        body: {
          email: args.email,
          name: args.name,
          password: args.password,
        },
        headers: createSeedHeaders(),
      });
    } catch (error) {
      if (isDuplicateUserError(error)) {
        return {
          email: args.email,
          status: "skipped_existing" as const,
        };
      }

      if (isAPIError(error)) {
        throw new APIError(error.status, error.body, error.headers, error.statusCode);
      }

      throw error;
    }

    return {
      email: args.email,
      status: "created" as const,
    };
  },
});
