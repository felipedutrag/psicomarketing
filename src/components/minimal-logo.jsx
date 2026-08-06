export function MinimalLogo({ hideText = false, muted = false, tableHeader = false, subtle = false }) {
  return (
    <div className={`inline-flex items-center gap-1.5 ${muted ? "opacity-80" : ""}`}>
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
        <svg
          viewBox="0 0 24 24"
          className={`${muted ? "size-6 text-zinc-400 dark:text-zinc-500" : tableHeader ? "size-6 text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.5)]" : subtle ? "size-6 text-indigo-600 drop-shadow-[0_0_4px_rgba(99,102,241,0.3)] dark:text-zinc-400 dark:drop-shadow-none" : "size-6 text-indigo-600 drop-shadow-[0_0_6px_rgba(99,102,241,0.4)] dark:text-indigo-400 dark:drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]"}`}
          aria-hidden="true"
        >
          <path
            d="M12 4.5v15.5m-4.5-8c0 3.5 9 3.5 9 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {!hideText && (
        <span className={`font-logo text-sm sm:text-base font-medium tracking-tight leading-none ${subtle ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-900 dark:text-zinc-100"}`}>
          Psicomarketing
        </span>
      )}
    </div>
  );
}
