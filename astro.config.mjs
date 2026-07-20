import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: "https://www.letsfixindia.com",
  prefetch: true,
  redirects: {
    "/landing": "/",
    "/indicators": "/statistics",
    "/submissions": "/submit",
  },
});
