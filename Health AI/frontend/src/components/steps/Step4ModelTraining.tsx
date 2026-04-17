'use client'

import * as React from 'react'
import { Cpu, Play, ChevronRight, CheckCircle2, Plus } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { trainModel } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { KNNVisualisation } from './KNNVisualisation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Banner } from '@/components/shared/Banner'
import { getModelLabel, generateId, formatPercent } from '@/lib/utils'
import type { ModelType } from '@/lib/types'

const MODEL_OPTIONS: { value: ModelType; label: string; description: string }[] = [
  {
    value: 'knn',
    label: 'K-Nearest Neighbours',
    description: 'Classifies based on similarity to nearby training examples.',
  },
  {
    value: 'logistic_regression',
    label: 'Logistic Regression',
    description: 'Estimates probability of an outcome using a linear boundary.',
  },
  {
    value: 'decision_tree',
    label: 'Decision Tree',
    description: 'Builds a tree of if/then rules from the data.',
  },
  {
    value: 'random_forest',
    label: 'Random Forest',
    description: 'Combines many decision trees for more robust predictions.',
  },
  {
    value: 'svm',
    label: 'Support Vector Machine',
    description: 'Finds the optimal boundary between classes.',
  },
  {
    value: 'naive_bayes',
    label: 'Naïve Bayes',
    description: 'Applies Bayes theorem with feature independence assumption.',
  },
]

