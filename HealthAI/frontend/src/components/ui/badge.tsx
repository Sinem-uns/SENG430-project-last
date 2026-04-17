import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-brand-navy text-white hover:bg-brand-navy/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-clinical-danger text-white hover:bg-clinical-danger/90',
        outline:
          'border-border-subtle text-foreground bg-transparent',
        success:
          'border-transparent bg-clinical-success text-white hover:bg-clinical-success/90',
        warning:
          'border-transparent bg-clinical-warning text-white hover:bg-clinical-warning/90',
        info:
          'border-transparent bg-clinical-info text-white hover:bg-clinical-info/90',
        teal:
          'border-transparent bg-brand-teal text-white hover:bg-brand-teal/90',
        light:
          'border-border-subtle bg-brand-light text-brand-navy',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
