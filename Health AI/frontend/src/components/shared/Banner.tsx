'use client'

import * as React from 'react'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type BannerVariant = 'success' | 'error' | 'warning' | 'info' | 'danger'

export interface BannerProps {
  variant: BannerVariant
  title?: string
  message: string
  dismissible?: boolean
  icon?: boolean
  className?: string
  onDismiss?: () => void
}

const variantConfig: Record<
  BannerVariant,
  {
    container: string
    icon: React.ReactNode
    titleColor: string
    messageColor: string
  }
> = {
  success: {
    container: 'bg-clinical-success/10 border-clinical-success/30',
    icon: <CheckCircle2 className="h-5 w-5 text-clinical-success shrink-0 mt-0.5" />,
    titleColor: 'text-clinical-success',
    messageColor: 'text-clinical-success/90',
  },
  info: {
    container: 'bg-clinical-info/10 border-clinical-info/30',
    icon: <Info className="h-5 w-5 text-clinical-info shrink-0 mt-0.5" />,
    titleColor: 'text-clinical-info',
    messageColor: 'text-clinical-info/90',
  },
  warning: {
    container: 'bg-clinical-warning/10 border-clinical-warning/30',
    icon: <AlertTriangle className="h-5 w-5 text-clinical-warning shrink-0 mt-0.5" />,
    titleColor: 'text-clinical-warning',
    messageColor: 'text-clinical-warning/90',
  },
  error: {
    container: 'bg-clinical-danger/10 border-clinical-danger/30',
    icon: <XCircle className="h-5 w-5 text-clinical-danger shrink-0 mt-0.5" />,
    titleColor: 'text-clinical-danger',
    messageColor: 'text-clinical-danger/90',
  },
  danger: {
    container: 'bg-clinical-danger/10 border-clinical-danger/30',
    icon: <XCircle className="h-5 w-5 text-clinical-danger shrink-0 mt-0.5" />,
    titleColor: 'text-clinical-danger',
    messageColor: 'text-clinical-danger/90',
  },
}

export function Banner({
  variant,
  title,
  message,
  dismissible = false,
  icon = true,
  className,
  onDismiss,
}: BannerProps) {
  const [dismissed, setDismissed] = React.useState(false)

  if (dismissed) return null

  const config = variantConfig[variant]

  function handleDismiss() {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-lg border px-4 py-3',
        config.container,
        className
      )}
    >
      {icon && config.icon}

      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn('text-sm font-semibold leading-tight mb-0.5', config.titleColor)}>
            {title}
          </p>
        )}
        <p className={cn('text-sm leading-relaxed', config.messageColor)}>
          {message}
        </p>
      </div>

      {dismissible && (
        <button
          onClick={handleDismiss}
          className={cn(
            'shrink-0 mt-0.5 rounded-sm opacity-60 hover:opacity-100 transition-opacity',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            config.titleColor
          )}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
