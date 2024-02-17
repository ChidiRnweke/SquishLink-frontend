import { defineConfig } from "vite";

export default defineConfig({
    base: "/squish",
    build: { rollupOptions: { input: { main: "./index.html", missing: "./missing-url/index.html" } } },

});
