import { z } from "zod";

const readEnvValue = (key: string): string | undefined => {
  const value = process.env[key];

  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue === "" ? undefined : trimmedValue;
};

export const env = {
  get CONVEX_SITE_URL(): string {
    return z.url().parse(readEnvValue("CONVEX_SITE_URL"));
  },
  get CONVEX_URL(): string {
    return z.url().parse(readEnvValue("CONVEX_URL"));
  },
  get SITE_URL(): string {
    return z.url().parse(readEnvValue("SITE_URL"));
  },
} as const;

export type BackendEnv = typeof env;
