'use client'

import * as React from 'react'
import { Info } from 'lucide-react'
import { formatPercent } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

export interface MetricCardProps {
  label: string
  value: number
  description: string
  concern: string
  status: 'good' | 'warning' | 'danger'
  emphasized?: boolean
  className?: string
}

const statusConfig = {
  good: {
    dot: 'bg-clinical-success',
    value: 'text-clinical-success',
    ring: 'ring-clinical-success/20',
    badge: 'bg-clinical-success/10 text-clinical-success',
    badgeLabel: 'Good',
  },
  warning: {
    dot: 'bg-clinical-warning',
    value: 'text-clinical-warning',
    ring: 'ring-clinical-warning/20',
    badge: 'bg-clinical-warning/10 text-clinical-warning',
    badgeLabel: 'Review',
  },
  danger: {
    dot: 'bg-clinical-danger',
    value: 'text-clinical-danger',
    ring: 'ring-clinical-danger/20',
    badge: 'bg-clinical-danger/10 text-clinical-danger',
    badgeLabel: 'Concern',
  },
}

export function MetricCard({
  label,
  value,
  description,
  concern,
  status,
  emphasized = false,
  className,
}: MetricCardProps) {
  const config = statusConfig[status]

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'rounded-xl border bg-surface-card p-4 transition-shadow hover:shadow-md',
          emphasized && `ring-2 ${config.ring}`,
          emphasized ? 'border-border-subtle' : 'border-border-subtle',
          className
        )}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* Status dot */}
            <span
              className={cn('status-dot shrink-0', config.dot)}
              aria-hidden="true"
            />
            <span className="text-sm font-medium text-foreground leading-tight">
              {label}
            </span>
            {emphasized && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-teal">
                Key
              </span>
            )}
          </div>

          {/* Info tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded"
                aria-label={`About ${label}`}
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px]">
              <p className="font-medium mb-1">{label}</p>
              <p className="opacity-90">{description}</p>
              <p className="mt-1 text-clinical-warning/90">{concern}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Metric value */}
        <div className="flex items-end justify-between gap-2">
          <span
            className={cn(
              'tabular-nums font-bold leading-none',
              emphasized ? 'text-4xl' : 'text-3xl',
              config.value
            )}
          >
            {formatPercent(value)}
          </span>

          {/* Status badge */}
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              config.badge
            )}
          >
            {config.badgeLabel}
          </span>
        </div>

        {/* Description (truncated, expandable via tooltip) */}
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>
    </TooltipProvider>
  )
}
