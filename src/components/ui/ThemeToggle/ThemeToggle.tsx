"use client";

import { useEffect, useSyncExternalStore } from "react";

import styles from "./ThemeToggle.module.css";

type Theme = "light" | "dark";

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  window.addEventListener("meridian-theme-change", onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener("meridian-theme-change", onChange);
  };
}

function getTheme(): Theme {
  const selected = document.documentElement.dataset.theme;
  if (selected === "light" || selected === "dark") return selected;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getServerTheme(): Theme {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = nextTheme === "dark" ? "Tema oscuro" : "Tema claro";

  useEffect(() => {
    const surface = getComputedStyle(document.documentElement).getPropertyValue("--color-surface").trim();
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", surface));
  }, [theme]);

  function toggle() {
    document.documentElement.dataset.theme = nextTheme;
    window.dispatchEvent(new Event("meridian-theme-change"));
  }

  return (
    <button type="button" className={styles.toggle} role="switch" aria-checked={theme === "dark"} aria-label="Tema oscuro" title={`Cambiar a ${label.toLowerCase()}`} onClick={toggle}>
      <span className={styles.slider} aria-hidden="true" />
    </button>
  );
}
