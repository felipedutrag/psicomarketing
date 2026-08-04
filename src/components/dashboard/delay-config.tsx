'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ShieldCheck, ArrowRight } from 'lucide-react'

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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-500" />
          <span>Configurações Anti-Ban (Delays)</span>
        </CardTitle>
        <CardDescription>
          Configure o intervalo de espera randômico entre envios para simular comportamento humano
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="delay-min" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Delay Mínimo (segundos)
                </Label>
                <Input
                  id="delay-min"
                  type="number"
                  min={1}
                  value={delayMin}
                  onChange={e => setDelayMin(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="delay-max" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Delay Máximo (segundos)
                </Label>
                <Input
                  id="delay-max"
                  type="number"
                  min={1}
                  value={delayMax}
                  onChange={e => setDelayMax(e.target.value)}
                />
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
                  Salvar Intervalo Anti-Ban
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
              • O delay é aplicado entre cada mensagem individual. Intervalos maiores que 30s reduzem drasticamente o risco de bloqueio.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
