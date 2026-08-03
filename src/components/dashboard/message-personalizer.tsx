'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Sparkles, Loader2, CheckCircle } from 'lucide-react'

export function MessagePersonalizer() {
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
        })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: 'Erro ao personalizar mensagens' })
    } finally {
      setIsPersonalizing(false)
    }
  }

  const defaultPrompt = `Você é um especialista em personalização de mensagens de WhatsApp para marketing B2B.
Sua tarefa é personalizar uma mensagem base para cada lead, usando o nome da pessoa de forma natural e profissional.
Mantenha o tom original da mensagem mas adapte para soar mais pessoal para cada destinatário.
A mensagem deve ser curta, direta e profissional, adequada para WhatsApp.
Não altere a essência da mensagem original, apenas personalize com o nome.`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalização com IA</CardTitle>
        <CardDescription>
          Personalize mensagens automaticamente usando IA com fallback
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="custom-prompt"
            checked={useCustomPrompt}
            onCheckedChange={setUseCustomPrompt}
          />
          <Label htmlFor="custom-prompt">Usar prompt personalizado</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="base-message">Mensagem Base</Label>
          <Textarea
            id="base-message"
            placeholder="Exemplo: Olá {nome}, gostaria de apresentar nossa solução de automação para psicólogos..."
            value={baseMessage}
            onChange={(e) => setBaseMessage(e.target.value)}
            rows={4}
          />
        </div>

        {useCustomPrompt && (
          <div className="space-y-2">
            <Label htmlFor="custom-prompt-input">Prompt Personalizado</Label>
            <Textarea
              id="custom-prompt-input"
              placeholder={defaultPrompt}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          </div>
        )}

        <Button onClick={handlePersonalize} disabled={isPersonalizing || !baseMessage.trim()}>
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
          <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
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

        <div className="text-xs text-gray-500">
          <p>• Modelos: NVIDIA → Groq → Gemini (fallback)</p>
          <p>• Personalização baseada no nome do lead</p>
          <p>• Mensagens salvas no Redis</p>
        </div>
      </CardContent>
    </Card>
  )
}
