import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts"
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import * as pkg from "./package.json";

const NODE_ENV = process.env.mode || "development";
const VERSION = pkg.version;

export default defineConfig({
  build: {
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, "src", "index.ts"),
      name: "Checklist",
      fileName: "checklist",
    },
  },
  define: {
    NODE_ENV: JSON.stringify(NODE_ENV),
    VERSION: JSON.stringify(VERSION),
  },
  plugins: [cssInjectedByJsPlugin(), dts()],
})

