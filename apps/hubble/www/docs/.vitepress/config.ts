import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Hubble",
  description: "Documentation for Hubble",
  head: [["script", { src: "/_vercel/insights/script.js", defer: "true" }]],
  themeConfig: {
    nav: [{ text: "Home", link: "/" }],
    search: {
      provider: "local",
    },
    sidebar: [
      {
        text: "Get Started",
        items: [
          { text: "Hubble", link: "/intro/hubble" },
          { text: "Installation", link: "/intro/install" },
          { text: "Networks", link: "/intro/networks" },
          { text: "Monitoring", link: "/intro/monitoring" },
          { text: "Tutorials", link: "/intro/tutorials" },
        ],
      },
      {
        text: "Documentation",
        items: [
          { text: "CLI", link: "/docs/cli" },
          { text: "APIs", link: "/docs/api" },
          { text: "Messages", link: "/docs/messages" },
          { text: "Events", link: "/docs/events" },
          { text: "Architecture", link: "/docs/architecture" },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/farcasterxyz/hubble" }],
  },
});
