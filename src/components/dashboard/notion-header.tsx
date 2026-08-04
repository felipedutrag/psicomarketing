'use client'

import { useState } from 'react'
import {
  Star,
  Share2,
  MoreHorizontal
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NotionHeaderProps {
  activeTabTitle?: string
  activeIcon?: LucideIcon
}

export function NotionHeader({
  activeTabTitle = 'Central de Prospecção & Vendas',
  activeIcon: ActiveIcon = Star
}: NotionHeaderProps) {
  const [isStarred, setIsStarred] = useState(true)

  return (
    <div className="w-full">
      {/* Notion Top Navigation Breadcrumb Bar */}
      <header className="sticky top-0 z-50 flex h-11 items-center justify-between border-b border-zinc-200/70 bg-[#fbfbfa]/90 px-4 sm:px-12 backdrop-blur-sm dark:bg-[#181818]/90 dark:border-[#252525]">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">Psicomarketing OS</span>
          <span>/</span>
          <span className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
            <ActiveIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>{activeTabTitle}</span>
          </span>
        </div>

        {/* Topbar Action Buttons (Frameless Notion Buttons) */}
        <div className="flex items-center gap-1">
          <div className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 px-2.5 py-0.5 rounded-full mr-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Sistema Ativo
          </div>

          <button
            onClick={() => setIsStarred(!isStarred)}
            className="flex h-7 w-7 items-center justify-center rounded-[4px] border-0 bg-transparent text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-[#252525] hover:text-amber-500 cursor-pointer transition-colors"
            title="Favoritar página"
          >
            <Star className={`h-3.5 w-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          <button
            className="flex items-center gap-1.5 h-7 px-2 rounded-[4px] border-0 bg-transparent text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-[#252525] dark:hover:text-zinc-200 cursor-pointer transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Compartilhar</span>
          </button>

          <button
            className="flex h-7 w-7 items-center justify-center rounded-[4px] border-0 bg-transparent text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-[#252525] dark:hover:text-zinc-200 cursor-pointer transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Notion Page Cover Image Banner */}
      <div className={`relative h-28 sm:h-36 w-full transition-all duration-500`}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1274&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}
        />
        <div className="absolute inset-0 bg-black/25" />
      </div>

      {/* Notion Page Header Main Area - Aligned 100% to Content Max-W-7XL */}
      <div className="relative border-b border-zinc-200/60 dark:border-[#242424]">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-12 pb-6">
          {/* Emoji Selector Icon */}
          <div className="-mt-8 sm:-mt-10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-xs border border-zinc-200/80 dark:bg-[#1f1f1f] dark:border-[#2a2a2a] cursor-pointer hover:scale-105 transition-transform">
            <ActiveIcon className="h-7 w-7" strokeWidth={1.5} />
          </div>

          {/* Page Title */}
          <div className="space-y-2">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {activeTabTitle}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-3xl leading-relaxed">
              Captação de leads com IA e automação de disparos para psicólogos.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
