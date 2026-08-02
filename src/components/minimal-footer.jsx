import { MinimalLogo } from "@/components/minimal-logo";

export function MinimalFooter() {
  return (
    <footer className="mt-10 border-t border-zinc-200/80 bg-zinc-50/90 pt-6 pb-4 backdrop-blur-sm md:mt-14 md:pb-6 dark:border-zinc-800/80 dark:bg-zinc-950/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 md:px-8">
        {/* Centered Muted Logo */}
        <div className="flex justify-center">
          <MinimalLogo hideText muted />
        </div>
      </div>
    </footer>
  );
}
