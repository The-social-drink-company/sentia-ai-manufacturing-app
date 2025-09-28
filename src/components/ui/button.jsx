import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 focus-visible:ring-cyan-300/60',
        default:
          'bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 focus-visible:ring-cyan-300/60',
        outline:
          'border border-white/20 bg-transparent text-white hover:bg-white/10 focus-visible:ring-white/30',
        ghost:
          'bg-white/10 text-white hover:bg-white/20 focus-visible:ring-cyan-300/30',
        secondary:
          'bg-white/12 text-slate-200 hover:bg-white/20 focus-visible:ring-white/30',
        destructive:
          'bg-red-600 text-white shadow hover:bg-red-500 focus-visible:ring-red-500/40',
        link:
          'text-cyan-300 underline-offset-4 hover:underline focus-visible:ring-0'
      },
      size: {
        default: 'h-10 px-5',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default'
    }
  }
)

const Button = forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
})

Button.displayName = 'Button'

export { Button, buttonVariants }
export default Button
