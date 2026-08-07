'use client'

import { useState } from 'react'
import {
  Star,
  MoreHorizontal
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NotionHeaderProps {
  activeTabTitle?: string
  activeIcon?: LucideIcon
  onOrbClick?: () => void
}

export function NotionHeader({
  activeTabTitle = 'Central de Prospecção & Vendas',
  activeIcon: ActiveIcon = Star,
  onOrbClick
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
          {/* Gaby Orb — ativa a IA da Dashboard */}
          <button
            type="button"
            onClick={onOrbClick}
            className="relative mr-1 hidden sm:flex size-5 items-center justify-center cursor-pointer rounded-full border-0 bg-transparent p-0 transition-transform hover:scale-110"
            title="Ativar IA da Dashboard"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400/40" />
            <span
              className="relative inline-flex h-3.5 w-3.5 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.7)] ring-1 ring-white/30 dark:ring-white/20"
              style={{
                background: "radial-gradient(circle at 30% 30%, #ffe4e6 0%, #f43f5e 50%, #9f1239 100%)",
              }}
            />
          </button>

          <button
            onClick={() => setIsStarred(!isStarred)}
            className="flex h-7 w-7 items-center justify-center rounded-[4px] border-0 bg-transparent text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-[#252525] hover:text-amber-500 cursor-pointer transition-colors"
            title="Favoritar página"
          >
            <Star className={`h-3.5 w-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
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
