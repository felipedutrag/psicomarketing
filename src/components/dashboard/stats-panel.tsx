'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Loader2, Users, MessageSquare, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'
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
    const interval = setInterval(fetchStats, 30000) // Atualiza a cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  const StatCard = ({ title, value, icon: Icon, description }: { title: string; value: number | string; icon: any; description: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas</CardTitle>
          <CardDescription>Carregando estatísticas...</CardDescription>
        </CardHeader>
        <CardContent>
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Estatísticas</h3>
          <p className="text-sm text-muted-foreground">Visão geral do desempenho</p>
        </div>
        <Button onClick={fetchStats} variant="ghost" size="icon" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Leads"
          value={stats.total_leads}
          icon={Users}
          description="Leads cadastrados"
        />
        <StatCard
          title="Pendentes"
          value={stats.pending}
          icon={MessageSquare}
          description="Aguardando personalização"
        />
        <StatCard
          title="Enviados"
          value={stats.sent}
          icon={CheckCircle}
          description="Mensagens enviadas"
        />
        <StatCard
          title="Respondidos"
          value={stats.responded}
          icon={TrendingUp}
          description="Leads que responderam"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Taxa de Resposta"
          value={`${stats.response_rate.toFixed(1)}%`}
          icon={TrendingUp}
          description="Dos leads enviados"
        />
        <StatCard
          title="Erros"
          value={stats.error}
          icon={AlertCircle}
          description="Falhas no envio"
        />
      </div>

      <div className="text-xs text-muted-foreground">
        Última atualização: {new Date(stats.last_updated).toLocaleString('pt-BR')}
      </div>
    </div>
  )
}
