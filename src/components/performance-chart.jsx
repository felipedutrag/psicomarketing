"use client";

import { useState } from "react";
import { TrendingUp, Zap, Clock, Users, ShieldCheck, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function PerformanceChart() {
  const [activeTab, setActiveTab] = useState("conversao");

  const metrics = {
    conversao: {
      title: "Taxa de Conversão de Pacientes",
      subtitle: "Proporção de contatos do WhatsApp que efetivamente agendam consulta.",
      manualValue: "12%",
      aiValue: "68%",
      increase: "+466% de eficiência",
      bars: [
        { label: "Atendimento Manual", value: 12, color: "bg-zinc-300 dark:bg-zinc-800" },
        { label: "Agente IA + Plugins", value: 68, color: "bg-emerald-500 shadow-xs" },
      ],
      pointsManual: [10, 12, 11, 14, 12, 13, 12],
      pointsAI: [20, 35, 48, 55, 62, 65, 68],
    },
    tempo: {
      title: "Tempo Médio de Primeiro Atendimento",
      subtitle: "Tempo decorrido entre a mensagem do paciente e a resposta qualificada.",
      manualValue: "2h 40min",
      aiValue: "4 segundos",
      increase: "99.9% mais rápido",
      bars: [
        { label: "Atendimento Manual", value: 95, color: "bg-zinc-300 dark:bg-zinc-800" },
        { label: "Agente IA + Plugins", value: 3, color: "bg-emerald-500 shadow-xs" },
      ],
      pointsManual: [80, 85, 90, 88, 92, 95, 95],
      pointsAI: [10, 8, 5, 4, 3, 3, 3],
    },
    retorno: {
      title: "Retorno Sobre Investimento (ROI)",
      subtitle: "Aproveitamento do orçamento de tráfego pago (Google & Meta Ads).",
      manualValue: "2.1x ROI",
      aiValue: "8.4x ROI",
      increase: "4x mais faturamento",
      bars: [
        { label: "Anúncios sem IA", value: 25, color: "bg-zinc-300 dark:bg-zinc-800" },
        { label: "Tráfego + Agente IA", value: 90, color: "bg-emerald-500 shadow-xs" },
      ],
      pointsManual: [15, 18, 20, 22, 21, 23, 25],
      pointsAI: [25, 40, 58, 70, 78, 85, 90],
    },
  };

  const current = metrics[activeTab];

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-zinc-200 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 md:p-8">
      {/* Chart Top Header & Tabs */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs">
              <TrendingUp className="size-3" /> Métrica em Tempo Real
            </Badge>
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
              Impacto Mensurável
            </span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {current.title}
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">{current.subtitle}</p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-100/80 p-1 dark:border-zinc-800 dark:bg-zinc-900/80">
          <button
            type="button"
            onClick={() => setActiveTab("conversao")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === "conversao"
                ? "bg-white text-emerald-700 shadow-xs dark:bg-zinc-800 dark:text-emerald-400"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <Users className="size-3.5" /> Conversão
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tempo")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === "tempo"
                ? "bg-white text-emerald-700 shadow-xs dark:bg-zinc-800 dark:text-emerald-400"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <Clock className="size-3.5" /> Velocidade
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("retorno")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === "retorno"
                ? "bg-white text-emerald-700 shadow-xs dark:bg-zinc-800 dark:text-emerald-400"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <Zap className="size-3.5" /> Retorno Ads
          </button>
        </div>
      </div>

      {/* Main Graph Visualization Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Stat Cards */}
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-5 dark:border-zinc-800/80 dark:bg-zinc-900/40">
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                Sem Automação
              </span>
              <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">
                {current.manualValue}
              </p>
            </div>
            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <span className="text-[11px] font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                Com Agente IA + Plugins
              </span>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {current.aiValue}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <ArrowUpRight className="size-4 shrink-0" />
            <span>{current.increase}</span>
          </div>
        </div>

        {/* Right Side: Interactive Area Chart SVG + Progress Bars */}
        <div className="flex flex-col justify-between gap-6 rounded-xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-950 lg:col-span-2">
          {/* SVG Sparkline Graph */}
          <div className="relative h-36 w-full overflow-hidden">
            <svg viewBox="0 0 300 100" className="h-full w-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="20" x2="300" y2="20" stroke="currentColor" strokeDasharray="3 3" className="text-zinc-200 dark:text-zinc-800" strokeWidth="0.8" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="currentColor" strokeDasharray="3 3" className="text-zinc-200 dark:text-zinc-800" strokeWidth="0.8" />
              <line x1="0" y1="80" x2="300" y2="80" stroke="currentColor" strokeDasharray="3 3" className="text-zinc-200 dark:text-zinc-800" strokeWidth="0.8" />

              {/* Manual Line */}
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="text-zinc-400 dark:text-zinc-600 transition-all duration-500"
                points={current.pointsManual
                  .map((p, i) => `${i * 50},${100 - p}`)
                  .join(" ")}
              />

              {/* AI Area Fill */}
              <polygon
                fill="url(#emeraldGradient)"
                points={`0,100 ${current.pointsAI
                  .map((p, i) => `${i * 50},${100 - p}`)
                  .join(" ")} 300,100`}
                className="transition-all duration-500"
              />

              {/* AI Active Line */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500"
                points={current.pointsAI
                  .map((p, i) => `${i * 50},${100 - p}`)
                  .join(" ")}
              />

              {/* Glow Node Dots */}
              {current.pointsAI.map((p, i) => (
                <circle
                  key={i}
                  cx={i * 50}
                  cy={100 - p}
                  r="3.5"
                  className="fill-emerald-500 stroke-white dark:stroke-zinc-950"
                  strokeWidth="1.5"
                />
              ))}
            </svg>
          </div>

          {/* Progress Comparison Bars */}
          <div className="space-y-3">
            {current.bars.map((bar) => (
              <div key={bar.label} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  <span>{bar.label}</span>
                  <span className="font-semibold">{bar.value}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${bar.color}`}
                    style={{ width: `${bar.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Footer Note */}
      <div className="flex items-center justify-between border-t border-zinc-200/80 pt-3 text-xs text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          Dados baseados em métricas reais de conversão de consultórios atendidos.
        </span>
        <span className="font-mono text-[11px] hidden sm:inline">
          Otimização Contínua
        </span>
      </div>
    </div>
  );
}
