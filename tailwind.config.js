const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  darkMode: "class",
  mode: "jit",
  purge: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Source Serif 4", ...fontFamily.serif],
        mono: ["IBM Plex Mono", ...fontFamily.mono],
      },
      borderRadius: {
        DEFAULT: "8px",
        secondary: "4px",
        container: "12px",
      },
      boxShadow: {
        DEFAULT: "0 1px 4px rgba(0, 0, 0, 0.1)",
        hover: "0 2px 8px rgba(0, 0, 0, 0.12)",
      },
      colors: {
        primary: {
          DEFAULT: "#5C6E4E",
          hover: "#4A5A3D",
        },
        secondary: {
          DEFAULT: "#6B6455",
          hover: "#4A4437",
        },
        accent: {
          gold: "#B98A3D",
          green: "#6B7F4F",
          red: "#B5502F",
          orange: "#B98A3D",
        },
        surface: {
          light: "#F6F1E7",
          card: "#FFFFFF",
          dark: "#1A160F",
          "dark-card": "#221D13",
        },
        border: {
          light: "#EAE0C8",
          dark: "#3A3323",
        },
        text: {
          primary: "#201C16",
          secondary: "#6B6455",
          "dark-primary": "#EDE6D3",
          "dark-secondary": "#93876A",
        },
      },
      spacing: {
        "form-field": "16px",
        section: "32px",
      },
    },
  },
  variants: {
    extend: {
      boxShadow: ["hover", "active"],
    },
  },
};
