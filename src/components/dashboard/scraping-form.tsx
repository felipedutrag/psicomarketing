'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Loader2, ArrowRight } from 'lucide-react'

interface ScrapeResultItem {
  nome: string
  whatsapp?: string
  website?: string
  endereco?: string
}

export function ScrapingForm() {
  const [templateUrl, setTemplateUrl] = useState('https://www.google.com/maps/search/psicologos+em+${CIDADE}')
  const [cities, setCities] = useState('')
  const [dataCount, setDataCount] = useState(10)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; count?: number; scraped?: number; results?: ScrapeResultItem[]; error?: string } | null>(null)

  const handleScrape = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/dashboard/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scrape',
          data: {
            templateUrl,
            cities: cities.split('\n').map(c => c.trim()).filter(Boolean),
            dataCount
          }
        })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: 'Erro ao buscar leads' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
          <span>Buscar Leads no Google Maps</span>
        </CardTitle>
        <CardDescription>
          Captura automatizada por cidade usando busca parametrizada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <Label htmlFor="template-url" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            URL modelo
          </Label>
          <Input
            id="template-url"
            value={templateUrl}
            onChange={(e) => setTemplateUrl(e.target.value)}
            placeholder="https://www.google.com/maps/search/psicologos+em+${CIDADE}"
            className="font-mono text-xs"
          />
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Use <code className="bg-zinc-100 dark:bg-[#222] px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono">{"${CIDADE}"}</code> como parâmetro dinâmico.
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="cities" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Cidades (uma por linha)
          </Label>
          <Textarea
            id="cities"
            placeholder={'São Paulo\nGuarulhos\nCampinas\nSantos'}
            value={cities}
            onChange={(e) => setCities(e.target.value)}
            rows={4}
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="data-count" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Quantidade de dados por cidade
          </Label>
          <Input
            id="data-count"
            type="number"
            value={dataCount}
            onChange={(e) => setDataCount(parseInt(e.target.value) || 10)}
            min={1}
            max={50}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            onClick={handleScrape}
            disabled={isLoading || !templateUrl.trim() || !cities.trim()}
            variant="outline"
            className="flex-1 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                Buscar Leads
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {isLoading && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 animate-pulse">
            Buscando nos mapas... isso pode levar alguns segundos por cidade.
          </p>
        )}

        {result && (
          <div
            className={`rounded-[6px] border px-3 py-2 text-xs ${
              result.success
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400'
            }`}
          >
            {result.success ? (
              <div className="space-y-3">
                <p>✓ {result.count} leads importados de {result.scraped} encontrados!</p>
                {result.results && result.results.length > 0 && (
                  <ul className="text-[11px] space-y-1 max-h-36 overflow-auto">
                    {result.results.map((r, i) => (
                      <li key={i}>
                        {r.nome} - {r.whatsapp} {r.website ? `- ${r.website}` : ''} {r.endereco ? `(${r.endereco})` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p>✗ {result.error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
