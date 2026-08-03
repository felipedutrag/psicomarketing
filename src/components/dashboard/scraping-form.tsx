'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Loader2, Upload } from 'lucide-react'

interface ScrapeResultItem {
  nome: string
  whatsapp?: string
  website?: string
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

  const handleClear = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dashboard/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: 'Erro ao limpar leads' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buscar Leads</CardTitle>
        <CardDescription>
          Busca automática de leads no Google Maps usando uma URL modelo por cidade
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="template-url">URL modelo</Label>
          <Input
            id="template-url"
            value={templateUrl}
            onChange={(e) => setTemplateUrl(e.target.value)}
            placeholder="https://www.google.com/maps/search/psicologos+em+${CIDADE}"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Use <code className="bg-muted px-1 rounded">{"${CIDADE}"}</code> como parâmetro que será substituído por cada cidade.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cities">Cidades (uma por linha)</Label>
          <Textarea
            id="cities"
            placeholder={'São Paulo\nGuarulhos\nCampinas\nSantos'}
            value={cities}
            onChange={(e) => setCities(e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data-count">Quantidade de dados por cidade</Label>
          <Input
            id="data-count"
            type="number"
            value={dataCount}
            onChange={(e) => setDataCount(parseInt(e.target.value) || 10)}
            min={1}
            max={50}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleScrape} disabled={isLoading || !templateUrl.trim() || !cities.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Buscar Leads
              </>
            )}
          </Button>

          <Button onClick={handleClear} variant="destructive" disabled={isLoading}>
            Limpar Todos
          </Button>
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">
            Buscando nos mapas... isso pode levar alguns minutos.
          </p>
        )}

        {result && (
          <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {result.success ? (
              <div className="space-y-2">
                <p>✓ {result.count} leads importados de {result.scraped} encontrados!</p>
                {result.results && result.results.length > 0 && (
                  <ul className="text-xs space-y-1 max-h-40 overflow-auto">
                    {result.results.map((r, i) => (
                      <li key={i}>
                        {r.nome} - {r.whatsapp} {r.website ? `- ${r.website}` : ''}
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
