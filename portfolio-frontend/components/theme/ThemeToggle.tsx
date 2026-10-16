"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme, isMounted } = useTheme();

  if (!isMounted) {
    return (
      <div
        className={cn(
          "w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/10 flex items-center justify-center animate-pulse",
          className
        )}
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 p-2 rounded-xl transition-all duration-300",
        "bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]",
        "border border-black/[0.08] dark:border-white/[0.1] text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400",
        "shadow-sm active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        className
      )}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className="relative w-4 h-4 flex items-center justify-center overflow-hidden">
        {isDark ? (
          <Sun
            size={16}
            className="text-amber-400 transition-all duration-300 rotate-0 scale-100"
          />
        ) : (
          <Moon
            size={16}
            className="text-slate-700 transition-all duration-300 rotate-0 scale-100"
          />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-medium capitalize select-none">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}

