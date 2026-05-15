import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                mapPrimary: "#9D2148",
                mapSecondary: "#900C3F",
                mapAccent: "#C70039",
                mapHighlight: "#FF5733",
                mapDark: "#1a1b26",
            },
            boxShadow: {
                'premium': '0 10px 30px -10px rgba(0, 0, 0, 0.15), 0 4px 10px -5px rgba(0, 0, 0, 0.04)',
                'glass': 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
            },
            backgroundImage: {
                'gradient-premium': 'linear-gradient(135deg, #581845 0%, #900C3F 100%)',
            },
            fontFamily: {
                outfit: ["var(--font-outfit)", "sans-serif"],
                inter: ["var(--font-inter)", "sans-serif"],
            },
            keyframes: {
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "zoom-in": {
                    "0%": { opacity: "0", transform: "scale(0.95)" },
                    "100%": { opacity: "1", transform: "scale(1)" },
                },
                "slide-in-from-bottom": {
                    "0%": { opacity: "0", transform: "translateY(1rem)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "slide-in-from-top": {
                    "0%": { opacity: "0", transform: "translateY(-0.5rem)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
            animation: {
                "fade-in": "fade-in 0.3s ease-out",
                "zoom-in": "zoom-in 0.3s ease-out",
                "slide-in-from-bottom": "slide-in-from-bottom 0.4s ease-out",
                "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
            },
        },
    },
    plugins: [],
};
export default config;
