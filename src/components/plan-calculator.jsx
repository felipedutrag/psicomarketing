"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Plus, ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLilithVoice } from "@/hooks/use-lilith-voice";

const BASE_PLAN = {
  name: "IA Core + WhatsApp Conector",
  price: 147,
  description: "Atendimento 24/7 por texto no WhatsApp, qualificação de leads e gestão da agenda.",
};

const AVAILABLE_PLUGINS = [
  {
    id: "landing-page-ai",
    title: "Landing Page Conector",
    price: 99,
    category: "Conversão",
    description: "Edite textos e imagens do seu site direto no painel com IA generativa.",
  },
  {
    id: "google-ads",
    title: "Google Ads Conector",
    price: 99,
    category: "Aquisição",
    description: "Gestão de campanhas no Google com relatórios e edição com IA.",
  },
  {
    id: "facebook-ads",
    title: "Meta Ads Conector",
    price: 99,
    category: "Tráfego Pago",
    description: "Gerencia campanhas no Instagram e Facebook com IA.",
  },
  {
    id: "smart-booking",
    title: "Google Meet Conector",
    price: 99,
    category: "Automação",
    description: "Agende e gerencie reuniões no Google Meet direto pelo WhatsApp com IA.",
  },
];

export function PlanCalculator() {
  const [selectedPlugins, setSelectedPlugins] = useState([
        "email-dispatch",
    ]);
  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "yearly"
  const [micPermission, setMicPermission] = useState("prompt"); // "prompt" | "granted" | "denied"
  const greetedRef = useRef(false);
  const {
    isRecordingVoice,
    isSpeaking,
    isReadyToSpeak,
    toggleVoiceRecording,
    sendTextToVoice,
  } = useLilithVoice();

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.permissions) return;
    let active = true;
    navigator.permissions
      .query({ name: "microphone" })
      .then((status) => {
        if (!active) return;
        setMicPermission(status.state);
        status.addEventListener("change", () => {
          setMicPermission(status.state);
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isReadyToSpeak && isRecordingVoice && !greetedRef.current) {
      greetedRef.current = true;
      sendTextToVoice("Olá! Como posso ajudar você hoje?");
    }
    if (!isRecordingVoice) {
      greetedRef.current = false;
    }
  }, [isReadyToSpeak, isRecordingVoice, sendTextToVoice]);

  const togglePlugin = (id) => {
    setSelectedPlugins((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const calculateTotal = () => {
    const pluginsTotal = AVAILABLE_PLUGINS.reduce((acc, plugin) => {
      if (selectedPlugins.includes(plugin.id)) {
        return acc + plugin.price;
      }
      return acc;
    }, 0);

    const monthlyTotal = BASE_PLAN.price + pluginsTotal;

    if (billingCycle === "yearly") {
      // 20% discount on yearly
      return Math.round(monthlyTotal * 0.8);
    }

    return monthlyTotal;
  };

  const totalMonthly = calculateTotal();
  const selectedPluginObjects = AVAILABLE_PLUGINS.filter((p) =>
    selectedPlugins.includes(p.id)
  );

  const buildWhatsappLink = () => {
    const pluginNames = selectedPluginObjects.map((p) => p.title).join(", ");
    const text = `Olá! Montei meu plano no site com o IA Core + os plugins (${
      pluginNames || "sem plugins adicionais"
    }) por R$ ${totalMonthly}/mês no plano ${
      billingCycle === "yearly" ? "Anual (20% OFF)" : "Mensal"
    }. Gostaria de ativar!`;

    return `https://wa.me/5511989819696?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Left Column: Plugin Selection Grid */}
      <div className="space-y-5 lg:col-span-7">
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-100/80 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/60">
          <div
            className={`flex items-center transition-all duration-300 ${
              isRecordingVoice || isSpeaking ? "gap-3.5" : "gap-2"
            }`}
          >
            {/* Mini Planet Orb Tooltip */}
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className="group relative m-0 block shrink-0 cursor-pointer appearance-none border-0 bg-transparent p-0"
              aria-label={
                isRecordingVoice
                  ? "Encerrar chamada de voz"
                  : "Iniciar chamada de voz com nossa agente"
              }
            >
              <span
                className={`relative block overflow-hidden rounded-full transition-all duration-300 ${
                  isRecordingVoice || isSpeaking
                    ? "h-7 w-7 scale-110 ring-2 ring-teal-300/70 shadow-[0_0_22px_6px_rgba(13,148,136,0.45)]"
                    : "h-5 w-5"
                }`}
                style={{
                  background:
                    "conic-gradient(#bae6fd 0%, #38bdf8 30%, #0d9488 55%, #38bdf8 70%, #bae6fd 100%)",
                  animation: "spin 8s linear infinite",
                }}
              >
                <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/40 via-transparent to-black/25" />
                <span className="relative flex h-full w-full items-center justify-center text-[8px] font-bold text-white drop-shadow-sm">
                  ?
                </span>
              </span>

              {/* Tooltip (desktop only) */}
              <span
                className={`pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-56 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white p-2.5 text-center text-xs font-semibold text-zinc-700 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 sm:block dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 ${
                  isRecordingVoice ? "hidden" : ""
                }`}
              >
                {micPermission === "denied"
                  ? "Permita o microfone no navegador para falar."
                                  : "Clique aqui para tirar dúvidas!"}
              </span>
            </button>
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className="cursor-pointer appearance-none border-0 bg-transparent p-0 text-left text-sm font-bold text-zinc-900 transition-colors hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400"
            >
                          Clique aqui para tirar dúvidas!
            </button>
          </div>
          <span className="font-mono text-sm font-semibold">
                      <span className="text-white">Plano base: </span>
                      <span className="text-primary">R$ {BASE_PLAN.price}/mês</span>
                    </span>
        </div>

        <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Selecione os plugins que deseja adicionar ao seu agente de IA:
        </p>

        <div className="grid gap-3.5 sm:grid-cols-2">
          {AVAILABLE_PLUGINS.map((plugin) => {
            const isSelected = selectedPlugins.includes(plugin.id);

            return (
              <button
                key={plugin.id}
                type="button"
                onClick={() => togglePlugin(plugin.id)}
                className={`group relative flex flex-col justify-between rounded-xl border p-5 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-500/10 shadow-xs dark:border-indigo-500/70 dark:bg-indigo-950/40"
                    : "border-zinc-200/90 bg-zinc-100/70 hover:border-zinc-300 dark:border-zinc-800/90 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {plugin.title}
                    </span>
                    <div
                      className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500 text-white dark:bg-indigo-500 dark:text-white"
                          : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950"
                      }`}
                    >
                      {isSelected ? <Check className="size-3 stroke-[3]" /> : <Plus className="size-3 text-zinc-400" />}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-400 leading-relaxed">
                    {plugin.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-zinc-200/60 pt-2.5 dark:border-zinc-800/60">
                  <Badge variant="secondary" className="text-[10px] py-0.5 px-2">
                    {plugin.category}
                  </Badge>
                  <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                    {plugin.price ? `+R$ ${plugin.price}/mês` : "Solicitar Cotação"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Live Plan Summary & Total */}
      <div className="lg:col-span-5">
        <div className="flex flex-col justify-between rounded-xl border border-indigo-500/30 bg-zinc-100/90 p-7 shadow-sm backdrop-blur dark:border-indigo-500/20 dark:bg-zinc-900/80">
          <div className="space-y-5">
            {/* Header & Cycle Switch */}
            <div className="flex items-start justify-between gap-3 border-b border-zinc-200/80 pb-4 dark:border-zinc-800">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Resumo do seu Plano
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Estimativa de investimento mensal
                </p>
              </div>

              {/* Monthly vs Yearly Switch */}
              <div className="mt-1 flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    billingCycle === "monthly"
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    billingCycle === "yearly"
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  Anual
                </button>
              </div>
            </div>

            {/* Included Items List */}
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between font-semibold text-zinc-800 dark:text-zinc-200 text-sm sm:text-base">
                              <span>Plano Starter</span>
                              <span className="font-mono font-bold text-primary">R$ {BASE_PLAN.price}</span>
              </div>

                            <div className="pl-6 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">+ WhatsApp Conector (incluso)</p>
                              <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">Atendimento 24/7 por texto, qualificação de leads e agendamentos automáticos.</p>
                            </div>

                            {selectedPluginObjects.length > 0 ? (
                              selectedPluginObjects.map((plugin) => (
                                <div
                                  key={plugin.id}
                                  className="flex items-center justify-between text-zinc-700 dark:text-zinc-400 pl-6 text-xs sm:text-sm"
                                >
                                  <span>+ {plugin.title}</span>
                                  <span className="font-mono font-medium">R$ {plugin.price}</span>
                                </div>
                              ))
                            ) : (
                              <p className="pl-6 text-xs sm:text-sm italic text-zinc-400">
                                Nenhum conector adicional selecionado
                              </p>
                            )}
                        </div>

            {/* Total Display */}
            <div className="border-t border-zinc-200/80 pt-5 dark:border-zinc-800">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-400">
                  Investimento Total:
                </span>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-primary font-mono">
                    R$ {totalMonthly}
                  </span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400"> / mês</span>
                </div>
              </div>

              {billingCycle === "yearly" && (
                <p className="mt-1.5 text-right text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  Economia de 20% aplicada no plano anual!
                </p>
              )}
            </div>
          </div>

          {/* CTA Button & Footnote */}
          <div className="mt-8 space-y-3">
            <Button asChild size="lg" className="w-full py-6 text-base font-medium">
              <a href={buildWhatsappLink()} target="_blank" rel="noopener noreferrer">
                Ativar Módulos Selecionados <ArrowRight className="size-5 ml-1.5" />
              </a>
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-center text-xs text-zinc-500 dark:text-zinc-400">
              <ShieldCheck className="size-4 text-indigo-500" />
              <span>Sem fidelidade obrigatória • Suporte prioritário</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
