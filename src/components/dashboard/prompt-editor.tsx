'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Save, RotateCcw, Loader2, CheckCircle, Sparkles, RefreshCw } from 'lucide-react'

export function PromptEditor() {
  const [customPrompt, setCustomPrompt] = useState('')
  const [defaultPrompt, setDefaultPrompt] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)

  const fetchPrompts = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dashboard/prompt')
      const data = await response.json()
      setCustomPrompt(data.customPrompt || '')
      setDefaultPrompt(data.defaultPrompt || '')
      setUseCustom(data.hasCustom)
    } catch (error) {
      console.error('Erro ao buscar prompts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPrompts()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setResult(null)

    try {
      const response = await fetch('/api/dashboard/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          prompt: customPrompt
        })
      })

      const data = await response.json()
      setResult(data)
      if (data.success) {
        setUseCustom(true)
      }
    } catch (error) {
      setResult({ success: false, error: 'Erro ao salvar prompt' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    setIsSaving(true)
    setResult(null)

    try {
      const response = await fetch('/api/dashboard/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      })

      const data = await response.json()
      setResult(data)
      if (data.success) {
        setCustomPrompt('')
        setUseCustom(false)
        await fetchPrompts()
      }
    } catch (error) {
      setResult({ success: false, error: 'Erro ao resetar prompt' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editor de Prompt do Process-AI</CardTitle>
        <CardDescription>
          Personalize o prompt usado pelo sistema de IA no WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="use-custom"
            checked={useCustom}
            onCheckedChange={setUseCustom}
            disabled={!customPrompt}
          />
          <Label htmlFor="use-custom">Usar prompt customizado</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt-editor">Prompt Customizado</Label>
          <Textarea
            id="prompt-editor"
            placeholder="Digite seu prompt customizado aqui..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={15}
            className="font-mono text-sm"
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving || !customPrompt.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Prompt
              </>
            )}
          </Button>

          <Button onClick={handleReset} variant="outline" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetando...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Voltar ao Padrão
              </>
            )}
          </Button>

          <Button onClick={fetchPrompts} variant="ghost" size="icon" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {result && (
          <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {result.success ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <p>✓ Prompt salvo com sucesso!</p>
              </div>
            ) : (
              <p>✗ {result.error}</p>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            <p>O prompt é salvo no Redis e usado pelo process-ai em todas as conversas</p>
          </div>
          <p>• Suporta variáveis de contexto do sistema</p>
          <p>• Reset volta ao prompt padrão do sistema</p>
        </div>
      </CardContent>
    </Card>
  )
}
