const headerPattern = /^(\w+)(?:\(([^()\r\n]*)\))?(!)?: (.+)$/u;

/** @type {import("@commitlint/types").UserConfig} */
const config = {
  extends: ["@commitlint/config-conventional"],
  parserPreset: {
    parserOpts: {
      headerCorrespondence: ["type", "scope", "breaking", "subject"],
      headerPattern,
      noteKeywords: ["BREAKING CHANGE", "BREAKING-CHANGE"],
    },
  },
  rules: {
    "body-leading-blank": [2, "always"],
    "footer-leading-blank": [2, "always"],
    "subject-empty": [2, "never"],
    "type-empty": [2, "never"],
  },
};

export default config;
