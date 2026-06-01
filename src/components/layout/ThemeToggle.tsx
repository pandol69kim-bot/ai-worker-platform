"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "theme-mode";
const subscribe = () => () => {};

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function handleToggle() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="gap-1.5" disabled>
        <Sun className="h-4 w-4" />
        테마
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleToggle}>
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {theme === "dark" ? "일반모드" : "다크모드"}
    </Button>
  );
}