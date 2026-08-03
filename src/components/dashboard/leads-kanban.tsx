'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  RefreshCw,
  ExternalLink,
  Trash2,
  Send,
  ListPlus,
  X,
  Globe,
  User
} from 'lucide-react'
import type { Lead } from '@/lib/dashboard/config'

interface LeadsKanbanProps {
  revision?: number
  onRevisionChange?: () => void
}

export function LeadsKanban({ revision = 0, onRevisionChange }: LeadsKanbanProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchLeads = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dashboard/leads')
      const data = await response.json()
      setLeads(data.leads || [])
    } catch (error) {
      console.error('Erro ao buscar leads para Kanban:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [revision])

  const updateQueue = async (action: 'add' | 'remove', leadId: string) => {
    setBusyId(leadId)
    try {
      await fetch('/api/dashboard/whatsapp/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, leadIds: [leadId] }),
      })
      await fetchLeads()
      if (onRevisionChange) onRevisionChange()
    } catch (error) {
      console.error('Erro ao atualizar fila:', error)
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/dashboard/leads/${id}`, { method: 'DELETE' })
      await fetchLeads()
      if (onRevisionChange) onRevisionChange()
    } catch (error) {
      console.error('Erro ao deletar lead:', error)
    }
  }

  const handleSendSingle = async (id: string) => {
    setBusyId(id)
    try {
      await fetch('/api/dashboard/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: [id] })
      })
      await fetchLeads()
      if (onRevisionChange) onRevisionChange()
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    } finally {
      setBusyId(null)
    }
  }

  const columns = [
    {
      id: 'pending',
      title: 'Pendente',
      emoji: '📋',
      color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
      badgeColor: 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
      items: leads.filter((l) => l.status === 'pending' && !l.na_fila)
    },
    {
      id: 'personalized',
      title: 'Personalizado',
      emoji: '✨',
      color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
      badgeColor: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300',
      items: leads.filter((l) => l.status === 'personalized' && !l.na_fila)
    },
    {
      id: 'queue',
      title: 'Na Fila',
      emoji: '⚡',
      color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
      badgeColor: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
      items: leads.filter((l) => l.na_fila && l.status !== 'sent')
    },
    {
      id: 'sent',
      title: 'Enviados',
      emoji: '✅',
      color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400',
      items: leads.filter((l) => l.status === 'sent')
    },
    {
      id: 'error',
      title: 'Erro',
      emoji: '⚠️',
      color: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
      badgeColor: 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-400',
      items: leads.filter((l) => l.status === 'error')
    }
  ]

  return (
    <div className="space-y-4">
      {/* Notion Board View Toolbar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Quadro Kanban de Prospecção
          </span>
          <Badge variant="outline" className="text-xs font-mono">
            {leads.length} leads no total
          </Badge>
        </div>
        <Button
          onClick={fetchLeads}
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className="h-8 gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Kanban Columns Container with Generous Spacing */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1">
        {columns.map((col) => (
          <div
            key={col.id}
            className="flex-1 min-w-[280px] sm:min-w-[300px] max-w-[360px] flex flex-col rounded-[8px] border border-zinc-200/80 bg-[#fbfbfa] p-3 dark:bg-[#181818] dark:border-[#242424]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between p-2 rounded-[6px] bg-zinc-100/80 dark:bg-[#1f1f1f] border border-zinc-200/60 dark:border-[#282828] mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">{col.emoji}</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{col.title}</span>
              </div>
              <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${col.badgeColor}`}>
                {col.items.length}
              </span>
            </div>

            {/* Column Cards Container */}
            <div className="space-y-3 flex-1 min-h-[300px]">
              {col.items.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-[6px] border border-dashed border-zinc-200/80 dark:border-[#282828] text-xs text-zinc-400">
                  Sem registros
                </div>
              ) : (
                col.items.map((lead) => (
                  <Card
                    key={lead.id}
                    className="p-3.5 space-y-2.5 rounded-[6px] border border-zinc-200/80 dark:border-[#282828] bg-white dark:bg-[#202020] shadow-2xs hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{lead.nome}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="text-zinc-400 hover:text-red-500 cursor-pointer p-1 transition-colors"
                        title="Excluir Lead"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                      📱 {lead.whatsapp || 'Sem número'}
                    </div>

                    {lead.website && (
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                      >
                        <Globe className="h-3 w-3" />
                        Website
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}

                    {/* Message Preview Snippet */}
                    <div className="rounded-[4px] bg-zinc-50 dark:bg-[#161616] p-2.5 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-[#262626] line-clamp-3 leading-relaxed">
                      {lead.mensagem_personalizada || lead.mensagem_inicial || 'Sem mensagem personalizada'}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-[#282828]">
                      {col.id !== 'sent' && (
                        <Button
                          onClick={() => updateQueue(lead.na_fila ? 'remove' : 'add', lead.id)}
                          disabled={busyId === lead.id}
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1 cursor-pointer"
                        >
                          {busyId === lead.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : lead.na_fila ? (
                            <>
                              <X className="h-3.5 w-3.5 text-red-500" />
                              <span className="text-red-500 font-medium">Sair da fila</span>
                            </>
                          ) : (
                            <>
                              <ListPlus className="h-3.5 w-3.5 text-indigo-500" />
                              <span>Fila</span>
                            </>
                          )}
                        </Button>
                      )}

                      {col.id !== 'sent' && (
                        <Button
                          onClick={() => handleSendSingle(lead.id)}
                          disabled={busyId === lead.id}
                          size="sm"
                          className="h-7 px-2.5 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer ml-auto"
                        >
                          <Send className="h-3 w-3" />
                          Enviar
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
