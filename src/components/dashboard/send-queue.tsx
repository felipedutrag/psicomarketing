'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Timer, Loader2, Users, Pause, Play, X, Trash2, RefreshCw, CalendarClock } from 'lucide-react'
import type { Lead } from '@/lib/dashboard/config'

interface QueueResponse {
  queue: Lead[]
  delayMin: number
  delayMax: number
  lastSendAt: number | null
  paused: boolean
  schedule: { enabled: boolean; start: string; end: string }
  withinWindow: boolean
  nextOpenAt: number | null
  now: number
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function formatDelay(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`
}

function formatUntil(ms: number): string {
  const totalMs = Math.max(0, ms)
  const minutes = Math.floor(totalMs / 60000)
  const hours = Math.floor(minutes / 60)
  const restMinutes = minutes % 60
  if (hours > 0) return `abre em ${hours}h ${restMinutes}min`
  return `abre em ${minutes}min`
}

export function SendQueue() {
  const [data, setData] = useState<QueueResponse | null>(null)
  const [now, setNow] = useState<number>(Date.now())
  const [busy, setBusy] = useState(false)

  const fetchQueue = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/whatsapp/queue')
      const json = await response.json()
      if (json.queue) setData(json)
    } catch (error) {
      console.error('Erro ao buscar fila de envio:', error)
    }
  }, [])

  useEffect(() => {
    fetchQueue()
    const poll = setInterval(() => {
      if (!document.hidden) fetchQueue()
    }, 5000)
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      clearInterval(poll)
      clearInterval(tick)
    }
  }, [fetchQueue])

  const postAction = async (action: string, leadIds?: string[]) => {
    setBusy(true)
    try {
      const response = await fetch('/api/dashboard/whatsapp/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, leadIds }),
      })
      const json = await response.json()
      if (!json.success) console.error('Erro na fila:', json.error)
    } catch (error) {
      console.error('Erro ao modificar fila:', error)
    } finally {
      setBusy(false)
      await fetchQueue()
    }
  }

  if (!data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <span>⚡</span>
            <span>Fila de Disparo Anti-Ban</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </CardContent>
      </Card>
    )
  }

  const count = data.queue.length
  const readyAt = data.lastSendAt ? data.lastSendAt + data.delayMin * 1000 : null
  const remaining = readyAt ? readyAt - now : 0
  const scheduleOn = data.schedule.enabled
  const outsideWindow = scheduleOn && !data.withinWindow
  const timeWindowNote =
    scheduleOn && data.nextOpenAt ? formatUntil(data.nextOpenAt - now) : null
  const ready = count === 0 || (!outsideWindow && remaining <= 0)

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <span>⚡</span>
            <span>Fila de Disparo Anti-Ban</span>
          </CardTitle>
          <CardDescription>
            {count === 0
              ? 'Sem leads na fila. Selecione leads na tabela de leads para adicionar.'
              : `${count} lead(s) aguardando disparo automático com controle de intervalo`}
          </CardDescription>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${
              data.paused
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
            }`}
          >
            {data.paused ? 'Pausada' : `${count} na fila`}
          </span>
          {count > 0 && !data.paused && (
            <div
              className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-xs font-semibold ${
                ready
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
              }`}
            >
              {outsideWindow ? (
                <CalendarClock className="h-3.5 w-3.5" />
              ) : (
                <Timer className="h-3.5 w-3.5" />
              )}
              {ready
                ? 'Pronto para enviar'
                : outsideWindow
                  ? `Fora do horário · ${timeWindowNote}`
                  : `Próximo em ${formatCountdown(remaining)}`}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => postAction(data.paused ? 'resume' : 'pause')}
            disabled={busy}
            size="sm"
            className={data.paused ? 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold' : 'border-zinc-300 dark:border-[#333]'}
            variant={data.paused ? 'default' : 'outline'}
          >
            {data.paused ? (
              <>
                <Play className="h-3.5 w-3.5" />
                Retomar Fila
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5" />
                Pausar Fila
              </>
            )}
          </Button>
          {count > 0 && (
            <Button onClick={() => postAction('clear')} disabled={busy} size="sm" variant="outline" className="border-red-300 text-red-600 dark:border-red-900/50 dark:text-red-400">
              <Trash2 className="h-3.5 w-3.5" />
              Limpar Fila
            </Button>
          )}
          <Button onClick={fetchQueue} disabled={busy} size="sm" variant="ghost">
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </Button>
        </div>

        {count === 0 ? (
          <div className="rounded-[6px] border border-dashed border-zinc-200 dark:border-[#282828] p-6 text-center text-xs text-zinc-400 space-y-1">
            <p className="font-semibold text-zinc-700 dark:text-zinc-300">A fila de envio está vazia</p>
            <p>Navegue até a <strong>Tabela de Leads</strong>, selecione os contatos desejados e clique em <strong>Adicionar à Fila</strong>.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {data.queue.map(lead => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between gap-3 rounded-[6px] border border-zinc-200/80 bg-zinc-50 dark:bg-[#1a1a1a] dark:border-[#262626] px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">{lead.nome}</p>
                    <p className="truncate font-mono text-[11px] text-zinc-400">{lead.whatsapp}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${lead.status === 'personalized' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                      {lead.status === 'personalized' ? 'Personalizado' : 'Pendente'}
                    </span>
                    <Button
                      onClick={() => postAction('remove', [lead.id])}
                      disabled={busy}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-red-500"
                      title="Remover da fila"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-200/60 dark:border-[#242424] pt-3">
              • Intervalo anti-ban ativo: {formatDelay(data.delayMin)} a {formatDelay(data.delayMax)}.
              {scheduleOn && (
                <> Janela configurada: {data.schedule.start} às {data.schedule.end}.</>
              )}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}