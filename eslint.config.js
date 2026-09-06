import { defineConfig, globalIgnores } from "eslint/config";
import sourcePolicy from "@cordisx/eslint-config";
import parser from "@typescript-eslint/parser";

export default defineConfig([
  globalIgnores(["node_modules/**", "dist/**", "coverage/**"]),
  { files: ["**/*.{js,mjs,cjs}"], extends: [sourcePolicy] },
  {
    files: ["**/*.{ts,mts,cts,tsx}"],
    languageOptions: { parser },
    extends: [sourcePolicy],
  },
]);
