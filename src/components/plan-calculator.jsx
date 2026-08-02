"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Check,
  Plus,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Phone,
  X,
  Loader2,
  CheckCircle2,
  Copy,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLilithVoice } from "@/hooks/use-lilith-voice";
import { QRCodeSVG } from "qrcode.react";

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

const INSTALLER = {
  name: "Felipe Dutra",
  phone: "13 98865-8518",
  role: "Responsável pela instalação",
};

const activationSchema = z.object({
  fullName: z.string().min(3, "Nome completo é obrigatório"),
  email: z.string().email("E-mail válido é obrigatório"),
  whatsapp: z.string().refine((val) => {
    const digits = val.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 13;
  }, "WhatsApp inválido (ex: 11999999999)"),
  selectedDate: z.string().min(1, "Selecione um horário para a call de onboarding"),
});

function formatWhatsApp(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) {
    return digits.slice(0, 13);
  }
  const sliced = digits.slice(0, 11);
  if (sliced.length <= 2) return sliced;
  if (sliced.length <= 7) return `(${sliced.slice(0, 2)}) ${sliced.slice(2)}`;
  return `(${sliced.slice(0, 2)}) ${sliced.slice(2, 7)}-${sliced.slice(7)}`;
}

function groupSlotsByDate(slots) {
  const byDate = {};
  slots.forEach((s) => {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  });
  const dates = Object.keys(byDate).sort();
  return dates.map((date) => ({
    date,
    slots: byDate[date].sort((a, b) => new Date(a.id).getTime() - new Date(b.id).getTime()),
  }));
}

