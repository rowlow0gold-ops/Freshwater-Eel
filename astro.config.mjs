// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://eel.minhojan-world.site",
  // Inline all stylesheets into the HTML so the browser doesn't have to
  // make a second blocking round-trip for CSS — fixes the "Render blocking
  // requests" Lighthouse audit and shaves ~150ms off FCP.
  build: {
    inlineStylesheets: "always",
  },
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
    build: {
      // Smaller, more focused chunks → less unused JS per page.
      cssCodeSplit: true,
      minify: "esbuild",
    },
  },
});
