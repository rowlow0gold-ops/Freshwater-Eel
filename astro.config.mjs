// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://eel.minhojan-world.site",
  i18n: {
    defaultLocale: "ko",
    locales: ["ko", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "ko",
        locales: { ko: "ko-KR", en: "en-US" },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
