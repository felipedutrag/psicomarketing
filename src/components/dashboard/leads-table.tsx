'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2, Send, Loader2, RefreshCw, ExternalLink, ListPlus, X, Search, Filter, Plus } from 'lucide-react'
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
  const [filterQuery, setFilterQuery] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [colWidths, setColWidths] = useState({
    nome: 220,
    whatsapp: 140,
    mensagem: 240,
    website: 150,
    status: 140,
    acoes: 100,
  })

  const [resizingCol, setResizingCol] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  const handleMouseDown = (col: string, e: React.MouseEvent) => {
    e.preventDefault()
    setResizingCol(col)
    setStartX(e.clientX)
    setStartWidth(colWidths[col as keyof typeof colWidths])
  }

  useEffect(() => {
    if (!resizingCol) return

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX
      const newWidth = Math.max(80, startWidth + diff)
      setColWidths(prev => ({ ...prev, [resizingCol]: newWidth }))
    }

    const handleMouseUp = () => {
      setResizingCol(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingCol, startX, startWidth])

  const visibleLeads = leads
    .filter((lead) => lead.status !== 'sent')
    .filter((lead) =>
      filterQuery
        ? lead.nome.toLowerCase().includes(filterQuery.toLowerCase()) ||
          lead.whatsapp.includes(filterQuery)
        : true
    )

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
      onSelectionChange(visibleLeads.map((lead) => lead.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectLead = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id))
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
        body: JSON.stringify({ leadIds: selectedIds }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        const { sent = 0, errored = 0, skipped = 0 } = data
        setFeedback({
          type: 'success',
          text: `${sent} enviada(s)${errored > 0 ? `, ${errored} com erro` : ''}${
            skipped > 0 ? `, ${skipped} sem número` : ''
          }.`,
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

  const getNotionStatusBadge = (status: Lead['status'], naFila?: boolean) => {
    const notionColors = {
      pending: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
      personalized: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      sent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      responded: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      error: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800',
    }

    const labels = {
      pending: 'Pendente',
      personalized: 'Personalizado',
      sent: 'Enviado',
      responded: 'Respondido',
      error: 'Erro',
    }

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${notionColors[status]}`}>
          {labels[status]}
        </span>
        {naFila && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            ⚡ Na Fila
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border border-zinc-200/80 bg-[#fbfbfa] p-4 dark:bg-[#191919] dark:border-[#2f2f2f]">
      {/* Notion Database Table Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/60 dark:border-[#2b2b2b]">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Tabela de Leads (Banco de Dados)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {visibleLeads.length} leads visualizados
            </p>
          </div>
        </div>

        {/* Database Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Filtrar por nome ou zap..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="h-8 rounded-md border border-zinc-200 bg-white dark:bg-[#222] dark:border-[#333] pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>
          <Button onClick={fetchLeads} variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" disabled={isLoading}>
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Selected Items Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-indigo-500/30 bg-indigo-500/10 p-2.5 text-xs">
          <span className="font-medium text-indigo-700 dark:text-indigo-300">
            {selectedIds.length} lead(s) selecionado(s)
          </span>
          <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                updateQueue('add', selectedIds, `${selectedIds.length} lead(s) adicionado(s) à fila de envio.`)
              }
              disabled={queueBusy || isSending}
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 cursor-pointer"
            >
              {queueBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <ListPlus className="h-3 w-3" />}
              Adicionar à fila
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || queueBusy}
              size="sm"
              className="h-7 text-xs gap-1 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Enviar Agora
            </Button>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`rounded-md border p-2.5 text-xs ${
            feedback.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Notion Style Table */}
      <div className="overflow-x-auto rounded-md border border-zinc-200/80 bg-white dark:bg-[#202020] dark:border-[#2f2f2f]">
        <Table className="w-full table-fixed">
          <TableHeader className="bg-zinc-50 dark:bg-[#1a1a1a]">
            <TableRow className="border-b border-zinc-200/80 dark:border-[#2b2b2b]">
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedIds.length === visibleLeads.length && visibleLeads.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="relative text-xs font-semibold text-zinc-600 dark:text-zinc-400 select-none overflow-hidden" style={{ width: colWidths.nome }}>
                Aa Nome
                <div onMouseDown={(e) => handleMouseDown('nome', e)} className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-indigo-500/50 transition-colors" />
              </TableHead>
              <TableHead className="relative text-xs font-semibold text-zinc-600 dark:text-zinc-400 select-none overflow-hidden" style={{ width: colWidths.whatsapp }}>
                📱 WhatsApp
                <div onMouseDown={(e) => handleMouseDown('whatsapp', e)} className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-indigo-500/50 transition-colors" />
              </TableHead>
              <TableHead className="relative text-xs font-semibold text-zinc-600 dark:text-zinc-400 select-none overflow-hidden" style={{ width: colWidths.mensagem }}>
                💬 Mensagem
                <div onMouseDown={(e) => handleMouseDown('mensagem', e)} className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-indigo-500/50 transition-colors" />
              </TableHead>
              <TableHead className="relative text-xs font-semibold text-zinc-600 dark:text-zinc-400 select-none overflow-hidden" style={{ width: colWidths.website }}>
                🔗 Website
                <div onMouseDown={(e) => handleMouseDown('website', e)} className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-indigo-500/50 transition-colors" />
              </TableHead>
              <TableHead className="relative text-xs font-semibold text-zinc-600 dark:text-zinc-400 select-none overflow-hidden" style={{ width: colWidths.status }}>
                🏷️ Status
                <div onMouseDown={(e) => handleMouseDown('status', e)} className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-indigo-500/50 transition-colors" />
              </TableHead>
              <TableHead className="relative text-right text-xs font-semibold text-zinc-600 dark:text-zinc-400 select-none" style={{ width: colWidths.acoes }}>
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-zinc-400" />
                </TableCell>
              </TableRow>
            ) : visibleLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-xs text-zinc-400">
                  Nenhum lead encontrado neste filtro.
                </TableCell>
              </TableRow>
            ) : (
              visibleLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 border-b border-zinc-100 dark:border-[#2b2b2b] text-xs transition-colors"
                >
                  <TableCell className="w-10">
                    <Checkbox
                      checked={selectedIds.includes(lead.id)}
                      onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100 truncate" style={{ width: colWidths.nome }}>
                    <div className="truncate" title={lead.nome}>{lead.nome}</div>
                  </TableCell>
                  <TableCell className="font-mono text-zinc-600 dark:text-zinc-400 truncate" style={{ width: colWidths.whatsapp }}>
                    <div className="truncate">{lead.whatsapp}</div>
                  </TableCell>
                  <TableCell style={{ width: colWidths.mensagem }}>
                    <details className="cursor-pointer group">
                      <summary className="text-[11px] text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                        Ver mensagem...
                      </summary>
                      <div className="mt-1.5 p-2 rounded bg-zinc-100 dark:bg-[#181818] border border-zinc-200/60 dark:border-[#2f2f2f] text-[11px] text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-w-xs">
                        {getPlannedMessage(lead)}
                      </div>
                    </details>
                  </TableCell>
                  <TableCell style={{ width: colWidths.website }}>
                    {lead.website ? (
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-full"
                        title={lead.website}
                      >
                        <span className="truncate">{getWebsiteLabel(lead.website)}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </TableCell>
                  <TableCell style={{ width: colWidths.status }}>
                    {getNotionStatusBadge(lead.status, lead.na_fila)}
                  </TableCell>
                  <TableCell className="text-right" style={{ width: colWidths.acoes }}>
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
                        className="h-7 w-7 text-zinc-400 hover:text-indigo-600 cursor-pointer"
                        title={lead.na_fila ? 'Remover da fila' : 'Adicionar à fila'}
                      >
                        {queueBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : lead.na_fila ? (
                          <X className="h-3.5 w-3.5 text-red-500" />
                        ) : (
                          <ListPlus className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        onClick={() => handleDelete(lead.id)}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-400 hover:text-red-500 cursor-pointer"
                        title="Excluir Lead"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
  )
}
