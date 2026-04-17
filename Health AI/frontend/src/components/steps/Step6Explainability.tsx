'use client'

import * as React from 'react'
import { Eye, Loader2, ChevronRight, User, BarChart2 } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
  ReferenceLine,
} from 'recharts'
import { useAppStore } from '@/lib/store'
import { getDomainById } from '@/lib/domains'
import { explainPrediction } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Banner } from '@/components/shared/Banner'
import { formatPercent, getClassLabel } from '@/lib/utils'

export function Step6Explainability() {
  const {
    selectedDomainId,
    activeResults,
    processedDataset,
    selectedPatientIndex,
    explanationData,
    isExplaining,
    setSelectedPatientIndex,
    setExplanationData,
    setIsExplaining,
    preCheckItem,
    setCurrentStep,
  } = useAppStore()

  const domain = selectedDomainId ? getDomainById(selectedDomainId) : null

  async function handleExplain() {
    if (!activeResults || !processedDataset) return
    setIsExplaining(true)
    try {
      const data = await explainPrediction({
        processedDataset,
        trainResults: activeResults,
        patientIndex: selectedPatientIndex,
      })
      setExplanationData(data)
      preCheckItem('explanations')
    } catch (err) {
      console.error('Explanation failed:', err)
    } finally {
      setIsExplaining(false)
    }
  }

  const nTest = processedDataset?.nTest ?? 0
  const actualLabel =
    processedDataset && domain && explanationData !== null
      ? getClassLabel(domain, processedDataset.yTest[selectedPatientIndex] ?? 0)
      : null
  const predictedLabel =
    domain && explanationData !== null
      ? getClassLabel(domain, explanationData.prediction)
      : null
  const isCorrect =
    explanationData !== null &&
    processedDataset &&
    explanationData.prediction === processedDataset.yTest[selectedPatientIndex]

  if (!activeResults || !processedDataset) {
    return (
      <div className="step-container">
        <Banner
          variant="warning"
          title="No active model"
          message="Train and select a model in Step 4, then view results in Step 5 before using Explainability."
        />
      </div>
    )
  }

  // Feature importance chart (top 10), mapped to clinical labels
  const topFeatures = [...(activeResults.featureImportance || [])]
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10)
    .map((f) => ({
      feature: domain?.featureLabels?.[f.feature] || f.feature,
      importance: f.importance,
    }))

  const mappedContributions = explanationData
    ? explanationData.contributions.map((c) => ({
        ...c,
        label: domain?.featureLabels?.[c.feature] || c.feature,
      }))
    : []

  return (
    <div className="step-container">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="teal" size="sm">Step 6</Badge>
          <span className="text-xs text-muted-foreground">Explainability</span>
        </div>
        <h1 className="step-heading">Why Did the Model Predict That?</h1>
        <p className="step-subheading">
          Examine which features most influenced the model's prediction overall and for an individual patient.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Overall Feature Importance block (spans 2 columns on lg) */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                Overall Feature Importance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topFeatures.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Feature importance is not available for this model type.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={topFeatures}
                    layout="vertical"
                    margin={{ top: 5, right: 20, bottom: 5, left: 180 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      type="number"
                      domain={[0, 1]}
                      tickFormatter={(v) => v.toFixed(2)}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="feature"
                      tick={{ fontSize: 11 }}
                      width={175}
                    />
                    <RechartsTooltip
                      formatter={(value: number) => [value.toFixed(4), 'Importance']}
                    />
                    <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                      {topFeatures.map((_, i) => (
                        <Cell
                          key={i}
                          fill={i === 0 ? '#1B3A6B' : i < 3 ? '#2563EB' : '#0D9488'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          {domain?.clinicalSenseCheck && (
            <Banner
              variant="info"
              title="Clinical Sense Check"
              message={domain.clinicalSenseCheck}
              className="mt-4"
            />
          )}
        </div>

        {/* Patient selector */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Select Patient
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm mb-1">
                  <Label>Test Patient</Label>
                </div>
                <Select
                  value={selectedPatientIndex.toString()}
                  onValueChange={(val) => setSelectedPatientIndex(parseInt(val, 10))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a patient..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Patient A</SelectItem>
                    <SelectItem value={Math.floor(nTest / 2).toString()}>Patient B</SelectItem>
                    <SelectItem value={Math.max(0, nTest - 1).toString()}>Patient C</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select from representative test cases
                </p>
              </div>

              {processedDataset && domain && (
                <div className="rounded-lg bg-surface border border-border-subtle p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actual Outcome
                  </p>
                  <Badge variant={processedDataset.yTest[selectedPatientIndex] === 0 ? 'success' : 'warning'}>
                    {getClassLabel(domain, processedDataset.yTest[selectedPatientIndex] ?? 0)}
                  </Badge>
                </div>
              )}

              <Button
                variant="teal"
                className="w-full"
                onClick={handleExplain}
                loading={isExplaining}
                disabled={isExplaining}
              >
                <Eye className="h-4 w-4" />
                {isExplaining ? 'Explaining...' : 'Explain This Patient'}
              </Button>
            </CardContent>
          </Card>

          <Banner
            variant="warning"
            title="Important Clinical Reminder"
            message="These explanations show associations between measurements and outcomes in the training data — they do not prove causation. A clinician must always decide whether and how to act on any AI prediction."
          />
        </div>

        {/* Explanation */}
        <div className="lg:col-span-2 space-y-4">
          {!explanationData && !isExplaining && (
            <div className="flex items-center justify-center min-h-[200px] rounded-xl border border-dashed border-border-subtle bg-surface">
              <div className="text-center">
                <Eye className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select a patient and click "Explain This Patient" to see feature contributions.
                </p>
              </div>
            </div>
          )}

          {isExplaining && (
            <div className="flex items-center gap-3 p-8 rounded-xl border border-border-subtle bg-surface-card">
              <Loader2 className="h-5 w-5 animate-spin text-brand-teal" />
              <span className="text-sm text-muted-foreground">Generating explanation...</span>
            </div>
          )}

          {explanationData && !isExplaining && (
            <>
              {/* Prediction summary */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Model Prediction</p>
                      <Badge
                        variant={explanationData.prediction === 0 ? 'success' : 'warning'}
                        size="lg"
                      >
                        {predictedLabel}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                      <span className="text-2xl font-bold text-brand-navy">
                        {formatPercent(
                          Math.max(...explanationData.probability)
                        )}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Actual Outcome</p>
                      <Badge
                        variant={actualLabel === predictedLabel ? 'success' : 'destructive'}
                        size="lg"
                      >
                        {actualLabel}
                      </Badge>
                    </div>
                    <div>
                      <Badge
                        variant={isCorrect ? 'success' : 'destructive'}
                        size="md"
                      >
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Banner
                variant="info"
                title="What-if Analysis"
                message="The bars below show how much each feature shifted the base probability for this specific patient."
              />

              {/* Feature contributions waterfall */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Single-Patient Feature Contributions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-4">
                    Bars pointing right (positive) push the prediction toward the positive outcome.
                    Bars pointing left (negative) push toward the negative outcome (safe).
                  </p>
                  <ResponsiveContainer width="100%" height={Math.max(200, mappedContributions.length * 32)}>
                    <BarChart
                      data={mappedContributions}
                      layout="vertical"
                      margin={{ top: 5, right: 20, bottom: 5, left: 180 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        width={175}
                      />
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [
                          value.toFixed(4),
                          'Contribution',
                        ]}
                      />
                      <ReferenceLine x={0} stroke="#94a3b8" />
                      <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                        {mappedContributions.map((c, i) => (
                          <Cell
                            key={i}
                            fill={c.contribution >= 0 ? '#DC2626' : '#0D9488'} // positive is risk = red, negative is safe = green
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end mt-6">
        <Button variant="teal" size="lg" onClick={() => setCurrentStep(7)}>
          Ethics & Bias Review
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
