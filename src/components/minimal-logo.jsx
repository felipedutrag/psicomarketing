export function MinimalLogo({ hideText = false, muted = false, tableHeader = false, subtle = false, prominent = false }) {
  const iconSvg = (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Psi (Ψ): cap bar + stem + lateral prongs */}
      <path d="M4.6 8.5h14.8" />
      <path d="M12 8.5v11" />
      <path d="M12 19.5c-1.9-4.4-4.8-8.3-7.4-11" />
      <path d="M12 19.5c1.9-4.4 4.8-8.3 7.4-11" />
      {/* Growth arrow rising from the psi */}
      <path d="M12 8.5V4.4" />
      <path d="M9.5 6.7 12 4.2l2.5 2.5" />
    </svg>
  );

  return (
    <div className={`inline-flex items-center gap-1.5 ${muted ? "opacity-80" : ""}`}>
      {prominent ? (
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-indigo-500/40 bg-indigo-500/10 dark:border-zinc-600/40 dark:bg-zinc-950">
            <div className="size-8 text-indigo-600 transition-all duration-700 dark:text-zinc-400">
              {iconSvg}
            </div>
          </div>
          <div className="flex flex-col justify-center leading-none">
            <span className="font-logo -mt-1.5 text-base sm:text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Psicomarketing
            </span>
            <span className="-mt-0.5 font-serif italic text-[10px] sm:text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Marketing para Psicólogos
            </span>
          </div>
        </div>
      ) : (
        <div
          className={`relative grid place-items-center rounded-lg border shadow-xs transition-all duration-700 ${tableHeader
              ? "size-9 animate-gradient-shift"
              : subtle
                ? "size-8 border-indigo-400/60 bg-white/95 shadow-[0_0_12px_2px_rgba(99,102,241,0.15)] dark:border-zinc-700/40 dark:bg-zinc-950/90 dark:shadow-none"
                : muted
                  ? "size-8 border-zinc-300/70 bg-transparent dark:border-zinc-700"
                  : "size-9 border-indigo-300/60 bg-white ring-1 ring-indigo-400/20 shadow-[0_0_8px_1px_rgba(99,102,241,0.1)] dark:border-indigo-500/40 dark:bg-zinc-950 dark:ring-indigo-500/20 dark:shadow-[0_0_10px_2px_rgba(99,102,241,0.12)]"
            }`}
          style={tableHeader ? {
            background: "linear-gradient(-45deg, #312e81, #164e63, #065f46, #78350f, #7f1d1d, #312e81)",
            backgroundSize: "400% 400%"
          } : undefined}
        >
          <div className={muted
            ? "size-6 text-zinc-400 dark:text-zinc-500"
            : tableHeader
              ? "size-6 text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.5)]"
              : subtle
                ? "size-6 text-indigo-600 drop-shadow-[0_0_4px_rgba(99,102,241,0.3)] dark:text-zinc-400 dark:drop-shadow-none"
                : "size-6 text-indigo-600 drop-shadow-[0_0_6px_rgba(99,102,241,0.4)] dark:text-indigo-400 dark:drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]"
          }>
            {iconSvg}
          </div>
        </div>
      )}
      {!hideText && !prominent && (
        <span className="font-logo text-sm sm:text-base font-semibold tracking-tight leading-none">
          <span className={muted ? "text-zinc-500 dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-100"}>
            Psico
          </span>
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-fuchsia-400">
            marketing
          </span>
        </span>
      )}
    </div>
  );
}
