import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricCard } from '@/components/shared/MetricCard'

// MetricCard uses Tooltip from Radix UI. We provide a simple wrapper.
// Radix UI components work in jsdom with some limitations on portal rendering.

const defaultProps = {
  label: 'Sensitivity',
  value: 0.82,
  description: 'Proportion of actual positives correctly identified.',
  concern: 'Low sensitivity means missed cases.',
  status: 'good' as const,
}

describe('MetricCard component', () => {
  it('renders the metric label', () => {
    render(<MetricCard {...defaultProps} />)
    expect(screen.getByText('Sensitivity')).toBeInTheDocument()
  })

  it('renders the metric value formatted as a percentage', () => {
    render(<MetricCard {...defaultProps} value={0.82} />)
    expect(screen.getByText('82.0%')).toBeInTheDocument()
  })

  it('renders 0.0% for a value of 0', () => {
    render(<MetricCard {...defaultProps} value={0} />)
    expect(screen.getByText('0.0%')).toBeInTheDocument()
  })

  it('renders 100.0% for a value of 1', () => {
    render(<MetricCard {...defaultProps} value={1} />)
    expect(screen.getByText('100.0%')).toBeInTheDocument()
  })

  it('shows "Good" badge for status=good', () => {
    render(<MetricCard {...defaultProps} status="good" />)
    expect(screen.getByText('Good')).toBeInTheDocument()
  })

  it('shows "Review" badge for status=warning', () => {
    render(<MetricCard {...defaultProps} status="warning" />)
    expect(screen.getByText('Review')).toBeInTheDocument()
  })

  it('shows "Concern" badge for status=danger', () => {
    render(<MetricCard {...defaultProps} status="danger" />)
    expect(screen.getByText('Concern')).toBeInTheDocument()
  })

  it('applies green styling class for good status', () => {
    const { container } = render(<MetricCard {...defaultProps} status="good" />)
    // The value span has text-clinical-success class for good status
    const valueEl = container.querySelector('.text-clinical-success.tabular-nums')
    expect(valueEl).not.toBeNull()
  })

  it('applies red/danger styling class for danger status', () => {
    const { container } = render(
      <MetricCard
        {...defaultProps}
        value={0.3}
        status="danger"
        label="Sensitivity"
        description="Low sensitivity"
        concern="Very low"
      />
    )
    const valueEl = container.querySelector('.text-clinical-danger.tabular-nums')
    expect(valueEl).not.toBeNull()
  })

  it('shows "Key" badge when emphasized=true', () => {
    render(<MetricCard {...defaultProps} emphasized={true} />)
    expect(screen.getByText('Key')).toBeInTheDocument()
  })

  it('does not show "Key" badge when emphasized=false (default)', () => {
    render(<MetricCard {...defaultProps} emphasized={false} />)
    expect(screen.queryByText('Key')).toBeNull()
  })

  it('applies ring class when emphasized=true', () => {
    const { container } = render(<MetricCard {...defaultProps} emphasized={true} />)
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('ring-2')
  })

  it('description text is visible in the card', () => {
    render(
      <MetricCard
        {...defaultProps}
        description="Proportion of actual positives correctly identified."
      />
    )
    expect(
      screen.getByText('Proportion of actual positives correctly identified.')
    ).toBeInTheDocument()
  })

  it('renders the info button for tooltip trigger', () => {
    render(<MetricCard {...defaultProps} />)
    const infoButton = screen.getByRole('button', { name: /about sensitivity/i })
    expect(infoButton).toBeInTheDocument()
  })
})
