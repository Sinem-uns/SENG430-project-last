import { create } from 'zustand'
import type {
  ModelType,
  DataRow,
  ColumnInfo,
  ColumnMapping,
  PrepSettings,
  ProcessedDataset,
  TrainResults,
  ComparisonRow,
  ExplanationData,
  BiasData,
  ChecklistItem,
} from './types'

// ============================================================
// Default values
// ============================================================

const DEFAULT_PREP_SETTINGS: PrepSettings = {
  testSize: 0.2,
  missingStrategy: 'median',
  normalizeMethod: 'zscore',
  applySmote: false,
}

const DEFAULT_HYPERPARAMS: Record<ModelType, Record<string, unknown>> = {
  knn: { k: 5, distance: 'euclidean' },
  svm: { kernel: 'rbf', C: 1.0 },
  decision_tree: { maxDepth: 5 },
  random_forest: { nTrees: 100, maxDepth: 5 },
  logistic_regression: { C: 1.0, maxIter: 100 },
  naive_bayes: { varSmoothing: 1e-9 },
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  {
    id: 'explanations',
    label: 'Model outputs include explanations',
    description: 'The AI provides reasons for each prediction, not just a result.',
    checked: true,
    preChecked: true,
  },
  {
    id: 'data_documented',
    label: 'Training data source is documented',
    description: 'The origin and characteristics of the training data are recorded.',
    checked: true,
    preChecked: true,
  },
  {
    id: 'bias_audit',
    label: 'Subgroup bias audit completed',
    description: 'Performance across demographic groups has been reviewed for fairness.',
    checked: false,
    preChecked: false,
  },
  {
    id: 'human_oversight',
    label: 'Human oversight plan defined',
    description: 'A clinician remains responsible for every AI-assisted decision.',
    checked: false,
    preChecked: false,
  },
  {
    id: 'privacy',
    label: 'Patient data privacy protected (GDPR)',
    description:
      'No identifiable patient data is retained. Consent and anonymisation processes are in place.',
    checked: false,
    preChecked: false,
  },
  {
    id: 'monitoring',
    label: 'Plan exists to monitor model performance over time',
    description: 'Accuracy and bias will be re-evaluated regularly against new data.',
    checked: false,
    preChecked: false,
  },
  {
    id: 'incident_reporting',
    label: 'Pathway exists for reporting AI-related incidents',
    description: 'Clinical staff know how to escalate concerns about AI errors or bias.',
    checked: false,
    preChecked: false,
  },
  {
    id: 'clinical_validation',
    label: 'Clinical validation completed before real-world use',
    description:
      'The model has been prospectively validated in the target clinical setting before deployment.',
    checked: false,
    preChecked: false,
  },
]

const makeDefaultTrainedModels = (): Record<ModelType, TrainResults | null> => ({
  knn: null,
  svm: null,
  decision_tree: null,
  random_forest: null,
  logistic_regression: null,
  naive_bayes: null,
})

// ============================================================
// Unlock logic helper
// ============================================================

function computeUnlockedSteps(
  columnMapping: ColumnMapping | null,
  processedDataset: ProcessedDataset | null,
  trainedModels: Record<ModelType, TrainResults | null>,
  activeResults: TrainResults | null
): number[] {
  const unlocked = new Set([1, 2, 7])
  if (columnMapping !== null) unlocked.add(3)
  if (processedDataset !== null) unlocked.add(4)
  if (Object.values(trainedModels).some((r) => r !== null)) unlocked.add(5)
  if (activeResults !== null) unlocked.add(6)
  return Array.from(unlocked).sort((a, b) => a - b)
}

// ============================================================
// Store Interface
// ============================================================

interface AppStore {
  // Navigation
  currentStep: number
  unlockedSteps: number[]

  // Step 1: Domain
  selectedDomainId: string | null

