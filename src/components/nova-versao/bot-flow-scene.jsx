"use client";

import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, Sparkles, UserCheck, MessageSquare } from "lucide-react";

const ALL_DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
const MOBILE_DAYS = ["Segunda", "Terça", "Quarta"];
const TIMES = ["08:00", "10:00", "14:00", "16:00"];

const SCHEDULE_SEQUENCE = [
  { day: 0, time: "08:00", patient: "Mariana S. (Ansiedade)", type: "Primeira Consulta" },
  { day: 1, time: "10:00", patient: "Carlos E. (TCC)", type: "Retorno" },
  { day: 2, time: "14:00", patient: "Fernanda M. (Acolhimento)", type: "Nova Sessão" },
  { day: 0, time: "14:00", patient: "Lucas R. (Depressão)", type: "Sessão Semanal" },
  { day: 3, time: "08:00", patient: "Juliana P. (Burnout)", type: "Primeira Consulta" },
  { day: 1, time: "16:00", patient: "Roberto A. (Casal)", type: "Acolhimento" },
  { day: 4, time: "10:00", patient: "Beatriz C. (TCC)", type: "Retorno" },
  { day: 2, time: "08:00", patient: "Gabriel T. (Ansiedade)", type: "Nova Sessão" },
  { day: 3, time: "14:00", patient: "Patricia L. (Autoestima)", type: "Primeira Consulta" },
  { day: 4, time: "14:00", patient: "Rafael H. (Stress)", type: "Sessão Semanal" },
  { day: 0, time: "16:00", patient: "Vanessa G. (TCC)", type: "Retorno" },
  { day: 2, time: "16:00", patient: "Thiago F. (Acolhimento)", type: "Nova Sessão" },
  { day: 3, time: "16:00", patient: "Aline K. (Ansiedade)", type: "Primeira Consulta" },
  { day: 4, time: "16:00", patient: "Marcelo D. (Retorno)", type: "Sessão Semanal" },
];

export function BotFlowScene() {
  const [filledSlots, setFilledSlots] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [lastNotification, setLastNotification] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= SCHEDULE_SEQUENCE.length) {
          setFilledSlots({});
          setLastNotification({ text: "Reiniciando simulação da agenda...", type: "info" });
          return 0;
        }

        const nextItem = SCHEDULE_SEQUENCE[prev];
        const key = `${nextItem.day}-${nextItem.time}`;

        setFilledSlots((slots) => ({
          ...slots,
          [key]: nextItem,
        }));

        setLastNotification({
          text: `IA agendou ${nextItem.patient} para ${ALL_DAYS[nextItem.day]} às ${nextItem.time}`,
          type: "success",
        });

        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  const filledCount = Object.keys(filledSlots).length;
  const occupancyRate = Math.round((filledCount / 20) * 100);

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 md:p-8">
      {/* Top Header Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 pb-3 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
            <Calendar className="size-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Agenda Semanal (IA Ativa)
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Preenchimento automático via WhatsApp
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Ocupação
            </span>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {occupancyRate}%
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Consultas
            </span>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {filledCount} / 20
            </p>
          </div>
        </div>
      </div>

      {/* Live Activity Banner */}
      <div className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-800 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-300">
        <div className="flex items-center gap-2 overflow-hidden">
          <MessageSquare className="size-3.5 shrink-0 animate-pulse text-blue-600 dark:text-blue-400" />
          <span className="truncate font-medium">
            {lastNotification ? lastNotification.text : "Aguardando novas mensagens..."}
          </span>
        </div>
        <span className="shrink-0 rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-500/30 dark:text-blue-300">
          Ao vivo
        </span>
      </div>

      {/* Responsive Calendar Grid */}

      {/* Mobile View: 3 Days (Segunda, Terça, Quarta) */}
      <div className="block md:hidden w-full">
        <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <div className="p-1">Horário</div>
          {MOBILE_DAYS.map((day) => (
            <div
              key={day}
              className="rounded bg-zinc-200/60 p-1.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="mt-2.5 space-y-2">
          {TIMES.map((time) => (
            <div key={time} className="grid grid-cols-4 items-center gap-1.5 text-xs">
              <div className="pr-1 text-center font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                {time}
              </div>
              {MOBILE_DAYS.map((_, dayIndex) => {
                const key = `${dayIndex}-${time}`;
                const slot = filledSlots[key];

                return (
                  <div
                    key={key}
                    className={`flex h-16 flex-col justify-center rounded-lg border p-1.5 transition-all duration-300 ${
                      slot
                        ? "animate-in fade-in zoom-in-95 border-blue-500/40 bg-blue-50 dark:border-blue-800/60 dark:bg-blue-950/50"
                        : "border-dashed border-zinc-200 bg-white/50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-600"
                    }`}
                  >
                    {slot ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="size-3 shrink-0 text-blue-600 dark:text-blue-400" />
                          <p className="truncate text-[10px] font-bold text-zinc-900 dark:text-zinc-100">
                            {slot.patient.split(" ")[0]} {slot.patient.split(" ")[1]}
                          </p>
                        </div>
                        <span className="inline-block truncate rounded bg-blue-200/60 px-1 py-0.2 text-[8px] font-medium text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                          {slot.type}
                        </span>
                      </div>
                    ) : (
                      <span className="text-center text-[10px] opacity-40">Livre</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Desktop View: All 5 Days (Segunda a Sexta) */}
      <div className="hidden md:block w-full">
        <div className="grid grid-cols-6 gap-1.5 text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <div className="p-1">Horário</div>
          {ALL_DAYS.map((day) => (
            <div
              key={day}
              className="rounded bg-zinc-200/60 p-1.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="mt-2.5 space-y-2">
          {TIMES.map((time) => (
            <div key={time} className="grid grid-cols-6 items-center gap-1.5 text-xs">
              <div className="pr-1 text-center font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                {time}
              </div>
              {ALL_DAYS.map((_, dayIndex) => {
                const key = `${dayIndex}-${time}`;
                const slot = filledSlots[key];

                return (
                  <div
                    key={key}
                    className={`flex h-16 flex-col justify-center rounded-lg border p-2 transition-all duration-300 ${
                      slot
                        ? "animate-in fade-in zoom-in-95 border-blue-500/40 bg-blue-50 dark:border-blue-800/60 dark:bg-blue-950/50"
                        : "border-dashed border-zinc-200 bg-white/50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-600"
                    }`}
                  >
                    {slot ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="size-3 shrink-0 text-blue-600 dark:text-blue-400" />
                          <p className="truncate text-[10px] font-bold text-zinc-900 dark:text-zinc-100">
                            {slot.patient.split(" ")[0]} {slot.patient.split(" ")[1]}
                          </p>
                        </div>
                        <span className="inline-block truncate rounded bg-blue-200/60 px-1 py-0.2 text-[9px] font-medium text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                          {slot.type}
                        </span>
                      </div>
                    ) : (
                      <span className="text-center text-[10px] opacity-40">Livre</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
        <span className="inline-flex items-center gap-1">
          <Sparkles className="size-3 text-blue-500" />
          A IA tria o paciente e encaixa automaticamente na sua agenda
        </span>
        <span className="inline-flex items-center gap-1 font-mono text-[10px]">
          <UserCheck className="size-3 text-zinc-400" />
          Zero conflitos de horários
        </span>
      </div>
    </div>
  );
}

