"use client"

import * as React from "react"
import { Separator as SeparatorPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-zinc-200/80 data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch dark:bg-zinc-800/80",
        className
      )}
      {...props} />
  );
}

export { Separator }
