import { MinimalLogo } from "@/components/minimal-logo";

export function MinimalFooter() {
  return (
    <footer className="mt-4 sm:mt-6 md:mt-8 border-t border-zinc-200/80 bg-zinc-50/90 pt-4 sm:pt-6 pb-3 sm:pb-4 md:pb-6 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:gap-5 px-3 sm:px-4 md:px-8">
        {/* Centered Logo */}
        <div className="flex justify-center">
          <MinimalLogo hideText subtle />
        </div>
      </div>
    </footer>
  );
}
