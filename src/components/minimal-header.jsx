"use client";

import Link from "next/link";
import { MinimalLogo } from "./minimal-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function MinimalHeader() {
  const navLinks = [
    { label: "Módulos", href: "#modulos" },
    { label: "Voz Live", href: "#live-demo" },
    { label: "Como Funciona", href: "#fluxo" },
    { label: "Calculadora", href: "#investimento" },
  ];

  return (
    <header className="sticky top-3 sm:top-4 z-50 mx-auto w-full max-w-7xl transition-all duration-300">
      <div className="relative flex items-center rounded-full border border-zinc-200/80 bg-white/80 px-3 py-2 sm:px-4 sm:py-2.5 shadow-xs backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80 md:px-6 md:py-3">
        {/* Left: Icon-only logo — compact, doesn't push the nav */}
        <Link
          href="/"
          className="relative z-10 flex shrink-0 items-center transition-opacity hover:opacity-90"
        >
          <MinimalLogo subtle />
        </Link>

        {/* Center: Nav — absolutely centered, not pushed by logo or toggle */}
        <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 rounded-full bg-zinc-100/70 p-1 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-white hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Theme Toggle — balanced weight against the logo icon */}
        <div className="relative z-10 ml-auto flex items-center gap-2.5">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
