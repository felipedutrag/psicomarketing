import { NextResponse } from 'next/server'
import { getWhatsAppStatus, getQRCode, setWhatsAppStatus } from '@/lib/dashboard/whatsapp'

export async function GET() {
  try {
    const status = await getWhatsAppStatus()
    const qrCode = await getQRCode()
    return NextResponse.json({ status, qrCode })
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
      const { getWhatsAppClientIfExists } = await import('@/lib/whatsapp/manager')
      const client = getWhatsAppClientIfExists()
      if (client) {
        await client.stop()
      } else {
        await setWhatsAppStatus('disconnected')
      }
      return NextResponse.json({ success: true, status: 'disconnected' })
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
