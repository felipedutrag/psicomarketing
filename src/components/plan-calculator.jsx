"use client";

import { useState } from "react";
import { Check, Plus, Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const BASE_PLAN = {
  name: "IA Core Atendimento",
  price: 297,
  description: "Atendimento 24/7 por texto no WhatsApp, qualificação de leads e gestão da agenda.",
};

const AVAILABLE_PLUGINS = [
  {
    id: "google-ads",
    title: "Google Ads Plugin",
    price: 197,
    category: "Aquisição",
    description: "Criação e otimização contínua de campanhas na rede de pesquisa do Google.",
  },
  {
    id: "facebook-ads",
    title: "Meta / Instagram Ads Plugin",
    price: 197,
    category: "Tráfego Pago",
    description: "Anúncios direcionados no Instagram e Facebook com link direto para o WhatsApp.",
  },
  {
    id: "native-voice",
    title: "Módulo de Voz Nativa",
    price: 149,
    category: "Hiper-Realista",
    description: "Atendimento por mensagens de áudio ultra-realistas com voz humana no WhatsApp.",
  },
  {
    id: "smart-booking",
    title: "Sincronização de Agenda & Lembretes",
    price: 97,
    category: "Automação",
    description: "Integração bidirecional com Google Calendar, iCal e confirmações automáticas.",
  },
  {
    id: "email-dispatch",
    title: "Nutrição por E-mail & Lembretes",
    price: 77,
    category: "Relacionamento",
    description: "Régua automática de confirmação, reagendamento e orientações pré-consulta.",
  },
  {
    id: "custom-plugin",
    title: "Plugin / Integração Sob Medida",
    price: 249,
    category: "API Customizada",
    description: "Desenvolvimento de webhook ou integração com sistema clínico específico.",
  },
];

export function PlanCalculator() {
  const [selectedPlugins, setSelectedPlugins] = useState([
    "google-ads",
    "native-voice",
    "smart-booking",
  ]);
  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "yearly"

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
        <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-100/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <Zap className="size-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Plano Base Obrigatório: {BASE_PLAN.name}
            </span>
          </div>
          <span className="font-mono text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            R$ {BASE_PLAN.price}/mês
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

                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {plugin.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-zinc-200/60 pt-2.5 dark:border-zinc-800/60">
                  <Badge variant="secondary" className="text-[10px] py-0.5 px-2">
                    {plugin.category}
                  </Badge>
                  <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    +R$ {plugin.price}/mês
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Live Plan Summary & Total */}
      <div className="lg:col-span-5">
        <div className="sticky top-6 flex flex-col justify-between rounded-xl border border-indigo-500/30 bg-zinc-100/90 p-7 shadow-sm backdrop-blur dark:border-indigo-500/20 dark:bg-zinc-900/80">
          <div className="space-y-5">
            {/* Header & Cycle Switch */}
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-4 dark:border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Resumo do seu Plano
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Estimativa de investimento mensal
                </p>
              </div>

              {/* Monthly vs Yearly Switch */}
              <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
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
                  Anual (-20%)
                </button>
              </div>
            </div>

            {/* Included Items List */}
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between font-semibold text-zinc-800 dark:text-zinc-200 text-sm sm:text-base">
                <span className="flex items-center gap-2">
                  <Check className="size-4 text-indigo-600 dark:text-indigo-400" />
                  Plano Base ({BASE_PLAN.name})
                </span>
                <span className="font-mono font-bold">R$ {BASE_PLAN.price}</span>
              </div>

              {selectedPluginObjects.length > 0 ? (
                selectedPluginObjects.map((plugin) => (
                  <div
                    key={plugin.id}
                    className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 pl-6 text-xs sm:text-sm"
                  >
                    <span>+ {plugin.title}</span>
                    <span className="font-mono font-medium">R$ {plugin.price}</span>
                  </div>
                ))
              ) : (
                <p className="pl-6 text-xs sm:text-sm italic text-zinc-400">
                  Nenhum plugin selecionado ainda
                </p>
              )}
            </div>

            {/* Total Display */}
            <div className="border-t border-zinc-200/80 pt-5 dark:border-zinc-800">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  Investimento Total:
                </span>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
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
