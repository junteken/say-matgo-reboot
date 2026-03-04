/**
 * ControlPanel Component Tests
 *
 * Tests for the control panel component that provides game controls
 * (Go/Stop buttons) with animations and state indicators.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ControlPanel } from './ControlPanel'

describe('ControlPanel Component', () => {
  describe('Rendering', () => {
    it('should render Go button', () => {
      render(
        <ControlPanel
          canGo={true}
          canStop={true}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      expect(screen.getByRole('button', { name: /고/ })).toBeInTheDocument()
    })

    it('should render Stop button', () => {
      render(
        <ControlPanel
          canGo={true}
          canStop={true}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      expect(screen.getByRole('button', { name: /스톱/ })).toBeInTheDocument()
    })

    it('should display current Go count', () => {
      render(
        <ControlPanel
          canGo={true}
          canStop={true}
          goCount={2}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      expect(screen.getByText(/2고/)).toBeInTheDocument()
    })

    it('should display Go count as 0 when not provided', () => {
      render(
        <ControlPanel
          canGo={true}
          canStop={true}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      expect(screen.getByText(/0고/)).toBeInTheDocument()
    })
  })

  describe('Button States', () => {
    it('should enable Go button when canGo is true', () => {
      render(
        <ControlPanel
          canGo={true}
          canStop={false}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      const goButton = screen.getByRole('button', { name: /고/ })
      expect(goButton).not.toBeDisabled()
    })

    it('should disable Go button when canGo is false', () => {
      render(
        <ControlPanel
          canGo={false}
          canStop={true}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      const goButton = screen.getByRole('button', { name: /고/ })
      expect(goButton).toBeDisabled()
    })

    it('should enable Stop button when canStop is true', () => {
      render(
        <ControlPanel
          canGo={false}
          canStop={true}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      const stopButton = screen.getByRole('button', { name: /스톱/ })
      expect(stopButton).not.toBeDisabled()
    })

    it('should disable Stop button when canStop is false', () => {
      render(
        <ControlPanel
          canGo={true}
          canStop={false}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      const stopButton = screen.getByRole('button', { name: /스톱/ })
      expect(stopButton).toBeDisabled()
    })

    it('should disable both buttons when both canGo and canStop are false', () => {
      render(
        <ControlPanel
          canGo={false}
          canStop={false}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      const goButton = screen.getByRole('button', { name: /고/ })
      const stopButton = screen.getByRole('button', { name: /스톱/ })

      expect(goButton).toBeDisabled()
      expect(stopButton).toBeDisabled()
    })
  })

  describe('User Interactions', () => {
    it('should call onGo when Go button is clicked', () => {
      const handleGo = vi.fn()

      render(
        <ControlPanel
          canGo={true}
          canStop={true}
          onGo={handleGo}
          onStop={() => {}}
        />
      )

      const goButton = screen.getByRole('button', { name: /고/ })
      fireEvent.click(goButton)

      expect(handleGo).toHaveBeenCalledTimes(1)
    })

    it('should call onStop when Stop button is clicked', () => {
      const handleStop = vi.fn()

      render(
        <ControlPanel
          canGo={true}
          canStop={true}
          onGo={() => {}}
          onStop={handleStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /스톱/ })
      fireEvent.click(stopButton)

      expect(handleStop).toHaveBeenCalledTimes(1)
    })

    it('should not call onGo when Go button is disabled and clicked', () => {
      const handleGo = vi.fn()

      render(
        <ControlPanel
          canGo={false}
          canStop={true}
          onGo={handleGo}
          onStop={() => {}}
        />
      )

      const goButton = screen.getByRole('button', { name: /고/ })
      fireEvent.click(goButton)

      expect(handleGo).not.toHaveBeenCalled()
    })

    it('should not call onStop when Stop button is disabled and clicked', () => {
      const handleStop = vi.fn()

      render(
        <ControlPanel
          canGo={true}
          canStop={false}
          onGo={() => {}}
          onStop={handleStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /스톱/ })
      fireEvent.click(stopButton)

      expect(handleStop).not.toHaveBeenCalled()
    })

    it('should handle keyboard interaction (Enter key) on Go button', () => {
      const handleGo = vi.fn()

      render(
        <ControlPanel
          canGo={true}
          canStop={true}
          onGo={handleGo}
          onStop={() => {}}
        />
      )

      const goButton = screen.getByRole('button', { name: /고/ })
      fireEvent.keyDown(goButton, { key: 'Enter' })

      expect(handleGo).toHaveBeenCalledTimes(1)
    })

    it('should handle keyboard interaction (Space key) on Stop button', () => {
      const handleStop = vi.fn()

      render(
        <ControlPanel
          canGo={true}
          canStop={true}
          onGo={() => {}}
          onStop={handleStop}
        />
      )

      const stopButton = screen.getByRole('button', { name: /스톱/ })
      fireEvent.keyDown(stopButton, { key: ' ' })

      expect(handleStop).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <ControlPanel
          canGo={true}
          canStop={true}
          goCount={2}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      const goButton = screen.getByRole('button', { name: /고/ })
      const stopButton = screen.getByRole('button', { name: /스톱/ })

      expect(goButton).toHaveAttribute('aria-label')
      expect(stopButton).toHaveAttribute('aria-label')
    })

    it('should indicate disabled state with ARIA', () => {
      render(
        <ControlPanel
          canGo={false}
          canStop={true}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      const goButton = screen.getByRole('button', { name: /고/ })
      expect(goButton).toHaveAttribute('aria-disabled', 'true')
    })

    it('should have proper role for control panel', () => {
      render(
        <ControlPanel
          canGo={true}
          canStop={true}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      const panel = screen.getByRole('region', { name: /게임 컨트롤/ })
      expect(panel).toBeInTheDocument()
    })

    it('should make buttons focusable with tab index', () => {
      render(
        <ControlPanel
          canGo={true}
          canStop={true}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      const goButton = screen.getByRole('button', { name: /고/ })
      const stopButton = screen.getByRole('button', { name: /스톱/ })

      expect(goButton).toHaveAttribute('tabIndex', '0')
      expect(stopButton).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('Layout and Styling', () => {
    it('should apply Go button styling', () => {
      const { container } = render(
        <ControlPanel
          canGo={true}
          canStop={true}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      const goButton = screen.getByRole('button', { name: /고/ })
      expect(goButton).toHaveClass('btn-primary')
    })

    it('should apply Stop button styling', () => {
      const { container } = render(
        <ControlPanel
          canGo={true}
          canStop={true}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      const stopButton = screen.getByRole('button', { name: /스톱/ })
      expect(stopButton).toHaveClass('btn-danger')
    })

    it('should display buttons in horizontal layout', () => {
      const { container } = render(
        <ControlPanel
          canGo={true}
          canStop={true}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      const panel = container.querySelector('.flex')
      expect(panel).toBeInTheDocument()
    })

    it('should have gap between buttons', () => {
      const { container } = render(
        <ControlPanel
          canGo={true}
          canStop={true}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      const panel = container.querySelector('.gap-3')
      expect(panel).toBeInTheDocument()
    })
  })

  describe('Go Count Display', () => {
    it('should show Go count indicator', () => {
      render(
        <ControlPanel
          canGo={true}
          canStop={true}
          goCount={3}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      expect(screen.getByText('3고')).toBeInTheDocument()
    })

    it('should update Go count when prop changes', () => {
      const { rerender } = render(
        <ControlPanel
          canGo={true}
          canStop={true}
          goCount={1}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      expect(screen.getByText('1고')).toBeInTheDocument()

      rerender(
        <ControlPanel
          canGo={true}
          canStop={true}
          goCount={2}
          onGo={() => {}}
          onStop={() => {}}
        />
      )

      expect(screen.getByText('2고')).toBeInTheDocument()
    })
  })
})
