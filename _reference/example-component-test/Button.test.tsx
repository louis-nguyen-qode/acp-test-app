import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { LoadingButton } from './Button'

// Comprehensive Vitest + Testing Library tests for LoadingButton.
// Demonstrates: render, click, disabled, loading, accessibility.
// Each test has at least one expect(). No .skip or .only.

describe('LoadingButton', () => {
  // --- Render tests ---

  it('renders children as button text', () => {
    render(<LoadingButton>Save changes</LoadingButton>)

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
  })

  it('renders as a button element', () => {
    render(<LoadingButton>Click me</LoadingButton>)

    const button = screen.getByRole('button')
    expect(button.tagName).toBe('BUTTON')
  })

  // --- Click handler tests ---

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<LoadingButton onClick={onClick}>Click me</LoadingButton>)

    await user.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when clicked while disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <LoadingButton onClick={onClick} disabled>
        Click me
      </LoadingButton>
    )

    await user.click(screen.getByRole('button'))

    expect(onClick).not.toHaveBeenCalled()
  })

  // --- Disabled state tests ---

  it('is disabled when the disabled prop is true', () => {
    render(<LoadingButton disabled>Save</LoadingButton>)

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is not disabled by default', () => {
    render(<LoadingButton>Save</LoadingButton>)

    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  // --- Loading state tests ---

  it('is disabled when loading is true', () => {
    render(<LoadingButton loading>Save</LoadingButton>)

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows a spinner when loading', () => {
    render(<LoadingButton loading>Save</LoadingButton>)

    // The Loader2 icon renders as an SVG with aria-hidden
    // The button itself should indicate busy state
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('shows loadingText when loading and loadingText is provided', () => {
    render(
      <LoadingButton loading loadingText="Saving...">
        Save
      </LoadingButton>
    )

    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('shows children text when loading and no loadingText is provided', () => {
    render(<LoadingButton loading>Save</LoadingButton>)

    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('does not show spinner when not loading', () => {
    render(<LoadingButton>Save</LoadingButton>)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-busy', 'false')
  })

  it('does not call onClick when clicked while loading', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <LoadingButton onClick={onClick} loading>
        Save
      </LoadingButton>
    )

    await user.click(screen.getByRole('button'))

    expect(onClick).not.toHaveBeenCalled()
  })

  // --- Accessibility tests ---

  it('has an accessible name from its text content', () => {
    render(<LoadingButton>Delete account</LoadingButton>)

    // getByRole with accessible name verifies the button is correctly labeled
    expect(screen.getByRole('button', { name: 'Delete account' })).toBeInTheDocument()
  })

  it('sets aria-disabled when disabled', () => {
    render(<LoadingButton disabled>Save</LoadingButton>)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-disabled', 'true')
  })

  it('sets aria-busy when loading', () => {
    render(<LoadingButton loading>Save</LoadingButton>)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  // --- Variant passthrough tests ---

  it('accepts and applies className', () => {
    render(<LoadingButton className="w-full">Save</LoadingButton>)

    expect(screen.getByRole('button')).toHaveClass('w-full')
  })

  it('forwards additional props to the underlying button', () => {
    render(<LoadingButton data-testid="my-button">Save</LoadingButton>)

    expect(screen.getByTestId('my-button')).toBeInTheDocument()
  })
})
