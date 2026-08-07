'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDashboardVoice } from '@/hooks/use-dashboard-voice'
import {
  Mic,
  PhoneOff,
  Play,
  AudioLines,
  Sparkles,
  Search,
  MessageCircle,
  Users,
  Timer,
  ListPlus,
  ChevronDown,
  Wifi,
  Globe,
  FileText,
} from 'lucide-react'

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
`

const QUICK_COMMANDS = [
  {
    label: 'Buscar leads',
    prompt: 'Busque leads no Google Maps nas cidades São Paulo e Campinas, 10 leads por cidade.',
    icon: Search,
  },
  {
    label: 'Adicionar à fila',
    prompt: 'Adicione todos os leads disponíveis à lista de espera.',
    icon: ListPlus,
  },
  {
    label: 'Status WhatsApp',
    prompt: 'Qual é o status atual do WhatsApp?',
    icon: MessageCircle,
  },
  {
    label: 'Estatísticas',
    prompt: 'Mostre as estatísticas da dashboard.',
    icon: Sparkles,
  },
  {
    label: 'Personalizar mensagens',
    prompt: 'Personalize as mensagens para todos os leads pendentes usando a mensagem base: "Olá {nome}, achei seu contato e queria conversar."',
    icon: FileText,
  },
  {
    label: 'Ver leads',
    prompt: 'Liste os leads mais recentes.',
    icon: Users,
  },
]

const AVAILABLE_FUNCTIONS = [
  { name: 'executarScraping', desc: 'Extrai leads no Google Maps (1+ cidades, leads por extração)', icon: Search },
  { name: 'conectarWhatsApp', desc: 'Conecta/liga o WhatsApp (QR code)', icon: Wifi },
  { name: 'desconectarWhatsApp', desc: 'Desconecta o WhatsApp', icon: Wifi },
  { name: 'statusWhatsApp', desc: 'Verifica o status da conexão', icon: MessageCircle },
  { name: 'verEstatisticas', desc: 'Mostra KPIs da dashboard', icon: Sparkles },
  { name: 'verLeads', desc: 'Lista leads (filtros por cidade/status/limite)', icon: Users },
  { name: 'adicionarLeads', desc: 'Cadastra um ou mais contatos manualmente', icon: Users },
  { name: 'removerLeads', desc: 'Remove leads (por IDs, cidade ou whatsapp)', icon: Users },
  { name: 'limparLeads', desc: 'Remove todos os leads', icon: Users },
  { name: 'adicionarListaEspera', desc: 'Coloca contatos na fila (todos, por cidade ou IDs)', icon: ListPlus },
  { name: 'removerListaEspera', desc: 'Tira contatos da fila (por cidade ou IDs)', icon: ListPlus },
  { name: 'pausarFila / retomarFila', desc: 'Pausa ou retoma a fila de disparo', icon: Timer },
  { name: 'personalizarMensagens', desc: 'Executa a personalização de mensagens com IA', icon: FileText },
  { name: 'enviarMensagem', desc: 'Envio manual para número ou lead', icon: SendIcon },
  { name: 'configurarDelay', desc: 'Ajusta o intervalo anti-ban entre envios', icon: Timer },
]

function SendIcon() {
  return <MessageCircle className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
}

export function VoiceAIPanel({ startSignal = 0 }: { startSignal?: number }) {
  const {
    isRecordingVoice,
    isSpeaking,
    isSessionActive,
    selectedVoice,
    setSelectedVoice,
    toggleVoiceRecording,
    startLiveDialog,
    sendTextToVoice,
    GEMINI_LIVE_VOICES,
  } = useDashboardVoice()

  const [lastCommand, setLastCommand] = useState<string | null>(null)

  useEffect(() => {
    if (startSignal > 0 && !isRecordingVoice) {
      startLiveDialog()
    }
  }, [startSignal, isRecordingVoice, startLiveDialog])

  const runCommand = (prompt: string) => {
    const sent = sendTextToVoice(prompt)
    setLastCommand(sent ? prompt : 'Inicie a chamada antes de enviar comandos de texto.')
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AudioLines className="h-3.5 w-3.5 text-indigo-500" strokeWidth={1.5} />
            <span>IA de Voz — Controle da Dashboard</span>
          </CardTitle>
          <Badge
            variant="outline"
            className={`text-[10px] ${
              isRecordingVoice
                ? 'border-rose-400/40 bg-rose-500/10 text-rose-500'
                : 'border-zinc-300 dark:border-[#333] text-zinc-500'
            }`}
          >
            {isRecordingVoice ? (isSpeaking ? 'Falando...' : 'Ouvindo...') : 'Em espera'}
          </Badge>
        </div>
        <CardDescription>
          Controle total do painel por voz: scraping, WhatsApp, leads, fila e personalização de mensagens.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Orb + Mic (mesmo layout da landing page) */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center gap-3 rounded-[6px] border border-zinc-200/80 dark:border-[#262626] bg-zinc-50/60 dark:bg-[#181818]/60 p-5 overflow-hidden">
            <style>{fogAnimation}</style>

            <div className="relative w-full flex flex-col items-center justify-center min-h-[200px] sm:min-h-[260px]">
              <div className="relative flex items-center justify-center">
                {/* Main Planet Sphere with Notch Cutout Container */}
                <div
                  className={`w-44 h-44 sm:w-56 sm:h-56 rounded-full relative overflow-hidden transition-all duration-700 ${
                    isSpeaking
                      ? 'ring-1 ring-rose-300/30'
                      : isRecordingVoice
                        ? 'shadow-[0_20px_60px_-10px_rgba(225,29,72,0.3)] ring-1 ring-red-400/20'
                        : 'shadow-[0_10px_30px_-5px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)]'
                  }`}
                  style={isSpeaking ? { animation: 'speakingPulse 1.5s ease-in-out infinite' } : undefined}
                >
                  {/* Base Gradient Background */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(135deg, #ffe4e6 0%, #f43f5e 50%, #9f1239 100%)',
                    }}
                  />

                  {/* Crystal Ball Effect - Liquid/Fog Layer 1 (Bright Rose) */}
                  <div
                    className="absolute inset-0 opacity-80 blur-2xl"
                    style={{
                      background: 'radial-gradient(ellipse at 30% 30%, rgba(255,182,193,1) 0%, rgba(244,63,94,0.7) 40%, transparent 70%)',
                      animation: isSpeaking ? 'fogMove 1.5s ease-in-out infinite' : 'fogMove 6s ease-in-out infinite',
                    }}
                  />

                  {/* Crystal Ball Effect - Liquid/Fog Layer 2 (Deep Purple) */}
                  <div
                    className="absolute inset-0 opacity-75 blur-2xl"
                    style={{
                      background: 'radial-gradient(ellipse at 70% 60%, rgba(147,51,234,0.9) 0%, rgba(88,28,135,0.7) 40%, transparent 70%)',
                      animation: isSpeaking ? 'fogMove2 1.8s ease-in-out infinite' : 'fogMove2 7s ease-in-out infinite',
                    }}
                  />

                  {/* Crystal Ball Effect - Liquid/Fog Layer 3 (Lime Green for high contrast) */}
                  <div
                    className="absolute inset-0 opacity-70 blur-3xl"
                    style={{
                      background: 'radial-gradient(ellipse at 50% 80%, rgba(163,230,53,0.8) 0%, rgba(132,204,22,0.6) 50%, transparent 70%)',
                      animation: isSpeaking ? 'fogMove3 2s ease-in-out infinite' : 'fogMove3 8s ease-in-out infinite',
                    }}
                  />

                  {/* Liquid Wave Effect for organic movement */}
                  <div
                    className="absolute inset-0 opacity-50 blur-xl"
                    style={{
                      background: 'radial-gradient(circle at 40% 40%, rgba(251,113,133,0.8) 0%, transparent 60%)',
                      animation: isSpeaking ? 'liquidWave 2s ease-in-out infinite' : 'liquidWave 8s ease-in-out infinite',
                    }}
                  />

                  {/* Overlay to ensure visibility across themes */}
                  <div className="absolute inset-0 bg-white/10 dark:bg-black/10 pointer-events-none" />

                  {/* Crystal Reflection Effect */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 50%)',
                    }}
                  />

                  {/* Minimal Specular Soft Highlight */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20 pointer-events-none" />

                  {/* Crystal Border Glow */}
                  <div
                    className="absolute inset-0 rounded-full opacity-50"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent, rgba(254,205,211,0.4), transparent, rgba(192,132,252,0.4), transparent)',
                      animation: isSpeaking ? 'spin 3s linear infinite' : 'spin 15s linear infinite',
                    }}
                  />
                </div>

                {/* Seamless Notch Cutout Button Overlay at Bottom Center */}
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 size-10 sm:size-12 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                    isSessionActive
                      ? 'bg-rose-600 text-white hover:bg-rose-500 hover:scale-105 shadow-[0_0_20px_rgba(225,29,72,0.5)]'
                      : isRecordingVoice
                        ? 'bg-white text-black hover:bg-zinc-100 hover:scale-105'
                        : 'bg-white text-black hover:bg-zinc-100 hover:scale-105 animate-pulse'
                  }`}
                  title={isRecordingVoice ? 'Encerrar chamada' : 'Iniciar chamada'}
                >
                  {isRecordingVoice ? (
                    <PhoneOff className="size-4 sm:size-5.5 fill-current" />
                  ) : (
                    <Play className="size-4 sm:size-5.5 fill-current" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center max-w-[220px]">
              {isRecordingVoice
                ? `Sessão live ativa com a voz ${selectedVoice}. Fale no microfone.`
                : 'Clique no botão do orbe para iniciar o controle por voz.'}
            </p>

            <div className="w-full max-w-[300px] space-y-1.5">
              <label className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                <Mic className="h-3 w-3" />
                Voz da assistente
              </label>
              <Select value={selectedVoice} onValueChange={(v) => setSelectedVoice(v)} className="w-full">
                <SelectTrigger className="h-8 w-full truncate text-xs">
                  <SelectValue placeholder="Selecionar voz" className="text-xs" />
                </SelectTrigger>
                <SelectContent className="min-w-[320px] bg-white text-zinc-800 border-zinc-200 dark:bg-[#1f1f1f] dark:text-zinc-100 dark:border-[#333]">
                  {GEMINI_LIVE_VOICES.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id} className="text-xs whitespace-nowrap">
                      {voice.name} — {voice.style}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Commands + Functions */}
          <div className="lg:col-span-3 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                Comandos rápidos
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_COMMANDS.map((cmd) => (
                  <button
                    key={cmd.label}
                    type="button"
                    onClick={() => runCommand(cmd.prompt)}
                    className="flex items-center gap-1.5 rounded-[6px] border border-zinc-200/80 dark:border-[#2a2a2a] bg-zinc-50 dark:bg-[#1a1a1a] px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                  >
                    <cmd.icon className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
                    {cmd.label}
                  </button>
                ))}
              </div>
              {lastCommand && (
                <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500 italic truncate">
                  » {lastCommand}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                <Globe className="h-3.5 w-3.5 text-zinc-400" />
                Funções disponíveis para a IA
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2 max-h-64 overflow-y-auto pr-1">
                {AVAILABLE_FUNCTIONS.map((fn) => (
                  <div
                    key={fn.name}
                    className="flex items-start gap-2 rounded-[6px] border border-zinc-200/70 dark:border-[#242424] px-2.5 py-2"
                  >
                    <fn.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" strokeWidth={1.5} />
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[10px] font-semibold text-zinc-800 dark:text-zinc-200">
                        {fn.name}
                      </p>
                      <p className="text-[10px] leading-tight text-zinc-500 dark:text-zinc-400">{fn.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1 text-[11px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-200/60 dark:border-[#242424] pt-3">
          <p>• Diga comandos como «busque leads em 3 cidades», «adicione à lista de espera», «conecte o WhatsApp», «personalize as mensagens».</p>
          <p>• Módulo independente da IA de voz da landing page (sessão, tools e rotas próprias).</p>
        </div>
      </CardContent>
    </Card>
  )
}
