"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const START_VOICE_EVENT = "psicomarketing:start-voice";

export function StartVoiceButton({ label }) {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;
      const targetId = isDesktop ? "live-demo-desktop" : "live-demo-mobile";
      document
        .getElementById(targetId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.dispatchEvent(new Event(START_VOICE_EVENT));
    }
  };

  return (
    <Button
      size="sm"
      onClick={handleClick}
      className="group relative h-9 sm:h-10 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-3.5 sm:px-5 text-xs sm:text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(139,92,246,0.7)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_14px_40px_-8px_rgba(139,92,246,0.9)] hover:brightness-110 active:scale-95"
    >
      <span className="relative flex items-center gap-2">
        {label}
        <ArrowRight className="size-3.5 sm:size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
    </Button>
  );
}