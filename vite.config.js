import { resolve } from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/guide/build#multi-page-app
export default defineConfig({
  build: {
    // Allow top-level await (ES2022+). All modern browsers support this.
    target: "esnext",
    rollupOptions: {
      input: {
        // Root page
        home: resolve(__dirname, "index.html"),

        // Clean-URL pages (folder/index.html → served at /folder/)
        login: resolve(__dirname, "login/index.html"),
        profile: resolve(__dirname, "profile/index.html"),

        // Sub-pages (legacy /pages/ paths kept for internal links)
        newsDetails: resolve(__dirname, "pages/news-details.html"),
        admin: resolve(__dirname, "pages/admin.html"),
        createNews: resolve(__dirname, "pages/create-news.html"),
        editNews: resolve(__dirname, "pages/edit-news.html"),
        about: resolve(__dirname, "pages/about.html"),
        contact: resolve(__dirname, "pages/contact.html"),
      },
    },
  },
});
