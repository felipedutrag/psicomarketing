'use client'

import { StatsPanel } from '@/components/dashboard/stats-panel'
import { ScrapingForm } from '@/components/dashboard/scraping-form'
import { WhatsAppPanel } from '@/components/dashboard/whatsapp-panel'
import { MessagePersonalizer } from '@/components/dashboard/message-personalizer'
import { LeadsTable } from '@/components/dashboard/leads-table'
import { PromptEditor } from '@/components/dashboard/prompt-editor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutDashboard, MessageSquare, Users, Send, BarChart3, Sparkles } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Psicomarketing</h1>
            <p className="text-muted-foreground">
              Sistema de automação de prospecção e envio de mensagens
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <StatsPanel />

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="messaging" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensagens
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <ScrapingForm />
              <WhatsAppPanel />
            </div>
            <MessagePersonalizer />
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <LeadsTable />
          </TabsContent>

          <TabsContent value="messaging" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <MessagePersonalizer />
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Envios</CardTitle>
                  <CardDescription>
                    Visualize o histórico de mensagens enviadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Funcionalidade em desenvolvimento...
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4">
            <WhatsAppPanel />
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Envio</CardTitle>
                <CardDescription>
                  Configure os parâmetros de envio anti-ban
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Delay Mínimo</p>
                  <p className="text-sm text-muted-foreground">2 minutos</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Delay Máximo</p>
                  <p className="text-sm text-muted-foreground">5 minutos</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tipo de Delay</p>
                  <p className="text-sm text-muted-foreground">Dinâmico (exponencial/jitter)</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  Essas configurações são otimizadas para evitar bloqueios no WhatsApp
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <PromptEditor />
          </TabsContent>
        </Tabs>

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Integração ManyChat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Webhook configurado para receber respostas e atualizar estatísticas automaticamente
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">IA com Fallback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                NVIDIA → Groq → Gemini para personalização confiável de mensagens
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Armazenamento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Leads e estatísticas salvos no Redis para alta performance
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
