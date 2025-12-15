import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// The 'reggietr-tagger' import is removed

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  // The 'componentTagger' plugin is removed from the array
  plugins: [react()].filter(Boolean), 
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));