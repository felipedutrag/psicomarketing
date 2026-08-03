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
    const { status, qrCode } = body
    
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
