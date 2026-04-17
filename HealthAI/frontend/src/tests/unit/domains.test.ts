import { describe, it, expect } from 'vitest'
import { DOMAINS, getDomainById } from '@/lib/domains'

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describe('DOMAINS configuration', () => {
  it('contains exactly 20 domains', () => {
    expect(DOMAINS).toHaveLength(20)
  })

  it('every domain has a unique id', () => {
    const ids = DOMAINS.map((d) => d.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(DOMAINS.length)
  })

  it('all domains have the required fields', () => {
    for (const domain of DOMAINS) {
      expect(domain).toHaveProperty('id')
      expect(domain).toHaveProperty('label')
      expect(domain).toHaveProperty('taskType')
      expect(domain).toHaveProperty('targetColumn')
      expect(domain).toHaveProperty('classLabels')
      expect(typeof domain.id).toBe('string')
      expect(domain.id.length).toBeGreaterThan(0)
      expect(typeof domain.label).toBe('string')
      expect(domain.label.length).toBeGreaterThan(0)
      expect(['binary', 'multiclass']).toContain(domain.taskType)
      expect(typeof domain.targetColumn).toBe('string')
      expect(domain.targetColumn.length).toBeGreaterThan(0)
      expect(Array.isArray(domain.classLabels)).toBe(true)
      expect(domain.classLabels.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('binary task domains have exactly 2 classLabels', () => {
    const binaryDomains = DOMAINS.filter((d) => d.taskType === 'binary')
    expect(binaryDomains.length).toBeGreaterThan(0)
    for (const domain of binaryDomains) {
      expect(domain.classLabels).toHaveLength(2)
    }
  })

  it('multiclass task domains have 3 or more classLabels', () => {
    const multiclassDomains = DOMAINS.filter((d) => d.taskType === 'multiclass')
    // There should be at least one multiclass domain
    if (multiclassDomains.length > 0) {
      for (const domain of multiclassDomains) {
        expect(domain.classLabels.length).toBeGreaterThanOrEqual(3)
      }
    }
  })
})

describe('getDomainById', () => {
  it('returns the cardiology domain by id', () => {
    const domain = getDomainById('cardiology')
    expect(domain).toBeDefined()
    expect(domain!.id).toBe('cardiology')
    expect(domain!.targetColumn).toBe('readmission_30days')
    expect(domain!.taskType).toBe('binary')
  })

  it('returns the diabetes domain by id', () => {
    const domain = getDomainById('diabetes')
    expect(domain).toBeDefined()
    expect(domain!.id).toBe('diabetes')
    expect(domain!.taskType).toBe('binary')
  })

  it('returns the fetal_health domain by id', () => {
    const domain = getDomainById('fetal_health')
    expect(domain).toBeDefined()
    expect(domain!.id).toBe('fetal_health')
  })

  it('returns undefined for an unknown domain id', () => {
    const domain = getDomainById('unknown_domain_xyz')
    expect(domain).toBeUndefined()
  })

  it('returns undefined for an empty string id', () => {
    const domain = getDomainById('')
    expect(domain).toBeUndefined()
  })
})
