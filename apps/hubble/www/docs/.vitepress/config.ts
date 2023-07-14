import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Hubble",
  description: "Documentation for Hubble",
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Examples", link: "/developers/examples" },
    ],
    search: {
      provider: "local",
    },
    sidebar: [
      {
        text: "Introduction",
        items: [{ text: "Introduction", link: "/intro/introduction" }],
      },
      {
        text: "Installation",
        items: [
          { text: "Docker", link: "/installation/docker" },
          { text: "From Source", link: "/installation/source" },
          { text: "Upgrading", link: "/installation/upgrades" },
        ],
      },
      {
        text: "Syncing",
        items: [
          { text: "Mainnet", link: "/syncing/mainnet" },
          { text: "Testnet", link: "/syncing/testnet" },
          { text: "Troubleshooting", link: "/syncing/troubleshooting" },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/farcasterxyz/hubble" }],
  },
});
