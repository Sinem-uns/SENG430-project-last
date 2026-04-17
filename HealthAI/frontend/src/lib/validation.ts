import { z } from 'zod'

// ============================================================
// File validation
// ============================================================

export const csvFileSchema = z
  .instanceof(File)
  .refine((file) => file.name.toLowerCase().endsWith('.csv'), {
    message: 'File must be a CSV (.csv) file.',
  })
  .refine((file) => file.size <= 50 * 1024 * 1024, {
    message: 'File size must not exceed 50 MB.',
  })
  .refine((file) => file.size > 0, {
    message: 'File must not be empty.',
  })

// ============================================================
// Column mapping validation
// ============================================================

export const columnMappingSchema = z
  .object({
    targetColumn: z.string().min(1, 'A target (outcome) column must be selected.'),
    featureColumns: z
      .array(z.string())
      .min(2, 'At least 2 feature columns must be selected.'),
    excludedColumns: z.array(z.string()),
  })
  .refine(
    (data) => !data.featureColumns.includes(data.targetColumn),
    {
      message: 'The target column cannot also be a feature column.',
      path: ['featureColumns'],
    }
  )

export type ColumnMappingInput = z.infer<typeof columnMappingSchema>

// ============================================================
// Preprocessing settings validation
// ============================================================

export const prepSettingsSchema = z.object({
  testSize: z
    .number()
    .min(0.1, 'Test split must be at least 10%.')
    .max(0.4, 'Test split must not exceed 40%.'),
  missingStrategy: z.enum(['median', 'mode', 'remove'], {
    errorMap: () => ({ message: 'Invalid missing value strategy.' }),
  }),
  normalizeMethod: z.enum(['zscore', 'minmax', 'none'], {
    errorMap: () => ({ message: 'Invalid normalisation method.' }),
  }),
  applySmote: z.boolean(),
})

export type PrepSettingsInput = z.infer<typeof prepSettingsSchema>

// ============================================================
// Train request validation
// ============================================================

const knnHyperparamsSchema = z.object({
  k: z.number().int().min(1).max(50),
  distance: z.enum(['euclidean', 'manhattan']),
})

const svmHyperparamsSchema = z.object({
  kernel: z.enum(['linear', 'rbf']),
  C: z.number().positive().max(1000),
})

const decisionTreeHyperparamsSchema = z.object({
  maxDepth: z.number().int().min(1).max(20),
})

const randomForestHyperparamsSchema = z.object({
  nTrees: z.number().int().min(10).max(500),
  maxDepth: z.number().int().min(1).max(20),
})

const logisticRegressionHyperparamsSchema = z.object({
  C: z.number().positive().max(1000),
  maxIter: z.number().int().min(50).max(1000),
})

const naiveBayesHyperparamsSchema = z.object({
  varSmoothing: z.number().positive(),
})

export const trainRequestSchema = z.object({
  modelType: z.enum([
    'knn',
    'svm',
    'decision_tree',
    'random_forest',
    'logistic_regression',
    'naive_bayes',
  ]),
  hyperparams: z.union([
    knnHyperparamsSchema,
    svmHyperparamsSchema,
    decisionTreeHyperparamsSchema,
    randomForestHyperparamsSchema,
    logisticRegressionHyperparamsSchema,
    naiveBayesHyperparamsSchema,
  ]),
})

export type TrainRequestInput = z.infer<typeof trainRequestSchema>

// ============================================================
// Individual hyperparam schemas (exported for per-field validation)
// ============================================================

export {
  knnHyperparamsSchema,
  svmHyperparamsSchema,
  decisionTreeHyperparamsSchema,
  randomForestHyperparamsSchema,
  logisticRegressionHyperparamsSchema,
  naiveBayesHyperparamsSchema,
}
