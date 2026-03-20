import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { EditorApp } from "./EditorApp";
import { OnboardingScreen } from "./OnboardingScreen";

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#1E1E2F] text-[#1C1C1C] dark:text-[#EAEAEA] transition-colors">
        <Authenticated>
          <EditorApp darkMode={darkMode} onToggleDark={() => setDarkMode((d) => !d)} />
        </Authenticated>
        <Unauthenticated>
          <OnboardingScreen darkMode={darkMode} onToggleDark={() => setDarkMode((d) => !d)} />
        </Unauthenticated>
        <Toaster theme={darkMode ? "dark" : "light"} />
      </div>
    </div>
  );
}
