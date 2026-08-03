import { NextResponse } from 'next/server'
import { getStats, updateStats } from '@/lib/dashboard/whatsapp'

// Recalcula as estatísticas no máximo a cada TTL. Dentro da janela, lê do cache
// (evita varrer o Redis inteiro em toda requisição).
const TTL_MS = 15 * 1000

export async function GET() {
  try {
    let stats = await getStats()
    const last = stats?.last_updated ? new Date(stats.last_updated).getTime() : 0
    if (!stats || Date.now() - last > TTL_MS) {
      await updateStats()
      stats = await getStats()
    }
    return NextResponse.json({ stats })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
