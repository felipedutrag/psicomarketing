import Link from "next/link";
import { MinimalLogo } from "@/components/nova-versao/minimal-logo";
import { ShieldCheck, Heart } from "lucide-react";

export function MinimalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-6 border-t border-zinc-200/80 bg-zinc-50/50 pt-6 pb-4 md:pb-6 dark:border-zinc-800/80 dark:bg-zinc-950/50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 md:px-8">
        {/* Top Row: Logo & Quick Links & Status Indicator */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <MinimalLogo />

          {/* Quick Navigation Links */}
          <nav className="flex flex-wrap items-center gap-6 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <Link
              href="#investimento"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Agendar Assessoria
            </Link>
            <Link
              href="/"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Site Atual
            </Link>
            <a
              href="https://wa.me/5511989819696"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Contato WhatsApp
            </a>
          </nav>

          {/* Live System Status Indicator */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-400">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-indigo-500" />
            </span>
            <span>Sistemas Operacionais</span>
          </div>
        </div>

        <div className="h-px w-full bg-zinc-200/80 dark:bg-zinc-800/80" />

        {/* Bottom Row: Legal & Copyright Note */}
        <div className="flex flex-col gap-3 text-xs text-zinc-500 dark:text-zinc-400 md:flex-row md:items-center md:justify-between">
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>
              &copy; {currentYear} Psicomarketing • IA &amp; Tráfego Pago para Psicólogos.
            </span>
          </p>

          <p className="flex items-center gap-1 text-[11px]">
            <span>Desenvolvido com foco em ética clínica e alto desempenho.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
