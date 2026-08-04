'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2, Clock, Users, Zap, CheckCircle2, LineChart, AlertTriangle, Activity } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { DashboardStats } from '@/lib/dashboard/config'

export function StatsPanel() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(() => {
      if (!document.hidden) fetchStats()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const StatBlock = ({
    icon: Icon,
    title,
    value,
    description
  }: {
    icon: LucideIcon
    title: string
    value: number | string
    description: string
  }) => (
    <div className="flex flex-col justify-between rounded-lg border border-zinc-200/80 bg-[#fbfbfa] p-4 dark:bg-[#191919] dark:border-[#2f2f2f] shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
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

  if (!stats) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-zinc-200/80 bg-[#fbfbfa] p-8 dark:bg-[#191919] dark:border-[#2f2f2f]">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400 mr-2" />
        <span className="text-xs text-zinc-500">Carregando dados do workspace...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Resumo de Performance
          </span>
        </div>
        <Button
          onClick={fetchStats}
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className="h-7 text-xs gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Sincronizar
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <StatBlock
          icon={Users}
          title="Total Leads"
          value={stats.total_leads}
          description="Cadastrados no OS"
        />
        <StatBlock
          icon={Zap}
          title="Na Fila"
          value={stats.pending}
          description="Fila Anti-Ban"
        />
        <StatBlock
          icon={CheckCircle2}
          title="Enviados"
          value={stats.sent}
          description="Mensagens entregues"
        />
        <StatBlock
          icon={LineChart}
          title="Taxa Resposta"
          value={`${stats.response_rate.toFixed(1)}%`}
          description="Engajamento estimado"
        />
        <StatBlock
          icon={AlertTriangle}
          title="Erros"
          value={stats.error}
          description="Falhas de disparo"
        />
      </div>

      <div className="flex items-center justify-end text-[11px] text-zinc-400 gap-1.5">
        <Clock className="h-3 w-3" />
        Última sincronização: {new Date(stats.last_updated).toLocaleTimeString('pt-BR')}
      </div>
    </div>
  )
}
