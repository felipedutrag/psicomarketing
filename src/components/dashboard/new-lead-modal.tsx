'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X, UserPlus, Loader2, CheckCircle } from 'lucide-react'

interface NewLeadModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function NewLeadModal({ open, onClose, onCreated }: NewLeadModalProps) {
  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [website, setWebsite] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (!open) return null

  const handleSubmit = async () => {
    setFeedback(null)
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/dashboard/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual',
          data: { nome, whatsapp, website, mensagem_inicial: mensagem },
        }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setFeedback({ type: 'success', text: 'Lead adicionado com sucesso!' })
        setNome('')
        setWhatsapp('')
        setWebsite('')
        setMensagem('')
        setTimeout(() => {
          onCreated()
          onClose()
        }, 700)
      } else {
        setFeedback({ type: 'error', text: data.error || 'Erro ao adicionar lead' })
      }
    } catch (error) {
      setFeedback({ type: 'error', text: 'Erro ao adicionar lead' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Novo Lead"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog Card */}
      <div className="relative w-full max-w-md rounded-[10px] border border-zinc-200/80 bg-[#fbfbfa] shadow-xl dark:bg-[#191919] dark:border-[#2b2b2b]">
        <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-[#252525] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300/80 dark:border-[#333] bg-white dark:bg-[#1f1f1f] text-indigo-500">
              <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
            </span>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Adicionar Lead</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-transparent text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-[#252525] hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="space-y-2">
            <Label htmlFor="nl-nome" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Nome *
            </Label>
            <Input
              id="nl-nome"
              placeholder="Ex.: Dr. João Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nl-whatsapp" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              WhatsApp *
            </Label>
            <Input
              id="nl-whatsapp"
              placeholder="5511987654321 (DDI DDD + número)"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nl-website" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Website (opcional)
            </Label>
            <Input
              id="nl-website"
              placeholder="https://exemplo.com.br"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nl-mensagem" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Mensagem inicial (opcional)
            </Label>
            <Textarea
              id="nl-mensagem"
              placeholder="Mensagem de contato para este lead..."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={2}
            />
          </div>

          {feedback && (
            <div
              className={`flex items-center gap-1.5 rounded-[6px] border px-3 py-2 text-xs ${
                feedback.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400'
              }`}
            >
              {feedback.type === 'success' && <CheckCircle className="h-3.5 w-3.5" />}
              {feedback.text}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 text-xs cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !nome.trim() || !whatsapp.trim()}
              size="sm"
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  Adicionar Lead
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}