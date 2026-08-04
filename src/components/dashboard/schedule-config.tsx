'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Clock, ArrowRight } from 'lucide-react'

export function ScheduleConfig() {
  const [enabled, setEnabled] = useState(false)
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('17:00')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/dashboard/config/send-schedule')
        const data = await response.json()
        if (data.schedule) {
          setEnabled(data.schedule.enabled)
          setStart(data.schedule.start)
          setEnd(data.schedule.end)
        }
      } catch (error) {
        console.error('Erro ao carregar horário de envio:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const initial = setTimeout(load, 0)
    return () => clearTimeout(initial)
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/dashboard/config/send-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, start, end })
      })
      const data = await response.json()
      if (response.ok) {
        setFeedback({
          type: 'success',
          text: enabled
            ? `Envios liberados entre ${start} e ${end}.`
            : 'Horário de envio desativado. A fila pode rodar a qualquer momento.',
        })
      } else {
        setFeedback({ type: 'error', text: data.error || 'Erro ao salvar horário' })
      }
    } catch (error) {
      setFeedback({ type: 'error', text: 'Erro ao salvar horário' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-purple-500" />
          <span>Horário Comercial de Envio</span>
        </CardTitle>
        <CardDescription>
          Restrinja o disparo automático de mensagens a janelas de horário comercial
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-2 rounded-[6px] bg-zinc-100 dark:bg-[#202020] p-2.5 border border-zinc-200/60 dark:border-[#282828]">
              <Switch id="schedule-enabled" checked={enabled} onCheckedChange={setEnabled} />
              <Label htmlFor="schedule-enabled" className="text-xs font-medium cursor-pointer text-zinc-800 dark:text-zinc-200">
                {enabled ? 'Envio limitado ao horário definido' : 'Envio liberado 24 horas por dia'}
              </Label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="schedule-start" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Horário Início
                </Label>
                <Input id="schedule-start" type="time" value={start} onChange={e => setStart(e.target.value)} disabled={!enabled} />
              </div>
              <div className="space-y-3">
                <Label htmlFor="schedule-end" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Horário Fim
                </Label>
                <Input id="schedule-end" type="time" value={end} onChange={e => setEnd(e.target.value)} disabled={!enabled} />
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving} variant="outline" className="w-full border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 font-medium">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  Salvar Horário Comercial
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            {feedback && (
              <div
                className={`rounded-[6px] border px-3 py-2 text-xs ${
                  feedback.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400'
                }`}
              >
                {feedback.text}
              </div>
            )}

            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-200/60 dark:border-[#242424] pt-3">
              • Fora da janela, a fila de disparos fica automaticamente pausada até o próximo horário de abertura.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}