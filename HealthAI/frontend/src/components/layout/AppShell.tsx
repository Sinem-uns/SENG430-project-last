'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Navbar } from './Navbar'
import { Stepper } from './Stepper'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Lazy-load step components to keep initial bundle small
const StepComponents = {
  1: React.lazy(() => import('@/components/steps/Step1ClinicalContext').then(m => ({ default: m.Step1ClinicalContext }))),
  2: React.lazy(() => import('@/components/steps/Step2DataExploration').then(m => ({ default: m.Step2DataExploration }))),
  3: React.lazy(() => import('@/components/steps/Step3DataPrep').then(m => ({ default: m.Step3DataPrep }))),
  4: React.lazy(() => import('@/components/steps/Step4ModelTraining').then(m => ({ default: m.Step4ModelTraining }))),
  5: React.lazy(() => import('@/components/steps/Step5Results').then(m => ({ default: m.Step5Results }))),
  6: React.lazy(() => import('@/components/steps/Step6Explainability').then(m => ({ default: m.Step6Explainability }))),
  7: React.lazy(() => import('@/components/steps/Step7Ethics').then(m => ({ default: m.Step7Ethics }))),
} as const

type StepNumber = keyof typeof StepComponents

const STEP_LABELS: Record<StepNumber, string> = {
  1: 'Clinical Context',
  2: 'Data Exploration',
  3: 'Data Preparation',
  4: 'Model & Training',
  5: 'Results',
  6: 'Explainability',
  7: 'Ethics & Bias',
}

function StepLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <svg
          className="animate-spin h-8 w-8 text-brand-teal"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm">Loading step...</span>
      </div>
    </div>
  )
}

function LockedStepPlaceholder({ stepNumber }: { stepNumber: number }) {
  const stepLabel = STEP_LABELS[stepNumber as StepNumber] ?? `Step ${stepNumber}`

  const lockMessages: Record<number, string> = {
    3: 'Complete Data Exploration (Step 2) and select your target and feature columns to unlock Data Preparation.',
    4: 'Complete Data Preparation (Step 3) to unlock Model & Training.',
    5: 'Train at least one model in Step 4 to unlock Results.',
    6: 'View results in Step 5 and select an active model to unlock Explainability.',
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-sm px-6">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface border-2 border-border-subtle">
          <Lock className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-brand-navy mb-2">
          {stepLabel} Locked
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {lockMessages[stepNumber] ??
            'Complete the previous steps to unlock this section.'}
        </p>
      </div>
    </div>
  )
}

export function AppShell() {
  const { currentStep, unlockedSteps, setCurrentStep } = useAppStore()
  const unlockedSet = new Set(unlockedSteps)

  const isUnlocked = (step: number) => unlockedSet.has(step)

  function handlePrev() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  function handleNext() {
    const nextStep = currentStep + 1
    if (nextStep <= 7 && isUnlocked(nextStep)) {
      setCurrentStep(nextStep)
    }
  }

  const canGoPrev = currentStep > 1
  const canGoNext = currentStep < 7 && isUnlocked(currentStep + 1)

  const ActiveStep = StepComponents[currentStep as StepNumber]

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Stepper */}
      <Stepper />

      {/* Main content area */}
      <main className="flex-1" id="main-content">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pb-24">
          <React.Suspense fallback={<StepLoadingFallback />}>
            {isUnlocked(currentStep) ? (
              <div
                key={currentStep}
                className="animate-fade-in"
              >
                <ActiveStep />
              </div>
            ) : (
              <LockedStepPlaceholder stepNumber={currentStep} />
            )}
          </React.Suspense>
        </div>
      </main>

      {/* Bottom navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-subtle bg-surface-card/95 backdrop-blur supports-[backdrop-filter]:bg-surface-card/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Previous */}
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={!canGoPrev}
              className={cn(!canGoPrev && 'invisible')}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            {/* Step indicator */}
            <div className="text-center">
              <span className="text-xs text-muted-foreground">
                Step {currentStep} of 7
              </span>
              <p className="text-sm font-medium text-brand-navy hidden sm:block">
                {STEP_LABELS[currentStep as StepNumber]}
              </p>
            </div>

            {/* Next */}
            {currentStep < 7 ? (
              <Button
                variant={canGoNext ? 'teal' : 'outline'}
                onClick={handleNext}
                disabled={!canGoNext}
                className={cn(!canGoNext && 'opacity-50')}
                title={!canGoNext ? 'Complete this step to continue' : undefined}
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="w-[88px]" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
