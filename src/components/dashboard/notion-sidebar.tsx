'use client'

import { useState, useSyncExternalStore } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Bookmark,
  Moon,
  Sun,
  LayoutDashboard,
  Users,
  Kanban,
  Send,
  Bot,
  Settings2,
  ShieldCheck,
  Target,
  Brain,
  AudioLines,
  TrendingUp
} from 'lucide-react'
import { useTheme } from '@/components/theme-provider'

interface NotionSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

export function NotionSidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed
}: NotionSidebarProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  // true no cliente / false no SSR — evita mismatch de hidratação nos ícones de tema
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const [searchQuery, setSearchQuery] = useState('')

  const sections = [
    {
      title: 'VISÃO GERAL',
      items: [
        { id: 'overview', label: 'Visão Geral & KPIs', icon: LayoutDashboard, description: 'Métricas e Painéis' }
      ]
    },
    {
      title: 'GESTÃO DE LEADS',
      items: [
        { id: 'leads', label: 'Database de Leads', icon: Users, description: 'Tabela de Contatos' },
        { id: 'kanban', label: 'Quadro Kanban', icon: Kanban, description: 'Pipeline por Status' }
      ]
    },
    {
      title: 'ANALYTICS & VENDAS',
      items: [
        { id: 'analytics', label: 'Analytics & Funil', icon: TrendingUp, description: 'Conversões e Receita' }
      ]
    },
    {
      title: 'DISPAROS & AUTOMAÇÃO',
      items: [
        { id: 'queue', label: 'Fila de Disparo', icon: Send, description: 'Envios em Tempo Real' },
        { id: 'config', label: 'Delays & Anti-Ban', icon: Settings2, description: 'Intervalos Humanos' }
      ]
    },
    {
      title: 'INTELIGÊNCIA ARTIFICIAL',
      items: [
        { id: 'ai', label: 'IA & Prompt Engine', icon: Bot, description: 'Personalizador de Mensagens' },
        { id: 'voz', label: 'Controle por Voz', icon: AudioLines, description: 'IA de Voz da Dashboard' }
      ]
    }
  ]

  const favorites = [
    { id: 'leads', label: 'Prospecção Ativa', icon: Target },
    { id: 'queue', label: 'Fila Anti-Ban', icon: ShieldCheck }
  ]

  return (
    <aside
      className={`relative h-screen shrink-0 flex flex-col border-r border-zinc-200/80 bg-[#fbfbfa] text-zinc-800 transition-all duration-300 dark:bg-[#181818] dark:border-[#252525] dark:text-zinc-200 select-none ${
        isCollapsed ? 'w-14' : 'w-64'
      }`}
    >
      {/* Sidebar Collapse/Expand Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-4 z-[60] flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-xs hover:bg-zinc-100 dark:bg-[#252525] dark:border-[#333] dark:hover:bg-[#2e2e2e] text-zinc-500 dark:text-zinc-400 transition-transform cursor-pointer"
        title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
      >
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Workspace Header */}
      <div className="flex h-11 items-center justify-between border-b border-zinc-200/60 px-3.5 dark:border-[#242424] shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-2 overflow-hidden cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-[#222222] px-1.5 py-1 rounded-[6px] transition-colors w-full">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-300/80 dark:border-[#333] bg-white dark:bg-[#1f1f1f] text-indigo-500 shadow-xs">
              <Brain className="h-3 w-3" strokeWidth={1.5} />
            </div>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
              Psicomarketing OS
            </span>
          </div>
        ) : (
          <div className="flex h-6 w-6 mx-auto items-center justify-center rounded-full border border-zinc-300/80 dark:border-[#333] bg-white dark:bg-[#1f1f1f] text-indigo-500 shadow-xs">
            <Brain className="h-3 w-3" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Quick Search */}
      {!isCollapsed && (
        <div className="p-3 shrink-0">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar funcionalidades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[6px] border-0 bg-zinc-200/60 dark:bg-[#202020] py-1.5 pl-8 pr-8 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
            />
            <kbd className="absolute right-2 text-[9px] text-zinc-400 font-mono">
              ⌘K
            </kbd>
          </div>
        </div>
      )}

      {/* Scrollable Functional Navigation List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-5">
        {sections.map((sec) => (
          <div key={sec.title} className="space-y-1">
            {!isCollapsed && (
              <div className="px-2 pt-1 pb-1 text-[10px] font-bold text-[#878786] dark:text-[#737373] uppercase tracking-wider">
                {sec.title}
              </div>
            )}

            <nav className="space-y-1">
              {sec.items.map((item) => {
                const isActive = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex w-full items-center gap-3 rounded-[6px] px-2.5 py-2 text-xs cursor-pointer transition-colors border-0 shadow-none ${
                      isActive
                        ? 'bg-zinc-200/80 text-zinc-900 dark:bg-[#252525] dark:text-zinc-100 font-semibold'
                        : 'bg-transparent text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#202020] dark:hover:text-zinc-200'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title={isCollapsed ? item.label : item.description}
                  >
                    <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    {!isCollapsed && (
                      <div className="flex flex-col items-start leading-tight truncate">
                        <span className="truncate">{item.label}</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        ))}

        {/* Favorites Section */}
        {!isCollapsed && (
          <div className="space-y-1 pt-2 border-t border-zinc-200/60 dark:border-[#242424]">
            <div className="flex items-center justify-between px-2 pt-1 pb-1 text-[10px] font-bold text-[#878786] dark:text-[#737373] uppercase tracking-wider">
              <span>FAVORITOS</span>
              <Bookmark className="h-3 w-3 text-zinc-400" />
            </div>
            <nav className="space-y-1">
              {favorites.map((fav) => (
                <button
                  key={fav.id}
                  onClick={() => setActiveTab(fav.id)}
                  className="flex w-full items-center gap-3 rounded-[6px] px-2.5 py-2 text-xs bg-transparent border-0 text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-[#202020] dark:hover:text-zinc-200 cursor-pointer transition-colors"
                >
                  <fav.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <span className="truncate">{fav.label}</span>
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-zinc-200/60 dark:border-[#242424] p-3 space-y-2 shrink-0">
{!isCollapsed ? (
            <>
              <div className="flex items-center justify-between rounded-[6px] bg-zinc-100 dark:bg-[#1f1f1f] px-2.5 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">WhatsApp Engine</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  ONLINE
                </span>
              </div>

              <div className="flex items-center justify-between px-1 pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                    C
                  </div>
                  <div className="flex flex-col text-left leading-none">
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Cadelo Lead OS</span>
                    <span className="text-[9px] text-zinc-400">Administrador</span>
                  </div>
                </div>
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="rounded-[6px] p-1.5 border-0 bg-transparent hover:bg-zinc-200/60 dark:hover:bg-[#252525] text-zinc-500 dark:text-zinc-400 cursor-pointer transition-colors"
                  title="Alternar tema Notion (Light/Dark)"
                >
                  {!mounted ? (
                    <span className="h-4 w-4" />
                  ) : isDark ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="WhatsApp Engine Online" />
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="rounded-[6px] p-1.5 border-0 bg-transparent hover:bg-zinc-200/60 dark:hover:bg-[#252525] text-zinc-500 dark:text-zinc-400 cursor-pointer"
              >
                {!mounted ? (
                  <span className="h-4 w-4" />
                ) : isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
      </div>
    </aside>
  )
}
