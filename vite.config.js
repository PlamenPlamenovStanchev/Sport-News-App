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

        // Sub-pages
        login: resolve(__dirname, "pages/login.html"),
        register: resolve(__dirname, "pages/register.html"),
        newsDetails: resolve(__dirname, "pages/news-details.html"),
        profile: resolve(__dirname, "pages/profile.html"),
        admin: resolve(__dirname, "pages/admin.html"),
        createNews: resolve(__dirname, "pages/create-news.html"),
        editNews: resolve(__dirname, "pages/edit-news.html"),
        about: resolve(__dirname, "pages/about.html"),
        contact: resolve(__dirname, "pages/contact.html"),
      },
    },
  },
});
