export function MinimalLogo() {
  return (
    <div className="inline-flex items-center gap-3.5">
      <div className="relative grid size-12 place-items-center rounded-lg border border-zinc-300 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
        <svg
          viewBox="0 0 24 24"
          className="size-7 text-zinc-900 dark:text-zinc-100"
          aria-hidden="true"
        >
          <path
            d="M12 4.5v13m-4.5-8c0 3.5 9 3.5 9 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="17.5" r="1.6" className="fill-indigo-600 text-indigo-600 dark:fill-indigo-400 dark:text-indigo-400" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <p className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Psicomarketing
          </p>
          <span className="size-1.5 rounded-full bg-indigo-500" />
        </div>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">IA para psicólogos</p>
      </div>
    </div>
  );
}
