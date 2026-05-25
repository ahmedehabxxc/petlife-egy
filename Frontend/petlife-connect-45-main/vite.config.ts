import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      ".ngrok-free.app", 
       ".ngrok-free.dev",
    ],
    proxy: {
      // In dev, call backend through same-origin to avoid CORS headaches:
      // axios baseURL should be "/api" in the frontend.
      "/api": {
        target: "http://localhost:5270",
        changeOrigin: true,
        secure: false,
      },
<<<<<<< HEAD
=======
      "/uploads": {
        target: "http://localhost:5270",
        changeOrigin: true,
        secure: false,
      },
>>>>>>> 566e763e4723dcdbb86bc931af1d7ad2ab712daf
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
