'use client'

import * as React from 'react'
import { ChevronDown, Stethoscope, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { DOMAINS } from '@/lib/domains'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Group domains by specialty area for organised display
const SPECIALTY_GROUPS: Record<string, string[]> = {
  'Cardiology & Vascular': ['cardiology', 'arrhythmia', 'stroke'],
  'Oncology': ['breast_cancer', 'cervical_cancer'],
  'Organ Systems': ['nephrology', 'liver', 'thyroid', 'ophthalmology'],
  'Neurology & Mental Health': ['parkinsons', 'mental_health'],
  'Respiratory & Critical Care': ['pulmonology', 'sepsis'],
  'Endocrinology & Metabolic': ['diabetes', 'readmission'],
  'Haematology': ['haematology', 'haematology_advanced'],
  'Obstetrics, Orthopaedics & Dermatology': ['fetal_health', 'orthopaedics', 'dermatology'],
}

export function DomainSelector() {
  const { selectedDomainId, columnMapping, selectDomain, resetAll, setCurrentStep } = useAppStore()
  const [open, setOpen] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [pendingDomainId, setPendingDomainId] = React.useState<string | null>(null)

  const currentDomain = DOMAINS.find((d) => d.id === selectedDomainId)
  const hasProgress = columnMapping !== null

  function handleSelect(domainId: string) {
    if (domainId === selectedDomainId) {
      setOpen(false)
      return
    }

    if (hasProgress) {
      setPendingDomainId(domainId)
      setOpen(false)
      setConfirmOpen(true)
    } else {
      selectDomain(domainId)
      resetAll()
      selectDomain(domainId)
      setCurrentStep(1)
      setOpen(false)
    }
  }

  function handleConfirmSwitch() {
    if (pendingDomainId) {
      resetAll()
      selectDomain(pendingDomainId)
      setCurrentStep(1)
    }
    setConfirmOpen(false)
    setPendingDomainId(null)
  }

  function handleCancelSwitch() {
    setConfirmOpen(false)
    setPendingDomainId(null)
  }

  const pendingDomain = DOMAINS.find((d) => d.id === pendingDomainId)

  return (
    <>
      {/* Trigger chip */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium',
          'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
          currentDomain
            ? 'border-brand-teal/30 bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20'
            : 'border-border-subtle bg-surface text-muted-foreground hover:bg-accent'
        )}
        aria-label="Select clinical specialty"
      >
        <Stethoscope className="h-3.5 w-3.5" />
        <span className="max-w-[140px] truncate sm:max-w-[200px]">
          {currentDomain ? currentDomain.label : 'Select Specialty'}
        </span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {/* Domain picker modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Clinical Specialty</DialogTitle>
            <DialogDescription>
              Choose a medical domain to explore. Each specialty uses a different dataset and
              clinical question.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-4 mt-2">
            {Object.entries(SPECIALTY_GROUPS).map(([group, ids]) => {
              const groupDomains = ids
                .map((id) => DOMAINS.find((d) => d.id === id))
                .filter(Boolean) as typeof DOMAINS

              if (groupDomains.length === 0) return null

              return (
                <div key={group}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                    {group}
                  </p>
                  <div className="space-y-1">
                    {groupDomains.map((domain) => (
                      <button
                        key={domain.id}
                        onClick={() => handleSelect(domain.id)}
                        className={cn(
                          'w-full text-left flex items-start gap-3 rounded-lg px-3 py-2.5',
                          'border transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue',
                          domain.id === selectedDomainId
                            ? 'border-brand-teal bg-brand-teal/5 text-brand-navy'
                            : 'border-transparent hover:border-border-subtle hover:bg-surface'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-brand-navy">
                              {domain.label}
                            </span>
                            {domain.id === selectedDomainId && (
                              <Badge variant="teal" size="sm">
                                Active
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {domain.clinicalQuestion}
                          </p>
                        </div>
                        <div className="text-right shrink-0 mt-0.5">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            ~{domain.estimatedMinutes} min
                          </span>
                          <Badge
                            variant={domain.taskType === 'binary' ? 'light' : 'info'}
                            size="sm"
                            className="ml-1"
                          >
                            {domain.taskType === 'binary' ? 'Binary' : 'Multiclass'}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm switch dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-clinical-warning" />
              Switch Specialty?
            </DialogTitle>
            <DialogDescription>
              Switching to{' '}
              <strong className="text-foreground">{pendingDomain?.label}</strong> will reset
              your current progress — including data settings, trained models, and results. This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancelSwitch}>
              Keep Current
            </Button>
            <Button variant="destructive" onClick={handleConfirmSwitch}>
              Switch & Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
