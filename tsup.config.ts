import { defineConfig } from "tsup";

export default defineConfig({
    entry: [
        "src/next-routes.ts", // Main entry point
        "src/react-router/index.ts", // React Router entry point
        "src/remix/index.ts", // Remix entry point
    ],
    format: ["cjs", "esm"], // CommonJS and ES module builds
    dts: true, // Generate declaration file(s)
    splitting: false, // Do not use code splitting to generate simpler builds
    sourcemap: true, // Include source maps
    clean: true, // Clean the output directory before building
    external: ["@react-router/dev/routes", "@remix-run/route-config"], // Mark these as external dependencies
});
