"use client";

import { Mic, Plug, Workflow, LayoutDashboard } from "lucide-react";

export function ProcessTimeline({ steps }) {
  const stepIcons = [Mic, Plug, Workflow, LayoutDashboard];

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-100/70 p-3 sm:p-5 md:p-6 lg:p-8 shadow-xs backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/50">
      {/* Mobile Vertical View */}
      <div className="relative flex md:hidden flex-col gap-4 sm:gap-5">
        {/* Connecting Vertical Line */}
        <div className="absolute top-5 sm:top-6 bottom-5 sm:bottom-6 left-4 sm:left-5 w-0.5 -translate-x-1/2 bg-gradient-to-b from-indigo-500/20 via-indigo-500/60 to-indigo-500/20" />

        {steps.map((stepText, idx) => {
          const Icon = stepIcons[idx % stepIcons.length];
          return (
            <div key={idx} className="relative z-10 flex items-start gap-3 sm:gap-4 group">
              {/* Step Node Circle (Left) */}
              <div className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-lg border-2 border-indigo-500/40 bg-white shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:shadow-md group-hover:shadow-indigo-500/30 dark:bg-zinc-950 dark:border-indigo-500/40">
                <Icon className="size-3.5 sm:size-4 text-indigo-600 transition-colors group-hover:text-white dark:text-indigo-400 dark:group-hover:text-white" />
              </div>

              {/* Step Content (Right of Icon) */}
              <div className="space-y-1 pt-0.5">
                <span className="inline-block rounded-full bg-indigo-500/10 px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                  Etapa 0{idx + 1}
                </span>

                <p className="text-[10px] sm:text-xs font-semibold text-zinc-900 leading-snug dark:text-zinc-200">
                  {stepText}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Horizontal View */}
      <div className="relative hidden md:flex flex-row items-stretch justify-between gap-4 sm:gap-6">
        {/* Connecting Horizontal Line aligned with icon centers */}
        <div className="absolute top-6 left-[10%] right-[10%] h-0.5 -translate-y-1/2 bg-gradient-to-r from-indigo-500/20 via-indigo-500/60 to-indigo-500/20" />

        {steps.map((stepText, idx) => {
          const Icon = stepIcons[idx % stepIcons.length];
          return (
            <div
              key={idx}
              className="relative z-10 flex flex-1 flex-col items-center text-center group"
            >
              {/* Step Node Circle */}
              <div className="flex size-10 sm:size-12 items-center justify-center rounded-lg border-2 border-indigo-500/40 bg-white shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:shadow-md group-hover:shadow-indigo-500/30 dark:bg-zinc-950 dark:border-indigo-500/40">
                <Icon className="size-4 sm:size-5 text-indigo-600 transition-colors group-hover:text-white dark:text-indigo-400 dark:group-hover:text-white" />
              </div>

              {/* Step Badge */}
              <span className="mt-2 sm:mt-3 inline-block rounded-full bg-indigo-500/10 px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                Etapa 0{idx + 1}
              </span>

              {/* Step Content */}
              <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium text-zinc-700 leading-relaxed dark:text-zinc-300 max-w-[180px] sm:max-w-[220px]">
                {stepText}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
