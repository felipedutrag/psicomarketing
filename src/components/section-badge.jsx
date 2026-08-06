export function SectionBadge({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-wide text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-300">
      <Icon className="size-3.5 sm:size-4" strokeWidth={2} />
      {children}
    </span>
  );
}
