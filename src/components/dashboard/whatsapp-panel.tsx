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
    const interval = setInterval(fetchStatus, 5000)
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
      disconnected: { variant: 'secondary' as const, icon: XCircle, label: 'Desconectado' },
      connecting: { variant: 'default' as const, icon: Loader2, label: 'Conectando...' },
      connected: { variant: 'default' as const, icon: CheckCircle, label: 'Conectado' },
      ready: { variant: 'default' as const, icon: CheckCircle, label: 'Pronto' },
      sending: { variant: 'default' as const, icon: Loader2, label: 'Enviando...' },
      error: { variant: 'destructive' as const, icon: AlertCircle, label: 'Erro' },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-2">
        {status === 'connecting' || status === 'sending' ? (
          <Icon className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
        {config.label}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>WhatsApp Integration</CardTitle>
            <CardDescription>
              Conecte seu WhatsApp para envio automático de mensagens
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {qrCode && (status === 'connecting' || status === 'disconnected') && (
          <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg">
            <QrCode className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">Escaneie o QR code para conectar</div>
            {qrCode.startsWith('data:') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrCode} alt="QR Code" className="w-48 h-48 rounded" />
            ) : (
              <pre className="p-2 text-xs max-w-full overflow-auto">{qrCode}</pre>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {status === 'disconnected' || status === 'error' ? (
            <Button onClick={handleConnect} disabled={isLoading}>
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
            <Button onClick={handleDisconnect} variant="outline" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desconectando...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Desconectar
                </>
              )}
            </Button>
          )}

          <Button onClick={fetchStatus} variant="ghost" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {feedback && (
          <div
            className={`text-sm p-2 rounded border ${
              feedback.type === 'success'
                ? 'border-green-500/50 text-green-600 dark:text-green-400'
                : 'border-red-500/50 text-red-600 dark:text-red-400'
            }`}
          >
            {feedback.text}
          </div>
        )}

        <div className="space-y-3 p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            <p className="text-sm font-medium">Enviar mensagem manual</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa-phone">Número (DDI DDD + número)</Label>
            <Input
              id="wa-phone"
              placeholder="5511987654321"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa-message">Mensagem</Label>
            <Textarea
              id="wa-message"
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={sending || !phone.trim() || !message.trim()}
            className="w-full"
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

        <div className="text-xs text-muted-foreground">
          <p>• Autenticação via QR code</p>
          <p>• Servidor em background</p>
          <p>• Delay dinâmico anti-ban (2-5 minutos)</p>
        </div>
      </CardContent>
    </Card>
  )
}
