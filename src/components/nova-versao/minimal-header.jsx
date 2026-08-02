"use client";

import Link from "next/link";
import { MinimalLogo } from "./minimal-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowUpRight } from "lucide-react";

export function MinimalHeader() {
  const navLinks = [
    { label: "Módulos", href: "#modulos" },
    { label: "Voz Live", href: "#live-demo" },
    { label: "Como Funciona", href: "#fluxo" },
    { label: "Calculadora", href: "#investimento" },
  ];

  return (
    <header className="sticky top-4 z-50 mx-auto w-full max-w-7xl transition-all duration-300">
      <div className="flex items-center justify-between gap-4 rounded-full border border-zinc-200/80 bg-white/80 px-4 py-2.5 shadow-xs backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80 md:px-6">
        {/* Left: Minimal Logo */}
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
          <MinimalLogo />
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 rounded-full bg-zinc-100/70 p-1 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-white hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Theme Toggle & CTA */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          <Button
            asChild
            size="sm"
            className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 transition-all dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            <a href="#investimento" className="flex items-center gap-1.5">
              <span>Agendar IA</span>
              <Sparkles className="size-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
