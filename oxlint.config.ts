import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";

export default defineConfig({
  extends: [core, react],
  ignorePatterns: [
    "**/*.gen.ts",
    "**/*.gen.tsx",
    "**/*.gen.js",
    "**/*.gen.jsx",
    "**/*.gen.d.ts",
    "**/_generated/**/*",
  ],
  overrides: [
    {
      files: ["packages/backend/convex/**/*"],
      rules: {
        "unicorn/filename-case": "off",
      },
    },
  ],
  rules: {
    "func-style": ["error", "declaration", { allowArrowFunctions: true }],
  },
});
