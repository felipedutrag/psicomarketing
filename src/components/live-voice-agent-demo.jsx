"use client";

import { useLilithVoice, GEMINI_LIVE_VOICES } from "@/hooks/use-lilith-voice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mic,
  MicOff,
  CalendarCheck,
  Volume2,
  CheckCircle2,
  Phone,
  PhoneOff,
} from "lucide-react";

const initialBookings = [
  {
    id: "b1",
    nome: "Mariana Silva",
    dia: "Quarta-feira",
    horario: "14:00",
    tipoConsulta: "Primeira Consulta",
    status: "Confirmado",
  },
  {
    id: "b2",
    nome: "Mariana Silva",
    dia: "Quarta-feira",
    horario: "17:00",
    tipoConsulta: "Primeira Consulta",
    status: "Confirmado",
  },
];

export function LiveVoiceAgentDemo() {
  const {
    isRecordingVoice,
    isSpeaking,
    toggleVoiceRecording,
    selectedVoice,
    setSelectedVoice,
    scheduledBookings,
  } = useLilithVoice();

  const displayBookings = [...scheduledBookings, ...initialBookings];

  return (
    <Card className="p-6 md:p-8 bg-zinc-100/70 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 backdrop-blur-sm transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs text-zinc-500">
              Voz Bidirecional + Tool Calling
            </Badge>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Simule Agendamento por IA e veja como é incrível!
          </h3>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
            Crie agendamentos personalizados, cancele e remaque, deixamos uma agenda ao lado para você testar.
          </p>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          {isRecordingVoice ? (
            <Badge className="bg-indigo-600 text-white px-3 py-1 text-xs gap-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              Sessão Live Ativa ({selectedVoice})
            </Badge>
          ) : (
            <Badge variant="outline" className="text-zinc-500 px-3 py-1 text-xs">
              Sessão em Espera
            </Badge>
          )}
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column: ElevenLabs Style Audio Orb & Connect Controls */}
        <div className="lg:col-span-5 flex flex-col items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center relative overflow-hidden">
          {/* Authentic ChatGPT Advanced Voice & ElevenLabs Planet Orb */}
          <div className="relative my-4 flex flex-col items-center justify-center w-full min-h-[260px]">
            {/* Outer Subtle Ambient Glow */}
            <div
              className={`absolute w-64 h-60 rounded-full transition-all duration-700 ${
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
                className={`w-56 h-56 sm:w-60 sm:h-60 rounded-full relative overflow-hidden transition-all duration-700 ${
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
                      <span className="w-1.5 bg-white/90 rounded-full animate-bounce h-6" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 bg-white/90 rounded-full animate-bounce h-10" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 bg-white/90 rounded-full animate-bounce h-8" style={{ animationDelay: "300ms" }} />
                      <span className="w-1.5 bg-white/90 rounded-full animate-bounce h-11" style={{ animationDelay: "450ms" }} />
                      <span className="w-1.5 bg-white/90 rounded-full animate-bounce h-7" style={{ animationDelay: "200ms" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Seamless Notch Cutout Button Overlay at Bottom Center */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-zinc-50 dark:bg-zinc-950 p-2 rounded-full">
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`size-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isRecordingVoice
                        ? "bg-rose-600 text-white hover:bg-rose-500 hover:scale-105 shadow-md shadow-rose-600/30"
                        : "bg-black text-white hover:bg-zinc-900 hover:scale-105 shadow-md"
                    }`}
                    title={isRecordingVoice ? "Encerrar chamada" : "Iniciar chamada"}
                  >
                    {isRecordingVoice ? (
                      <PhoneOff className="size-4.5 fill-current" />
                    ) : (
                      <Phone className="size-4.5 fill-current" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Connect Instruction Text */}
          <div className="w-full space-y-2 mt-2">
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {isRecordingVoice
                ? `Sessão live ativa com a voz ${selectedVoice}. Fale no microfone.`
                : `Clique no botão do orbe para iniciar a chamada por voz em tempo real.`}
            </p>
          </div>
        </div>

        {/* Right Column: Voice Selector & Session Bookings Feed */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
          {/* Voice Selector Dropdown (Positioned on the Right Side) */}
          <div className="bg-white/80 dark:bg-zinc-950/60 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-left space-y-2 md:py-8 md:px-6">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-500" />
                Seletor de Voz Nativa (Gemini Live)
              </label>
              <Badge variant="secondary" className="text-[10px] font-semibold">
                7 Opções de Voz
              </Badge>
            </div>
            <div className="line-ignite h-px w-full" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Escolha o timbre de voz com sintetizador em tempo real (PCM 24kHz):
            </p>
            <Select
              value={selectedVoice}
              onValueChange={setSelectedVoice}
              disabled={isRecordingVoice}
            >
              <SelectTrigger className="w-full h-9 text-xs sm:text-sm font-semibold">
                <SelectValue placeholder="Escolha uma voz" />
              </SelectTrigger>
              <SelectContent>
                {GEMINI_LIVE_VOICES.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} • {v.gender} — {v.style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Session Bookings Feed */}
          <div className="flex-1 bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-indigo-500/10 pb-2.5">
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Agendamentos da Sessão (Lilith Live)
                </span>
                <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-500">
                  {displayBookings.length} {displayBookings.length === 1 ? "registro" : "registros"}
                </Badge>
              </div>

              <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                {displayBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between text-xs sm:text-sm p-3 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <CalendarCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{b.nome}</span>
                      <span className="text-zinc-500 text-xs">• {b.tipoConsulta}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] sm:text-xs font-mono bg-zinc-100 dark:bg-zinc-800">
                        {b.dia} às {b.horario}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
