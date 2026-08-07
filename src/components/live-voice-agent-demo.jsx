"use client";

import { useCallback, useEffect, useState } from "react";
import { useLilithVoice } from "@/hooks/use-lilith-voice";

// Beacon de analytics: dispara 1x por carregamento de página quando a landing
// é acessada com o ?id= do ManyChat (duas instâncias montam: mobile e desktop).
let landingAnalyticsSent = false;
import { SectionBadge } from "@/components/section-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  CalendarCheck,
  CheckCircle2,
  Mic,
  Play,
  PhoneOff,
  Sparkles,
  Wand2,
} from "lucide-react";

const initialBookings = [];

const exampleCommands = [
  "Agende uma consulta com a Ana amanhã às 10h",
  "Remarque o João para sexta às 14h",
  "Cancele a consulta do Pedro",
  "Quais horários têm livre hoje?",
];

const howItWorks = [
  { step: "1", title: "Fale no microfone", text: "Pressione o botão do orbe e diga o que quer fazer." },
  { step: "2", title: "A IA executa as tools", text: "Gaby entende, agenda, remarca ou cancela sozinha." },
  { step: "3", title: "Agenda atualiza na hora", text: "Veja cada registro aparecer aqui em tempo real." },
];

const fogAnimation = `
  @keyframes fogMove {
    0%, 100% {
      transform: translate(0, 0) scale(1) rotate(0deg);
      opacity: 0.6;
    }
    25% {
      transform: translate(15px, -15px) scale(1.15) rotate(90deg);
      opacity: 0.8;
    }
    50% {
      transform: translate(-10px, 10px) scale(0.9) rotate(180deg);
      opacity: 0.5;
    }
    75% {
      transform: translate(-15px, -10px) scale(1.1) rotate(270deg);
      opacity: 0.7;
    }
  }

  @keyframes fogMove2 {
    0%, 100% {
      transform: translate(0, 0) scale(1) rotate(0deg);
      opacity: 0.5;
    }
    33% {
      transform: translate(-20px, 15px) scale(1.2) rotate(120deg);
      opacity: 0.7;
    }
    66% {
      transform: translate(15px, -20px) scale(0.85) rotate(240deg);
      opacity: 0.4;
    }
  }

  @keyframes fogMove3 {
    0%, 100% {
      transform: translate(0, 0) scale(1);
      opacity: 0.4;
    }
    50% {
      transform: translate(25px, 25px) scale(1.3);
      opacity: 0.6;
    }
  }

  @keyframes liquidWave {
    0%, 100% {
      border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
    }
    25% {
      border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
    }
    50% {
      border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%;
    }
    75% {
      border-radius: 60% 40% 60% 30% / 70% 30% 50% 60%;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes speakingPulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 25px 70px -10px rgba(244,63,94,0.4);
    }
    50% {
      transform: scale(1.08);
      box-shadow: 0 35px 90px -15px rgba(244,63,94,0.6);
    }
  }

  @keyframes bookingIn {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes micNudge {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(4px);
    }
  }
`;

