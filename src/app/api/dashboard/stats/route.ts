import { NextResponse } from 'next/server'
import { getStats, updateStats } from '@/lib/dashboard/whatsapp'

export async function GET() {
  try {
    await updateStats()
    const stats = await getStats()
    return NextResponse.json({ stats })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
