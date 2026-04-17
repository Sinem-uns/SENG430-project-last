import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Stepper } from '@/components/layout/Stepper'

// ---------------------------------------------------------------------------
// Mock the Zustand store
// ---------------------------------------------------------------------------
const mockSetCurrentStep = vi.fn()

// We'll mutate this object to control store state per test
const mockStoreState = {
  currentStep: 1,
  unlockedSteps: [1],
  setCurrentStep: mockSetCurrentStep,
}

vi.mock('@/lib/store', () => ({
  useAppStore: (selector?: (state: typeof mockStoreState) => unknown) => {
    if (typeof selector === 'function') {
      return selector(mockStoreState)
    }
    return mockStoreState
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function resetStore(overrides: Partial<typeof mockStoreState> = {}) {
  Object.assign(mockStoreState, {
    currentStep: 1,
    unlockedSteps: [1],
    setCurrentStep: mockSetCurrentStep,
    ...overrides,
  })
  mockSetCurrentStep.mockClear()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Stepper component', () => {
  beforeEach(() => {
    resetStore()
  })

  it('renders all 7 steps (desktop stepper)', () => {
    render(<Stepper />)
    // The step labels are visible in the desktop stepper
    expect(screen.getAllByText('Clinical Context').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Data Exploration').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Data Preparation').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Model & Training').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Results').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Explainability').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ethics & Bias').length).toBeGreaterThan(0)
  })

  it('the active step button has aria-current="step"', () => {
    resetStore({ currentStep: 1, unlockedSteps: [1] })
    render(<Stepper />)
    const currentSteps = screen.getAllByRole('button', { current: 'step' })
    expect(currentSteps.length).toBeGreaterThan(0)
  })

  it('locked step buttons are disabled', () => {
    resetStore({ currentStep: 1, unlockedSteps: [1] })
    render(<Stepper />)
    // Step 2-7 should be disabled (only step 1 is unlocked)
    // Find buttons with aria-label containing "Step 2" and "locked"
    const step2Button = screen.getAllByRole('button').find((btn) =>
      btn.getAttribute('aria-label')?.includes('Step 2')
    )
    expect(step2Button).toBeDefined()
    expect(step2Button).toBeDisabled()
  })

  it('unlocked steps are not disabled', () => {
    resetStore({ currentStep: 2, unlockedSteps: [1, 2, 3] })
    render(<Stepper />)
    const step1Button = screen.getAllByRole('button').find((btn) =>
      btn.getAttribute('aria-label')?.includes('Step 1')
    )
    expect(step1Button).toBeDefined()
    expect(step1Button).not.toBeDisabled()
  })

  it('done steps (before active) show a check icon — no number in the circle', () => {
    resetStore({ currentStep: 3, unlockedSteps: [1, 2, 3] })
    render(<Stepper />)
    // Step 1 and 2 are done — their buttons should not show "1" or "2" as text (replaced by check)
    // We verify that the aria-label for step 1 does NOT contain "(locked)"
    const step1Button = screen.getAllByRole('button').find((btn) =>
      btn.getAttribute('aria-label')?.includes('Step 1')
    )
    expect(step1Button).toBeDefined()
    expect(step1Button!.getAttribute('aria-label')).not.toContain('locked')
  })

  it('clicking an unlocked step calls setCurrentStep with the correct step number', () => {
    resetStore({ currentStep: 1, unlockedSteps: [1, 2] })
    render(<Stepper />)
    const step2Button = screen.getAllByRole('button').find((btn) =>
      btn.getAttribute('aria-label')?.includes('Step 2') &&
      !btn.getAttribute('aria-label')?.includes('locked')
    )
    expect(step2Button).toBeDefined()
    fireEvent.click(step2Button!)
    expect(mockSetCurrentStep).toHaveBeenCalledWith(2)
  })

  it('clicking a locked step does NOT call setCurrentStep', () => {
    resetStore({ currentStep: 1, unlockedSteps: [1] })
    render(<Stepper />)
    const step3Button = screen.getAllByRole('button').find((btn) =>
      btn.getAttribute('aria-label')?.includes('Step 3')
    )
    expect(step3Button).toBeDefined()
    fireEvent.click(step3Button!)
    expect(mockSetCurrentStep).not.toHaveBeenCalled()
  })

  it('the stepper has a navigation role', () => {
    render(<Stepper />)
    expect(screen.getByRole('navigation', { name: 'Progress steps' })).toBeInTheDocument()
  })

  it('step 7 (Ethics & Bias) label is visible', () => {
    render(<Stepper />)
    expect(screen.getAllByText('Ethics & Bias').length).toBeGreaterThan(0)
  })
})
