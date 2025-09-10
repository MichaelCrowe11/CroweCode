// Site configuration for CroweCode Platform
export const siteConfig = {
  name: "CroweCode",
  title: "CroweCode - Professional Cloud Development Platform",
  description: "Professional cloud development platform with AI-powered coding, real-time collaboration, and seamless GitHub integration",
  url: "https://crowecode.com",
  ogImage: "https://crowecode.com/og.png",
  keywords: [
    "cloud ide",
    "online code editor",
    "ai coding assistant",
    "collaborative development",
    "github integration",
    "web development",
    "crowe code",
    "crowecode"
  ],
  links: {
    github: "https://github.com/MichaelCrowe11/crowe-logic-platform",
    twitter: "https://twitter.com/crowecode",
    discord: "https://discord.gg/crowecode",
    docs: "https://docs.crowecode.com"
  },
  creator: "Michael Crowe",
  company: "Crowe Logic",
  features: {
    ai: {
      enabled: true,
      providers: ["anthropic", "openai", "google"],
      defaultProvider: "anthropic"
    },
    collaboration: {
      enabled: true,
      maxUsers: 10,
      realtime: true
    },
    ide: {
      themes: ["dark", "light", "monokai", "dracula"],
      defaultTheme: "dark",
      languages: ["javascript", "typescript", "python", "java", "go", "rust"],
      autoSave: true,
      autoFormat: true
    },
    github: {
      enabled: true,
      integration: "crowehub",
      features: ["sync", "pr", "issues", "actions"]
    }
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://api.crowecode.com",
    version: "v1",
    timeout: 30000
  },
  branding: {
    primaryColor: "#00ADB5",
    secondaryColor: "#393E46",
    accentColor: "#FFD700",
    darkBg: "#0A0E27",
    lightBg: "#F7F7F7",
    logo: {
      light: "/logo-light.svg",
      dark: "/logo-dark.svg",
      favicon: "/favicon.ico"
    }
  },
  social: {
    twitter: "@crowecode",
    github: "MichaelCrowe11",
    linkedin: "michael-crowe",
    email: "support@crowecode.com"
  }
}

export type SiteConfig = typeof siteConfig