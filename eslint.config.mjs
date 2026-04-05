import { includeIgnoreFile } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Import sub-package configs
import apiConfig from "./apps/api/eslint.config.mjs";
import clientConfig from "./apps/client/eslint.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

export default [
  // Include global gitignore
  ...(includeIgnoreFile ? [includeIgnoreFile(gitignorePath)] : []),
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/coverage/**",
    ],
  },
  // Apply API rules to API files
  ...apiConfig.map((config) => ({
    ...config,
    files: [
      "apps/api/**/*.ts",
      "apps/api/**/*.tsx",
      "apps/api/**/*.js",
      "apps/api/**/*.mjs",
    ],
  })),
  // Apply Client rules to Client files
  ...clientConfig.map((config) => ({
    ...config,
    files: [
      "apps/client/**/*.ts",
      "apps/client/**/*.tsx",
      "apps/client/**/*.js",
      "apps/client/**/*.jsx",
    ],
  })),
];
