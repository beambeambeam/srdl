import { join } from "node:path";
import type { ReadableStream } from "node:stream/web";
import { TextDecoder } from "node:util";
import { z } from "zod";

import { env } from "./env";

declare const Bun: {
  spawn(
    command: string[],
    options: {
      cwd: string;
      stderr: "pipe";
      stdout: "pipe";
    },
  ): {
    stderr: ReadableStream<Uint8Array> | null;
    stdout: ReadableStream<Uint8Array> | null;
    exited: Promise<number>;
  };
};

type SeedResult =
  | {
      email: string;
      status: "created";
    }
  | {
      email: string;
      status: "skipped_existing";
    };

const backendDirectoryPath = import.meta.dirname;
const convexBinaryPath = join(backendDirectoryPath, "node_modules", ".bin", "convex");

const seedResultSchema = z.union([
  z.object({
    email: z.string(),
    status: z.literal("created"),
  }),
  z.object({
    email: z.string(),
    status: z.literal("skipped_existing"),
  }),
]);

const readStream = async (
  stream: ReadableStream<Uint8Array> | null,
  writer: NodeJS.WriteStream,
): Promise<string> => {
  if (!stream) {
    return "";
  }

  const decoder = new TextDecoder();
  let output = "";

  for await (const chunk of stream) {
    const text = decoder.decode(chunk, {
      stream: true,
    });

    output += text;
    writer.write(text);
  }

  const trailingText = decoder.decode();

  output += trailingText;

  if (trailingText !== "") {
    writer.write(trailingText);
  }

  return output;
};

const parseSeedResult = (rawOutput: string): SeedResult => {
  const trimmedOutput = rawOutput.trim();

  if (trimmedOutput === "") {
    throw new Error("Seed command completed without returning a result.");
  }

  return seedResultSchema.parse(JSON.parse(trimmedOutput));
};

const args = JSON.stringify({
  email: env.ROOT_ADMIN_EMAIL,
  name: env.ROOT_ADMIN_NAME,
  password: env.ROOT_ADMIN_PASSWORD,
});

const seedProcess = Bun.spawn([convexBinaryPath, "run", "seed:createRootAdmin", args], {
  cwd: backendDirectoryPath,
  stderr: "pipe",
  stdout: "pipe",
});

const [stdout, stderr, exitCode] = await Promise.all([
  readStream(seedProcess.stdout, process.stdout),
  readStream(seedProcess.stderr, process.stderr),
  seedProcess.exited,
]);

if (exitCode !== 0) {
  const failureDetails = stderr.trim();

  throw new Error(
    failureDetails === ""
      ? `Seed command failed with exit code ${exitCode}.`
      : `Seed command failed with exit code ${exitCode}: ${failureDetails}`,
  );
}

const result = parseSeedResult(stdout);

if (result.status === "created") {
  process.stdout.write(`Root admin created for ${result.email}.\n`);
} else {
  process.stdout.write(`Root admin already exists for ${result.email}; skipping.\n`);
}
