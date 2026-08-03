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

import {
  Bot,
  Sparkles,
  Zap,
  Plus,
  Filter
} from 'lucide-react'

export default function DashboardPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [leadsRevision, setLeadsRevision] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const tabTitles: Record<string, { title: string; emoji: string }> = {
    overview: { title: 'Visão Geral & KPIs', emoji: '📊' },
    leads: { title: 'Database de Leads', emoji: '👥' },
    kanban: { title: 'Quadro Kanban de Prospecção', emoji: '🎴' },
    queue: { title: 'Fila de Disparo Anti-Ban', emoji: '⚡' },
    ai: { title: 'IA & Personalização de Mensagens', emoji: '🤖' },
    config: { title: 'Configurações de Envio & Delays', emoji: '⚙️' }
  }

  const currentTabInfo = tabTitles[activeTab] || { title: 'Central de Prospecção', emoji: '🧠' }

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
          activeEmoji={currentTabInfo.emoji}
        />

        {/* Notion Content Canvas */}
        <main className="flex-1 px-4 sm:px-12 py-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Notion Callout Block Notice */}
          <div className="flex items-start gap-3 rounded-[6px] border border-indigo-200/60 bg-indigo-50/50 p-3.5 dark:border-indigo-900/30 dark:bg-indigo-950/20 text-xs text-indigo-900 dark:text-indigo-200">
            <span className="text-base">💡</span>
            <div className="space-y-0.5">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Bem-vindo ao seu Psicomarketing OS!</span>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11px]">
                Este workspace centraliza a busca de novos leads via Google Maps, enriquece a abordagem com
                IA e realiza envios com intervalos anti-ban configurados. Alterne entre as visões abaixo para gerenciar a operação.
              </p>
            </div>
          </div>

          {/* Notion Database View Switcher Bar */}
          <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-[#242424] pb-1.5">
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium cursor-pointer border-0 shadow-none transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-zinc-200/80 text-zinc-900 dark:bg-[#252525] dark:text-zinc-100 font-semibold'
                    : 'bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#1e1e1e] dark:hover:text-zinc-200'
                }`}
              >
                <span>📊</span>
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
                <span>👥</span>
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
                <span>🎴</span>
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
                <span>⚡</span>
                <span>Fila de Disparo</span>
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium cursor-pointer border-0 shadow-none transition-colors ${
                  activeTab === 'ai'
                    ? 'bg-zinc-200/80 text-zinc-900 dark:bg-[#252525] dark:text-zinc-100 font-semibold'
                    : 'bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#1e1e1e] dark:hover:text-zinc-200'
                }`}
              >
                <span>🤖</span>
                <span>IA & Prompt</span>
              </button>

              <button
                onClick={() => setActiveTab('config')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium cursor-pointer border-0 shadow-none transition-colors ${
                  activeTab === 'config'
                    ? 'bg-zinc-200/80 text-zinc-900 dark:bg-[#252525] dark:text-zinc-100 font-semibold'
                    : 'bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#1e1e1e] dark:hover:text-zinc-200'
                }`}
              >
                <span>⚙️</span>
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
                onClick={() => setActiveTab('leads')}
                className="flex items-center gap-1 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded-[4px] font-medium cursor-pointer transition-colors"
              >
                <Plus className="h-3 w-3" />
                Novo Lead
              </button>
            </div>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <StatsPanel />

              <div className="grid gap-6 lg:grid-cols-2 items-start">
                <ScrapingForm />
                <WhatsAppPanel />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[6px] border border-zinc-200/80 bg-[#fbfbfa] p-3.5 dark:bg-[#181818] dark:border-[#242424] space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs">
                    <Bot className="h-3.5 w-3.5" />
                    IA Multiprovedor Fallback
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Sua IA alterna dinamicamente entre Gemini, NVIDIA e Groq para garantir personalização zero-fail.
                  </p>
                </div>

                <div className="rounded-[6px] border border-zinc-200/80 bg-[#fbfbfa] p-3.5 dark:bg-[#181818] dark:border-[#242424] space-y-1.5">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    Proteção Anti-Ban
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Envios com intervalo humano randômico entre 30s a 120s para proteger a conta de WhatsApp.
                  </p>
                </div>

                <div className="rounded-[6px] border border-zinc-200/80 bg-[#fbfbfa] p-3.5 dark:bg-[#181818] dark:border-[#242424] space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                    <Zap className="h-3.5 w-3.5" />
                    Ultra Performance Redis
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Fila e banco de dados de leads persistem no Upstash Redis com tempo de resposta em milissegundos.
                  </p>
                </div>
              </div>
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
            <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
              <SendQueue />
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

          {/* Tab 6: Automation Configs & Delays */}
          {activeTab === 'config' && (
            <div className="grid gap-6 lg:grid-cols-2 items-start animate-in fade-in duration-200">
              <DelayConfig />
              <ScheduleConfig />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}