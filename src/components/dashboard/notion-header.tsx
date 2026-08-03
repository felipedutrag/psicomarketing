'use client'

import { useState } from 'react'
import {
  Star,
  Share2,
  MoreHorizontal,
  Tag,
  Zap,
  UserCheck,
  ImageIcon,
  Clock
} from 'lucide-react'

interface NotionHeaderProps {
  activeTabTitle?: string
  activeEmoji?: string
}

export function NotionHeader({
  activeTabTitle = 'Central de Prospecção & Vendas',
  activeEmoji = '🎯'
}: NotionHeaderProps) {
  const [isStarred, setIsStarred] = useState(true)
  const [coverPreset, setCoverPreset] = useState<'gradient' | 'minimal' | 'dark'>('gradient')

  const coverStyles = {
    gradient: 'bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 dark:from-indigo-950 dark:via-purple-950 dark:to-zinc-950',
    minimal: 'bg-gradient-to-r from-slate-200 via-zinc-200 to-neutral-200 dark:from-zinc-800 dark:via-zinc-900 dark:to-neutral-900',
    dark: 'bg-gradient-to-r from-amber-950/40 via-zinc-900 to-indigo-950/40'
  }

  return (
    <div className="w-full">
      {/* Notion Top Navigation Breadcrumb Bar */}
      <header className="flex h-11 items-center justify-between border-b border-zinc-200/70 bg-[#fbfbfa]/90 px-4 sm:px-12 backdrop-blur-sm dark:bg-[#181818]/90 dark:border-[#252525]">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">Psicomarketing OS</span>
          <span>/</span>
          <span className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
            <span>{activeEmoji}</span>
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
      <div className={`relative h-28 sm:h-36 w-full transition-all duration-500 ${coverStyles[coverPreset]}`}>
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] dark:bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
        
        {/* Cover Action Button */}
        <div className="absolute bottom-2 right-4 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
          <button
            onClick={() => setCoverPreset(coverPreset === 'gradient' ? 'minimal' : coverPreset === 'minimal' ? 'dark' : 'gradient')}
            className="flex items-center gap-1.5 rounded-[4px] border border-white/20 bg-black/40 px-2 py-1 text-[10px] text-white backdrop-blur-md hover:bg-black/60 cursor-pointer"
          >
            <ImageIcon className="h-3 w-3" />
            Alterar Capa
          </button>
        </div>
      </div>

      {/* Notion Page Header Main Area - Aligned 100% to Content Max-W-7XL */}
      <div className="relative border-b border-zinc-200/60 dark:border-[#242424]">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-12 pb-6">
          {/* Emoji Selector Icon */}
          <div className="-mt-8 sm:-mt-10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-xs border border-zinc-200/80 dark:bg-[#1f1f1f] dark:border-[#2a2a2a] cursor-pointer hover:scale-105 transition-transform">
            {activeEmoji}
          </div>

          {/* Page Title */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {activeTabTitle}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-3xl leading-relaxed">
              Workspace central de captura, tratamento com Inteligência Artificial e automação de disparos para psicólogos e clínicas.
            </p>
          </div>

          {/* Notion Database / Page Property Chips */}
          <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-200/60 dark:border-[#242424]">
            <div className="flex items-center gap-1.5 rounded-[4px] bg-zinc-100 dark:bg-[#1f1f1f] px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-[#282828]">
              <Tag className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-zinc-500 dark:text-zinc-400">Status:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Ativo ⚡</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-[4px] bg-zinc-100 dark:bg-[#1f1f1f] px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-[#282828]">
              <Zap className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-zinc-500 dark:text-zinc-400">Engine:</span>
              <span className="font-medium">Google Maps + IA Fallback</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-[4px] bg-zinc-100 dark:bg-[#1f1f1f] px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-[#282828]">
              <UserCheck className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-zinc-500 dark:text-zinc-400">Operador:</span>
              <span className="font-medium">Cadelo & Lilith IA</span>
            </div>

            <div className="flex items-center gap-1.5 rounded-[4px] bg-zinc-100 dark:bg-[#1f1f1f] px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-[#282828]">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-zinc-500 dark:text-zinc-400">Atualizado:</span>
              <span className="font-medium">Hoje</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
