import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ModelType } from './types'
import type { DomainConfig } from './types'

// ============================================================
// Tailwind class merge
// ============================================================

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// ============================================================
// Formatting
// ============================================================

/**
 * Format a 0-1 decimal as a percentage string.
 * e.g. 0.7324 → "73.2%"
 */
export function formatPercent(n: number, decimals = 1): string {
  if (!isFinite(n) || isNaN(n)) return 'N/A'
  return `${(n * 100).toFixed(decimals)}%`
}

/**
 * Format a number with specified decimal places.
 * e.g. 1234.567, 2 → "1234.57"
 */
export function formatNumber(n: number, decimals = 2): string {
  if (!isFinite(n) || isNaN(n)) return 'N/A'
  return n.toFixed(decimals)
}

/**
 * Format large numbers with K/M suffix.
 * e.g. 12500 → "12.5K"
 */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

// ============================================================
// Clinical metric status thresholds
// ============================================================

const METRIC_THRESHOLDS: Record<string, { good: number; warning: number }> = {
  accuracy: { good: 0.8, warning: 0.7 },
  sensitivity: { good: 0.75, warning: 0.6 },
  specificity: { good: 0.75, warning: 0.6 },
  precision: { good: 0.75, warning: 0.6 },
  f1: { good: 0.75, warning: 0.6 },
  auc: { good: 0.8, warning: 0.7 },
}

/**
 * Returns the clinical status of a metric value.
 * Used to colour metric cards green/amber/red.
 */
export function getMetricStatus(
  metric: string,
  value: number
): 'good' | 'warning' | 'danger' {
  const thresholds = METRIC_THRESHOLDS[metric]
  if (!thresholds) return 'warning'
  if (value >= thresholds.good) return 'good'
  if (value >= thresholds.warning) return 'warning'
  return 'danger'
}

// ============================================================
// Model labels
// ============================================================

const MODEL_LABELS: Record<ModelType, string> = {
  knn: 'K-Nearest Neighbours (KNN)',
  svm: 'Support Vector Machine (SVM)',
  decision_tree: 'Decision Tree',
  random_forest: 'Random Forest',
  logistic_regression: 'Logistic Regression',
  naive_bayes: 'Naïve Bayes',
}

/**
 * Returns a human-readable label for a model type.
 */
export function getModelLabel(modelType: ModelType): string {
  return MODEL_LABELS[modelType] ?? modelType
}

/**
 * Returns a short label for a model type.
 */
export function getModelShortLabel(modelType: ModelType): string {
  const shortLabels: Record<ModelType, string> = {
    knn: 'KNN',
    svm: 'SVM',
    decision_tree: 'Decision Tree',
    random_forest: 'Random Forest',
    logistic_regression: 'Logistic Reg.',
    naive_bayes: 'Naïve Bayes',
  }
  return shortLabels[modelType] ?? modelType
}

// ============================================================
// Unique ID generation
// ============================================================

/**
 * Generate a simple unique ID for comparison rows.
 * Uses timestamp + random suffix for lightweight uniqueness.
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// ============================================================
// PDF download helper
// ============================================================

/**
 * Trigger a browser download of a base64-encoded PDF.
 * Creates a temporary anchor element and clicks it.
 */
export function downloadBase64PDF(base64: string, filename: string): void {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: 'application/pdf' })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ============================================================
// Domain class label helper
// ============================================================

/**
 * Get a human-readable class label from a domain config.
 * Falls back to numeric string if index is out of range.
 */
export function getClassLabel(domain: DomainConfig, classIndex: number): string {
  if (classIndex >= 0 && classIndex < domain.classLabels.length) {
    return domain.classLabels[classIndex]
  }
  return classIndex.toString()
}

// ============================================================
// Misc helpers
// ============================================================

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Truncate a string to a maximum length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength - 1)}…`
}

/**
 * Convert a snake_case or camelCase string to Title Case.
 * e.g. 'ejection_fraction' → 'Ejection Fraction'
 */
export function toTitleCase(str: string): string {
  return str
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Sleep for a given number of milliseconds.
 * Useful for optimistic UI and test scenarios.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
