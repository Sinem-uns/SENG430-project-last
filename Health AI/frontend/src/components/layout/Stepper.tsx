'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface Step {
  number: number
  label: string
  shortLabel: string
}

const STEPS: Step[] = [
  { number: 1, label: 'Clinical Context', shortLabel: 'Context' },
  { number: 2, label: 'Data Exploration', shortLabel: 'Data' },
  { number: 3, label: 'Data Preparation', shortLabel: 'Prep' },
  { number: 4, label: 'Model & Training', shortLabel: 'Train' },
  { number: 5, label: 'Results', shortLabel: 'Results' },
  { number: 6, label: 'Explainability', shortLabel: 'Explain' },
  { number: 7, label: 'Ethics & Bias', shortLabel: 'Ethics' },
]

export function Stepper() {
  const { currentStep, unlockedSteps, setCurrentStep } = useAppStore()
  const unlockedSet = new Set(unlockedSteps)

  function getStepStatus(stepNumber: number): 'done' | 'active' | 'locked' {
    if (stepNumber === currentStep) return 'active'
    if (stepNumber < currentStep) return 'done'
    return 'locked'
  }

  function isClickable(stepNumber: number): boolean {
    return unlockedSet.has(stepNumber)
  }

  function handleStepClick(stepNumber: number) {
    if (isClickable(stepNumber)) {
      setCurrentStep(stepNumber)
    }
  }

  return (
    <div
      className="sticky top-16 z-40 w-full bg-surface-card border-b border-border-subtle shadow-sm"
      role="navigation"
      aria-label="Progress steps"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Desktop stepper */}
        <div className="hidden md:flex items-center py-3">
          {STEPS.map((step, index) => {
            const status = getStepStatus(step.number)
            const clickable = isClickable(step.number)
            const isLast = index === STEPS.length - 1

            return (
              <React.Fragment key={step.number}>
                {/* Step node */}
                <button
                  onClick={() => handleStepClick(step.number)}
                  disabled={!clickable}
                  className={cn(
                    'flex flex-col items-center group relative',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-lg px-2 py-1',
                    clickable ? 'cursor-pointer' : 'cursor-not-allowed'
                  )}
                  aria-label={`Step ${step.number}: ${step.label}${!clickable ? ' (locked)' : ''}`}
                  aria-current={status === 'active' ? 'step' : undefined}
                >
                  {/* Circle */}
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200',
                      status === 'done' && 'border-brand-teal bg-brand-teal text-white',
                      status === 'active' &&
                        'border-brand-navy bg-brand-navy text-white ring-4 ring-brand-light scale-110',
                      status === 'locked' && 'border-border-subtle bg-surface text-muted-foreground',
                      clickable &&
                        status !== 'active' &&
                        'group-hover:border-brand-blue group-hover:text-brand-blue'
                    )}
                  >
                    {status === 'done' ? (
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    ) : (
                      <span>{step.number}</span>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      'mt-1 text-[11px] font-medium whitespace-nowrap transition-colors',
                      status === 'active' && 'text-brand-navy',
                      status === 'done' && 'text-brand-teal',
                      status === 'locked' && 'text-muted-foreground',
                      clickable &&
                        status !== 'active' &&
                        'group-hover:text-brand-blue'
                    )}
                  >
                    {step.label}
                  </span>
                </button>

                {/* Connector line */}
                {!isLast && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-1 mt-[-12px] transition-colors duration-300',
                      step.number < currentStep
                        ? 'bg-brand-teal'
                        : 'bg-border-subtle'
                    )}
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Mobile stepper — compact horizontal scroll */}
        <div className="md:hidden flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
          {STEPS.map((step) => {
            const status = getStepStatus(step.number)
            const clickable = isClickable(step.number)

            return (
              <button
                key={step.number}
                onClick={() => handleStepClick(step.number)}
                disabled={!clickable}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
                  status === 'active' &&
                    'bg-brand-navy text-white',
                  status === 'done' &&
                    'bg-brand-teal/15 text-brand-teal',
                  status === 'locked' &&
                    'bg-surface text-muted-foreground opacity-60',
                  clickable &&
                    status === 'locked' &&
                    'opacity-80 hover:opacity-100'
                )}
                aria-current={status === 'active' ? 'step' : undefined}
              >
                {status === 'done' ? (
                  <Check className="h-3 w-3 shrink-0" strokeWidth={3} />
                ) : (
                  <span className="w-4 h-4 flex items-center justify-center rounded-full border border-current text-[10px] shrink-0">
                    {step.number}
                  </span>
                )}
                <span>{step.shortLabel}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
