"use client";

import { useState } from "react";
import {
  Globe,
  Megaphone,
  Mic,
  Calendar,
  Mail,
  Cpu,
  Play,
  Pause,
  Sparkles,
  Volume2,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ICON_MAP = {
  Globe,
  Megaphone,
  Mic,
  Calendar,
  Mail,
  Cpu,
};

export function FeatureTabs({ plugins }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const categories = [
    { id: "all", label: "Todos os Módulos" },
    { id: "ads", label: "Tráfego Pago & Anúncios" },
    { id: "voice", label: "Atendimento & Voz Nativa" },
    { id: "automation", label: "Agendamento & E-mails" },
  ];

  const filteredPlugins = plugins.filter((plugin) => {
    if (activeCategory === "ads") {
      return plugin.id === "google-ads" || plugin.id === "facebook-ads";
    }
    if (activeCategory === "voice") {
      return plugin.id === "native-voice";
    }
    if (activeCategory === "automation") {
      return (
        plugin.id === "smart-booking" ||
        plugin.id === "email-dispatch" ||
        plugin.id === "custom-plugin"
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 ${
              activeCategory === cat.id
                ? "border border-indigo-500/50 bg-indigo-500/10 text-indigo-700 shadow-xs dark:border-indigo-500/40 dark:bg-indigo-950/50 dark:text-indigo-300"
                : "border border-zinc-200/80 bg-white/80 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Modules Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPlugins.map((plugin) => {
          const PluginIcon = ICON_MAP[plugin.iconName] || Globe;

          return (
            <div
              key={plugin.id}
              className="group relative flex flex-col justify-between rounded-xl border border-zinc-200/90 bg-zinc-100/70 p-6 shadow-xs backdrop-blur transition-all duration-300 hover:border-indigo-500/40 hover:shadow-md dark:border-zinc-800/90 dark:bg-zinc-900/50 dark:hover:border-indigo-500/30"
            >
              <div className="space-y-3.5">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex size-11 items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 transition-colors group-hover:border-indigo-500/40 group-hover:bg-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900">
                    <PluginIcon className="size-5 text-zinc-700 transition-colors group-hover:text-indigo-600 dark:text-zinc-300 dark:group-hover:text-indigo-400" />
                  </div>
                  <Badge variant="secondary" className="text-[11px] font-semibold py-0.5 px-2.5">
                    {plugin.badge}
                  </Badge>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400 transition-colors">
                    {plugin.title}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {plugin.description}
                  </p>
                </div>
              </div>

              {/* Module-Specific Live Interactive Previews */}
              <div className="mt-5 pt-3.5 border-t border-zinc-200/80 dark:border-zinc-800/80">
                {plugin.id === "google-ads" && (
                  <div className="flex min-h-[108px] flex-col justify-center gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50 p-4 text-xs sm:text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                        <Volume2 className="size-3.5 text-indigo-600 dark:text-indigo-400" /> Google Ads por Voz
                      </span>
                      <span className="rounded bg-indigo-500/15 px-1.5 py-0.5 font-mono text-[10px] leading-none text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                        ativo
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 ring-1 ring-indigo-500/30">
                        <Mic className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                      </span>
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 leading-snug">
                        "Aumente o valor do CPC."
                      </span>
                    </div>
                  </div>
                )}

                {plugin.id === "facebook-ads" && (
                  <div className="flex min-h-[108px] flex-col justify-center gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50 p-4 text-xs sm:text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                        <TrendingUp className="size-3.5 text-indigo-600 dark:text-indigo-400" /> Meta Ads por Voz
                      </span>
                      <span className="rounded bg-indigo-500/15 px-1.5 py-0.5 font-mono text-[10px] leading-none text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                        ativo
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 ring-1 ring-indigo-500/30">
                        <Mic className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                      </span>
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 leading-snug">
                        "Resuma a performance de hoje"
                      </span>
                    </div>
                  </div>
                )}

                {plugin.id === "native-voice" && (
                  <div className="flex min-h-[92px] flex-col justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 p-3.5 text-xs sm:text-sm space-y-2.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between gap-2 font-semibold text-indigo-800 dark:text-indigo-300 text-xs">
                      <span className="min-w-0 truncate">Voz Humana Nativa</span>
                      <span className="shrink-0 rounded bg-indigo-500/15 px-1.5 py-0.5 font-mono text-[11px] leading-none text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                        0:14
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                        aria-label={isPlayingAudio ? "Pausar áudio de exemplo" : "Reproduzir áudio de exemplo"}
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs hover:bg-indigo-500 transition-colors"
                      >
                        {isPlayingAudio ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
                      </button>
                      <div className="flex h-8 flex-1 min-w-0 items-center gap-[2px]">
                        {[
                          40, 80, 50, 95, 60, 85, 45, 90, 40, 70, 85, 50, 95, 35, 60, 75, 55, 90, 45, 65,
                          55, 88, 42, 92, 58, 78, 48, 86, 38, 72, 90, 52, 96, 40, 62, 70, 58, 84, 44, 68,
                        ].map((h, i) => (
                          <span
                            key={i}
                            className={`flex-1 basis-0 rounded-full transition-all duration-300 ${
                              isPlayingAudio
                                ? "bg-indigo-700 dark:bg-indigo-500 animate-pulse"
                                : "bg-indigo-700/50 dark:bg-indigo-500/50"
                            }`}
                            style={{ height: `${isPlayingAudio ? Math.max(15, Math.min(100, h * 0.9)) : Math.max(15, h)}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {plugin.id === "smart-booking" && (
                  <div className="flex min-h-[92px] flex-col justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 p-3.5 text-xs sm:text-sm space-y-1.5 dark:border-zinc-800 dark:bg-zinc-900/50 font-mono">
                    <span className="text-[10px] sm:text-xs text-zinc-400 block">Google Calendar &amp; iCal</span>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-zinc-700 dark:text-zinc-300 text-xs truncate font-sans">
                        Consulta confirmada: Quarta-feira às 14h
                      </p>
                      <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">
                        <Sparkles className="size-3.5" /> Sincronizado
                      </span>
                    </div>
                  </div>
                )}

                {plugin.id === "email-dispatch" && (
                  <div className="flex min-h-[92px] flex-col justify-center rounded-xl border border-zinc-200/80 bg-zinc-50 p-3.5 text-xs sm:text-sm space-y-1.5 dark:border-zinc-800 dark:bg-zinc-900/50 font-mono">
                    <span className="text-[10px] sm:text-xs text-zinc-400 block">E-mail Automático de Confirmação</span>
                    <p className="text-zinc-700 dark:text-zinc-300 text-xs font-sans">
                        Consulta confirmada para Quarta-feira às 14h
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-sans">
                      Lembrete automático 24h e 1h antes do horário.
                    </p>
                  </div>
                )}

                {plugin.id === "custom-plugin" && (
                  <div className="flex min-h-[108px] flex-col justify-center rounded-xl border border-zinc-200/80 bg-zinc-950 p-3.5 text-xs font-mono text-indigo-400 space-y-1 dark:border-zinc-800">
                    <span className="text-[10px] sm:text-xs text-zinc-500 font-sans block">Integração via API</span>
                    <div className="space-y-0.5 break-all leading-relaxed">
                      <p>definePlugin(&apos;SuaAPI&apos;, &#123;</p>
                      <p>&nbsp;&nbsp;trigger: &apos;agendamento&apos; &#125;)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
