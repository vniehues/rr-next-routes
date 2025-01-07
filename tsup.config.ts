import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/next-routes.ts"], // Entry to your main file
    format: ["cjs", "esm"], // CommonJS and ES module builds
    dts: true, // Generate declaration file(s)
    splitting: false, // Do not use code splitting to generate simpler builds
    sourcemap: true, // Include source maps
    clean: true, // Clean the output directory before building
});