import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: "127.0.0.1",
        port: 3000,
        proxy: {
            "/auth": {
                target: "http://127.0.0.1:5000",
                changeOrigin: true,
            },
            "/player": {
                target: "http://127.0.0.1:5000",
                changeOrigin: true,
            },
        },
    },
});
