'use client'

import * as React from 'react'
import { Settings2, Loader2, CheckCircle2, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { getDomainById } from '@/lib/domains'
import { preprocessData } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Banner } from '@/components/shared/Banner'
import { Separator } from '@/components/ui/separator'
import { formatPercent } from '@/lib/utils'

export function Step3DataPrep() {
  const {
    selectedDomainId,
    columnMapping,
    rawData: storeRawData,
    rowCount,
    prepSettings,
    processedDataset,
    isPreparing,
    prepError,
    setPrepSettings,
    setProcessedDataset,
    setIsPreparing,
    setPrepError,
    setCurrentStep,
  } = useAppStore()

  const domain = selectedDomainId ? getDomainById(selectedDomainId) : null

  async function handleRunPreprocessing() {
    if (!domain || !columnMapping) return
    setIsPreparing(true)
    setPrepError(null)
    try {
      const result = await preprocessData({
        rawData: storeRawData,
        columnMapping,
        prepSettings,
        taskType: domain.taskType,
      })
      setProcessedDataset(result)
    } catch (err) {
      setPrepError(err instanceof Error ? err.message : 'Preprocessing failed.')
    } finally {
      setIsPreparing(false)
    }
  }

  const trainCount = processedDataset
    ? processedDataset.nTrain
    : Math.round(rowCount * (1 - prepSettings.testSize))
  const testCount = processedDataset
    ? processedDataset.nTest
    : Math.round(rowCount * prepSettings.testSize)

  return (
    <div className="step-container">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="teal" size="sm">Step 3</Badge>
          <span className="text-xs text-muted-foreground">Data Preparation</span>
        </div>
        <h1 className="step-heading">Prepare the Data</h1>
        <p className="step-subheading">
          Configure how missing values are handled, how features are scaled, and the train/test split.
        </p>
      </div>

      {!columnMapping && (
        <Banner
          variant="warning"
          title="Column mapping required"
          message="Return to Step 2 to select your target and feature columns before preprocessing."
        />
      )}

      {columnMapping && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings panel */}
          <div className="space-y-6">
            {/* Train/test split */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Train / Test Split
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Test set size</span>
                  <span className="font-semibold text-brand-navy">
                    {formatPercent(prepSettings.testSize)}
                  </span>
                </div>
                <Slider
                  min={10}
                  max={40}
                  step={5}
                  value={[Math.round(prepSettings.testSize * 100)]}
                  onValueChange={([v]) => setPrepSettings({ testSize: v / 100 })}
                />
                <div className="grid grid-cols-2 gap-3 text-center text-sm">
                  <div className="rounded-lg bg-brand-navy/5 p-3">
                    <p className="text-xl font-bold text-brand-navy">
                      {formatPercent(1 - prepSettings.testSize)}
                    </p>
                    <p className="text-xs text-muted-foreground">Training ({trainCount} rows)</p>
                  </div>
                  <div className="rounded-lg bg-brand-blue/5 p-3">
                    <p className="text-xl font-bold text-brand-blue">
                      {formatPercent(prepSettings.testSize)}
                    </p>
                    <p className="text-xs text-muted-foreground">Testing ({testCount} rows)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Missing values */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Missing Value Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={prepSettings.missingStrategy}
                  onValueChange={(v) =>
                    setPrepSettings({ missingStrategy: v as typeof prepSettings.missingStrategy })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="median">
                      Impute with Median (recommended for numeric)
                    </SelectItem>
                    <SelectItem value="mode">
                      Impute with Mode (recommended for categorical)
                    </SelectItem>
                    <SelectItem value="remove">Remove Rows with Missing Values</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Median imputation is robust to outliers and suitable for most clinical numeric
                  variables.
                </p>
              </CardContent>
            </Card>

            {/* Normalisation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Feature Normalisation</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={prepSettings.normalizeMethod}
                  onValueChange={(v) =>
                    setPrepSettings({ normalizeMethod: v as typeof prepSettings.normalizeMethod })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zscore">Z-Score Standardisation (mean=0, std=1)</SelectItem>
                    <SelectItem value="minmax">Min-Max Scaling (0 to 1)</SelectItem>
                    <SelectItem value="none">No Normalisation</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Required for KNN, SVM, and Logistic Regression. Not needed for tree-based models.
                </p>
              </CardContent>
            </Card>

            {/* SMOTE */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Class Imbalance (SMOTE)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Apply SMOTE</Label>
                    <p className="text-xs text-muted-foreground max-w-[220px]">
                      Oversample the minority class using synthetic examples. Useful when &lt;30%
                      of cases are positive.
                    </p>
                  </div>
                  <Switch
                    checked={prepSettings.applySmote}
                    onCheckedChange={(checked) => setPrepSettings({ applySmote: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary + run */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuration Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  { label: 'Features', value: `${columnMapping.featureColumns.length} columns` },
                  { label: 'Target', value: columnMapping.targetColumn },
                  { label: 'Test Split', value: formatPercent(prepSettings.testSize) },
                  { label: 'Missing Strategy', value: prepSettings.missingStrategy },
                  { label: 'Normalisation', value: prepSettings.normalizeMethod },
                  { label: 'SMOTE', value: prepSettings.applySmote ? 'Yes' : 'No' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-1 border-b border-border-subtle last:border-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-brand-navy">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {prepError && (
              <Banner variant="error" title="Preprocessing Failed" message={prepError} />
            )}

            {processedDataset && (
              <Banner
                variant="success"
                title="Preprocessing Complete"
                message={`Dataset split into ${processedDataset.nTrain} training and ${processedDataset.nTest} test samples. Step 4 is now unlocked.`}
              />
            )}

            <Button
              variant="teal"
              size="lg"
              className="w-full"
              onClick={handleRunPreprocessing}
              loading={isPreparing}
              disabled={isPreparing}
            >
              {isPreparing ? (
                'Preprocessing...'
              ) : processedDataset ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Re-run Preprocessing
                </>
              ) : (
                <>
                  Run Preprocessing
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>

            {processedDataset && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setCurrentStep(4)}
              >
                Continue to Model Training
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
