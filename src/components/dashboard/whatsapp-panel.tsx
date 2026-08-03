'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, QrCode, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

type WhatsAppStatus = 'disconnected' | 'connecting' | 'connected' | 'ready' | 'sending' | 'error'

export function WhatsAppPanel() {
  const [status, setStatus] = useState<WhatsAppStatus>('disconnected')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/dashboard/whatsapp/status')
      const data = await response.json()
      setStatus(data.status)
      setQrCode(data.qrCode)
    } catch (error) {
      console.error('Erro ao buscar status:', error)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000) // Poll a cada 5 segundos
    return () => clearInterval(interval)
  }, [])

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      // Simular início de conexão (em produção, chamaria script Node.js)
      await fetch('/api/dashboard/whatsapp/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'connecting' })
      })
      await fetchStatus()
    } catch (error) {
      console.error('Erro ao conectar:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      await fetch('/api/dashboard/whatsapp/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'disconnected' })
      })
      await fetchStatus()
    } catch (error) {
      console.error('Erro ao desconectar:', error)
    } finally {
      setIsLoading(false)
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
          <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg bg-white">
            <QrCode className="h-8 w-8 text-gray-600" />
            <div className="text-sm text-gray-600">Escaneie o QR code para conectar</div>
            <div className="p-2 bg-white rounded">
              {/* QR code seria renderizado aqui */}
              <div className="w-32 h-32 bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                QR Code
              </div>
            </div>
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

        <div className="text-xs text-gray-500">
          <p>• Autenticação via QR code</p>
          <p>• Servidor em background</p>
          <p>• Delay dinâmico anti-ban (2-5 minutos)</p>
        </div>
      </CardContent>
    </Card>
  )
}
