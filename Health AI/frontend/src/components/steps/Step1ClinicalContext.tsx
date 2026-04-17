'use client'

import * as React from 'react'
import {
  Stethoscope,
  Users,
  Target,
  HelpCircle,
  BookOpen,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { DOMAINS, getDomainById } from '@/lib/domains'
import { DomainSelector } from '@/components/layout/DomainSelector'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InfoCard, InfoRow } from '@/components/shared/InfoCard'
import { cn } from '@/lib/utils'

export function Step1ClinicalContext() {
  const { selectedDomainId, setCurrentStep } = useAppStore()
  const domain = selectedDomainId ? getDomainById(selectedDomainId) : null

  if (!domain) {
    return (
      <div className="step-container">
        <div className="text-center py-16">
          <Stethoscope className="mx-auto h-16 w-16 text-brand-teal/40 mb-6" />
          <h1 className="text-3xl font-bold text-brand-navy mb-3">
            HEALTH-AI · ML Learning Tool
          </h1>
          <p className="text-muted-foreground text-lg mb-2 max-w-xl mx-auto">
            An interactive learning platform for healthcare professionals to understand and build
            clinical machine learning models.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Erasmus+ KA220-HED · 20 Clinical Specialties · 6 ML Algorithms
          </p>

          <div className="flex flex-col items-center gap-4">
            <p className="text-sm font-medium text-foreground">
              Start by selecting a clinical specialty:
            </p>
            <DomainSelector />
          </div>

          {/* Domain preview grid */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {DOMAINS.map((d) => (
              <button
                key={d.id}
                onClick={() => useAppStore.getState().selectDomain(d.id)}
                className={cn(
                  'text-left rounded-lg border border-border-subtle bg-surface-card p-3',
                  'hover:border-brand-teal/40 hover:bg-brand-teal/5 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue'
                )}
              >
                <p className="text-xs font-semibold text-brand-navy leading-tight mb-1">
                  {d.label}
                </p>
                <p className="text-[11px] text-muted-foreground">{d.specialty}</p>
                <div className="mt-2 flex items-center gap-1">
                  <Badge
                    variant={d.taskType === 'binary' ? 'light' : 'info'}
                    size="sm"
                    className="text-[10px]"
                  >
                    {d.taskType}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">~{d.estimatedMinutes}m</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="step-container">
      {/* Step header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="teal" size="sm">Step 1</Badge>
          <span className="text-xs text-muted-foreground">Clinical Context</span>
        </div>
        <h1 className="step-heading">{domain.label}</h1>
        <p className="step-subheading">{domain.specialty}</p>
      </div>

      {/* Clinical question banner */}
      <Card className="mb-6 border-brand-navy/20 bg-brand-navy/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <HelpCircle className="h-5 w-5 text-brand-navy shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy/70 mb-1">
                Clinical Question
              </p>
              <p className="text-base font-medium text-brand-navy leading-snug">
                {domain.clinicalQuestion}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left: Why it matters + context */}
        <div className="space-y-4">
          <InfoCard
            title="Why This Matters Clinically"
            icon={<Target className="h-4 w-4" />}
            variant="clinical"
          >
            <p className="text-sm text-foreground leading-relaxed">
              {domain.whyItMatters}
            </p>
          </InfoCard>

          <InfoCard
            title="Clinical Context"
            icon={<BookOpen className="h-4 w-4" />}
          >
            <p className="text-sm text-foreground leading-relaxed">
              {domain.clinicalContextCopy}
            </p>
          </InfoCard>
        </div>

        {/* Right: Summary table */}
        <div className="space-y-4">
          <InfoCard title="Study Overview" icon={<Users className="h-4 w-4" />}>
            <div className="space-y-0">
              <InfoRow label="Patient Population" value={domain.patientPopulation} />
              <InfoRow label="Predicted Outcome" value={domain.predictedOutcome} />
              <InfoRow
                label="Task Type"
                value={
                  <Badge variant={domain.taskType === 'binary' ? 'light' : 'info'} size="sm">
                    {domain.taskType === 'binary' ? 'Binary Classification' : 'Multiclass Classification'}
                  </Badge>
                }
              />
              <InfoRow
                label="Outcome Classes"
                value={
                  <span className="text-right">
                    {domain.classLabels.map((label, i) => (
                      <span key={i} className="block text-xs">
                        Class {i}: {label}
                      </span>
                    ))}
                  </span>
                }
              />
              <InfoRow label="Data Source" value={domain.sampleDataSource} />
              <InfoRow
                label="Estimated Time"
                value={
                  <span className="flex items-center gap-1 justify-end">
                    <Clock className="h-3.5 w-3.5" />
                    ~{domain.estimatedMinutes} minutes
                  </span>
                }
              />
            </div>
          </InfoCard>

          {/* Suggested features preview */}
          <InfoCard title="Key Clinical Features" icon={<Stethoscope className="h-4 w-4" />}>
            <div className="flex flex-wrap gap-2">
              {domain.suggestedFeatures.map((feat) => (
                <Badge key={feat} variant="outline" size="sm">
                  {domain.featureLabels[feat] ?? feat}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {domain.suggestedFeatures.length} suggested features (you can customise in Step 2)
            </p>
          </InfoCard>
        </div>
      </div>

      {/* CTA to proceed */}
      <div className="flex justify-end">
        <Button
          variant="teal"
          size="lg"
          onClick={() => setCurrentStep(2)}
        >
          Explore the Data
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
