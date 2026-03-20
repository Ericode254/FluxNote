const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  darkMode: "class",
  mode: "jit",
  purge: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...fontFamily.sans],
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
          DEFAULT: "#4F91FF",
          hover: "#3a7de8",
        },
        secondary: {
          DEFAULT: "#555555",
          hover: "#333333",
        },
        accent: {
          cyan: "#00D8FF",
          green: "#32D74B",
          red: "#FF5F5F",
          orange: "#FF9500",
        },
        surface: {
          light: "#F5F5F5",
          card: "#FFFFFF",
          dark: "#1E1E2F",
          "dark-card": "#2A2A3B",
        },
        border: {
          light: "#E0E0E0",
          dark: "#3A3A4E",
        },
        text: {
          primary: "#1C1C1C",
          secondary: "#555555",
          "dark-primary": "#EAEAEA",
          "dark-secondary": "#AAAAAA",
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
