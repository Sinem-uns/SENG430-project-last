import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export interface InfoCardProps {
  title?: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
  variant?: 'default' | 'clinical' | 'highlight'
}

export function InfoCard({
  title,
  icon,
  children,
  className,
  headerClassName,
  contentClassName,
  variant = 'default',
}: InfoCardProps) {
  return (
    <Card
      className={cn(
        variant === 'clinical' && 'border-brand-teal/30 bg-brand-teal/5',
        variant === 'highlight' && 'border-brand-blue/30 bg-brand-light',
        className
      )}
    >
      {(title || icon) && (
        <CardHeader className={cn('pb-3', headerClassName)}>
          <CardTitle className="flex items-center gap-2 text-base">
            {icon && (
              <span
                className={cn(
                  'flex items-center justify-center',
                  variant === 'clinical' && 'text-brand-teal',
                  variant === 'highlight' && 'text-brand-blue',
                  variant === 'default' && 'text-brand-navy'
                )}
              >
                {icon}
              </span>
            )}
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(title || icon ? '' : 'pt-6', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}

// Convenience variant: a simple info table row
export interface InfoRowProps {
  label: string
  value: React.ReactNode
  labelClassName?: string
  valueClassName?: string
}

export function InfoRow({ label, value, labelClassName, valueClassName }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border-subtle last:border-0">
      <span className={cn('text-sm text-muted-foreground min-w-0 shrink-0 font-medium', labelClassName)}>
        {label}
      </span>
      <span className={cn('text-sm text-foreground text-right min-w-0', valueClassName)}>
        {value}
      </span>
    </div>
  )
}
