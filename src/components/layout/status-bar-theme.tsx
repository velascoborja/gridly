"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const TOP_THEME_COLOR = "#ffffff";
const SCROLLED_THEME_COLOR = "#e8edf3";
const SCROLL_THRESHOLD = 8;

function getThemeColorMeta() {
  let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;

  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }

  return meta;
}

function setThemeColor() {
  const nextColor = window.scrollY > SCROLL_THRESHOLD ? SCROLLED_THEME_COLOR : TOP_THEME_COLOR;
  const meta = getThemeColorMeta();

  if (meta.content !== nextColor) {
    meta.content = nextColor;
  }
}

export function StatusBarTheme() {
  const pathname = usePathname();

  useEffect(() => {
    let frameId: number | null = null;

    const scheduleThemeColorUpdate = () => {
      if (frameId !== null) return;

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        setThemeColor();
      });
    };

    scheduleThemeColorUpdate();
    window.addEventListener("scroll", scheduleThemeColorUpdate, { passive: true });
    window.addEventListener("pageshow", scheduleThemeColorUpdate);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("scroll", scheduleThemeColorUpdate);
      window.removeEventListener("pageshow", scheduleThemeColorUpdate);
    };
  }, [pathname]);

  return null;
}
