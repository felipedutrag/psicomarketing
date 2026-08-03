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
      <Card>
        <CardHeader>
          <CardTitle>Fila de Envio</CardTitle>
        </CardHeader>
        <CardContent>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Fila de Envio
          </CardTitle>
          <CardDescription>
            {count === 0
              ? 'Sem leads na fila. Adicione leads à fila pela tabela abaixo.'
              : `${count} lead(s) aguardando disparo`}
          </CardDescription>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge
            variant="outline"
            className={
              data.paused
                ? 'border-amber-500/30 text-amber-700 dark:text-amber-400'
                : 'border-indigo-500/30 text-indigo-700 dark:text-indigo-400'
            }
          >
            {data.paused ? 'Pausada' : `${count} na fila`}
          </Badge>
          {count > 0 && !data.paused && (
            <div
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${
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
          {count > 0 && data.paused && (
            <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <Pause className="h-3.5 w-3.5" />
              Envios suspensos
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
            variant={data.paused ? 'default' : 'outline'}
          >
            {data.paused ? (
              <>
                <Play className="h-4 w-4" />
                Retomar Fila
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                Pausar Fila
              </>
            )}
          </Button>
          {count > 0 && (
            <Button onClick={() => postAction('clear')} disabled={busy} size="sm" variant="outline">
              <Trash2 className="h-4 w-4" />
              Limpar Fila
            </Button>
          )}
          <Button onClick={fetchQueue} disabled={busy} size="sm" variant="ghost">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {count === 0 ? (
          <p className="text-sm text-muted-foreground">
            A fila é manual: selecione leads na tabela e clique em{" "}
            <span className="font-medium text-foreground">Adicionar à fila</span>, ou use o atalho na
            própria linha. Só o que estiver aqui será disparado.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {data.queue.map(lead => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-foreground/5 bg-background/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{lead.nome}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{lead.whatsapp}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={lead.status === 'personalized' ? 'default' : 'secondary'}>
                      {lead.status === 'personalized' ? 'Personalizado' : 'Pendente'}
                    </Badge>
                    <Button
                      onClick={() => postAction('remove', [lead.id])}
                      disabled={busy}
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Remover da fila (sem apagar o lead)"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Intervalo anti-ban entre envios: {formatDelay(data.delayMin)} a {formatDelay(data.delayMax)}.
              {scheduleOn && (
                <> Janela de envio ativa: {data.schedule.start} às {data.schedule.end}.</>
              )}{' '}
              O countdown reinicia após o término de cada disparo. Remover um lead da fila não apaga o lead.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}