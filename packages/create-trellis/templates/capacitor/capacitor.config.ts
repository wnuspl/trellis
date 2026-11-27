import type { CapacitorConfig } from "@capacitor/cli";

// Capacitor wraps the Vite build (dist/) in a native Android/iOS app.
const config: CapacitorConfig = {
    appId: "com.example.game",
    appName: "Trellis Game",
    webDir: "dist",
};

export default config;
