'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, TrendingUp, Send, CheckCircle2, MousePointerClick, CalendarCheck, Wallet, Banknote, Users, AlertCircle, Trash2 } from 'lucide-react'

interface TrendPoint {
  date: string
  acessou: number
  agendou: number
  pagou: number
  receita: number
}

interface RecentConversion {
  mc_user_id: string
  nome: string | null
  telefone: string | null
  email: string | null
  stage: string | null
  mensagem_conversao: string | null
  acessou_landing_at: string | null
  agendou_at: string | null
  pagou_at: string | null
}

interface RecentPayment {
  id: number
  mc_user_id: string | null
  transaction_id: string | null
  tipo: string
  amount_brl: number | null
  payer_name: string | null
  payer_email: string | null
  renewal_link_sent: boolean
  renewal_sent_at: string | null
  paid_at: string | null
}

interface AnalyticsStats {
  totalLeads: number
  byStage: { f_interessado: number; f_fechamento: number; f_quebra_objecao: number; pago: number }
  landingVisits: number
  agendamentos: number
  pagamentos: number
  receita: number
  ticketMedio: number
  taxas: { landing_para_agendamento: number; agendamento_para_pagamento: number; landing_para_pagamento: number }
  trend7: TrendPoint[]
  trend30: TrendPoint[]
  recentConversions: RecentConversion[]
  recentPayments: RecentPayment[]
  lastUpdated: string
}

const STAGE_LABELS: Record<string, string> = {
  f_interessado: 'Interessado',
  f_fechamento: 'Fechamento / Agendou',
  f_quebra_objecao: 'Quebra de Objeção',
  pago: 'Pagou (Cliente)',
}

const STAGE_COLORS: Record<string, string> = {
  f_interessado: 'bg-sky-500',
  f_fechamento: 'bg-indigo-500',
  f_quebra_objecao: 'bg-amber-500',
  pago: 'bg-emerald-500',
}

