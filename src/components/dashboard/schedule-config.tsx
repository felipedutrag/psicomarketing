'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save, Clock } from 'lucide-react'

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Horário de Envio
        </CardTitle>
        <CardDescription>
          Restrinja a fila de envio a um intervalo diário (ex.: 09:00 às 17:00)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <div className="flex items-center space-x-2">
              <Switch id="schedule-enabled" checked={enabled} onCheckedChange={setEnabled} />
              <Label htmlFor="schedule-enabled">
                {enabled ? 'Envio limitado ao horário definido' : 'Envio liberado a qualquer hora'}
              </Label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="schedule-start">Início</Label>
                <Input id="schedule-start" type="time" value={start} onChange={e => setStart(e.target.value)} disabled={!enabled} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-end">Fim</Label>
                <Input id="schedule-end" type="time" value={end} onChange={e => setEnd(e.target.value)} disabled={!enabled} />
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Horário
                </>
              )}
            </Button>

            {feedback && (
              <div
                className={`rounded-md border px-3 py-2 text-sm ${
                  feedback.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400'
                }`}
              >
                {feedback.text}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Fora do intervalo, a fila fica suspensa automaticamente e o envio é bloqueado até a próxima abertura.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}