export function PlanCalculator() {
  const [selectedPlugins, setSelectedPlugins] = useState([]);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [micPermission, setMicPermission] = useState("prompt");

  // Inline Checkout State
  const [isCheckoutExpanded, setIsCheckoutExpanded] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Form & Slots, 2: PIX
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [generatingPix, setGeneratingPix] = useState(false);
  const [pixData, setPixData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 mins in seconds

  const checkoutRef = useRef(null);
  const greetedRef = useRef(false);

  const {
    isRecordingVoice,
    isSpeaking,
    isReadyToSpeak,
    toggleVoiceRecording,
    sendTextToVoice,
  } = useLilithVoice();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(activationSchema),
    defaultValues: { fullName: "", email: "", whatsapp: "", selectedDate: "" },
  });

  const whatsappValue = watch("whatsapp");

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

  useEffect(() => {
    if (checkoutStep === 2 && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [checkoutStep, timeLeft]);

  const fetchSlots = async () => {
    if (availableSlots.length > 0) return;
    setLoadingSlots(true);
    try {
      const res = await fetch("/api/cal/slots?days=21");
      const data = await res.json();
      if (data.status === "success") {
        const flattened = [];
        Object.entries(data.slots).forEach(([date, times]) => {
          times.forEach((s) => {
            const d = new Date(s.time);
            const label = d.toLocaleString("pt-BR", {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "America/Sao_Paulo",
            });
            flattened.push({
              id: s.time,
              date: date,
              time: d.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Sao_Paulo",
              }),
              label: label.charAt(0).toUpperCase() + label.slice(1).replace(".", ""),
            });
          });
        });
        setAvailableSlots(flattened.sort((a, b) => new Date(a.id).getTime() - new Date(b.id).getTime()));
        setCarouselIndex(0);
      }
    } catch (error) {
      console.error("Erro ao buscar slots:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleOpenCheckout = () => {
    setIsCheckoutExpanded(true);
    if (checkoutStep === 0) setCheckoutStep(1);
    fetchSlots();
    setTimeout(() => {
      checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

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
      return Math.round(monthlyTotal * 0.8);
    }

    return monthlyTotal;
  };

  const totalMonthly = calculateTotal();
  const selectedPluginObjects = AVAILABLE_PLUGINS.filter((p) =>
    selectedPlugins.includes(p.id)
  );

  const onWhatsAppChange = (e) => {
    const formatted = formatWhatsApp(e.target.value);
    setValue("whatsapp", formatted, { shouldValidate: true });
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setValue("selectedDate", slot.id, { shouldValidate: true });
  };

  const handleSubmitForm = async (data) => {
    if (!selectedSlot) return;
    setGeneratingPix(true);

    try {
      const pixRes = await fetch("/api/ggpix/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total: totalMonthly,
          name: data.fullName,
          phone: data.whatsapp,
          email: data.email,
        }),
      });
      const pixResult = await pixRes.json();

      const bookingRes = await fetch("/api/cal/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.fullName,
          email: data.email,
          phone: data.whatsapp,
          start: selectedSlot.id,
        }),
      });
      const bookingResult = await bookingRes.json();

      if (pixResult.success) {
        setPixData({
          code: pixResult.pix_code,
          amount: totalMonthly,
          expiresAt: new Date(Date.now() + 120 * 60 * 1000),
        });
        setCheckoutStep(2);
        setTimeLeft(1800);
      } else if (bookingResult.pix) {
        setPixData({
          code: bookingResult.pix.code,
          amount: totalMonthly,
          expiresAt: new Date(Date.now() + 120 * 60 * 1000),
        });
        setCheckoutStep(2);
        setTimeLeft(1800);
      } else {
        alert("Erro ao processar ativação. Por favor, tente novamente.");
      }
    } catch (err) {
      console.error("Erro no processo de ativação", err);
    } finally {
      setGeneratingPix(false);
    }
  };

  const handleCopyPix = () => {
    if (!pixData?.code) return;
    navigator.clipboard.writeText(pixData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const groupedDates = groupSlotsByDate(availableSlots);
  const currentDateGroup = groupedDates[carouselIndex];

  return (
    <div className="space-y-8">
      {/* Top 2 Columns Layout */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Plugin Selection Grid */}
        <div className="space-y-5 lg:col-span-7">
          <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-100/80 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900/60">
            <div
              className={`flex items-center transition-all duration-300 ${
                isRecordingVoice || isSpeaking ? "gap-3.5" : "gap-2"
              }`}
            >
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
              <span className="text-zinc-600 dark:text-zinc-400">Plano base: </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">R$ {BASE_PLAN.price}/mês</span>
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
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">R$ {BASE_PLAN.price}</span>
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
              {isCheckoutExpanded ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full py-6 text-base font-semibold border-indigo-500/40 text-indigo-600 hover:bg-indigo-500/10 dark:text-indigo-400"
                  onClick={() => setIsCheckoutExpanded(false)}
                >
                  Recolher Checkout <ChevronUp className="size-5 ml-1.5" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full py-6 text-base font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 cursor-pointer"
                  onClick={handleOpenCheckout}
                >
                  Ativar Módulos Selecionados <ArrowRight className="size-5 ml-1.5" />
                </Button>
              )}

              <div className="flex items-center justify-center gap-1.5 text-center text-xs text-zinc-500 dark:text-zinc-400">
                <ShieldCheck className="size-4 text-indigo-500" />
                <span>Sem fidelidade obrigatória • Suporte prioritário</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Inline Checkout Panel */}
      {isCheckoutExpanded && (
        <div
          ref={checkoutRef}
          className="rounded-2xl border border-indigo-500/30 bg-white/90 dark:bg-zinc-900/90 p-6 sm:p-8 shadow-xl backdrop-blur transition-all duration-300 animate-in fade-in slide-in-from-top-4"
        >
          {/* Header & Steps Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                  Checkout no Calculador
                </Badge>
                <span className="text-xs font-semibold text-zinc-400">
                  Passo {checkoutStep} de 2
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {checkoutStep === 1 ? "Dados Pessoais & Call de Onboarding" : "Finalizar Pagamento via PIX"}
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                  checkoutStep >= 1 ? "bg-indigo-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                }`}
              >
                <span>1</span>
                <span>Dados & Agendamento</span>
              </div>
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                  checkoutStep === 2 ? "bg-indigo-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                }`}
              >
                <span>2</span>
                <span>Pagamento</span>
              </div>
            </div>
          </div>

          {/* Step 1: Form + Calendar Slots */}
          {checkoutStep === 1 && (
            <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-12">
                {/* Form Fields & Calendar */}
                <div className="lg:col-span-7 space-y-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                    <User className="size-4 text-indigo-500" /> Preencha seus Dados
                  </h4>

                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Nome Completo
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="Ex: Dra. Ana Silva"
                      {...register("fullName")}
                      className={`${errors.fullName ? "border-red-500 focus:border-red-500" : ""} rounded-lg h-11 bg-zinc-50 dark:bg-zinc-950`}
                      disabled={generatingPix}
                    />
                    {errors.fullName && (
                      <p className="text-xs text-red-500">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Mail className="size-4 text-zinc-400" /> E-mail
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="ana@exemplo.com"
                        {...register("email")}
                        className={`${errors.email ? "border-red-500 focus:border-red-500" : ""} rounded-lg h-11 bg-zinc-50 dark:bg-zinc-950`}
                        disabled={generatingPix}
                      />
                      {errors.email && (
                        <p className="text-xs text-red-500">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Phone className="size-4 text-zinc-400" /> WhatsApp com DDD
                      </Label>
                      <Input
                        id="whatsapp"
                        placeholder="(11) 99999-9999"
                        value={whatsappValue}
                        onChange={onWhatsAppChange}
                        maxLength={20}
                        className={`${errors.whatsapp ? "border-red-500 focus:border-red-500" : ""} rounded-lg h-11 bg-zinc-50 dark:bg-zinc-950`}
                        disabled={generatingPix}
                      />
                      {errors.whatsapp && (
                        <p className="text-xs text-red-500">{errors.whatsapp.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Date & Time Slot Picker */}
                  <div className="pt-3 space-y-3">
                    <Label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Calendar className="size-4 text-indigo-500" />
                      Escolha o Horário da Call de Onboarding
                    </Label>

                    {loadingSlots ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
                        <Loader2 className="size-8 text-indigo-600 animate-spin" />
                        <p className="text-zinc-500 text-sm">Buscando horários disponíveis na agenda...</p>
                      </div>
                    ) : groupedDates.length > 0 ? (
                      <div className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-950/50">
                        <div className="relative">
                          <div className="flex gap-3 pb-2 overflow-x-auto scroll-hide">
                            {currentDateGroup?.slots.map((slot) => (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => handleSlotSelect(slot)}
                                className={`flex-1 min-w-[150px] flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                                  selectedSlot?.id === slot.id
                                    ? "border-indigo-500 bg-indigo-500/10 dark:bg-indigo-950/50 ring-1 ring-indigo-500"
                                    : "border-zinc-200 hover:border-indigo-300 dark:border-zinc-800 dark:hover:border-indigo-700 bg-white dark:bg-zinc-900"
                                }`}
                                disabled={generatingPix}
                              >
                                <div className="w-8 h-8 rounded-md bg-indigo-500/10 flex items-center justify-center shrink-0">
                                  <Calendar className="size-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <span className="font-medium text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm truncate">
                                  {slot.label}
                                </span>
                                {selectedSlot?.id === slot.id && (
                                  <CheckCircle2 className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-auto" />
                                )}
                              </button>
                            ))}
                          </div>

                          {groupedDates.length > 1 && (
                            <div className="flex items-center justify-between pt-2">
                              <button
                                type="button"
                                onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
                                disabled={carouselIndex === 0}
                                className="flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 disabled:opacity-30"
                              >
                                <ChevronLeft className="size-4" /> Data Anterior
                              </button>

                              <div className="flex gap-1">
                                {groupedDates.map((_, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setCarouselIndex(i)}
                                    className={`h-1.5 rounded-full transition-all ${
                                      i === carouselIndex ? "bg-indigo-600 w-5" : "bg-zinc-300 dark:bg-zinc-700 w-1.5"
                                    }`}
                                  />
                                ))}
                              </div>

                              <button
                                type="button"
                                onClick={() => setCarouselIndex(Math.min(groupedDates.length - 1, carouselIndex + 1))}
                                disabled={carouselIndex >= groupedDates.length - 1}
                                className="flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 disabled:opacity-30"
                              >
                                Próxima Data <ChevronRight className="size-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                          {currentDateGroup ? currentDateGroup.slots.length : 0} horários em{" "}
                          {currentDateGroup
                            ? new Date(currentDateGroup.date).toLocaleDateString("pt-BR", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              })
                            : ""}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-zinc-500 text-sm">
                        Nenhum horário disponível no momento.
                      </div>
                    )}

                    {errors.selectedDate && (
                      <p className="text-xs text-red-500">{errors.selectedDate.message}</p>
                    )}
                  </div>
                </div>

                {/* Summary & Confirm Column */}
                <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 bg-zinc-50/80 dark:bg-zinc-950/80 space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Resumo da Ativação
                    </h4>

                    <div className="space-y-2 text-sm border-b border-zinc-200 dark:border-zinc-800 pb-4">
                      <div className="flex justify-between font-semibold text-zinc-900 dark:text-zinc-100">
                        <span>Plano IA Core</span>
                        <span>R$ {BASE_PLAN.price}/mês</span>
                      </div>
                      {selectedPluginObjects.length > 0 ? (
                        selectedPluginObjects.map((p) => (
                          <div key={p.id} className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400 pl-3">
                            <span>+ {p.title}</span>
                            <span>R$ {p.price}/mês</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs italic text-zinc-400 pl-3">Nenhum conector extra</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-base font-bold text-zinc-900 dark:text-zinc-100">
                        <span>Investimento Mensal:</span>
                        <span className="text-indigo-600 dark:text-indigo-400">R$ {totalMonthly}/mês</span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        Ciclo: {billingCycle === "yearly" ? "Anual (20% OFF)" : "Mensal"} • Sem fidelidade
                      </p>
                    </div>

                    {selectedSlot && (
                      <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 p-3 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                        <span className="font-bold flex items-center gap-1.5">
                          <Calendar className="size-3.5" /> Call Agendada:
                        </span>
                        <p>{selectedSlot.label}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      disabled={!selectedSlot || generatingPix}
                      className="w-full py-6 text-base font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer"
                    >
                      {generatingPix ? (
                        <>
                          <Loader2 className="size-5 mr-2 animate-spin" /> Gerando PIX...
                        </>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Confirmar e Gerar PIX <ArrowRight className="size-5" />
                        </span>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-1.5 text-center text-xs text-zinc-500">
                      <ShieldCheck className="size-4 text-indigo-500" />
                      <span>Garantia de atendimento e suporte direto no WhatsApp</span>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Step 2: PIX QR Code & Instructions */}
          {checkoutStep === 2 && pixData && (
            <div className="space-y-6">
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-6 text-green-600 dark:text-green-400 shrink-0" />
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                      Call de Onboarding Reservada!
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Horário: {selectedSlot?.label}
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-600 text-white font-mono text-xs">
                  Aguardando PIX
                </Badge>
              </div>

              <div className="grid gap-6 lg:grid-cols-12">
                {/* QR Code & Copia e Cola */}
                <div className="lg:col-span-7 space-y-5 flex flex-col items-center text-center">
                  <div className="p-4 bg-white rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md">
                    <QRCodeSVG value={pixData.code} size={200} level="M" includeMargin={true} />
                  </div>

                  <div className="w-full space-y-2 text-left">
                    <Label className="text-xs text-zinc-500 uppercase tracking-wider font-bold">
                      Código PIX Copia e Cola
                    </Label>
                    <div className="relative">
                      <textarea
                        readOnly
                        value={pixData.code}
                        className="w-full px-3 py-2.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl font-mono text-xs text-zinc-800 dark:text-zinc-200 min-h-[70px] resize-none pr-24"
                      />
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="size-3.5 text-emerald-300" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Details & Installer Info */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/80 dark:bg-zinc-950/80 space-y-3 text-sm">
                    <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-2">
                      <span className="text-zinc-600 dark:text-zinc-400">Valor Total</span>
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-lg font-mono">
                        R$ {pixData.amount},00
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-2">
                      <span className="text-zinc-600 dark:text-zinc-400">Validade do PIX</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {formatTimer(timeLeft)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-600 dark:text-zinc-400">Instalação</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedSlot?.label}</span>
                    </div>
                  </div>

                  {/* Installer Card */}
                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                        FD
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{INSTALLER.name}</p>
                        <p className="text-xs text-zinc-500">{INSTALLER.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 pt-1">
                      <Phone className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-semibold">{INSTALLER.phone}</span>
                      <span className="text-zinc-400">•</span>
                      <span>Contato via WhatsApp</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 pt-1 leading-relaxed">
                      Após a confirmação do pagamento, {INSTALLER.name} entra em contato direto para validar as configurações iniciais do seu agente.
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setCheckoutStep(1)}
                    className="w-full text-xs font-semibold cursor-pointer"
                  >
                    Alterar Horário ou Dados
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
