'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RefreshCw, QrCode, Loader2, CheckCircle, XCircle, AlertCircle, Send } from 'lucide-react'

type WhatsAppStatus = 'disconnected' | 'connecting' | 'connected' | 'ready' | 'sending' | 'error'

export function WhatsAppPanel() {
  const [status, setStatus] = useState<WhatsAppStatus>('disconnected')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/dashboard/whatsapp/status')
      const data = await response.json()
      if (data.status) setStatus(data.status)
      setQrCode(data.qrCode || null)
    } catch (error) {
      console.error('Erro ao buscar status:', error)
    }
  }

  useEffect(() => {
    const initial = setTimeout(fetchStatus, 0)
    const interval = setInterval(() => {
      if (!document.hidden) fetchStatus()
    }, 5000)
    return () => {
      clearTimeout(initial)
      clearInterval(interval)
    }
  }, [])

  const handleConnect = async () => {
    setIsLoading(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/dashboard/whatsapp/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' })
      })
      const data = await response.json()
      if (!response.ok) {
        setFeedback({ type: 'error', text: data.error || 'Erro ao conectar' })
      }
      await fetchStatus()
    } catch (error) {
      console.error('Erro ao conectar:', error)
      setFeedback({ type: 'error', text: 'Erro ao conectar ao WhatsApp' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    setFeedback(null)
    try {
      await fetch('/api/dashboard/whatsapp/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' })
      })
      setQrCode(null)
      await fetchStatus()
    } catch (error) {
      console.error('Erro ao desconectar:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async () => {
    if (!phone.trim() || !message.trim()) return
    setSending(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/dashboard/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), message })
      })
      const data = await response.json()
      if (response.ok) {
        setFeedback({ type: 'success', text: 'Mensagem enviada com sucesso!' })
        setPhone('')
        setMessage('')
      } else {
        setFeedback({ type: 'error', text: data.error || 'Erro ao enviar mensagem' })
      }
    } catch (error) {
      setFeedback({ type: 'error', text: 'Erro ao enviar mensagem' })
    } finally {
      setSending(false)
    }
  }

  const getStatusBadge = () => {
    const statusConfig = {
      disconnected: { color: 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300', icon: XCircle, label: 'Desconectado' },
      connecting: { color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300', icon: Loader2, label: 'Conectando...' },
      connected: { color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300', icon: CheckCircle, label: 'Conectado' },
      ready: { color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300', icon: CheckCircle, label: 'Pronto ⚡' },
      sending: { color: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300', icon: Loader2, label: 'Enviando...' },
      error: { color: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300', icon: AlertCircle, label: 'Erro' },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${config.color}`}>
        {status === 'connecting' || status === 'sending' ? (
          <Icon className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Icon className="h-3.5 w-3.5" />
        )}
        {config.label}
      </span>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <span>📱</span>
            <span>WhatsApp Integration Engine</span>
          </CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Conecte seu WhatsApp via WebJS para automação de envios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {qrCode && (status === 'connecting' || status === 'disconnected') && (
          <div className="flex flex-col items-center space-y-2 p-4 border border-zinc-200/80 dark:border-[#2a2a2a] rounded-[6px] bg-zinc-50 dark:bg-[#1a1a1a]">
            <QrCode className="h-6 w-6 text-zinc-400" />
            <div className="text-xs text-zinc-500">Escaneie o QR code para conectar</div>
            {qrCode.startsWith('data:') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrCode} alt="QR Code" className="w-44 h-44 rounded border border-zinc-200 dark:border-[#333]" />
            ) : (
              <pre className="p-2 text-xs max-w-full overflow-auto font-mono text-zinc-400">{qrCode}</pre>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {status === 'disconnected' || status === 'error' ? (
            <Button onClick={handleConnect} disabled={isLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Conectar WhatsApp
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleDisconnect} variant="outline" disabled={isLoading} className="flex-1 border-zinc-300 dark:border-[#333] hover:bg-zinc-100 dark:hover:bg-[#282828]">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desconectando...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                  Desconectar
                </>
              )}
            </Button>
          )}

          <Button onClick={fetchStatus} variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-200">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

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

        <div className="space-y-3 p-3.5 border border-zinc-200/80 dark:border-[#262626] rounded-[6px] bg-zinc-50/50 dark:bg-[#1a1a1a]/50">
          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-semibold text-xs">
            <Send className="h-3.5 w-3.5 text-indigo-500" />
            <span>Enviar Mensagem Manual</span>
          </div>
          <div className="space-y-1">
            <Label htmlFor="wa-phone" className="text-[11px] text-zinc-600 dark:text-zinc-400">Número (DDI DDD + número)</Label>
            <Input
              id="wa-phone"
              placeholder="5511987654321"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="wa-message" className="text-[11px] text-zinc-600 dark:text-zinc-400">Mensagem</Label>
            <Textarea
              id="wa-message"
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              className="text-xs"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={sending || !phone.trim() || !message.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar
              </>
            )}
          </Button>
        </div>

        <div className="space-y-1 text-[11px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-200/60 dark:border-[#242424] pt-3">
          <p>• Autenticação via QR code seguro</p>
          <p>• Instância ativa no servidor em segundo plano</p>
          <p>• Delay dinâmico anti-ban automático</p>
        </div>
      </CardContent>
    </Card>
  )
}
