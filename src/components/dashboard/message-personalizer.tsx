'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Sparkles, Loader2, CheckCircle } from 'lucide-react'

interface MessagePersonalizerProps {
  selectedLeadIds?: string[]
  onPersonalized?: () => void
}

export function MessagePersonalizer({ selectedLeadIds = [], onPersonalized }: MessagePersonalizerProps) {
  const [baseMessage, setBaseMessage] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [isPersonalizing, setIsPersonalizing] = useState(false)
  const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null)

  const handlePersonalize = async () => {
    if (!baseMessage.trim()) {
      setResult({ success: false, error: 'Mensagem base é obrigatória' })
      return
    }

    setIsPersonalizing(true)
    setResult(null)

    try {
      const response = await fetch('/api/dashboard/personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseMessage,
          customPrompt: useCustomPrompt ? customPrompt : undefined,
          leadIds: selectedLeadIds,
        })
      })

      const data = await response.json()
      setResult(data)
      if (data.success && onPersonalized) {
        onPersonalized()
      }
    } catch (error) {
      setResult({ success: false, error: 'Erro ao personalizar mensagens' })
    } finally {
      setIsPersonalizing(false)
    }
  }

  const defaultPrompt = `Você é um especialista em personalização de mensagens de WhatsApp para marketing B2B.
Sua tarefa é personalizar uma mensagem base para cada lead, usando o nome da pessoa de forma natural e profissional.`

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <span>✨</span>
          <span>Personalização com IA</span>
        </CardTitle>
        <CardDescription>
          Personalize mensagens automaticamente usando IA com multiprovedores
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2 rounded-[6px] bg-zinc-100 dark:bg-[#202020] p-2.5 border border-zinc-200/60 dark:border-[#282828]">
          <Switch
            id="custom-prompt"
            checked={useCustomPrompt}
            onCheckedChange={setUseCustomPrompt}
          />
          <Label htmlFor="custom-prompt" className="text-xs font-medium cursor-pointer text-zinc-800 dark:text-zinc-200">
            Usar prompt personalizado
          </Label>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="base-message" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Mensagem Base
          </Label>
          <Textarea
            id="base-message"
            placeholder="Exemplo: Olá {nome}, gostaria de apresentar nossa solução de automação para psicólogos..."
            value={baseMessage}
            onChange={(e) => setBaseMessage(e.target.value)}
            rows={5}
          />
        </div>

        {useCustomPrompt && (
          <div className="space-y-1.5">
            <Label htmlFor="custom-prompt-input" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Prompt Personalizado
            </Label>
            <Textarea
              id="custom-prompt-input"
              placeholder={defaultPrompt}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={6}
              className="font-mono text-xs"
            />
          </div>
        )}

        <Button
          onClick={handlePersonalize}
          disabled={isPersonalizing || !baseMessage.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
        >
          {isPersonalizing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Personalizando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Personalizar Mensagens
            </>
          )}
        </Button>

        {result && (
          <div
            className={`rounded-[6px] border px-3 py-2 text-xs ${
              result.success
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400'
            }`}
          >
            {result.success ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <p>✓ {result.count} mensagens personalizadas com sucesso!</p>
              </div>
            ) : (
              <p>✗ {result.error}</p>
            )}
          </div>
        )}

        <div className="space-y-1 text-[11px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-200/60 dark:border-[#242424] pt-3">
          <p>• Modelos: Gemini → NVIDIA → Groq (fallback automatizado)</p>
          <p>• Personalização baseada no nome do lead</p>
          <p>• Mensagens salvas no Redis</p>
          {selectedLeadIds.length === 0 && (
            <p className="text-amber-600 dark:text-amber-400 font-medium">
              • Sem seleção prévia: personaliza apenas os pendentes.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
