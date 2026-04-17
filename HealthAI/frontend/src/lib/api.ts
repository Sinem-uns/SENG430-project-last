/**
 * api.ts — Frontend API layer for HEALTH-AI
 *
 * Responsibilities:
 * - Build backend request payloads (camelCase frontend → snake_case backend)
 * - Map backend responses (snake_case backend → camelCase frontend)
 * - Provide typed, user-friendly error messages
 */
import type {
  DatasetApiResponse,
  ColumnInfo,
  PreprocessRequest,
  ProcessedDataset,
  TrainRequest,
  TrainResults,
  ExplainRequest,
  ExplanationData,
  BiasRequest,
  BiasData,
  CertificateRequest,
  SubgroupResult,
} from './types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

// ============================================================
// HTTP helpers
// ============================================================

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Server error (${res.status})`
    try {
      const body = await res.json()
      message = body?.detail || body?.message || message
    } catch {
      // ignore JSON parse errors
    }
    throw new ApiError(message, res.status)
  }
  return res.json() as Promise<T>
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<T>(res)
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  return handleResponse<T>(res)
}

// ============================================================
// Backend raw types (snake_case) — internal only
// ============================================================

interface BackendColumnInfo {
  name: string
  dtype: string
  missing_count: number
  missing_pct: number
  unique_count: number
  sample_values: (string | number)[]
}

interface BackendDatasetResponse {
  domain_id: string
  columns: BackendColumnInfo[]
  rows: Record<string, string | number>[]
  row_count: number
  target_column: string
  suggested_features: string[]
  class_distribution: Record<string, number>
}

interface BackendPrepareResponse {
  X_train: number[][]
  y_train: number[]
  X_test: number[][]
  y_test: number[]
  feature_names_out: string[]
  class_names: string[]
  n_train: number
  n_test: number
  class_dist_train: Record<string, number>
  class_dist_test: Record<string, number>
  smote_applied: boolean
}

interface BackendRocCurve {
  fpr: number[]
  tpr: number[]
  thresholds: number[]
}

interface BackendFeatureImportance {
  feature: string
  importance: number
}

interface BackendMetrics {
  accuracy: number
  sensitivity: number
  specificity: number
  precision: number
  f1: number
  auc: number
}

interface BackendTrainResponse {
  metrics: BackendMetrics
  confusion_matrix: number[][]
  roc_curve: BackendRocCurve | null
  feature_importance: BackendFeatureImportance[]
  predictions: number[]
  probabilities: number[][]
}

interface BackendContribution {
  feature: string
  contribution: number
  value: number
}

interface BackendExplainResponse {
  patient_prediction: number
  patient_probability: number[]
  contributions: BackendContribution[]
}

interface BackendSubgroupResult {
  name: string
  group: string
  n: number
  sensitivity: number
  specificity: number
  delta_sensitivity: number
  delta_specificity: number
  status: string
}

interface BackendBiasResponse {
  overall_sensitivity: number
  overall_specificity: number
  subgroups: BackendSubgroupResult[]
  has_significant_bias: boolean
}

interface BackendCertificateResponse {
  pdf_base64: string
}

// ============================================================
// Mapping helpers
// ============================================================

function mapColumnInfo(col: BackendColumnInfo): ColumnInfo {
  return {
    name: col.name,
    dtype: col.dtype as ColumnInfo['dtype'],
    missingCount: col.missing_count,
    missingPct: col.missing_pct,
    uniqueCount: col.unique_count,
    sampleValues: col.sample_values,
  }
}

function mapProcessedDataset(r: BackendPrepareResponse): ProcessedDataset {
  return {
    xTrain: r.X_train,
    yTrain: r.y_train,
    xTest: r.X_test,
    yTest: r.y_test,
    featureNames: r.feature_names_out,
    classNames: r.class_names,
    nTrain: r.n_train,
    nTest: r.n_test,
    classDistTrain: r.class_dist_train,
    classDistTest: r.class_dist_test,
    smoteApplied: r.smote_applied,
  }
}

function mapTrainResults(
  r: BackendTrainResponse,
  modelType: TrainRequest['modelType'],
  hyperparams: TrainRequest['hyperparams']
): TrainResults {
  return {
    modelType,
    hyperparams,
    metrics: r.metrics,
    confusionMatrix: r.confusion_matrix,
    rocCurve: r.roc_curve ?? { fpr: [0, 1], tpr: [0, 1], thresholds: [1, 0] },
    featureImportance: r.feature_importance,
    predictions: r.predictions,
    probabilities: r.probabilities,
  }
}

// ============================================================
// Dataset endpoints
// ============================================================

export async function fetchDataset(domainId: string): Promise<DatasetApiResponse> {
  try {
    const r = await get<BackendDatasetResponse>(`/api/datasets/${domainId}`)
    return {
      rows: r.rows,
      columns: r.columns.map(mapColumnInfo),
      rowCount: r.row_count,
      targetColumn: r.target_column,
      suggestedFeatures: r.suggested_features,
      classDistribution: r.class_distribution,
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      throw new Error(
        `Dataset for '${domainId}' not found on the server. Ensure the backend has the dataset loaded.`
      )
    }
    throw new Error(
      'Failed to load clinical dataset. Please check your connection to the backend server.'
    )
  }
}

export async function uploadCSV(file: File): Promise<DatasetApiResponse> {
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })
    const r = await handleResponse<BackendDatasetResponse>(res)
    return {
      rows: r.rows,
      columns: r.columns.map(mapColumnInfo),
      rowCount: r.row_count,
      targetColumn: r.target_column ?? '',
      suggestedFeatures: r.suggested_features ?? [],
      classDistribution: r.class_distribution ?? {},
    }
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 422) throw new Error('The uploaded file could not be parsed. Ensure it is a valid CSV with a header row.')
      if (err.status === 413) throw new Error('File too large. Maximum upload size is 50 MB.')
    }
    throw new Error('CSV upload failed. Please check the file format and try again.')
  }
}

// ============================================================
// Preprocessing endpoint
// ============================================================

export async function preprocessData(request: PreprocessRequest): Promise<ProcessedDataset> {
  const { rawData, columnMapping, prepSettings, taskType } = request
  const { targetColumn, featureColumns } = columnMapping

  // Extract feature matrix and target vector from raw data rows
  const X_raw = rawData.map((row) => featureColumns.map((f) => row[f] ?? null))
  const y_raw = rawData.map((row) => row[targetColumn] ?? null)

  const body = {
    X_raw,
    y_raw,
    feature_names: featureColumns,
    test_size: prepSettings.testSize,
    missing_strategy: prepSettings.missingStrategy,
    normalize: prepSettings.normalizeMethod,
    apply_smote: prepSettings.applySmote,
    task_type: taskType,
  }

  try {
    const r = await post<BackendPrepareResponse>('/api/preprocess', body)
    return mapProcessedDataset(r)
  } catch (err) {
    if (err instanceof ApiError && err.status === 422) {
      throw new Error(
        `Preprocessing failed: ${err.message}. Try adjusting missing value strategy or checking feature selection.`
      )
    }
    throw new Error(
      'Data preprocessing failed. This may be due to incompatible feature types or too many missing values.'
    )
  }
}

// ============================================================
// Training endpoint
// ============================================================

export async function trainModel(request: TrainRequest): Promise<TrainResults> {
  const { processedDataset: pd, modelType, hyperparams } = request

  const body = {
    model_type: modelType,
    hyperparams,
    X_train: pd.xTrain,
    y_train: pd.yTrain,
    X_test: pd.xTest,
    y_test: pd.yTest,
    feature_names: pd.featureNames,
    class_names: pd.classNames,
    task_type: pd.classNames.length > 2 ? 'multiclass' : 'binary',
  }

  try {
    const r = await post<BackendTrainResponse>('/api/train', body)
    return mapTrainResults(r, modelType, hyperparams)
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 422) throw new Error(`Training failed: ${err.message}. Check hyperparameter values are within valid ranges.`)
      if (err.status === 500) throw new Error('Model training encountered a server error. This model type may not support the selected features.')
    }
    throw new Error('Model training failed. Please check your dataset and hyperparameter settings.')
  }
}

// ============================================================
// Explainability endpoint
// ============================================================

export async function explainPrediction(request: ExplainRequest): Promise<ExplanationData> {
  const { processedDataset: pd, trainResults: tr, patientIndex } = request

  const body = {
    model_type: tr.modelType,
    hyperparams: tr.hyperparams,
    X_train: pd.xTrain,
    y_train: pd.yTrain,
    X_test: pd.xTest,
    feature_names: pd.featureNames,
    patient_index: patientIndex,
  }

  try {
    const r = await post<BackendExplainResponse>('/api/explain', body)
    return {
      patientIndex,
      prediction: r.patient_prediction,
      probability: r.patient_probability,
      contributions: r.contributions.map((c) => ({
        feature: c.feature,
        contribution: c.contribution,
        value: c.value,
        label: c.feature,
      })),
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 422) {
      throw new Error(`Could not generate explanation for patient ${patientIndex}. The patient index may be out of range.`)
    }
    throw new Error('Prediction explanation failed. Some model types have limited interpretability.')
  }
}

// ============================================================
// Bias analysis endpoint
// ============================================================

export async function analysisBias(request: BiasRequest): Promise<BiasData> {
  const { processedDataset: pd, trainResults: tr, subgroupFields, rawData } = request

  // Build subgroup_data: only include columns that exist in rawData
  // We use the test indices from the end of rawData (approximation since we don't track exact indices)
  // In practice we take the last pd.nTest rows of rawData for subgroup data
  const nTest = pd.nTest
  const testRows = rawData.slice(-nTest)
  const subgroup_data: Record<string, (string | number)[]> = {}
  for (const field of subgroupFields) {
    const colValues = testRows.map((row) => row[field])
    if (colValues.some((v) => v !== undefined && v !== null)) {
      subgroup_data[field] = colValues
    }
  }

  const body = {
    predictions: tr.predictions,
    y_true: pd.yTest,
    subgroup_data,
  }

  try {
    const r = await post<BackendBiasResponse>('/api/bias', body)
    return {
      overallSensitivity: r.overall_sensitivity,
      overallSpecificity: r.overall_specificity,
      subgroups: r.subgroups.map(
        (s): SubgroupResult => ({
          name: s.name,
          group: s.group,
          n: s.n,
          sensitivity: s.sensitivity,
          specificity: s.specificity,
          deltaSensitivity: s.delta_sensitivity,
          deltaSpecificity: s.delta_specificity,
          status: s.status as SubgroupResult['status'],
        })
      ),
      hasSignificantBias: r.has_significant_bias,
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 422) {
      throw new Error(`Bias analysis failed: ${err.message}. The selected subgroup fields may not be present in the dataset.`)
    }
    throw new Error('Bias analysis failed. Ensure subgroup fields are categorical columns with sufficient data in each group.')
  }
}

// ============================================================
// Certificate endpoint
// ============================================================

export async function downloadCertificate(request: CertificateRequest): Promise<string> {
  const body = {
    domain_label: request.domainId,
    model_type: request.modelType,
    model_params: {},
    metrics: request.metrics,
    bias_summary: [],
    checklist_items: request.checklistItems.map((item) => ({
      label: item.label,
      checked: item.checked,
      pre_checked: item.preChecked,
    })),
    generated_at: request.completedAt,
  }

  try {
    const r = await post<BackendCertificateResponse>('/api/generate-certificate', body)
    return r.pdf_base64
  } catch (err) {
    if (err instanceof ApiError && err.status === 422) {
      throw new Error('Certificate generation failed. Ensure all required steps have been completed.')
    }
    throw new Error('Certificate download failed. Please try again or contact support.')
  }
}

export async function downloadDetailedCertificate(request: CertificateRequest & { hyperparams: any, featureImportance: any[], confusionMatrix: number[][], biasSummary: any[] }): Promise<string> {
  const body = {
    domain_label: request.domainId,
    model_type: request.modelType,
    model_params: request.hyperparams,
    metrics: request.metrics,
    confusion_matrix: request.confusionMatrix,
    bias_summary: request.biasSummary,
    feature_importance: request.featureImportance,
    checklist_items: request.checklistItems.map((item) => ({
      label: item.label,
      checked: item.checked,
      pre_checked: item.preChecked,
    })),
    generated_at: request.completedAt,
  }

  try {
    const r = await post<BackendCertificateResponse>('/api/generate-detailed-certificate', body)
    return r.pdf_base64
  } catch (err) {
    if (err instanceof ApiError && err.status === 422) {
      throw new Error('Certificate generation failed. Ensure all required steps have been completed.')
    }
    throw new Error('Certificate download failed. Please try again or contact support.')
  }
}