  // Step 2: Data
  dataSource: 'builtin' | 'upload' | null
  rawData: DataRow[]
  columns: ColumnInfo[]
  rowCount: number
  columnMapping: ColumnMapping | null
  isLoadingData: boolean
  dataError: string | null

  // Step 3: Preprocessing
  prepSettings: PrepSettings
  processedDataset: ProcessedDataset | null
  isPreparing: boolean
  prepError: string | null

  // Step 4: Models
  selectedModel: ModelType
  hyperparams: Record<ModelType, Record<string, unknown>>
  trainedModels: Record<ModelType, TrainResults | null>
  comparisonRows: ComparisonRow[]
  isTraining: boolean
  trainingError: string | null
  autoRetrain: boolean

  // Step 5: Results
  activeResults: TrainResults | null

  // Step 6: Explainability
  selectedPatientIndex: number
  explanationData: ExplanationData | null
  isExplaining: boolean

  // Step 7: Ethics
  biasData: BiasData | null
  isAnalysingBias: boolean
  checklistItems: ChecklistItem[]

  // Actions
  setCurrentStep: (step: number) => void
  selectDomain: (domainId: string) => void
  setDataSource: (source: 'builtin' | 'upload' | null) => void
  setRawData: (data: DataRow[], columns: ColumnInfo[], rowCount: number) => void
  setColumnMapping: (mapping: ColumnMapping) => void
  setIsLoadingData: (loading: boolean) => void
  setDataError: (error: string | null) => void
  setPrepSettings: (settings: Partial<PrepSettings>) => void
  setProcessedDataset: (dataset: ProcessedDataset | null) => void
  setIsPreparing: (preparing: boolean) => void
  setPrepError: (error: string | null) => void
  setSelectedModel: (model: ModelType) => void
  updateHyperparam: (model: ModelType, key: string, value: unknown) => void
  setTrainedModel: (model: ModelType, results: TrainResults | null) => void
  setIsTraining: (training: boolean) => void
  setTrainingError: (error: string | null) => void
  setAutoRetrain: (auto: boolean) => void
  addComparisonRow: (row: ComparisonRow) => void
  removeComparisonRow: (id: string) => void
  setActiveResults: (results: TrainResults | null) => void
  setSelectedPatientIndex: (index: number) => void
  setExplanationData: (data: ExplanationData | null) => void
  setIsExplaining: (explaining: boolean) => void
  setBiasData: (data: BiasData | null) => void
  setIsAnalysingBias: (analysing: boolean) => void
  toggleChecklistItem: (id: string) => void
  preCheckItem: (id: string) => void
  resetAll: () => void
}

// ============================================================
// Initial State
// ============================================================

const getInitialState = () => ({
  currentStep: 1,
  unlockedSteps: [1, 2, 7],
  selectedDomainId: null as string | null,
  dataSource: null as 'builtin' | 'upload' | null,
  rawData: [] as DataRow[],
  columns: [] as ColumnInfo[],
  rowCount: 0,
  columnMapping: null as ColumnMapping | null,
  isLoadingData: false,
  dataError: null as string | null,
  prepSettings: { ...DEFAULT_PREP_SETTINGS },
  processedDataset: null as ProcessedDataset | null,
  isPreparing: false,
  prepError: null as string | null,
  selectedModel: 'knn' as ModelType,
  hyperparams: {
    knn: { ...DEFAULT_HYPERPARAMS.knn },
    svm: { ...DEFAULT_HYPERPARAMS.svm },
    decision_tree: { ...DEFAULT_HYPERPARAMS.decision_tree },
    random_forest: { ...DEFAULT_HYPERPARAMS.random_forest },
    logistic_regression: { ...DEFAULT_HYPERPARAMS.logistic_regression },
    naive_bayes: { ...DEFAULT_HYPERPARAMS.naive_bayes },
  } as Record<ModelType, Record<string, unknown>>,
  trainedModels: makeDefaultTrainedModels(),
  comparisonRows: [] as ComparisonRow[],
  isTraining: false,
  trainingError: null as string | null,
  autoRetrain: true,
  activeResults: null as TrainResults | null,
  selectedPatientIndex: 0,
  explanationData: null as ExplanationData | null,
  isExplaining: false,
  biasData: null as BiasData | null,
  isAnalysingBias: false,
  checklistItems: DEFAULT_CHECKLIST.map((item) => ({ ...item })),
})

