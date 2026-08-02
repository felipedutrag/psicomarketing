"use client";

import { Check, X, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MinimalLogo } from "@/components/minimal-logo";

export function ComparisonTable() {
  const comparisonItems = [
    {
          feature: "Agendamento de Sessões",
          traditional: "Manual, ligações e conflitos de horário",
          ai: "Automático, 24/7, sem conflitos",
    },
    {
          feature: "Tempo de resposta",
          traditional: "1 a 5 horas (durante sessões)",
          ai: "Instantâneo (< 5 segundos)",
    },
    {
          feature: "Fora do horário comercial",
          traditional: "Sem resposta até o dia seguinte",
          ai: "24 horas, 7 dias por semana",
    },
    {
          feature: "Lembrete Anti-Faltas",
          traditional: "Confirmação manual",
          ai: "Acompanhamento por IA",
    },
    {
          feature: "Tráfego Pago (Google & Meta)",
          traditional: "Desconectado do atendimento",
          ai: "Gestão de Anúncios",
    },
    {
      feature: "Foco do Profissional",
      traditional: "Dividido com burocracia/secretaria",
          ai: "100% focado no consultório",
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100/70 shadow-xs backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/50">
      {/* Mobile Stacked Card View */}
      <div className="block md:hidden p-2.5 space-y-2.5">
        {comparisonItems.map((item, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-zinc-200/90 bg-white/90 p-3 shadow-xs dark:border-zinc-800/90 dark:bg-zinc-950/80 space-y-2"
          >
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block border-b border-zinc-200/80 dark:border-zinc-800/80 pb-1.5">
              {item.feature}
            </span>

            {/* Traditional */}
            <div className="flex items-start gap-1.5 text-[11px] sm:text-xs text-zinc-700 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/60 p-2 rounded-lg">
              <X className="size-3.5 shrink-0 text-red-500 mt-0.5" />
              <div>
                <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">
                  Manual / Tradicional
                </span>
                <span>{item.traditional}</span>
              </div>
            </div>

            {/* AI Psicomarketing */}
            <div className="flex items-start gap-1.5 text-[11px] sm:text-xs text-indigo-950 dark:text-indigo-200 bg-indigo-500/10 dark:bg-indigo-950/50 p-2 rounded-lg border border-indigo-500/20 font-medium">
              <Check className="size-3.5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
              <div>
                <div className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-0.5">
                                  <MinimalLogo hideText subtle />
                </div>
                <span>{item.ai}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-800/50">
              <th className="p-4 font-semibold text-zinc-900 dark:text-zinc-100 w-1/3">
                Recurso / Operação
              </th>
              <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300 w-1/3">
                Atendimento Tradicional
              </th>
              <th className="p-4 font-semibold text-indigo-900 dark:text-indigo-300 bg-indigo-500/10 dark:bg-indigo-950/50 w-1/3">
                              <MinimalLogo hideText subtle />
                            </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
            {comparisonItems.map((item, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <tr
                  key={idx}
                  className={`transition-colors hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 ${
                    isEven
                      ? "bg-transparent"
                      : "bg-zinc-200/35 dark:bg-zinc-800/35"
                  }`}
                >
                  <td className="p-4 font-medium text-zinc-900 dark:text-zinc-100">
                    {item.feature}
                  </td>
                  <td className="p-4 text-zinc-700 dark:text-zinc-400">
                    <div className="flex items-start gap-2">
                      <X className="size-4 shrink-0 text-red-500 mt-0.5" />
                      <span>{item.traditional}</span>
                    </div>
                  </td>
                  <td
                    className={`p-4 text-zinc-900 dark:text-zinc-100 font-medium ${
                      isEven
                        ? "bg-indigo-500/5 dark:bg-indigo-950/25"
                        : "bg-indigo-500/12 dark:bg-indigo-950/40"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Check className="size-4 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                      <span>{item.ai}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-semibold">
                <ShieldCheck className="size-4 text-zinc-900 dark:text-zinc-100" />
                Conforme Resolução CFP 11/2018 • Sigilo, ética e anamnese protegidos
        </span>
        <Badge variant="secondary" className="text-[10px]">
          Previsibilidade Total
        </Badge>
      </div>
    </div>
  );
}
