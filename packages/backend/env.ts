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
  get ROOT_ADMIN_EMAIL(): string {
    return z.email().parse(readEnvValue("ROOT_ADMIN_EMAIL"));
  },
  get ROOT_ADMIN_NAME(): string {
    return z.string().min(2).parse(readEnvValue("ROOT_ADMIN_NAME"));
  },
  get ROOT_ADMIN_PASSWORD(): string {
    return z.string().min(8).parse(readEnvValue("ROOT_ADMIN_PASSWORD"));
  },
  get SITE_URL(): string {
    return z.url().parse(readEnvValue("SITE_URL"));
  },
} as const;

export type BackendEnv = typeof env;
