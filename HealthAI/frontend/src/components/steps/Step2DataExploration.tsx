'use client'

import * as React from 'react'
import {
  Database,
  Upload,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { getDomainById } from '@/lib/domains'
import { fetchDataset, uploadCSV } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Banner } from '@/components/shared/Banner'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn, toTitleCase } from '@/lib/utils'
import type { ColumnMapping, ColumnInfo } from '@/lib/types'

export function Step2DataExploration() {
  const {
    selectedDomainId,
    dataSource,
    rawData,
    columns,
    rowCount,
    columnMapping,
    isLoadingData,
    dataError,
    setDataSource,
    setRawData,
    setColumnMapping,
    setIsLoadingData,
    setDataError,
    setCurrentStep,
  } = useAppStore()

  const domain = selectedDomainId ? getDomainById(selectedDomainId) : null

  // Local column mapping state (committed on "Apply")
  const [localTarget, setLocalTarget] = React.useState<string>(
    columnMapping?.targetColumn ?? domain?.targetColumn ?? ''
  )
  const [localFeatures, setLocalFeatures] = React.useState<Set<string>>(
    new Set(columnMapping?.featureColumns ?? domain?.suggestedFeatures ?? [])
  )

  // Sync when domain changes or data loads
  React.useEffect(() => {
    if (domain && columns.length > 0) {
      setLocalTarget(columnMapping?.targetColumn ?? domain.targetColumn)
      setLocalFeatures(
        new Set(
          columnMapping?.featureColumns ??
            domain.suggestedFeatures.filter((f) => columns.some((c) => c.name === f))
        )
      )
    }
  }, [domain, columns.length])

  async function handleLoadBuiltIn() {
    if (!domain) return
    setIsLoadingData(true)
    setDataError(null)
    setDataSource('builtin')
    try {
      const result = await fetchDataset(domain.datasetId)
      setRawData(result.rows, result.columns, result.rowCount)
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Failed to load dataset.')
    } finally {
      setIsLoadingData(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsLoadingData(true)
    setDataError(null)
    setDataSource('upload')
    try {
      const result = await uploadCSV(file)
      setRawData(result.rows, result.columns, result.rowCount)
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'CSV upload failed.')
    } finally {
      setIsLoadingData(false)
      e.target.value = ''
    }
  }

  function toggleFeature(colName: string) {
    if (colName === localTarget) return
    setLocalFeatures((prev) => {
      const next = new Set(prev)
      if (next.has(colName)) next.delete(colName)
      else next.add(colName)
      return next
    })
  }

  function handleApplyMapping() {
    if (!localTarget || localFeatures.size < 2) return
    const excluded = columns
      .map((c) => c.name)
      .filter((n) => n !== localTarget && !localFeatures.has(n))
    const mapping: ColumnMapping = {
      targetColumn: localTarget,
      featureColumns: Array.from(localFeatures),
      excludedColumns: excluded,
    }
    setColumnMapping(mapping)
  }

  const canApply = localTarget !== '' && localFeatures.size >= 2

  if (!domain) {
    return (
      <div className="step-container">
        <Banner
          variant="warning"
          title="No specialty selected"
          message="Please select a clinical specialty in Step 1 before loading data."
        />
      </div>
    )
  }

  return (
    <div className="step-container">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="teal" size="sm">Step 2</Badge>
          <span className="text-xs text-muted-foreground">Data Exploration</span>
        </div>
        <h1 className="step-heading">Explore the Dataset</h1>
        <p className="step-subheading">
          Load clinical data, review column statistics, and select your features.
        </p>
      </div>

      {/* Data source selection */}
      {rawData.length === 0 && !isLoadingData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Choose Data Source</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="teal"
              className="flex-1"
              onClick={handleLoadBuiltIn}
              disabled={isLoadingData}
            >
              <Database className="h-4 w-4" />
              Load Built-in Dataset
            </Button>
            <div className="flex-1">
              <label className="w-full">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isLoadingData}
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4" />
                    Upload Your CSV
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={handleFileUpload}
                  disabled={isLoadingData}
                />
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoadingData && (
        <div className="flex items-center gap-3 p-6 rounded-xl border border-border-subtle bg-surface-card">
          <Loader2 className="h-5 w-5 animate-spin text-brand-teal" />
          <span className="text-sm text-muted-foreground">Loading dataset...</span>
        </div>
      )}

      {/* Error state */}
      {dataError && (
        <Banner
          variant="error"
          title="Data Loading Error"
          message={dataError}
          dismissible
          className="mb-4"
        />
      )}

      {/* Dataset loaded */}
      {rawData.length > 0 && !isLoadingData && (
        <>
          {/* Dataset summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Rows', value: rowCount.toLocaleString() },
              { label: 'Columns', value: columns.length.toString() },
              {
                label: 'Missing Values',
                value: `${columns.filter((c) => c.missingCount > 0).length} cols`,
              },
              {
                label: 'Source',
                value: dataSource === 'builtin' ? 'Built-in' : 'Uploaded',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border-subtle bg-surface-card p-3 text-center"
              >
                <p className="text-2xl font-bold text-brand-navy">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Column browser + mapping */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column list */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart2 className="h-4 w-4" />
                    Column Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border-subtle bg-surface">
                          <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Column
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Missing
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Unique
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Role
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {columns.map((col) => {
                          const isTarget = col.name === localTarget
                          const isFeature = localFeatures.has(col.name)
                          const clinicalLabel = domain.featureLabels[col.name] ?? col.name

                          return (
                            <tr
                              key={col.name}
                              className={cn(
                                'border-b border-border-subtle',
                                isTarget && 'bg-brand-teal/5',
                                isFeature && !isTarget && 'bg-brand-light/50'
                              )}
                            >
                              <td className="px-4 py-2">
                                <div>
                                  <p className="font-medium text-brand-navy text-xs">
                                    {clinicalLabel}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground font-mono">
                                    {col.name}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <Badge
                                  variant={col.dtype === 'numeric' ? 'light' : 'secondary'}
                                  size="sm"
                                >
                                  {col.dtype}
                                </Badge>
                              </td>
                              <td className="px-4 py-2">
                                <span
                                  className={cn(
                                    'text-xs',
                                    col.missingPct > 10
                                      ? 'text-clinical-warning font-medium'
                                      : 'text-muted-foreground'
                                  )}
                                >
                                  {col.missingCount > 0
                                    ? `${col.missingCount} (${col.missingPct.toFixed(1)}%)`
                                    : '—'}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-xs text-muted-foreground">
                                {col.uniqueCount}
                              </td>
                              <td className="px-4 py-2">
                                {isTarget ? (
                                  <Badge variant="teal" size="sm">Target</Badge>
                                ) : isFeature ? (
                                  <Badge variant="success" size="sm">Feature</Badge>
                                ) : (
                                  <Badge variant="outline" size="sm">Excluded</Badge>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Column mapping panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Column Mapping</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Target column */}
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                      Target (Outcome) Column
                    </Label>
                    <div className="space-y-1">
                      {columns.map((col) => (
                        <button
                          key={col.name}
                          onClick={() => {
                            setLocalTarget(col.name)
                            setLocalFeatures((prev) => {
                              const next = new Set(prev)
                              next.delete(col.name)
                              return next
                            })
                          }}
                          className={cn(
                            'w-full text-left text-xs px-3 py-2 rounded-md border transition-colors',
                            col.name === localTarget
                              ? 'border-brand-teal bg-brand-teal/10 text-brand-teal font-medium'
                              : 'border-transparent hover:border-border-subtle hover:bg-surface'
                          )}
                        >
                          {domain.featureLabels[col.name] ?? col.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Feature columns */}
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                      Feature Columns ({localFeatures.size} selected)
                    </Label>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {columns
                        .filter((c) => c.name !== localTarget)
                        .map((col) => (
                          <div key={col.name} className="flex items-center gap-2">
                            <Checkbox
                              id={`feat-${col.name}`}
                              checked={localFeatures.has(col.name)}
                              onCheckedChange={() => toggleFeature(col.name)}
                            />
                            <label
                              htmlFor={`feat-${col.name}`}
                              className="text-xs text-foreground cursor-pointer leading-tight flex-1"
                            >
                              {domain.featureLabels[col.name] ?? col.name}
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>

                  {localFeatures.size < 2 && (
                    <Banner
                      variant="warning"
                      message="Select at least 2 feature columns."
                      icon={false}
                    />
                  )}

                  <Button
                    variant="teal"
                    className="w-full"
                    onClick={handleApplyMapping}
                    disabled={!canApply}
                  >
                    {columnMapping ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Update Mapping
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4" />
                        Apply & Continue
                      </>
                    )}
                  </Button>

                  {columnMapping && (
                    <div className="flex items-center gap-2 text-xs text-clinical-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mapping applied — Step 3 unlocked
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reload option */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setDataSource(null)
                  setRawData([], [], 0)
                  setDataError(null)
                }}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Load Different Data
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
