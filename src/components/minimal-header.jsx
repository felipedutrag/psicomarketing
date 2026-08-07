"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Menu, MessageCircle, X } from "lucide-react";
import { MinimalLogo } from "./minimal-logo";
import { ThemeToggle } from "@/components/theme-toggle";

const WA_LINK =
  "https://wa.me/5511989819696?text=Quero%20montar%20meu%20ecossistema%20de%20conectores";

const navLinks = [
  { label: "Módulos", href: "#modulos", section: "modulos" },
  { label: "Voz Live", href: "#live-demo", section: "live-demo" },
  { label: "Como Funciona", href: "#fluxo", section: "fluxo" },
  { label: "Calculadora", href: "#investimento", section: "investimento" },
];

export function MinimalHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Elevação suave ao rolar a página
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scrollspy: destaca a seção visível no meio da viewport
  useEffect(() => {
    const observed = [
      { id: "modulos", nav: "modulos" },
      { id: "live-demo-mobile", nav: "live-demo" },
      { id: "live-demo-desktop", nav: "live-demo" },
      { id: "fluxo", nav: "fluxo" },
      { id: "investimento", nav: "investimento" },
    ];
    const idToNav = Object.fromEntries(observed.map((s) => [s.id, s.nav]));
    const navOrder = ["modulos", "live-demo", "fluxo", "investimento"];
    const visible = new Set();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        const active = [...visible]
          .map((id) => idToNav[id])
          .sort((a, b) => navOrder.indexOf(a) - navOrder.indexOf(b));
        setActiveSection(active.length ? active[active.length - 1] : null);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    observed.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Fecha o menu mobile ao clicar fora
  useEffect(() => {
    if (!isMenuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    document.addEventListener("pointerdown", onClick);
    return () => document.removeEventListener("pointerdown", onClick);
  }, [isMenuOpen]);

  const headerClasses = isScrolled
    ? "border-zinc-300/90 bg-white/70 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.12)] backdrop-blur-xl backdrop-saturate-150 dark:border-zinc-700/80 dark:bg-zinc-950/70"
    : "border-zinc-200/80 bg-white/60 backdrop-blur-xl backdrop-saturate-150 dark:border-zinc-800/80 dark:bg-zinc-950/60";

  const handleNavClick = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-3 sm:top-4 z-50 mx-auto w-full max-w-7xl transition-all duration-300">
      <div
        className={`relative flex items-center rounded-lg border px-3 py-2 sm:px-4 sm:py-2.5 transition-all duration-300 ${headerClasses} md:px-6 md:py-3`}
      >
        {/* Left: Logo */}
        <Link
          href="/"
          className="relative z-10 flex shrink-0 items-center transition-opacity hover:opacity-90"
        >
          <MinimalLogo prominent />
        </Link>

        {/* Center: Nav (desktop) — absolutely centered, not pushed by logo or toggle */}
        <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 rounded-lg bg-zinc-100/70 p-1 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
          {navLinks.map((link, index) => (
            <Fragment key={link.href}>
              <a
                href={link.href}
                onClick={handleNavClick}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  activeSection === link.section
                    ? "bg-white text-indigo-600 shadow-xs dark:bg-zinc-800 dark:text-indigo-400"
                    : "text-zinc-700 hover:bg-white hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }`}
              >
                {link.label}
              </a>
              {(index === 0 || index === 1 || index === 2) && (
                <span aria-hidden className="mx-0.5 h-4 w-px shrink-0 bg-zinc-200 dark:bg-zinc-800" />
              )}
            </Fragment>
          ))}
        </nav>

        {/* Right: theme toggle */}
        <div className="relative z-10 ml-auto flex items-center gap-1.5 sm:gap-2.5">
          <ThemeToggle />

          {/* Mobile menu toggle */}
          <button
            type="button"
            aria-label="Abrir menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((v) => !v)}
            className="inline-flex size-8 items-center justify-center rounded-md border border-zinc-300 dark:border-[#333] bg-white text-zinc-800 transition-colors hover:bg-zinc-100 md:hidden dark:bg-[#202020] dark:text-zinc-200 dark:hover:bg-[#282828]"
          >
            {isMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isMenuOpen && (
        <div ref={menuRef} className="mt-2 md:hidden">
          <nav className="rounded-lg border border-zinc-200/80 bg-white/95 p-2 shadow-lg backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleNavClick}
                className={`flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
                  activeSection === link.section
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