export function LiveVoiceAgentDemo({ placement = "desktop" }) {
  const [identity] = useState(() => {
    if (typeof window === "undefined") return { nome: null, id: null };
    const urlParams = new URLSearchParams(window.location.search);
    return {
      nome: urlParams.get("nome") || null,
      id: urlParams.get("id") || null,
    };
  });

  // Como o demo é montado 2x na página (mobile e desktop), só a instância
  // visível no viewport atual deve responder ao botão global de voz.
  const isPlacementVisible = useCallback(() => {
    if (typeof window === "undefined") return placement === "desktop";
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    return isDesktop ? placement === "desktop" : placement === "mobile";
  }, [placement]);

  const {
    isRecordingVoice,
    isSpeaking,
    isSessionActive,
    toggleVoiceRecording,
    startLiveDialog,
    selectedVoice,
    scheduledBookings,
  } = useLilithVoice(identity);

  // Registra a conversão "acesso à landing" para leads vindos do ManyChat (?id=)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!identity?.id || landingAnalyticsSent) return;
    landingAnalyticsSent = true;
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: identity.id, nome: identity.nome || null, event: "landing_visit" }),
    }).catch(() => { });
  }, [identity]);

  const displayBookings = [...scheduledBookings, ...initialBookings];

  useEffect(() => {
    const onStartVoice = () => {
      if (isPlacementVisible() && !isRecordingVoice) {
        startLiveDialog();
      }
    };
    window.addEventListener("psicomarketing:start-voice", onStartVoice);
    return () => window.removeEventListener("psicomarketing:start-voice", onStartVoice);
  }, [startLiveDialog, isRecordingVoice, isPlacementVisible]);

  return (
    <>
      <style>{fogAnimation}</style>
      {/* Header - outside the card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2.5 sm:mb-3">
            <SectionBadge icon={Mic}>
              Voz + Tool Calling (Live)
            </SectionBadge>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-100">
              Simule um agendamento
            </h3>
            <p className="max-w-4xl text-sm sm:text-base md:text-lg leading-tight text-zinc-700 dark:text-zinc-400">
              Pressione o microfone e veja como Gaby pode ser útil no seu dia a dia.
            </p>
          </div>
        </div>
      </div>

      <Card className="p-4 sm:p-6 md:p-8 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 transition-all duration-300 pb-4 md:pb-6 md:bg-zinc-100/70 md:dark:bg-zinc-900/50 md:border-transparent md:backdrop-blur-sm">
        {/* Main Interactive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Column: ElevenLabs Style Audio Orb & Connect Controls */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center relative overflow-hidden md:bg-zinc-50 md:dark:bg-zinc-950/60">
            {/* Authentic ChatGPT Advanced Voice & ElevenLabs Planet Orb */}
            <div className="relative my-2 sm:my-4 flex flex-col items-center justify-center w-full min-h-[200px] sm:min-h-[260px]">
              {/* Main Planet Sphere with Notch Cutout Container */}
              <div className="relative flex items-center justify-center">
                {/* Main Planet Sphere */}
                <div
                  className={`w-44 h-44 sm:w-56 sm:h-56 rounded-full relative overflow-hidden transition-all duration-700 ${isSpeaking
                    ? "ring-1 ring-rose-300/30"
                    : isRecordingVoice
                      ? "shadow-[0_20px_60px_-10px_rgba(225,29,72,0.3)] ring-1 ring-red-400/20"
                      : "shadow-[0_10px_30px_-5px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)]"
                    }`}
                  style={isSpeaking ? {
                    animation: "speakingPulse 1.5s ease-in-out infinite",
                  } : undefined}
                >
                  {/* Base Gradient Background */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(135deg, #ffe4e6 0%, #f43f5e 50%, #9f1239 100%)",
                    }}
                  />

                  {/* Crystal Ball Effect - Liquid/Fog Layer 1 (Bright Rose) */}
                  <div
                    className="absolute inset-0 opacity-80 blur-2xl"
                    style={{
                      background: "radial-gradient(ellipse at 30% 30%, rgba(255,182,193,1) 0%, rgba(244,63,94,0.7) 40%, transparent 70%)",
                      animation: isSpeaking ? "fogMove 1.5s ease-in-out infinite" : "fogMove 6s ease-in-out infinite",
                    }}
                  />

                  {/* Crystal Ball Effect - Liquid/Fog Layer 2 (Deep Purple) */}
                  <div
                    className="absolute inset-0 opacity-75 blur-2xl"
                    style={{
                      background: "radial-gradient(ellipse at 70% 60%, rgba(147,51,234,0.9) 0%, rgba(88,28,135,0.7) 40%, transparent 70%)",
                      animation: isSpeaking ? "fogMove2 1.8s ease-in-out infinite" : "fogMove2 7s ease-in-out infinite",
                    }}
                  />

                  {/* Crystal Ball Effect - Liquid/Fog Layer 3 (Lime Green for high contrast) */}
                  <div
                    className="absolute inset-0 opacity-70 blur-3xl"
                    style={{
                      background: "radial-gradient(ellipse at 50% 80%, rgba(163,230,53,0.8) 0%, rgba(132,204,22,0.6) 50%, transparent 70%)",
                      animation: isSpeaking ? "fogMove3 2s ease-in-out infinite" : "fogMove3 8s ease-in-out infinite",
                    }}
                  />

                  {/* Liquid Wave Effect for organic movement */}
                  <div
                    className="absolute inset-0 opacity-50 blur-xl"
                    style={{
                      background: "radial-gradient(circle at 40% 40%, rgba(251,113,133,0.8) 0%, transparent 60%)",
                      animation: isSpeaking ? "liquidWave 2s ease-in-out infinite" : "liquidWave 8s ease-in-out infinite",
                    }}
                  />

                  {/* Overlay to ensure visibility across themes */}
                  <div className="absolute inset-0 bg-white/10 dark:bg-black/10 pointer-events-none" />

                  {/* Crystal Reflection Effect */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 50%)",
                    }}
                  />

                  {/* Minimal Specular Soft Highlight */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20 pointer-events-none" />

                  {/* Crystal Border Glow */}
                  <div
                    className="absolute inset-0 rounded-full opacity-50"
                    style={{
                      background: "conic-gradient(from 0deg, transparent, rgba(254,205,211,0.4), transparent, rgba(192,132,252,0.4), transparent)",
                      animation: isSpeaking ? "spin 3s linear infinite" : "spin 15s linear infinite",
                    }}
                  />
                </div>


                {/* Seamless Notch Cutout Button Overlay at Bottom Center */}
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 size-10 sm:size-12 rounded-full flex items-center justify-center transition-all duration-300 ${isSessionActive
                    ? "bg-rose-600 text-white hover:bg-rose-500 hover:scale-105 shadow-[0_0_20px_rgba(225,29,72,0.5)]"
                    : isRecordingVoice
                      ? "bg-white text-black hover:bg-zinc-100 hover:scale-105"
                      : "bg-white text-black hover:bg-zinc-100 hover:scale-105 animate-pulse"
                    }`}
                  title={isRecordingVoice ? "Encerrar chamada" : "Iniciar chamada"}
                >
                  {isRecordingVoice ? (
                    <PhoneOff className="size-4 sm:size-5.5 fill-current" />
                  ) : (
                    <Play className="size-4 sm:size-5.5 fill-current" />
                  )}
                </button>
              </div>
            </div>

            {/* Connect Instruction Text */}
            <div className="w-full space-y-2 mt-2">
              <p className="text-[10px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-400">
                {isRecordingVoice
                  ? `Sessão live activa com a voz ${selectedVoice}. Fale no microfone.`
                  : `Clique no botão do orbe para iniciar.`}
              </p>
            </div>
          </div>

          {/* Right Column: Session Bookings Feed */}
          <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-5">
            {/* Session Bookings Feed */}
            <div className="lg:flex-1 bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3.5 sm:p-5 flex flex-col md:bg-indigo-500/5 md:dark:bg-indigo-950/20">
              <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  <span className="inline-flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 dark:bg-indigo-400/10">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                  <span className="hidden sm:inline">Agendamentos da Sessão</span>
                  <span className="sm:hidden">Agendamentos</span>
                </span>
                <Badge variant="outline" className="text-[9px] sm:text-[10px] border-indigo-500/30 text-indigo-500 bg-indigo-500/5 shrink-0">
                  {displayBookings.length} {displayBookings.length === 1 ? "registro" : "registros"}
                </Badge>
              </div>

              <div className="space-y-2 sm:space-y-2.5 lg:flex-1">
                {displayBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-indigo-500/25 bg-white/60 dark:bg-zinc-900/60 px-4 py-6 sm:py-8 text-center lg:min-h-[160px]">
                    <span className="inline-flex size-9 sm:size-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                      <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-[11px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                        Sem agendamentos ainda
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 leading-snug max-w-[220px]">
                        Toque no microfone e peça para a Gaby agendar uma consulta.
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-500 dark:text-indigo-400 mt-0.5"
                      style={{ animation: "micNudge 2s ease-in-out infinite" }}
                    >
                      <Mic className="w-3 h-3" />
                      Experimente agora
                    </span>
                  </div>
                ) : (
                  displayBookings.map((b, i) => (
                    <div
                      key={b.id}
                      className="booking-in flex items-center gap-2.5 sm:gap-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 px-2.5 sm:px-3.5 py-2.5 sm:py-3 shadow-xs transition-all duration-200 hover:border-indigo-500/40 hover:shadow-sm"
                      style={{ animation: `bookingIn 0.35s ease-out both`, animationDelay: `${Math.min(i, 5) * 60}ms` }}
                    >
                      <span className="inline-flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                        <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] sm:text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {b.nome}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                          {b.tipoConsulta}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-[9px] sm:text-[10px] sm:text-xs font-mono bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/15">
                        {b.dia} às {b.horario}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Desktop-only: Example commands + How it works */}
            <div className="hidden lg:flex flex-col gap-4">
              <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Comandos de exemplo
                  </span>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                  {exampleCommands.map((cmd) => (
                    <span
                      key={cmd}
                      className="rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-2 text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug"
                    >
                      &ldquo;{cmd}&rdquo;
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Como funciona
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {howItWorks.map((s) => (
                    <div
                      key={s.step}
                      className="rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-2.5"
                    >
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-indigo-500/15 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-1.5">
                        {s.step}
                      </span>
                      <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                        {s.title}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-snug mt-0.5">
                        {s.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
