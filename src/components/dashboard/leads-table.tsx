'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2, Send, Loader2, RefreshCw } from 'lucide-react'
import type { Lead } from '@/lib/dashboard/config'

export function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const fetchLeads = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dashboard/leads')
      const data = await response.json()
      setLeads(data.leads || [])
    } catch (error) {
      console.error('Erro ao buscar leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(leads.map(lead => lead.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectLead = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/dashboard/leads/${id}`, { method: 'DELETE' })
      await fetchLeads()
    } catch (error) {
      console.error('Erro ao deletar lead:', error)
    }
  }

  const handleSend = async () => {
    if (selectedIds.length === 0) return

    setIsSending(true)
    try {
      const response = await fetch('/api/dashboard/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: selectedIds })
      })

      const data = await response.json()
      if (data.success) {
        setSelectedIds([])
        await fetchLeads()
      }
    } catch (error) {
      console.error('Erro ao enviar mensagens:', error)
    } finally {
      setIsSending(false)
    }
  }

  const getStatusBadge = (status: Lead['status']) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pendente' },
      personalized: { variant: 'default' as const, label: 'Personalizado' },
      sent: { variant: 'default' as const, label: 'Enviado' },
      responded: { variant: 'default' as const, label: 'Respondido' },
      error: { variant: 'destructive' as const, label: 'Erro' },
    }

    const config = statusConfig[status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Leads</CardTitle>
            <CardDescription>
              Gerencie seus leads e envie mensagens via WhatsApp
            </CardDescription>
          </div>
          <Button onClick={fetchLeads} variant="ghost" size="icon" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {selectedIds.length > 0 && (
            <div className="flex gap-2 p-4 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-800">{selectedIds.length} leads selecionados</span>
              <Button onClick={handleSend} disabled={isSending} size="sm">
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Mensagens
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === leads.length && leads.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Nenhum lead encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(lead.id)}
                          onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{lead.nome}</TableCell>
                      <TableCell>{lead.whatsapp}</TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>{lead.website || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleDelete(lead.id)}
                          variant="ghost"
                          size="icon"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
