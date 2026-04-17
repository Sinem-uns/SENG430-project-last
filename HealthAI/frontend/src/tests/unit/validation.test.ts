import { describe, it, expect } from 'vitest'
import { csvFileSchema, columnMappingSchema, prepSettingsSchema } from '@/lib/validation'

// ---------------------------------------------------------------------------
// Helper to create a mock File
// ---------------------------------------------------------------------------
function makeFile(name: string, sizeBytes: number, type = 'text/csv'): File {
  const content = 'a'.repeat(sizeBytes)
  return new File([content], name, { type })
}

// ---------------------------------------------------------------------------
// csvFileSchema
// ---------------------------------------------------------------------------
describe('csvFileSchema', () => {
  it('rejects a file with a non-CSV extension', () => {
    const file = makeFile('data.xlsx', 1024)
    const result = csvFileSchema.safeParse(file)
    expect(result.success).toBe(false)
  })

  it('rejects a file whose name has a .txt extension', () => {
    const file = makeFile('data.txt', 100)
    const result = csvFileSchema.safeParse(file)
    expect(result.success).toBe(false)
  })

  it('rejects a CSV file exceeding 50 MB', () => {
    const over50MB = 51 * 1024 * 1024
    const file = makeFile('big.csv', over50MB)
    const result = csvFileSchema.safeParse(file)
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages.some((m) => m.toLowerCase().includes('50'))).toBe(true)
    }
  })

  it('accepts a valid CSV file under 50 MB', () => {
    const file = makeFile('patients.csv', 1024)
    const result = csvFileSchema.safeParse(file)
    expect(result.success).toBe(true)
  })

  it('rejects an empty CSV file', () => {
    const file = makeFile('empty.csv', 0)
    const result = csvFileSchema.safeParse(file)
    expect(result.success).toBe(false)
  })

  it('accepts a CSV file exactly at 50 MB', () => {
    const exactly50MB = 50 * 1024 * 1024
    const file = makeFile('limit.csv', exactly50MB)
    const result = csvFileSchema.safeParse(file)
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// columnMappingSchema
// ---------------------------------------------------------------------------
describe('columnMappingSchema', () => {
  it('rejects when featureColumns is empty', () => {
    const result = columnMappingSchema.safeParse({
      targetColumn: 'outcome',
      featureColumns: [],
      excludedColumns: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects when featureColumns has only one entry', () => {
    const result = columnMappingSchema.safeParse({
      targetColumn: 'outcome',
      featureColumns: ['age'],
      excludedColumns: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects when targetColumn is empty string', () => {
    const result = columnMappingSchema.safeParse({
      targetColumn: '',
      featureColumns: ['age', 'sex'],
      excludedColumns: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects when targetColumn is also in featureColumns', () => {
    const result = columnMappingSchema.safeParse({
      targetColumn: 'outcome',
      featureColumns: ['age', 'outcome'],
      excludedColumns: [],
    })
    expect(result.success).toBe(false)
  })

  it('accepts a valid mapping with target and 2 features', () => {
    const result = columnMappingSchema.safeParse({
      targetColumn: 'readmission_30days',
      featureColumns: ['age', 'ejection_fraction'],
      excludedColumns: [],
    })
    expect(result.success).toBe(true)
  })

  it('accepts a valid mapping with multiple features', () => {
    const result = columnMappingSchema.safeParse({
      targetColumn: 'outcome',
      featureColumns: ['age', 'sex', 'creatinine', 'sodium'],
      excludedColumns: ['patient_id'],
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// prepSettingsSchema
// ---------------------------------------------------------------------------
describe('prepSettingsSchema', () => {
  const validBase = {
    testSize: 0.2,
    missingStrategy: 'median' as const,
    normalizeMethod: 'zscore' as const,
    applySmote: false,
  }

  it('rejects testSize above 0.4', () => {
    const result = prepSettingsSchema.safeParse({ ...validBase, testSize: 0.5 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages.some((m) => m.toLowerCase().includes('40'))).toBe(true)
    }
  })

  it('rejects testSize below 0.1', () => {
    const result = prepSettingsSchema.safeParse({ ...validBase, testSize: 0.05 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages.some((m) => m.toLowerCase().includes('10'))).toBe(true)
    }
  })

  it('rejects an invalid missingStrategy', () => {
    const result = prepSettingsSchema.safeParse({ ...validBase, missingStrategy: 'mean' })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid normalizeMethod', () => {
    const result = prepSettingsSchema.safeParse({ ...validBase, normalizeMethod: 'standardize' })
    expect(result.success).toBe(false)
  })

  it('accepts valid settings with testSize 0.2', () => {
    const result = prepSettingsSchema.safeParse(validBase)
    expect(result.success).toBe(true)
  })

  it('accepts testSize exactly at 0.1', () => {
    const result = prepSettingsSchema.safeParse({ ...validBase, testSize: 0.1 })
    expect(result.success).toBe(true)
  })

  it('accepts testSize exactly at 0.4', () => {
    const result = prepSettingsSchema.safeParse({ ...validBase, testSize: 0.4 })
    expect(result.success).toBe(true)
  })

  it('accepts all valid missingStrategy values', () => {
    for (const strategy of ['median', 'mode', 'remove'] as const) {
      const result = prepSettingsSchema.safeParse({ ...validBase, missingStrategy: strategy })
      expect(result.success).toBe(true)
    }
  })

  it('accepts all valid normalizeMethod values', () => {
    for (const method of ['zscore', 'minmax', 'none'] as const) {
      const result = prepSettingsSchema.safeParse({ ...validBase, normalizeMethod: method })
      expect(result.success).toBe(true)
    }
  })
})
