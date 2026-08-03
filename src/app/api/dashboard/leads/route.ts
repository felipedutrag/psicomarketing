import { NextRequest, NextResponse } from 'next/server'
import { saveLeads, getLeads, clearLeads, parseManualInput, saveScrapedLeads } from '@/lib/dashboard/scraping'
import { updateStats } from '@/lib/dashboard/whatsapp'
import type { Lead } from '@/lib/dashboard/config'

export const maxDuration = 300

export async function GET() {
  try {
    const leads = await getLeads()
    return NextResponse.json({ leads })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao buscar leads' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, data } = body

    if (action === 'scrape') {
      const { templateUrl } = data
      const cities = Array.isArray(data.cities) ? data.cities : []
      const limitPerCity = Math.min(Math.max(Number(data.dataCount) || 10, 1), 50)

      if (!templateUrl || !templateUrl.includes('${CIDADE}')) {
        return NextResponse.json(
          { error: 'Informe uma URL modelo contendo o placeholder ${CIDADE} e a lista de cidades.' },
          { status: 400 }
        )
      }
      if (cities.length === 0) {
        return NextResponse.json({ error: 'Informe ao menos uma cidade.' }, { status: 400 })
      }

      const { scrapeLeadsByCities } = await import('@/lib/dashboard/maps-scraper')
      const scraped = await scrapeLeadsByCities(templateUrl, cities, limitPerCity)
      const saved = await saveScrapedLeads(scraped)
      await updateStats()

      return NextResponse.json({
        success: true,
        count: saved.length,
        scraped: scraped.length,
        results: saved.map(l => ({ nome: l.nome, whatsapp: l.whatsapp, website: l.website })),
      })
    }

    if (action === 'import') {
      const { input } = data
      const parsedLeads = parseManualInput(input)
      await saveLeads(parsedLeads as unknown as Lead[])
      await updateStats()
      return NextResponse.json({ success: true, count: parsedLeads.length })
    }

    if (action === 'clear') {
      await clearLeads()
      await updateStats()
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao processar leads' }, { status: 500 })
  }
}
