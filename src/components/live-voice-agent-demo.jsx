"use client";

import { useEffect } from "react";
import { useLilithVoice } from "@/hooks/use-lilith-voice";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  CalendarCheck,
  CheckCircle2,
  Phone,
  PhoneOff,
} from "lucide-react";

const initialBookings = [];

export function LiveVoiceAgentDemo() {
  const {
    isRecordingVoice,
    isSpeaking,
    toggleVoiceRecording,
    startLiveDialog,
    selectedVoice,
    scheduledBookings,
  } = useLilithVoice();

  const displayBookings = [...scheduledBookings, ...initialBookings];

  useEffect(() => {
    const onStartVoice = () => {
      if (!isRecordingVoice) {
        startLiveDialog();
      }
    };
    window.addEventListener("psicomarketing:start-voice", onStartVoice);
    return () => window.removeEventListener("psicomarketing:start-voice", onStartVoice);
  }, [startLiveDialog, isRecordingVoice]);

  return (
    <Card className="p-4 sm:p-6 md:p-8 bg-zinc-100/70 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 backdrop-blur-sm transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] sm:text-xs text-zinc-500">
              Voz Bidirecional + Tool Calling
            </Badge>
          </div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      Fale com a IA e preencha sua agenda
          </h3>
          <p className="text-xs sm:text-sm md:text-base text-zinc-700 dark:text-zinc-400">
                      Crie agendamentos personalizados, cancele e remaque, deixamos uma agenda fictícia ao lado para você testar.
          </p>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mt-4 sm:mt-6">
        {/* Left Column: ElevenLabs Style Audio Orb & Connect Controls */}
        <div className="lg:col-span-5 flex flex-col items-center justify-between p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center relative overflow-hidden">
          {/* Authentic ChatGPT Advanced Voice & ElevenLabs Planet Orb */}
          <div className="relative my-2 sm:my-4 flex flex-col items-center justify-center w-full min-h-[200px] sm:min-h-[260px]">
            {/* Outer Subtle Ambient Glow */}
            <div
              className={`absolute w-48 sm:w-64 h-44 sm:h-60 rounded-full transition-all duration-700 ${
                isSpeaking
                  ? "bg-gradient-to-r from-cyan-400/40 via-emerald-400/40 to-teal-500/40 blur-2xl animate-pulse scale-110"
                  : isRecordingVoice
                  ? "bg-gradient-to-r from-cyan-500/30 via-teal-500/30 to-green-500/30 blur-xl animate-pulse"
                  : "bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-green-500/10 blur-lg"
              }`}
            />

            {/* Main Planet Sphere with Notch Cutout Container */}
            <div className="relative flex items-center justify-center">
              {/* Main Planet Sphere */}
              <div
                className={`w-44 h-44 sm:w-56 sm:h-56 rounded-full relative overflow-hidden transition-all duration-700 ${
                  isSpeaking
                    ? "scale-105 shadow-[0_25px_70px_-10px_rgba(13,148,136,0.6)] dark:shadow-[0_25px_70px_-10px_rgba(56,189,248,0.4)] ring-1 ring-cyan-300/30"
                    : isRecordingVoice
                    ? "shadow-[0_20px_60px_-10px_rgba(13,148,136,0.45)] dark:shadow-[0_20px_60px_-10px_rgba(20,184,166,0.3)] ring-1 ring-teal-400/20"
                    : "shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)]"
                }`}
              >
                {/* Organic Multi-Layered Geographic Planet Gradient */}
                <div
                  className={`absolute inset-0 transition-transform duration-1000 ${
                    isSpeaking ? "animate-spin" : isRecordingVoice ? "animate-pulse" : ""
                  }`}
                  style={{
                    background:
                      "radial-gradient(circle at 35% 25%, #bae6fd 0%, #38bdf8 25%, #0d9488 50%, #15803d 75%, #14532d 100%)",
                    animationDuration: "25s",
                  }}
                />

                {/* Geographic Continent Curve Overlay Layer */}
                <div
                  className="absolute inset-0 opacity-85 mix-blend-color-burn"
                  style={{
                    background:
                      "radial-gradient(ellipse at 70% 80%, #166534 0%, #047857 40%, transparent 75%)",
                  }}
                />

                {/* Top Specular Soft Highlight */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/25 pointer-events-none" />

                {/* Film Grain / Tactile Noise Texture Overlay */}
                <div
                  className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  }}
                />

                {/* Audio Wave Visualizer Overlay when speaking */}
                {isSpeaking && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="flex items-center gap-1.5 h-12">
                      <span className="w-1.5 bg-indigo-400/60 rounded-full animate-bounce h-6" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 bg-cyan-400/60 rounded-full animate-bounce h-10" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 bg-teal-400/60 rounded-full animate-bounce h-8" style={{ animationDelay: "300ms" }} />
                      <span className="w-1.5 bg-emerald-400/60 rounded-full animate-bounce h-11" style={{ animationDelay: "450ms" }} />
                      <span className="w-1.5 bg-teal-400/60 rounded-full animate-bounce h-7" style={{ animationDelay: "200ms" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Seamless Notch Cutout Button Overlay at Bottom Center */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-zinc-50 dark:bg-zinc-950 p-1.5 sm:p-2 rounded-full">
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`size-10 sm:size-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isRecordingVoice
                        ? "bg-rose-600 text-white hover:bg-rose-500 hover:scale-105 shadow-md shadow-rose-600/30"
                        : "bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 shadow-md shadow-indigo-600/30 animate-pulse"
                    }`}
                    title={isRecordingVoice ? "Encerrar chamada" : "Iniciar chamada"}
                  >
                    {isRecordingVoice ? (
                      <PhoneOff className="size-4 sm:size-5.5 fill-current" />
                    ) : (
                      <Phone className="size-4 sm:size-5.5 fill-current" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Connect Instruction Text */}
          <div className="w-full space-y-2 mt-2">
            <p className="text-[10px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-400">
              {isRecordingVoice
                ? `Sessão live activa com a voz ${selectedVoice}. Fale no microfone.`
                : `Clique no botão do orbe para iniciar a chamada por voz em tempo real.`}
            </p>
          </div>
        </div>

        {/* Right Column: Session Bookings Feed */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4 sm:space-y-5">
          {/* Session Bookings Feed */}
          <div className="flex-1 bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3 border-b border-indigo-500/10 pb-2 sm:pb-2.5">
                <span className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Agendamentos da Sessão (Lilith Live)</span>
                  <span className="sm:hidden">Agendamentos</span>
                </span>
                <Badge variant="outline" className="text-[9px] sm:text-[10px] border-indigo-500/30 text-indigo-500">
                  {displayBookings.length} {displayBookings.length === 1 ? "registro" : "registros"}
                </Badge>
              </div>

              <div className="space-y-2 sm:space-y-2.5 max-h-[140px] sm:max-h-[180px] overflow-y-auto pr-1">
                {displayBookings.length === 0 ? (
                  <div className="flex items-center justify-center text-[10px] sm:text-xs p-3 sm:p-4 rounded-lg bg-white/60 dark:bg-zinc-900/60 border border-dashed border-zinc-300/70 dark:border-zinc-700/70 text-zinc-400 dark:text-zinc-500 text-center">
                    Sem agendamentos ainda!
                  </div>
                ) : (
                displayBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between text-[10px] sm:text-xs p-2 sm:p-3 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs"
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2.5">
                      <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{b.nome}</span>
                      <span className="text-zinc-500 text-[9px] sm:text-xs hidden sm:inline">• {b.tipoConsulta}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[9px] sm:text-[10px] sm:text-xs font-mono bg-zinc-100 dark:bg-zinc-800">
                        {b.dia} às {b.horario}
                      </Badge>
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
