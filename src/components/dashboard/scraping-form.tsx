'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Loader2 } from 'lucide-react'

export function ScrapingForm() {
  const [input, setInput] = useState('')
  const [dataCount, setDataCount] = useState(10)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null)

  const handleImport = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/dashboard/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          data: { input }
        })
      })

      const data = await response.json()
      setResult(data)
      if (data.success) {
        setInput('')
      }
    } catch (error) {
      setResult({ success: false, error: 'Erro ao importar leads' })
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
        <CardTitle>Importação Manual de Leads</CardTitle>
        <CardDescription>
          Insira os dados manualmente no formato: nome,whatsapp,website (opcional)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="data-count">Quantidade de dados</Label>
          <Input
            id="data-count"
            type="number"
            value={dataCount}
            onChange={(e) => setDataCount(parseInt(e.target.value) || 10)}
            min={1}
            max={1000}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data-input">Dados dos leads</Label>
          <Textarea
            id="data-input"
            placeholder="Exemplo:
João Silva,11998887766,https://joao-clinica.com.br
Maria Santos,11977776655
Pedro Costa,11966665544,https://pedro-psicologia.com"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleImport} disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importar Leads
              </>
            )}
          </Button>

          <Button onClick={handleClear} variant="destructive" disabled={isLoading}>
            Limpar Todos
          </Button>
        </div>

        {result && (
          <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {result.success ? (
              <p>✓ {result.count} leads importados com sucesso!</p>
            ) : (
              <p>✗ {result.error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
