// ============================================================
// Domain Types
// ============================================================

export type TaskType = 'binary' | 'multiclass'

export type ModelType =
  | 'knn'
  | 'svm'
  | 'decision_tree'
  | 'random_forest'
  | 'logistic_regression'
  | 'naive_bayes'

export type MissingStrategy = 'median' | 'mode' | 'remove'

export type NormalizeMethod = 'zscore' | 'minmax' | 'none'

export type StepStatus = 'done' | 'active' | 'locked'

// ============================================================
// Domain Configuration
// ============================================================

export interface DomainConfig {
  id: string
  label: string
  specialty: string
  clinicalQuestion: string
  whyItMatters: string
  patientPopulation: string
  predictedOutcome: string
  taskType: TaskType
  datasetId: string
  targetColumn: string
  suggestedFeatures: string[]
  featureLabels: Record<string, string>
  classLabels: string[]
  clinicalContextCopy: string
  clinicalSenseCheck: string
  subgroupFields: string[]
  sampleDataSource: string
  estimatedMinutes: number
}

// ============================================================
// Data Types
// ============================================================

export interface ColumnInfo {
  name: string
  dtype: 'numeric' | 'categorical' | 'text'
  missingCount: number
  missingPct: number
  uniqueCount: number
  sampleValues: (string | number)[]
}

export interface ColumnMapping {
  targetColumn: string
  featureColumns: string[]
  excludedColumns: string[]
}

export interface DataRow {
  [key: string]: string | number
}

// ============================================================
// Preprocessing
// ============================================================

export interface PrepSettings {
  testSize: number
  missingStrategy: MissingStrategy
  normalizeMethod: NormalizeMethod
  applySmote: boolean
}

export interface ProcessedDataset {
  xTrain: number[][]
  yTrain: number[]
  xTest: number[][]
  yTest: number[]
  featureNames: string[]
  classNames: string[]
  nTrain: number
  nTest: number
  classDistTrain: Record<string, number>
  classDistTest: Record<string, number>
  smoteApplied: boolean
}

// ============================================================
// Hyperparameters
// ============================================================

export interface KNNHyperparams {
  k: number
  distance: 'euclidean' | 'manhattan'
}

export interface SVMHyperparams {
  kernel: 'linear' | 'rbf'
  C: number
}

export interface DecisionTreeHyperparams {
  maxDepth: number
}

export interface RandomForestHyperparams {
  nTrees: number
  maxDepth: number
}

export interface LogisticRegressionHyperparams {
  C: number
  maxIter: number
}

export interface NaiveBayesHyperparams {
  varSmoothing: number
}

export type Hyperparams =
  | KNNHyperparams
  | SVMHyperparams
  | DecisionTreeHyperparams
  | RandomForestHyperparams
  | LogisticRegressionHyperparams
  | NaiveBayesHyperparams

// ============================================================
// Model Results
// ============================================================

export interface MetricsResult {
  accuracy: number
  sensitivity: number
  specificity: number
  precision: number
  f1: number
  auc: number
}

export interface FeatureImportance {
  feature: string
  importance: number
}

export interface TrainResults {
  modelType: ModelType
  hyperparams: Record<string, unknown>
  metrics: MetricsResult
  confusionMatrix: number[][]
  rocCurve: { fpr: number[]; tpr: number[]; thresholds: number[] }
  featureImportance: FeatureImportance[]
  predictions: number[]
  probabilities: number[][]
}

export interface ComparisonRow {
  id: string
  modelType: ModelType
  modelLabel: string
  hyperparams: Record<string, unknown>
  metrics: MetricsResult
}

// ============================================================
// Explainability
// ============================================================

export interface PatientContribution {
  feature: string
  contribution: number
  value: number
  label: string
}

export interface ExplanationData {
  patientIndex: number
  prediction: number
  probability: number[]
  contributions: PatientContribution[]
}

// ============================================================
// Bias / Ethics
// ============================================================

export interface SubgroupResult {
  name: string
  group: string
  n: number
  sensitivity: number
  specificity: number
  deltaSensitivity: number
  deltaSpecificity: number
  status: 'OK' | 'Review' | 'Warning'
}

export interface BiasData {
  overallSensitivity: number
  overallSpecificity: number
  subgroups: SubgroupResult[]
  hasSignificantBias: boolean
}

// ============================================================
// Ethics Checklist
// ============================================================

export interface ChecklistItem {
  id: string
  label: string
  description: string
  checked: boolean
  preChecked: boolean
}

// ============================================================
// API Request / Response Types
// ============================================================

export interface DatasetApiResponse {
  rows: DataRow[]
  columns: ColumnInfo[]
  rowCount: number
  targetColumn: string
  suggestedFeatures: string[]
  classDistribution: Record<string, number>
}

export interface PreprocessRequest {
  rawData: DataRow[]
  columnMapping: ColumnMapping
  prepSettings: PrepSettings
  taskType: TaskType
}

export interface TrainRequest {
  processedDataset: ProcessedDataset
  modelType: ModelType
  hyperparams: Record<string, unknown>
}

export interface ExplainRequest {
  processedDataset: ProcessedDataset
  trainResults: TrainResults
  patientIndex: number
}

export interface BiasRequest {
  processedDataset: ProcessedDataset
  trainResults: TrainResults
  subgroupFields: string[]
  rawData: DataRow[]
}

export interface CertificateRequest {
  domainId: string
  modelType: ModelType
  metrics: MetricsResult
  checklistItems: ChecklistItem[]
  completedAt: string
}
