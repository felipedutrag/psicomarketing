'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2, Send, Loader2, RefreshCw, ExternalLink, ListPlus, X } from 'lucide-react'
import type { Lead } from '@/lib/dashboard/config'

const DEFAULT_MESSAGE =
  'Olá, me chamo Gabriele, achei seu contato no Google Meu Negócio e queria apresentar uma solução que pode aumentar seus atendimentos e reduzir gastos com anúncios. Você pode falar 1 minuto?'

function getWebsiteLabel(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./i, '')
    const first = hostname.split('.')[0]
    return first.charAt(0).toUpperCase() + first.slice(1)
  } catch {
    return url
  }
}

function getPlannedMessage(lead: Lead): string {
  return lead.mensagem_personalizada || lead.mensagem_inicial || DEFAULT_MESSAGE
}

interface LeadsTableProps {
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  revision?: number
}

export function LeadsTable({ selectedIds, onSelectionChange, revision = 0 }: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [queueBusy, setQueueBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Leads que já receberam mensagem (status 'sent') saem da lista
  const visibleLeads = leads.filter(lead => lead.status !== 'sent')

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
    const initial = setTimeout(fetchLeads, 0)
    return () => clearTimeout(initial)
  }, [revision])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(visibleLeads.map(lead => lead.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectLead = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
    }
  }

  const updateQueue = async (action: 'add' | 'remove', ids: string[], message: string) => {
    if (ids.length === 0) return
    setQueueBusy(true)
    try {
      const response = await fetch('/api/dashboard/whatsapp/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, leadIds: ids }),
      })
      const data = await response.json()
      if (data.success) {
        setFeedback({ type: 'success', text: message })
        await fetchLeads()
      } else {
        setFeedback({ type: 'error', text: data.error || 'Erro ao atualizar a fila' })
      }
    } catch (error) {
      console.error('Erro ao atualizar fila:', error)
      setFeedback({ type: 'error', text: 'Erro ao atualizar a fila' })
    } finally {
      setQueueBusy(false)
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
    setFeedback(null)
    try {
      const response = await fetch('/api/dashboard/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: selectedIds })
      })

      const data = await response.json()
      if (response.ok && data.success) {
        const { sent = 0, errored = 0, skipped = 0 } = data
        setFeedback({
          type: 'success',
          text: `${sent} enviada(s)${errored > 0 ? `, ${errored} com erro` : ''}${skipped > 0 ? `, ${skipped} sem número` : ''}.`,
        })
        onSelectionChange([])
        await fetchLeads()
      } else {
        setFeedback({ type: 'error', text: data.error || 'Erro ao enviar mensagens' })
      }
    } catch (error) {
      console.error('Erro ao enviar mensagens:', error)
      setFeedback({ type: 'error', text: 'Erro ao enviar mensagens' })
    } finally {
      setIsSending(false)
    }
  }

  const getStatusBadge = (status: Lead['status'], naFila?: boolean) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pendente' },
      personalized: { variant: 'default' as const, label: 'Personalizado' },
      sent: { variant: 'default' as const, label: 'Enviado' },
      responded: { variant: 'default' as const, label: 'Respondido' },
      error: { variant: 'destructive' as const, label: 'Erro' },
    }

    const config = statusConfig[status]
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={config.variant}>{config.label}</Badge>
        {naFila && (
          <Badge variant="outline" className="border-indigo-500/30 text-indigo-700 dark:text-indigo-400">
            Na fila
          </Badge>
        )}
      </div>
    )
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
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
                {selectedIds.length} lead(s) selecionado(s)
              </span>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    updateQueue('add', selectedIds, `${selectedIds.length} lead(s) adicionado(s) à fila de envio.`)
                  }
                  disabled={queueBusy || isSending}
                  size="sm"
                  variant="outline"
                >
                  {queueBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ListPlus className="h-4 w-4" />
                  )}
                  Adicionar à fila
                </Button>
                <Button onClick={handleSend} disabled={isSending || queueBusy} size="sm">
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar Agora
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {isSending && (
            <p className="text-sm text-muted-foreground">
              Enviando mensagens... aguarde. Isso pode levar alguns segundos por lead.
            </p>
          )}

          {feedback && (
            <div
              className={`rounded-md border px-3 py-2 text-sm ${
                feedback.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === visibleLeads.length && visibleLeads.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : visibleLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Nenhum lead encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(lead.id)}
                          onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{lead.nome}</TableCell>
                      <TableCell>{lead.whatsapp}</TableCell>
                      <TableCell className="max-w-[260px]">
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground">Ver mensagem</summary>
                          <div className="mt-1 p-2 rounded bg-muted whitespace-pre-wrap text-xs">
                            {getPlannedMessage(lead)}
                          </div>
                        </details>
                      </TableCell>
                      <TableCell>
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            {getWebsiteLabel(lead.website)}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(lead.status, lead.na_fila)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            onClick={() =>
                              lead.na_fila
                                ? updateQueue('remove', [lead.id], 'Lead removido da fila.')
                                : updateQueue('add', [lead.id], 'Lead adicionado à fila de envio.')
                            }
                            disabled={queueBusy || isSending}
                            variant="ghost"
                            size="icon"
                            className={lead.na_fila ? 'text-destructive' : 'text-muted-foreground hover:text-primary'}
                            title={lead.na_fila ? 'Remover da fila (sem apagar o lead)' : 'Adicionar à fila de envio'}
                          >
                            {queueBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : lead.na_fila ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <ListPlus className="h-4 w-4" />
                            )}
                          </Button>
                          <Button onClick={() => handleDelete(lead.id)} variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
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
