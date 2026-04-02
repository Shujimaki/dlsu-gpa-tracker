import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DeansListModal,
  GPACalculationModal,
  type InstructionModalProps,
} from '../InstructionModals'

describe('DeansListModal', () => {
  const mockOnClose = vi.fn()
  const defaultProps: InstructionModalProps = {
    isOpen: true,
    onClose: mockOnClose,
  }

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  it('renders modal heading when isOpen is true', () => {
    render(<DeansListModal {...defaultProps} />)
    expect(screen.getByRole('heading', { name: /dean's list requirements/i })).toBeVisible()
  })

  it('renders all requirement items', () => {
    render(<DeansListModal {...defaultProps} />)
    expect(screen.getByText(/enrolled in at least 12 academic units/i)).toBeVisible()
    expect(screen.getByText(/gpa of 3\.4 or higher/i)).toBeVisible()
    expect(screen.getByText(/gpa of 3\.0 to 3\.39/i)).toBeVisible()
  })

  it('renders a close modal X button', () => {
    render(<DeansListModal {...defaultProps} />)
    expect(screen.getByRole('button', { name: /close modal/i })).toBeVisible()
  })

  it('closes modal when X button is clicked', async () => {
    const user = userEvent.setup()
    render(<DeansListModal {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: /close modal/i }))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('closes modal when Close button is clicked', async () => {
    const user = userEvent.setup()
    render(<DeansListModal {...defaultProps} />)
    // Use getAllByText since footer button is just "Close"
    const closeBtns = screen.getAllByText('Close')
    const footerBtn = closeBtns.find(el =>
      el.closest('.border-t')
    ) as HTMLElement
    expect(footerBtn).toBeInTheDocument()
    await user.click(footerBtn)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('does not render when isOpen is false', () => {
    render(<DeansListModal isOpen={false} onClose={mockOnClose} />)
    expect(screen.queryByRole('heading', { name: /dean's list requirements/i })).toBeNull()
  })
})

describe('GPACalculationModal', () => {
  const mockOnClose = vi.fn()
  const defaultProps: InstructionModalProps = {
    isOpen: true,
    onClose: mockOnClose,
  }

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  it('renders modal heading when isOpen is true', () => {
    render(<GPACalculationModal {...defaultProps} />)
    expect(screen.getByRole('heading', { name: /how gpa is calculated/i })).toBeVisible()
  })

  it('renders the GPA formula', () => {
    render(<GPACalculationModal {...defaultProps} />)
    expect(screen.getByText(/\u03a3/i)).toBeVisible()
    expect(screen.getAllByText(/grade/i)).toHaveLength(3)
  })

  it('renders the NAS note', () => {
    render(<GPACalculationModal {...defaultProps} />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/non-academic subjects/i)
    expect(alert).toHaveTextContent(/not.*included/i)
  })

  it('closes modal when X button is clicked', async () => {
    const user = userEvent.setup()
    render(<GPACalculationModal {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: /close modal/i }))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('closes modal when Close button is clicked', async () => {
    const user = userEvent.setup()
    render(<GPACalculationModal {...defaultProps} />)
    const closeBtns = screen.getAllByText('Close')
    const footerBtn = closeBtns.find(el =>
      el.closest('.border-t')
    ) as HTMLElement
    expect(footerBtn).toBeInTheDocument()
    await user.click(footerBtn)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('does not render when isOpen is false', () => {
    render(<GPACalculationModal isOpen={false} onClose={mockOnClose} />)
    expect(screen.queryByRole('heading', { name: /how gpa is calculated/i })).toBeNull()
  })
})