function KpiCard({ icon: Icon, title, value, description }: { icon: typeof Users; title: string; value: string | number; description: string }) {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-zinc-200/80 bg-[#fbfbfa] p-4 dark:bg-[#191919] dark:border-[#2f2f2f] shadow-2xs">
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
        <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{title}</span>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{value}</div>
        <p className="text-xs mt-1 text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>
    </div>
  )
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

export function AnalyticsPanel() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [trendDays, setTrendDays] = useState<7 | 30>(7)
  const [resendingId, setResendingId] = useState<number | null>(null)
  const [resendMessage, setResendMessage] = useState<{ id: number; ok: boolean; text: string } | null>(null)
  const [isDeletingAdmin, setIsDeletingAdmin] = useState(false)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dashboard/analytics')
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Erro ao buscar analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca no mount + polling
    fetchStats()
    const interval = setInterval(() => {
      if (!document.hidden) fetchStats()
    }, 60000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const handleResendRenewal = async (payment: RecentPayment) => {
    setResendingId(payment.id)
    setResendMessage(null)
    try {
      const res = await fetch('/api/dashboard/analytics/resend-renewal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: payment.id }),
      })
      const data = await res.json()
      setResendMessage({ id: payment.id, ok: res.ok, text: res.ok ? 'Link enviado!' : data.error || 'Falha no envio' })
    } catch {
      setResendMessage({ id: payment.id, ok: false, text: 'Falha no envio' })
    } finally {
      setResendingId(null)
      fetchStats()
    }
  }

  const handleClearAdmin = async () => {
    if (!window.confirm('Excluir os dados do admin (telefone 5513988658518) do analytics e pagamentos?')) return
    setIsDeletingAdmin(true)
    try {
      const res = await fetch('/api/dashboard/analytics/clear-admin', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao limpar')
      alert(`Dados do admin removidos: ${data.deletedAnalytics} linha(s) de analytics, ${data.deletedPayments} pagamento(s).`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao limpar dados do admin')
    } finally {
      setIsDeletingAdmin(false)
      fetchStats()
    }
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-zinc-200/80 bg-[#fbfbfa] p-8 dark:bg-[#191919] dark:border-[#2f2f2f]">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400 mr-2" />
        <span className="text-xs text-zinc-500">Carregando analytics do funil...</span>
      </div>
    )
  }

  const trend = trendDays === 7 ? stats.trend7 : stats.trend30
  const maxTrendCount = Math.max(1, ...trend.map((t) => Math.max(t.acessou, t.agendou, t.pagou)))
  const maxTrendRevenue = Math.max(1, ...trend.map((t) => t.receita))
  const stageOrder = ['f_interessado', 'f_fechamento', 'f_quebra_objecao', 'pago'] as const
  const funnelTotal = Math.max(1, stats.byStage.f_interessado || stats.totalLeads)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Analytics do Funil de Vendas</span>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchStats} variant="ghost" size="sm" disabled={isLoading} className="h-7 text-xs gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={isDeletingAdmin}
            onClick={handleClearAdmin}
            className="h-7 text-xs gap-1.5 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
          >
            {isDeletingAdmin ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Limpar dados do admin
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard icon={Users} title="Leads no Funil" value={stats.totalLeads} description="Rastreados via ManyChat" />
        <KpiCard icon={MousePointerClick} title="Acessaram Landing" value={stats.landingVisits} description="Visitas com ?id=" />
        <KpiCard icon={CalendarCheck} title="Agendamentos" value={stats.agendamentos} description="Reserva de vaga" />
        <KpiCard icon={Wallet} title="Pagamentos" value={stats.pagamentos} description="PIX confirmados" />
        <KpiCard icon={Banknote} title="Receita" value={formatBRL(stats.receita)} description="Total pago" />
        <KpiCard icon={CheckCircle2} title="Ticket Médio" value={formatBRL(stats.ticketMedio)} description="Por pagamento" />
      </div>

      {/* Taxas de conversão */}
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: 'Landing → Agendamento', value: stats.taxas.landing_para_agendamento },
          { label: 'Agendamento → Pagamento', value: stats.taxas.agendamento_para_pagamento },
          { label: 'Landing → Pagamento', value: stats.taxas.landing_para_pagamento },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-zinc-200/80 bg-[#fbfbfa] p-3.5 dark:bg-[#191919] dark:border-[#2f2f2f]">
            <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{item.label}</div>
            <div className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">{item.value}%</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-stretch">
        {/* Funil por etapa */}
        <section className="rounded-lg border border-zinc-200/80 bg-[#fbfbfa] p-4 dark:bg-[#191919] dark:border-[#2f2f2f] flex flex-col space-y-4">
          <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Funil de Vendas por Etapa</div>
          <div className="space-y-3 flex-1">
            {stageOrder.map((stage) => {
              const count = stats.byStage[stage]
              const pctOfFunnel = (count / funnelTotal) * 100
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-zinc-600 dark:text-zinc-400">{STAGE_LABELS[stage]}</span>
                    <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-200/70 dark:bg-[#2a2a2a] overflow-hidden">
                    <div className={`h-full rounded-full ${STAGE_COLORS[stage]}`} style={{ width: `${pctOfFunnel}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[11px] text-zinc-400 mt-auto">
            Etapa atual de cada lead (a etapa &apos;Pagou&apos; representa a base de clientes ativos).
          </p>
        </section>

        {/* Trend */}
        <section className="rounded-lg border border-zinc-200/80 bg-[#fbfbfa] p-4 dark:bg-[#191919] dark:border-[#2f2f2f] space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Conversões por Dia</div>
            <div className="flex items-center gap-1">
              {([7, 30] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setTrendDays(d)}
                  className={`px-2 py-0.5 rounded-[4px] text-[11px] font-medium cursor-pointer border-0 ${
                    trendDays === d ? 'bg-zinc-200/80 text-zinc-900 dark:bg-[#252525] dark:text-zinc-100' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-[#1e1e1e]'
                  }`}
                >
                  {d} dias
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {trend.slice(-14).map((t) => {
              const acessou = (t.acessou / maxTrendCount) * 100
              const agendou = (t.agendou / maxTrendCount) * 100
              const pagou = (t.pagou / maxTrendCount) * 100
              const receita = (t.receita / maxTrendRevenue) * 100
              return (
                <div key={t.date} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="font-mono">{t.date.slice(5)}</span>
                    <span className="font-mono">{formatBRL(t.receita)}</span>
                  </div>
                  <div className="flex h-3 gap-0.5 w-full">
                    <div className="bg-sky-500/70 rounded-l" style={{ width: `${acessou}%` }} title={`Acessos: ${t.acessou}`} />
                    <div className="bg-indigo-500/70" style={{ width: `${agendou}%` }} title={`Agendamentos: ${t.agendou}`} />
                    <div className="bg-emerald-500/80 rounded-r" style={{ width: `${pagou}%` }} title={`Pagamentos: ${t.pagou}`} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-500/70 inline-block" /> Acessos</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500/70 inline-block" /> Agendamentos</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500/80 inline-block" /> Pagamentos</span>
          </div>
        </section>
      </div>

      {/* Conversões recentes */}
      <section className="rounded-lg border border-zinc-200/80 bg-[#fbfbfa] p-4 dark:bg-[#191919] dark:border-[#2f2f2f] space-y-3">
        <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Conversões Recentes</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-zinc-400 border-b border-zinc-200/80 dark:border-[#2a2a2a]">
                <th className="py-2 pr-3 font-medium">Lead</th>
                <th className="py-2 pr-3 font-medium">Etapa</th>
                <th className="py-2 pr-3 font-medium hidden md:table-cell">Mensagem que Converteu</th>
                <th className="py-2 pr-3 font-medium">Landing</th>
                <th className="py-2 pr-3 font-medium">Agendou</th>
                <th className="py-2 font-medium">Pagou</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentConversions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-zinc-400">Nenhuma conversão registrada ainda.</td>
                </tr>
              )}
              {stats.recentConversions.map((c) => (
                <tr key={c.mc_user_id} className="border-b border-zinc-100 dark:border-[#222] last:border-0">
                  <td className="py-2 pr-3">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{c.nome || c.mc_user_id}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{c.mc_user_id}</div>
                  </td>
                  <td className="py-2 pr-3">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${c.stage === 'pago' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-[#222] dark:text-zinc-300'}`}>
                      {STAGE_LABELS[c.stage || 'f_interessado']}
                    </span>
                  </td>
                  <td className="py-2 pr-3 hidden md:table-cell">
                    <span className="text-zinc-500 dark:text-zinc-400 line-clamp-2 max-w-[280px]">
                      {c.mensagem_conversao || '—'}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-zinc-500">{c.acessou_landing_at ? formatDate(c.acessou_landing_at) : '—'}</td>
                  <td className="py-2 pr-3 text-zinc-500">{c.agendou_at ? formatDate(c.agendou_at) : '—'}</td>
                  <td className="py-2 text-zinc-500">{c.pagou_at ? formatDate(c.pagou_at) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pagamentos recentes */}
      <section className="rounded-lg border border-zinc-200/80 bg-[#fbfbfa] p-4 dark:bg-[#191919] dark:border-[#2f2f2f] space-y-3">
        <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Pagamentos Recentes</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-zinc-400 border-b border-zinc-200/80 dark:border-[#2a2a2a]">
                <th className="py-2 pr-3 font-medium">Cliente</th>
                <th className="py-2 pr-3 font-medium">Tipo</th>
                <th className="py-2 pr-3 font-medium">Valor</th>
                <th className="py-2 pr-3 font-medium hidden md:table-cell">Pago em</th>
                <th className="py-2 font-medium">Link de Renovação</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentPayments.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-zinc-400">Nenhum pagamento registrado ainda.</td>
                </tr>
              )}
              {stats.recentPayments.map((p) => (
                <tr key={p.id} className="border-b border-zinc-100 dark:border-[#222] last:border-0">
                  <td className="py-2 pr-3">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{p.payer_name || '—'}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{p.mc_user_id || p.transaction_id || p.id}</div>
                  </td>
                  <td className="py-2 pr-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${p.tipo === 'renovacao' ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' : 'bg-zinc-100 text-zinc-600 dark:bg-[#222] dark:text-zinc-300'}`}>
                      {p.tipo === 'renovacao' ? 'Renovação' : 'Assinatura'}
                    </span>
                  </td>
                  <td className="py-2 pr-3 font-mono font-semibold text-zinc-900 dark:text-zinc-100">{p.amount_brl != null ? formatBRL(p.amount_brl) : '—'}</td>
                  <td className="py-2 pr-3 text-zinc-500 hidden md:table-cell">{p.paid_at ? formatDate(p.paid_at) : formatDate(p.renewal_sent_at)}</td>
                  <td className="py-2">
                    {p.renewal_link_sent ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400">
                        <Send className="h-3 w-3" /> Enviado {formatDate(p.renewal_sent_at)}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={resendingId === p.id}
                          onClick={() => handleResendRenewal(p)}
                          className="h-6 text-[10px] gap-1 cursor-pointer"
                        >
                          {resendingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                          Enviar link de renovação
                        </Button>
                        {resendMessage?.id === p.id && (
                          <span className={`text-[10px] flex items-center gap-1 ${resendMessage.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                            {resendMessage.ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            {resendMessage.text}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
