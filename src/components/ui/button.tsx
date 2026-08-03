import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[6px] text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs font-semibold',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 shadow-2xs font-semibold',
        outline:
          'border border-zinc-300 dark:border-[#333] bg-white dark:bg-[#202020] text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#282828]',
        secondary:
          'bg-zinc-200 dark:bg-[#252525] text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-[#2e2e2e]',
        ghost: 'bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-[#222222] dark:hover:text-zinc-200',
        link: 'text-indigo-600 dark:text-indigo-400 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-3.5 py-2',
        sm: 'h-8 rounded-[5px] px-3 text-xs',
        lg: 'h-10 rounded-[6px] px-6 text-sm',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
