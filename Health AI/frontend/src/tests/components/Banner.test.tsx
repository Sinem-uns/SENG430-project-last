import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Banner } from '@/components/shared/Banner'

describe('Banner component', () => {
  it('renders with the provided message', () => {
    render(<Banner variant="success" message="Operation completed" />)
    expect(screen.getByText('Operation completed')).toBeInTheDocument()
  })

  it('renders with a title when provided', () => {
    render(<Banner variant="success" title="Success!" message="All done." />)
    expect(screen.getByText('Success!')).toBeInTheDocument()
    expect(screen.getByText('All done.')).toBeInTheDocument()
  })

  it('renders success variant with green styling class', () => {
    const { container } = render(<Banner variant="success" message="Good job" />)
    const alertDiv = container.querySelector('[role="alert"]')
    expect(alertDiv).not.toBeNull()
    // The success container class contains clinical-success
    expect(alertDiv!.className).toContain('clinical-success')
  })

  it('renders error variant with red/danger styling class', () => {
    const { container } = render(<Banner variant="error" message="Something went wrong" />)
    const alertDiv = container.querySelector('[role="alert"]')
    expect(alertDiv).not.toBeNull()
    expect(alertDiv!.className).toContain('clinical-danger')
  })

  it('renders danger variant with danger styling class', () => {
    const { container } = render(<Banner variant="danger" message="Critical warning" />)
    const alertDiv = container.querySelector('[role="alert"]')
    expect(alertDiv).not.toBeNull()
    expect(alertDiv!.className).toContain('clinical-danger')
  })

  it('shows dismiss button when dismissible=true', () => {
    render(<Banner variant="info" message="Click X to close" dismissible={true} />)
    const dismissButton = screen.getByLabelText('Dismiss')
    expect(dismissButton).toBeInTheDocument()
  })

  it('does not show dismiss button when dismissible=false (default)', () => {
    render(<Banner variant="info" message="No dismiss" />)
    expect(screen.queryByLabelText('Dismiss')).toBeNull()
  })

  it('disappears when dismiss button is clicked', () => {
    render(<Banner variant="warning" message="Dismissible banner" dismissible={true} />)
    const alertDiv = screen.getByRole('alert')
    expect(alertDiv).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Dismiss'))
    // After dismissal the component returns null
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('calls onDismiss callback when dismissed', () => {
    const onDismiss = vi.fn()
    render(
      <Banner
        variant="error"
        message="Will call callback"
        dismissible={true}
        onDismiss={onDismiss}
      />
    )
    fireEvent.click(screen.getByLabelText('Dismiss'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('shows icon by default (icon=true)', () => {
    const { container } = render(<Banner variant="success" message="With icon" icon={true} />)
    // Icon is rendered as an SVG inside the alert
    const svg = container.querySelector('[role="alert"] svg')
    expect(svg).not.toBeNull()
  })

  it('hides icon when icon=false', () => {
    const { container } = render(<Banner variant="success" message="No icon" icon={false} />)
    // The icon is not rendered at all because of the icon && condition
    // The svg for the CheckCircle should not appear (no icon prop passed to the icon slot)
    // There is still the X button's svg if dismissible, but icon=false means no status icon
    const alertDiv = container.querySelector('[role="alert"]')
    expect(alertDiv).not.toBeNull()
    // With icon=false and no dismissible, no SVG at all
    const svgs = container.querySelectorAll('[role="alert"] svg')
    expect(svgs.length).toBe(0)
  })

  it('renders warning variant', () => {
    const { container } = render(<Banner variant="warning" message="Take care" />)
    const alertDiv = container.querySelector('[role="alert"]')
    expect(alertDiv!.className).toContain('clinical-warning')
  })

  it('renders info variant', () => {
    const { container } = render(<Banner variant="info" message="Just so you know" />)
    const alertDiv = container.querySelector('[role="alert"]')
    expect(alertDiv!.className).toContain('clinical-info')
  })
})
