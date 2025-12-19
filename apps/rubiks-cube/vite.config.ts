import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  envDir: "../../", // Load .env files from monorepo root
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  resolve: {
    alias: {
      "@maker/core": path.resolve(
        __dirname,
        "../../packages/core/src/index.ts"
      ),
    },
  },
});
