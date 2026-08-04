"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const START_VOICE_EVENT = "psicomarketing:start-voice";

export function StartVoiceButton({ label }) {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(START_VOICE_EVENT));
    }
  };

  return (
    <Button
      asChild
      size="sm"
      className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md px-2.5 text-xs sm:px-3 sm:text-sm sm:h-8"
    >
      <Link href="#live-demo" onClick={handleClick}>
        {label} <ArrowRight className="size-3.5 sm:size-4" />
      </Link>
    </Button>
  );
}