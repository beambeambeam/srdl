import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  extends: [ultracite],
  ignorePatterns: [
    "**/*.gen.ts",
    "**/*.gen.tsx",
    "**/*.gen.js",
    "**/*.gen.jsx",
    "**/*.gen.d.ts",
    "**/_generated/**/*",
    "apps/web/src/routeTree.gen.ts",
  ],
});
