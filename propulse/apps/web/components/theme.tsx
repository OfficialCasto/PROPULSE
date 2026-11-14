"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";
function current(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
function subscribe(callback: () => void) {
  window.addEventListener("propulse-theme", callback);
  return () => window.removeEventListener("propulse-theme", callback);
}
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, current, () => "light");
  const next = theme === "dark" ? "light" : "dark";
  return <button type="button" className="icon-button" aria-label={next === "dark" ? "Ativar tema escuro" : "Ativar tema claro"}
    onClick={() => {
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("propulse-theme", next); } catch { /* Theme still applies for this page. */ }
      window.dispatchEvent(new Event("propulse-theme"));
    }}>
    {theme === "dark" ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
  </button>;
}