// ============================================================
// Store
// ============================================================

export const useAppStore = create<AppStore>()((set, get) => ({
  ...getInitialState(),

  setCurrentStep: (step) => set({ currentStep: step }),

  selectDomain: (domainId) => set({ selectedDomainId: domainId }),

  setDataSource: (source) => set({ dataSource: source }),

  setRawData: (data, columns, rowCount) =>
    set({ rawData: data, columns, rowCount, dataError: null }),

  setColumnMapping: (mapping) =>
    set((state) => ({
      columnMapping: mapping,
      unlockedSteps: computeUnlockedSteps(
        mapping,
        state.processedDataset,
        state.trainedModels,
        state.activeResults
      ),
    })),

  setIsLoadingData: (loading) => set({ isLoadingData: loading }),

  setDataError: (error) => set({ dataError: error }),

  setPrepSettings: (settings) =>
    set((state) => ({ prepSettings: { ...state.prepSettings, ...settings } })),

  setProcessedDataset: (dataset) =>
    set((state) => ({
      processedDataset: dataset,
      unlockedSteps: computeUnlockedSteps(
        state.columnMapping,
        dataset,
        state.trainedModels,
        state.activeResults
      ),
    })),

  setIsPreparing: (preparing) => set({ isPreparing: preparing }),

  setPrepError: (error) => set({ prepError: error }),

  setSelectedModel: (model) => set({ selectedModel: model }),

  updateHyperparam: (model, key, value) =>
    set((state) => ({
      hyperparams: {
        ...state.hyperparams,
        [model]: { ...state.hyperparams[model], [key]: value },
      },
    })),

  setTrainedModel: (model, results) =>
    set((state) => {
      const updatedModels = { ...state.trainedModels, [model]: results }
      const newActive = results !== null && state.activeResults === null ? results : state.activeResults
      return {
        trainedModels: updatedModels,
        activeResults: newActive,
        unlockedSteps: computeUnlockedSteps(
          state.columnMapping,
          state.processedDataset,
          updatedModels,
          newActive
        ),
      }
    }),

  setIsTraining: (training) => set({ isTraining: training }),

  setTrainingError: (error) => set({ trainingError: error }),

  setAutoRetrain: (auto) => set({ autoRetrain: auto }),

  addComparisonRow: (row) =>
    set((state) => ({ comparisonRows: [...state.comparisonRows, row] })),

  removeComparisonRow: (id) =>
    set((state) => ({ comparisonRows: state.comparisonRows.filter((r) => r.id !== id) })),

  setActiveResults: (results) =>
    set((state) => ({
      activeResults: results,
      unlockedSteps: computeUnlockedSteps(
        state.columnMapping,
        state.processedDataset,
        state.trainedModels,
        results
      ),
    })),

  setSelectedPatientIndex: (index) =>
    set({ selectedPatientIndex: index, explanationData: null }),

  setExplanationData: (data) => set({ explanationData: data }),

  setIsExplaining: (explaining) => set({ isExplaining: explaining }),

  setBiasData: (data) => set({ biasData: data }),

  setIsAnalysingBias: (analysing) => set({ isAnalysingBias: analysing }),

  toggleChecklistItem: (id) =>
    set((state) => ({
      checklistItems: state.checklistItems.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ),
    })),

  preCheckItem: (id) =>
    set((state) => ({
      checklistItems: state.checklistItems.map((item) =>
        item.id === id ? { ...item, checked: true } : item
      ),
    })),

  resetAll: () => set(getInitialState()),
}))
