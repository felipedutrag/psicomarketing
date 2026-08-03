'use client'

import { useState } from 'react'

import { StatsPanel } from '@/components/dashboard/stats-panel'
import { ScrapingForm } from '@/components/dashboard/scraping-form'
import { WhatsAppPanel } from '@/components/dashboard/whatsapp-panel'
import { MessagePersonalizer } from '@/components/dashboard/message-personalizer'
import { LeadsTable } from '@/components/dashboard/leads-table'
import { PromptEditor } from '@/components/dashboard/prompt-editor'
import { DelayConfig } from '@/components/dashboard/delay-config'
import { ScheduleConfig } from '@/components/dashboard/schedule-config'
import { SendQueue } from '@/components/dashboard/send-queue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { LayoutDashboard, Users, Settings2, Bot, Sparkles, Database } from 'lucide-react'

export default function DashboardPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [leadsRevision, setLeadsRevision] = useState(0)

  return (
    <main className="relative min-h-screen overflow-x-clip bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      {/* Subtle Dot Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:32px_32px] opacity-60 pointer-events-none" />

      {/* Ambient Light Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-indigo-500/15 via-purple-500/10 to-transparent blur-3xl rounded-full pointer-events-none" />
      <div className="absolute top-[35%] -right-40 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/15 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-20 -left-40 w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-600/15 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pt-8 pb-12 md:px-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Badge className="w-fit">Dashboard Psicomarketing</Badge>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">
            Central de Prospecção
          </h1>
          <p className="max-w-2xl text-sm text-zinc-700 dark:text-zinc-400 sm:text-base">
            Busque leads no Google Maps, personalize com IA e dispare mensagens no WhatsApp com intervalos anti-ban.
          </p>
        </div>

        <Separator className="w-full" />

        {/* Stats Overview */}
        <StatsPanel />

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 md:w-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <ScrapingForm />
              <WhatsAppPanel />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                  <Bot className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">IA com Fallback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Gemini → NVIDIA → Groq para personalização confiável de mensagens.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Disparo Inteligente</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Fila de envio com intervalo anti-ban dinâmico entre mensagens.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                  <Database className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Armazenamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Leads e estatísticas salvos no Redis para alta performance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <SendQueue />
            <LeadsTable selectedIds={selectedIds} onSelectionChange={setSelectedIds} revision={leadsRevision} />
            <div className="grid gap-4 lg:grid-cols-2">
              <MessagePersonalizer
                selectedLeadIds={selectedIds}
                onPersonalized={() => setLeadsRevision(v => v + 1)}
              />
              <div className="space-y-4">
                <DelayConfig />
                <ScheduleConfig />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <PromptEditor />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}