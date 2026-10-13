import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:bg-blue-800',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300',
        outline: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100',
        destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm active:bg-rose-800',
        ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm active:bg-emerald-800',
        amber: 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm active:bg-amber-800',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-lg px-6 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
