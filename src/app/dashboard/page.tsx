'use client'

import { useState } from 'react'

import { NotionSidebar } from '@/components/dashboard/notion-sidebar'
import { NotionHeader } from '@/components/dashboard/notion-header'
import { StatsPanel } from '@/components/dashboard/stats-panel'
import { ScrapingForm } from '@/components/dashboard/scraping-form'
import { WhatsAppPanel } from '@/components/dashboard/whatsapp-panel'
import { MessagePersonalizer } from '@/components/dashboard/message-personalizer'
import { LeadsTable } from '@/components/dashboard/leads-table'
import { LeadsKanban } from '@/components/dashboard/leads-kanban'
import { PromptEditor } from '@/components/dashboard/prompt-editor'
import { DelayConfig } from '@/components/dashboard/delay-config'
import { ScheduleConfig } from '@/components/dashboard/schedule-config'
import { SendQueue } from '@/components/dashboard/send-queue'
import { NewLeadModal } from '@/components/dashboard/new-lead-modal'
import { VoiceAIPanel } from '@/components/dashboard/voice-ai-panel'
import { AnalyticsPanel } from '@/components/dashboard/analytics-panel'

import {
  Bot,
  Sparkles,
  Zap,
  ArrowRight,
  Filter,
  LayoutDashboard,
  Users,
  Kanban,
  Send,
  Settings2,
  AudioLines,
  TrendingUp
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export default function DashboardPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [leadsRevision, setLeadsRevision] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false)
  const [voiceStartSignal, setVoiceStartSignal] = useState(0)

  const handleLeadCreated = () => {
    setLeadsRevision((v) => v + 1)
    setActiveTab('leads')
  }

  const handleOrbClick = () => {
    setVoiceStartSignal((v) => v + 1)
  }

  const tabTitles: Record<string, { title: string; icon: LucideIcon }> = {
    overview: { title: 'Visão Geral & KPIs', icon: LayoutDashboard },
    leads: { title: 'Database de Leads', icon: Users },
    kanban: { title: 'Quadro Kanban de Prospecção', icon: Kanban },
    analytics: { title: 'Analytics & Funil de Vendas', icon: TrendingUp },
    queue: { title: 'Fila de Disparo Anti-Ban', icon: Send },
    ai: { title: 'IA & Personalização de Mensagens', icon: Bot },
    voz: { title: 'Controle por Voz (IA da Dashboard)', icon: AudioLines },
    config: { title: 'Configurações de Envio & Delays', icon: Settings2 }
  }

  const currentTabInfo = tabTitles[activeTab] || { title: 'Central de Prospecção', icon: Sparkles }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#ffffff] text-zinc-900 antialiased dark:bg-[#121212] dark:text-zinc-100 font-sans">
      {/* Fixed Full-Height Notion Sidebar */}
      <NotionSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Page Scrollable Area */}
      <div className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0">
        {/* Notion Top Header */}
        <NotionHeader
          activeTabTitle={currentTabInfo.title}
          activeIcon={currentTabInfo.icon}
          onOrbClick={handleOrbClick}
        />

        {/* Notion Content Canvas */}
        <main className="flex-1 px-4 sm:px-12 py-6 pb-20 max-w-7xl w-full mx-auto space-y-6">
          {/* Notion Database View Switcher Bar */}
          <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-[#242424] pb-3">
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium cursor-pointer border-0 shadow-none transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-zinc-200/80 text-zinc-900 dark:bg-[#252525] dark:text-zinc-100 font-semibold'
                    : 'bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#1e1e1e] dark:hover:text-zinc-200'
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Visão Geral</span>
              </button>

              <button
                onClick={() => setActiveTab('leads')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium cursor-pointer border-0 shadow-none transition-colors ${
                  activeTab === 'leads'
                    ? 'bg-zinc-200/80 text-zinc-900 dark:bg-[#252525] dark:text-zinc-100 font-semibold'
                    : 'bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#1e1e1e] dark:hover:text-zinc-200'
                }`}
              >
                <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Tabela Leads</span>
              </button>

              <button
                onClick={() => setActiveTab('kanban')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium cursor-pointer border-0 shadow-none transition-colors ${
                  activeTab === 'kanban'
                    ? 'bg-zinc-200/80 text-zinc-900 dark:bg-[#252525] dark:text-zinc-100 font-semibold'
                    : 'bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#1e1e1e] dark:hover:text-zinc-200'
                }`}
              >
                <Kanban className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Quadro Kanban</span>
              </button>

              <button
                onClick={() => setActiveTab('queue')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium cursor-pointer border-0 shadow-none transition-colors ${
                  activeTab === 'queue'
                    ? 'bg-zinc-200/80 text-zinc-900 dark:bg-[#252525] dark:text-zinc-100 font-semibold'
                    : 'bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#1e1e1e] dark:hover:text-zinc-200'
                }`}
              >
                <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Fila de Disparo</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium cursor-pointer border-0 shadow-none transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-zinc-200/80 text-zinc-900 dark:bg-[#252525] dark:text-zinc-100 font-semibold'
                    : 'bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#1e1e1e] dark:hover:text-zinc-200'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium cursor-pointer border-0 shadow-none transition-colors ${
                  activeTab === 'ai'
                    ? 'bg-zinc-200/80 text-zinc-900 dark:bg-[#252525] dark:text-zinc-100 font-semibold'
                    : 'bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#1e1e1e] dark:hover:text-zinc-200'
                }`}
              >
                <Bot className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>IA & Prompt</span>
              </button>

              <button
                onClick={() => setActiveTab('voz')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium cursor-pointer border-0 shadow-none transition-colors ${
                  activeTab === 'voz'
                    ? 'bg-zinc-200/80 text-zinc-900 dark:bg-[#252525] dark:text-zinc-100 font-semibold'
                    : 'bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#1e1e1e] dark:hover:text-zinc-200'
                }`}
              >
                <AudioLines className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Controle por Voz</span>
              </button>

              <button
                onClick={() => setActiveTab('config')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium cursor-pointer border-0 shadow-none transition-colors ${
                  activeTab === 'config'
                    ? 'bg-zinc-200/80 text-zinc-900 dark:bg-[#252525] dark:text-zinc-100 font-semibold'
                    : 'bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#1e1e1e] dark:hover:text-zinc-200'
                }`}
              >
                <Settings2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Automações</span>
              </button>
            </div>

            {/* Notion Database Toolbar Quick Controls */}
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 px-2 py-1 rounded-[4px] hover:bg-zinc-100 dark:hover:bg-[#1e1e1e] cursor-pointer transition-colors"
              >
                <Filter className="h-3 w-3" />
                Filtros
              </button>
              <button
                onClick={() => setIsNewLeadOpen(true)}
                className="flex items-center gap-1 text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-300 dark:border-indigo-500/40 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 px-2.5 py-1 rounded-[4px] font-medium cursor-pointer transition-colors"
              >
                Novo Lead
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <StatsPanel />

              <section className="space-y-3">
                <div className="flex items-center gap-2.5 px-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Operações
                  </span>
                  <span className="h-px flex-1 bg-zinc-200/70 dark:bg-[#242424]" />
                </div>

                <div className="grid gap-6 lg:grid-cols-2 items-start">
                  <ScrapingForm />
                  <WhatsAppPanel />
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2.5 px-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Infraestrutura
                  </span>
                  <span className="h-px flex-1 bg-zinc-200/70 dark:bg-[#242424]" />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[6px] border border-zinc-200/80 bg-[#fbfbfa] p-3.5 dark:bg-[#181818] dark:border-[#242424] space-y-1.5">
                    <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-semibold text-xs">
                      <Bot className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
                      IA Multiprovedor Fallback
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Sua IA alterna dinamicamente entre Gemini, NVIDIA e Groq para garantir personalização zero-fail.
                    </p>
                  </div>

                  <div className="rounded-[6px] border border-zinc-200/80 bg-[#fbfbfa] p-3.5 dark:bg-[#181818] dark:border-[#242424] space-y-1.5">
                    <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-semibold text-xs">
                      <Sparkles className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
                      Proteção Anti-Ban
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Envios com intervalo humano randômico entre 30s a 120s para proteger a conta de WhatsApp.
                    </p>
                  </div>

                  <div className="rounded-[6px] border border-zinc-200/80 bg-[#fbfbfa] p-3.5 dark:bg-[#181818] dark:border-[#242424] space-y-1.5">
                    <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-semibold text-xs">
                      <Zap className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
                      Ultra Performance Redis
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Fila e banco de dados de leads persistem no Upstash Redis com tempo de resposta em milissegundos.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Tab 2: Leads Database Table */}
          {activeTab === 'leads' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <LeadsTable
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                revision={leadsRevision}
              />
            </div>
          )}

          {/* Tab 3: Notion Kanban Board */}
          {activeTab === 'kanban' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <LeadsKanban
                revision={leadsRevision}
                onRevisionChange={() => setLeadsRevision((v) => v + 1)}
              />
            </div>
          )}

          {/* Tab 4: Dispatch Queue */}
          {activeTab === 'queue' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <SendQueue />
            </div>
          )}

          {/* Tab 3.1: Analytics & Sales Funnel */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <AnalyticsPanel />
            </div>
          )}

          {/* Tab 5: AI & Message Personalization */}
          {activeTab === 'ai' && (
            <div className="grid gap-6 lg:grid-cols-2 items-start animate-in fade-in duration-200">
              <MessagePersonalizer
                selectedLeadIds={selectedIds}
                onPersonalized={() => setLeadsRevision((v) => v + 1)}
              />
              <PromptEditor />
            </div>
          )}

          {/* Tab 5.1: Voice AI Dashboard Control */}
          <div className={activeTab === 'voz' ? 'space-y-6 animate-in fade-in duration-200' : 'hidden'}>
            <VoiceAIPanel startSignal={voiceStartSignal} />
          </div>

          {/* Tab 6: Automation Configs & Delays */}
          {activeTab === 'config' && (
            <div className="grid gap-6 lg:grid-cols-2 items-start animate-in fade-in duration-200">
              <DelayConfig />
              <ScheduleConfig />
            </div>
          )}
        </main>
      </div>

      <NewLeadModal
        open={isNewLeadOpen}
        onClose={() => setIsNewLeadOpen(false)}
        onCreated={handleLeadCreated}
      />
    </div>
  )
}