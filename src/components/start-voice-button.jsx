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
      onClick={handleClick}
      className="group relative h-9 sm:h-12 rounded-full bg-indigo-600 px-4 sm:px-8 text-xs sm:text-base font-semibold text-white shadow-[0_8px_24px_-8px_rgba(79,70,229,0.5)] transition-all duration-300 hover:bg-indigo-700 hover:scale-[1.02] hover:shadow-[0_12px_32px_-8px_rgba(79,70,229,0.6)] active:scale-95"
    >
      <span className="relative flex items-center gap-1.5 sm:gap-2">
        {label}
        <ArrowRight className="size-3.5 sm:size-5 transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
    </Button>
  );
}