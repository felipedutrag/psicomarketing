import puppeteer, { type Browser, type Page } from 'puppeteer'

export interface ScrapedPlace {
  nome: string
  whatsapp?: string
  website?: string
}

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--no-first-run',
  '--no-zygote',
  '--disable-gpu'
]

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

export async function scrapeLeadsByCities(
  templateUrl: string,
  cities: string[],
  limitPerCity: number
): Promise<ScrapedPlace[]> {
  if (!templateUrl.includes('${CIDADE}')) {
    throw new Error('A URL modelo deve conter o placeholder ${CIDADE}')
  }

  const browser = await puppeteer.launch({ headless: true, args: LAUNCH_ARGS })
  const found: ScrapedPlace[] = []
  const seen = new Set<string>()

  try {
    for (const city of cities) {
      const cleanCity = city.trim()
      if (!cleanCity) continue

      const url = templateUrl.replace('${CIDADE}', encodeURIComponent(cleanCity))
      console.log(`[SCRAPER] Buscando leads para "${cleanCity}" -> ${url}`)

      const cityLeads = await scrapeCity(browser, url, limitPerCity)

      for (const lead of cityLeads) {
        const key = (lead.whatsapp || lead.nome).toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        found.push(lead)
      }

      await sleep(1500)
    }
  } finally {
    await browser.close()
  }

  return found
}

async function scrapeCity(browser: Browser, url: string, limit: number): Promise<ScrapedPlace[]> {
  const page = await browser.newPage()
  await page.setUserAgent(USER_AGENT)
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9' })
  await page.setViewport({ width: 1366, height: 900 })

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await sleep(4000)
    await dismissConsent(page)

    // Rola a página para carregar mais resultados
    for (let i = 0; i < Math.ceil(limit / 20) + 2; i++) {
      await page.keyboard.press('End')
      await sleep(700)
    }

    const placeUrls = await page.evaluate(() => {
      const urls = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="/maps/place/"]'))
        .map(a => a.href.split('?')[0])
      return Array.from(new Set(urls))
    })
    console.log(`[SCRAPER] ${placeUrls.length} lugares encontrados`)

    const results: ScrapedPlace[] = []
    const selected = placeUrls.slice(0, limit)

    for (const placeUrl of selected) {
      try {
        const place = await scrapePlace(page, placeUrl)
        if (place && (place.nome || place.whatsapp)) {
          results.push(place)
        }
      } catch (err) {
        console.error('[SCRAPER] Erro ao processar lugar:', err instanceof Error ? err.message : err)
      }
      await sleep(1200)
    }

    return results
  } finally {
    await page.close()
  }
}

async function scrapePlace(page: Page, url: string): Promise<ScrapedPlace | null> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await sleep(3500)
    await dismissConsent(page)

    const data = await page.evaluate(() => {
      const text = (sel: string) => document.querySelector(sel)?.textContent?.trim() ?? ''

      const nome = text('h1') || text('h2[data-attrid="title"]') || text('[data-attrid="title"]') || ''

      let website = ''
      for (const a of Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="http"]'))) {
        const href = a.href
        if (
          /^https?:\/\//i.test(href) &&
          !/google\.(com|br)/.test(href) &&
          !href.includes('g.page') &&
          !href.includes('wa.me') &&
          !href.includes('whatsapp')
        ) {
          website = href
          break
        }
      }

      let phone = ''
      const phoneAttr = document.querySelector('a[data-attrid="phone"]') as HTMLAnchorElement | null
      if (phoneAttr && phoneAttr.href.startsWith('tel:')) {
        phone = phoneAttr.href.replace('tel:', '')
      }
      if (!phone) {
        const tel = document.querySelector<HTMLAnchorElement>('a[href^="tel:"]')
        phone = tel ? tel.href.replace('tel:', '') : ''
      }

      return { nome, website, phone }
    })

    if (!data.nome && !data.phone) return null

    const lead: ScrapedPlace = { nome: data.nome }
    if (data.website) lead.website = data.website
    if (data.phone) {
      const digits = normalizePhone(data.phone)
      if (digits) lead.whatsapp = digits
    }

    return lead
  } catch {
    return null
  }
}

async function dismissConsent(page: Page) {
  try {
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
      const target = buttons.find(b =>
        /accept all|aceitar|concordo|rejeitar|reject all|recusar/i.test(b.textContent || '')
      )
      target?.click()
    })
    await sleep(500)
  } catch {
    // ignora
  }
}

export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length <= 11) digits = '55' + digits
  return digits
}
