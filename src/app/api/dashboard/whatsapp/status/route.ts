import { NextResponse } from 'next/server'
import { getWhatsAppStatus, getQRCode, setWhatsAppStatus } from '@/lib/dashboard/whatsapp'
import { getWhatsAppClientIfExists, initializeWhatsApp } from '@/lib/whatsapp/manager'

export async function GET() {
  try {
    // Auto-inicialização se ainda não iniciado
    await initializeWhatsApp()
    
    const status = await getWhatsAppStatus()
    const qrCode = await getQRCode()
    
    // Verificar health check real se estiver conectado
    let healthy = true
    if (status === 'connected' || status === 'ready') {
      const client = getWhatsAppClientIfExists()
      if (client) {
        healthy = await client.isHealthy()
        if (!healthy) {
          await setWhatsAppStatus('disconnected')
        }
      }
    }
    
    return NextResponse.json({ status: healthy ? status : 'disconnected', qrCode, healthy })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao buscar status' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, status, qrCode } = body

    if (action === 'connect') {
      const { getWhatsAppClient } = await import('@/lib/whatsapp/manager')
      const client = getWhatsAppClient()
      await client.start()
      return NextResponse.json({ success: true, status: await getWhatsAppStatus() })
    }

    if (action === 'disconnect') {
      const client = getWhatsAppClientIfExists()
      if (client) {
        await client.stop()
      } else {
        await setWhatsAppStatus('disconnected')
      }
      return NextResponse.json({ success: true, status: 'disconnected' })
    }

    if (action === 'healthcheck') {
      const client = getWhatsAppClientIfExists()
      if (client) {
        const healthy = await client.isHealthy()
        if (!healthy && (status === 'connected' || status === 'ready')) {
          await setWhatsAppStatus('disconnected')
        }
        return NextResponse.json({ success: true, healthy })
      }
      return NextResponse.json({ success: false, error: 'Cliente não inicializado' })
    }

    if (action === 'restart') {
      const { restartWhatsApp } = await import('@/lib/whatsapp/manager')
      await restartWhatsApp()
      return NextResponse.json({ success: true, status: await getWhatsAppStatus() })
    }

    if (status) {
      await setWhatsAppStatus(status)
    }

    if (qrCode) {
      const { setQRCode } = await import('@/lib/dashboard/whatsapp')
      await setQRCode(qrCode)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao atualizar status' }, { status: 500 })
  }
}
