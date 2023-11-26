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
          {
            text: "HTTP APIs",
            collapsed: true,
            items: [
              { text: "Using HTTP APIs", link: "/docs/httpapi/httpapi" },
              { text: "Info API", link: "/docs/httpapi/info" },
              { text: "Casts API", link: "/docs/httpapi/casts" },
              { text: "Reactions API", link: "/docs/httpapi/reactions" },
              { text: "Links API", link: "/docs/httpapi/links" },
              { text: "UserData API", link: "/docs/httpapi/userdata" },
              { text: "FIDS API", link: "/docs/httpapi/fids" },
              { text: "Storage API", link: "/docs/httpapi/storagelimits" },
              { text: "Username Proofs API", link: "/docs/httpapi/usernameproof" },
              { text: "Verifications API", link: "/docs/httpapi/verification" },
              { text: "On Chain API", link: "/docs/httpapi/onchain" },
              { text: "SubmitMessage API", link: "/docs/httpapi/submitmessage" },
              { text: "Events API", link: "/docs/httpapi/events" },
            ],
          },
          { text: "Messages", link: "/docs/messages" },
          { text: "OnChainEvents", link: "/docs/onchain_events" },
          { text: "Events", link: "/docs/events" },
          { text: "Architecture", link: "/docs/architecture" },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/farcasterxyz/hubble" }],
  },
});
