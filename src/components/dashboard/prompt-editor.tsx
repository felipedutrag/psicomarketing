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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>📝</span>
            <span>Editor de Prompt do Process-AI</span>
          </div>
          <Button
            onClick={fetchPrompts}
            variant="ghost"
            size="icon"
            disabled={isLoading}
            className="h-7 w-7 text-zinc-400 hover:text-zinc-100"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          Personalize o prompt usado pelo sistema de IA no WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2 rounded-[6px] bg-zinc-100 dark:bg-[#202020] p-2.5 border border-zinc-200/60 dark:border-[#282828]">
          <Switch
            id="use-custom"
            checked={useCustom}
            onCheckedChange={setUseCustom}
            disabled={!customPrompt}
          />
          <Label htmlFor="use-custom" className="text-xs font-medium cursor-pointer text-zinc-800 dark:text-zinc-200">
            Usar prompt customizado
          </Label>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prompt-editor" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Prompt Customizado
          </Label>
          <Textarea
            id="prompt-editor"
            placeholder="Digite seu prompt customizado aqui..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={8}
            className="font-mono text-xs"
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || !customPrompt.trim()}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
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

          <Button
            onClick={handleReset}
            variant="outline"
            disabled={isSaving}
            className="flex-1 border-zinc-300 dark:border-[#333] hover:bg-zinc-100 dark:hover:bg-[#282828]"
          >
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
        </div>

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
                <p>✓ Prompt salvo com sucesso!</p>
              </div>
            ) : (
              <p>✗ {result.error}</p>
            )}
          </div>
        )}

        <div className="space-y-1 text-[11px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-200/60 dark:border-[#242424] pt-3">
          <div className="flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            <p>Salvo no Redis e utilizado pelo process-ai em todas as conversas</p>
          </div>
          <p>• Suporta variáveis de contexto do sistema</p>
          <p>• Reset volta ao prompt padrão do sistema</p>
        </div>
      </CardContent>
    </Card>
  )
}
