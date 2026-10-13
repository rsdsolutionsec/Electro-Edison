import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-slate-800 border border-slate-200',
        primary: 'bg-blue-50 text-blue-700 border border-blue-200',
        success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        warning: 'bg-amber-50 text-amber-800 border border-amber-200',
        danger: 'bg-rose-50 text-rose-700 border border-rose-200',
        purple: 'bg-purple-50 text-purple-700 border border-purple-200',
        cyan: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
