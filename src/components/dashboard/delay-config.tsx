'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save } from 'lucide-react'

export function DelayConfig() {
  const [delayMin, setDelayMin] = useState<string>('')
  const [delayMax, setDelayMax] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const loadConfig = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/dashboard/config/send-delay')
        const data = await response.json()
        if (data.delay) {
          setDelayMin(String(data.delay.delayMin))
          setDelayMax(String(data.delay.delayMax))
        }
      } catch (error) {
        console.error('Erro ao carregar delay:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const initial = setTimeout(loadConfig, 0)
    return () => clearTimeout(initial)
  }, [])

  const handleSave = async () => {
    const min = parseInt(delayMin)
    const max = parseInt(delayMax)
    if (isNaN(min) || isNaN(max) || min < 1) {
      setFeedback({ type: 'error', text: 'Informe valores válidos (mínimo >= 1s).' })
      return
    }
    if (max < min) {
      setFeedback({ type: 'error', text: 'O delay máximo deve ser maior ou igual ao mínimo.' })
      return
    }

    setIsSaving(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/dashboard/config/send-delay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delayMin: min, delayMax: max })
      })
      const data = await response.json()
      if (response.ok) {
        setFeedback({ type: 'success', text: 'Delay atualizado com sucesso!' })
      } else {
        setFeedback({ type: 'error', text: data.error || 'Erro ao salvar delay' })
      }
    } catch (error) {
      setFeedback({ type: 'error', text: 'Erro ao salvar delay' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Envio</CardTitle>
        <CardDescription>
          Configure o intervalo de espera (delay) entre mensagens para evitar bloqueios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="delay-min">Delay Mínimo (segundos)</Label>
                <Input
                  id="delay-min"
                  type="number"
                  min={1}
                  value={delayMin}
                  onChange={e => setDelayMin(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delay-max">Delay Máximo (segundos)</Label>
                <Input
                  id="delay-max"
                  type="number"
                  min={1}
                  value={delayMax}
                  onChange={e => setDelayMax(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Delay
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
              O delay é aplicado entre cada mensagem enviada em lote. Valores maiores reduzem o risco de bloqueio no WhatsApp.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