const ParamLabel = ({ label, tooltip }: { label: string; tooltip: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help underline decoration-dotted underline-offset-2 transition-colors hover:text-brand-navy">
          <Label className="cursor-help">{label}</Label>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs p-2">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

export function Step4ModelTraining() {
  const {
    processedDataset,
    selectedModel,
    hyperparams,
    trainedModels,
    comparisonRows,
    isTraining,
    trainingError,
    autoRetrain,
    setSelectedModel,
    updateHyperparam,
    setAutoRetrain,
    setTrainedModel,
    setIsTraining,
    setTrainingError,
    setActiveResults,
    addComparisonRow,
    setCurrentStep,
  } = useAppStore()

  async function handleTrain() {
    if (!processedDataset) return
    setIsTraining(true)
    setTrainingError(null)
    try {
      const result = await trainModel({
        processedDataset,
        modelType: selectedModel,
        hyperparams: hyperparams[selectedModel],
      })
      setTrainedModel(selectedModel, result)
      setActiveResults(result)
    } catch (err) {
      setTrainingError(err instanceof Error ? err.message : 'Training failed.')
    } finally {
      setIsTraining(false)
    }
  }

  React.useEffect(() => {
    if (!autoRetrain || !processedDataset || !selectedModel) return
    const timer = setTimeout(() => {
      handleTrain()
    }, 300)
    return () => clearTimeout(timer)
  }, [hyperparams[selectedModel], autoRetrain])

  function handleAddToComparison() {
    const result = trainedModels[selectedModel]
    if (!result) return
    addComparisonRow({
      id: generateId(),
      modelType: selectedModel,
      modelLabel: getModelLabel(selectedModel),
      hyperparams: hyperparams[selectedModel],
      metrics: result.metrics,
    })
  }

  const currentResult = trainedModels[selectedModel]
  const hp = hyperparams[selectedModel]

  if (!processedDataset) {
    return (
      <div className="step-container">
        <Banner
          variant="warning"
          title="Data not prepared"
          message="Complete Step 3 (Data Preparation) before training a model."
        />
      </div>
    )
  }

  return (
    <div className="step-container">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="teal" size="sm">Step 4</Badge>
          <span className="text-xs text-muted-foreground">Model & Training</span>
        </div>
        <h1 className="step-heading">Select & Train a Model</h1>
        <p className="step-subheading">
          Choose an algorithm, tune its hyperparameters, and train on the prepared dataset.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model selector */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Choose Algorithm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              {MODEL_OPTIONS.map((opt) => {
                const trained = trainedModels[opt.value] !== null
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedModel(opt.value)}
                    className={`w-full text-left rounded-lg px-3 py-2.5 border transition-colors ${
                      selectedModel === opt.value
                        ? 'border-brand-navy bg-brand-navy/5'
                        : 'border-transparent hover:border-border-subtle hover:bg-surface'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-brand-navy">{opt.label}</span>
                      {trained && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-clinical-success shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                      {opt.description}
                    </p>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Hyperparameters + train */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Hyperparameters — {getModelLabel(selectedModel)}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Label htmlFor="auto-retrain" className="text-xs font-normal text-muted-foreground mr-1">Auto-Retrain</Label>
                <Switch 
                  id="auto-retrain" 
                  checked={autoRetrain} 
                  onCheckedChange={setAutoRetrain} 
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedModel === 'knn' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <ParamLabel label="K (neighbours)" tooltip="How many similar historical patient cases to review when classifying a new patient." />
                        <span className="font-semibold">{(hp as { k: number }).k}</span>
                      </div>
                      <Slider
                        min={1} max={20} step={2}
                        value={[(hp as { k: number }).k]}
                        onValueChange={([v]) => updateHyperparam('knn', 'k', v)}
                      />
                    </div>
                    <div className="space-y-2">
                      <ParamLabel label="Distance Metric" tooltip="The mathematical formula used to measure similarity between patients (e.g. straight-line vs block distance)." />
                      <Select
                        value={(hp as { distance: string }).distance}
                        onValueChange={(v) => updateHyperparam('knn', 'distance', v)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="euclidean">Euclidean</SelectItem>
                          <SelectItem value="manhattan">Manhattan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-center items-center pt-4">
                    <KNNVisualisation k={(hp as { k: number }).k} />
                  </div>
                </div>
              )}

              {selectedModel === 'svm' && (
                <>
                  <div className="space-y-2">
                    <ParamLabel label="Kernel" tooltip="The mathematical function used to transform patient data into higher dimensions to establish a clear separation boundary." />
                    <Select
                      value={(hp as { kernel: string }).kernel}
                      onValueChange={(v) => updateHyperparam('svm', 'kernel', v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rbf">RBF (non-linear)</SelectItem>
                        <SelectItem value="linear">Linear</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <ParamLabel label="Regularisation (C)" tooltip="Controls the trade-off. Lower C prefers a smoother boundary. Higher C tries to perfectly classify all training points but risks overfitting." />
                      <span className="font-semibold">{(hp as { C: number }).C}</span>
                    </div>
                    <Slider
                      min={1} max={100} step={1}
                      value={[(hp as { C: number }).C]}
                      onValueChange={([v]) => updateHyperparam('svm', 'C', v)}
                    />
                  </div>
                </>
              )}

              {selectedModel === 'decision_tree' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <ParamLabel label="Max Depth" tooltip="The maximum number of sequential questions (splits) the tree can ask. Too deep risks memorizing patient noise." />
                    <span className="font-semibold">{(hp as { maxDepth: number }).maxDepth}</span>
                  </div>
                  <Slider
                    min={1} max={20} step={1}
                    value={[(hp as { maxDepth: number }).maxDepth]}
                    onValueChange={([v]) => updateHyperparam('decision_tree', 'maxDepth', v)}
                  />
                </div>
              )}

              {selectedModel === 'random_forest' && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <ParamLabel label="Number of Trees" tooltip="How many individual decision trees to generate before combining their output for a more robust ensemble vote." />
                      <span className="font-semibold">{(hp as { nTrees: number }).nTrees}</span>
                    </div>
                    <Slider
                      min={10} max={200} step={10}
                      value={[(hp as { nTrees: number }).nTrees]}
                      onValueChange={([v]) => updateHyperparam('random_forest', 'nTrees', v)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <ParamLabel label="Max Depth" tooltip="The maximum depth allowed for each individual tree in the random forest ensemble." />
                      <span className="font-semibold">{(hp as { maxDepth: number }).maxDepth}</span>
                    </div>
                    <Slider
                      min={1} max={20} step={1}
                      value={[(hp as { maxDepth: number }).maxDepth]}
                      onValueChange={([v]) => updateHyperparam('random_forest', 'maxDepth', v)}
                    />
                  </div>
                </>
              )}

              {selectedModel === 'logistic_regression' && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <ParamLabel label="Regularisation (C)" tooltip="Inverse of regularisation strength. Smaller values specify stronger regularisation, creating a simpler model." />
                      <span className="font-semibold">{(hp as { C: number }).C}</span>
                    </div>
                    <Slider
                      min={1} max={100} step={1}
                      value={[(hp as { C: number }).C]}
                      onValueChange={([v]) => updateHyperparam('logistic_regression', 'C', v)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <ParamLabel label="Max Iterations" tooltip="The maximum number of times the algorithm tries to adjust its weights before concluding the optimization." />
                      <span className="font-semibold">{(hp as { maxIter: number }).maxIter}</span>
                    </div>
                    <Slider
                      min={50} max={500} step={50}
                      value={[(hp as { maxIter: number }).maxIter]}
                      onValueChange={([v]) =>
                        updateHyperparam('logistic_regression', 'maxIter', v)
                      }
                    />
                  </div>
                </>
              )}

              {selectedModel === 'naive_bayes' && (
                <p className="text-sm text-muted-foreground">
                  Naïve Bayes uses a variance smoothing parameter (var_smoothing = 1e-9 by
                  default). No further tuning is typically needed.
                </p>
              )}

              {trainingError && (
                <Banner variant="error" title="Training Error" message={trainingError} />
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="teal"
                  className="flex-1"
                  onClick={handleTrain}
                  loading={isTraining}
                  disabled={isTraining}
                >
                  <Play className="h-4 w-4" />
                  {isTraining ? 'Training...' : 'Train Model'}
                </Button>
                {currentResult && (
                  <Button variant="outline" onClick={handleAddToComparison}>
                    <Plus className="h-4 w-4" />
                    Compare
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick results preview */}
          {currentResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-clinical-success" />
                  Training Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Accuracy', value: currentResult.metrics.accuracy },
                    { label: 'Sensitivity', value: currentResult.metrics.sensitivity },
                    { label: 'AUC', value: currentResult.metrics.auc },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center rounded-lg bg-surface p-3">
                      <p className="text-2xl font-bold text-brand-navy">
                        {formatPercent(value)}
                      </p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setCurrentStep(5)}
                >
                  View Full Results
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Comparison table */}
          {comparisonRows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Model Comparison</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-subtle">
                        {['Model', 'Accuracy', 'Sensitivity', 'Specificity', 'AUC'].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.map((row) => (
                        <tr key={row.id} className="border-b border-border-subtle">
                          <td className="px-4 py-2 font-medium text-brand-navy text-xs">
                            {row.modelLabel}
                          </td>
                          <td className="px-4 py-2 text-xs">{formatPercent(row.metrics.accuracy)}</td>
                          <td className="px-4 py-2 text-xs">{formatPercent(row.metrics.sensitivity)}</td>
                          <td className="px-4 py-2 text-xs">{formatPercent(row.metrics.specificity)}</td>
                          <td className="px-4 py-2 text-xs">{formatPercent(row.metrics.auc)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
