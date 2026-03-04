/**
 * Avatar Component Tests
 *
 * Tests for the player avatar component that displays player representation
 * with emoji or image, online/offline status, and proper styling.
 *
 * @MX:SPEC: SPEC-UI-001
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from './Avatar'

describe('Avatar Component', () => {
  describe('Rendering', () => {
    it('should render avatar with emoji', () => {
      render(<Avatar emoji="👤" playerName="Player 1" />)

      expect(screen.getByText('👤')).toBeInTheDocument()
      expect(screen.getByText('Player 1')).toBeInTheDocument()
    })

    it('should render avatar with image URL', () => {
      render(
        <Avatar
          imageUrl="https://example.com/avatar.png"
          playerName="Player 1"
        />
      )

      const image = screen.getByRole('img')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/avatar.png')
      expect(image).toHaveAttribute('alt', 'Player 1 아바타')
    })

    it('should prioritize emoji over image when both provided', () => {
      render(
        <Avatar
          emoji="🎮"
          imageUrl="https://example.com/avatar.png"
          playerName="Player 1"
        />
      )

      // Emoji should be displayed (there's still an img role for the emoji div)
      expect(screen.getByText('🎮')).toBeInTheDocument()
      // But there should be no img tag (only div with role="img")
      const images = screen.getAllByRole('img')
      expect(images.length).toBe(1)
      expect(images[0]).toHaveTextContent('🎮')
    })

    it('should use default emoji when none provided', () => {
      render(<Avatar playerName="Player 1" />)

      expect(screen.getByText('👤')).toBeInTheDocument()
    })

    it('should display player name', () => {
      render(<Avatar emoji="🎮" playerName="Alice" />)

      expect(screen.getByText('Alice')).toBeInTheDocument()
    })
  })

  describe('Online Status', () => {
    it('should show online indicator when isOnline is true', () => {
      render(<Avatar emoji="🎮" playerName="Player 1" isOnline={true} />)

      const status = screen.getByLabelText(/온라인/)
      expect(status).toBeInTheDocument()

      // Check for the green dot inside the status element
      const dot = status.querySelector('.bg-green-500')
      expect(dot).toBeInTheDocument()
    })

    it('should show offline indicator when isOnline is false', () => {
      render(<Avatar emoji="🎮" playerName="Player 1" isOnline={false} />)

      const status = screen.getByLabelText(/오프라인/)
      expect(status).toBeInTheDocument()

      // Check for the gray dot inside the status element
      const dot = status.querySelector('.bg-gray-500')
      expect(dot).toBeInTheDocument()
    })

    it('should default to online when isOnline not provided', () => {
      render(<Avatar emoji="🎮" playerName="Player 1" />)

      const status = screen.getByLabelText(/온라인/)
      expect(status).toBeInTheDocument()
    })

    it('should display online status text', () => {
      render(<Avatar emoji="🎮" playerName="Player 1" isOnline={true} />)

      expect(screen.getByText('온라인')).toBeInTheDocument()
    })

    it('should display offline status text', () => {
      render(<Avatar emoji="🎮" playerName="Player 1" isOnline={false} />)

      expect(screen.getByText('오프라인')).toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    it('should render with small size', () => {
      const { container } = render(
        <Avatar emoji="🎮" playerName="Player 1" size="small" />
      )

      const avatar = container.querySelector('.w-12')
      expect(avatar).toBeInTheDocument()
    })

    it('should render with medium size', () => {
      const { container } = render(
        <Avatar emoji="🎮" playerName="Player 1" size="medium" />
      )

      const avatar = container.querySelector('.w-16')
      expect(avatar).toBeInTheDocument()
    })

    it('should render with large size', () => {
      const { container } = render(
        <Avatar emoji="🎮" playerName="Player 1" size="large" />
      )

      const avatar = container.querySelector('.w-20')
      expect(avatar).toBeInTheDocument()
    })

    it('should default to medium size', () => {
      const { container } = render(
        <Avatar emoji="🎮" playerName="Player 1" />
      )

      const avatar = container.querySelector('.w-16')
      expect(avatar).toBeInTheDocument()
    })
  })

  describe('Layout and Styling', () => {
    it('should use flexbox layout', () => {
      const { container } = render(
        <Avatar emoji="🎮" playerName="Player 1" />
      )

      const avatar = container.querySelector('.flex')
      expect(avatar).toBeInTheDocument()
    })

    it('should have gap between avatar and info', () => {
      const { container } = render(
        <Avatar emoji="🎮" playerName="Player 1" />
      )

      const avatar = container.querySelector('.gap-3')
      expect(avatar).toBeInTheDocument()
    })

    it('should center items vertically', () => {
      const { container } = render(
        <Avatar emoji="🎮" playerName="Player 1" />
      )

      const avatar = container.querySelector('.items-center')
      expect(avatar).toBeInTheDocument()
    })

    it('should have rounded corners', () => {
      const { container } = render(
        <Avatar emoji="🎮" playerName="Player 1" />
      )

      const avatar = container.querySelector('.rounded-full')
      expect(avatar).toBeInTheDocument()
    })

    it('should have padding', () => {
      const { container } = render(
        <Avatar emoji="🎮" playerName="Player 1" />
      )

      const avatar = container.querySelector('.p-3')
      expect(avatar).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<Avatar emoji="🎮" playerName="Player 1" isOnline={true} />)

      const avatar = screen.getByRole('img', { name: /Player 1/ })
      expect(avatar).toBeInTheDocument()
    })

    it('should announce online status to screen readers', () => {
      render(<Avatar emoji="🎮" playerName="Player 1" isOnline={true} />)

      const status = screen.getByLabelText('Player 1 온라인 상태')
      expect(status).toBeInTheDocument()
    })

    it('should announce offline status to screen readers', () => {
      render(<Avatar emoji="🎮" playerName="Player 1" isOnline={false} />)

      const status = screen.getByLabelText('Player 1 오프라인 상태')
      expect(status).toBeInTheDocument()
    })
  })

  describe('Visual Indicators', () => {
    it('should have circular avatar container', () => {
      const { container } = render(
        <Avatar emoji="🎮" playerName="Player 1" />
      )

      const avatar = container.querySelector('.rounded-full')
      expect(avatar).toBeInTheDocument()
    })

    it('should have background color', () => {
      const { container } = render(
        <Avatar emoji="🎮" playerName="Player 1" />
      )

      const avatar = container.querySelector('.bg-gray-800')
      expect(avatar).toBeInTheDocument()
    })

    it('should have shadow', () => {
      const { container } = render(
        <Avatar emoji="🎮" playerName="Player 1" />
      )

      const avatar = container.querySelector('.shadow-md')
      expect(avatar).toBeInTheDocument()
    })

    it('should have status indicator dot', () => {
      const { container } = render(
        <Avatar emoji="🎮" playerName="Player 1" isOnline={true} />
      )

      const dot = container.querySelector('.w-3.h-3')
      expect(dot).toBeInTheDocument()
    })
  })

  describe('Player Name Display', () => {
    it('should display name in bold', () => {
      const { container } = render(
        <Avatar emoji="🎮" playerName="Alice" />
      )

      const name = container.querySelector('.font-bold')
      expect(name).toBeInTheDocument()
      expect(name).toHaveTextContent('Alice')
    })

    it('should handle long player names', () => {
      render(
        <Avatar
          emoji="🎮"
          playerName="Very Long Player Name That Goes On"
        />
      )

      expect(
        screen.getByText('Very Long Player Name That Goes On')
      ).toBeInTheDocument()
    })

    it('should handle special characters in player names', () => {
      render(<Avatar emoji="🎮" playerName="Player@123" />)

      expect(screen.getByText('Player@123')).toBeInTheDocument()
    })

    it('should truncate very long names', () => {
      const { container } = render(
        <Avatar
          emoji="🎮"
          playerName="This is an extremely long player name that should be truncated"
        />
      )

      const name = container.querySelector('.truncate')
      expect(name).toBeInTheDocument()
    })
  })

  describe('Emoji Display', () => {
    it('should display emoji in appropriate size', () => {
      const { container } = render(
        <Avatar emoji="🎮" playerName="Player 1" size="medium" />
      )

      const emoji = container.querySelector('.text-3xl')
      expect(emoji).toBeInTheDocument()
    })

    it('should scale emoji with size prop', () => {
      const { container: smallContainer } = render(
        <Avatar emoji="🎮" playerName="Player 1" size="small" />
      )
      const { container: largeContainer } = render(
        <Avatar emoji="🎮" playerName="Player 1" size="large" />
      )

      const smallEmoji = smallContainer.querySelector('.text-2xl')
      const largeEmoji = largeContainer.querySelector('.text-4xl')

      expect(smallEmoji).toBeInTheDocument()
      expect(largeEmoji).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty player name', () => {
      render(<Avatar emoji="🎮" playerName="" />)

      expect(screen.getByText('🎮')).toBeInTheDocument()
    })

    it('should handle missing emoji and image', () => {
      render(<Avatar playerName="Player 1" />)

      expect(screen.getByText('👤')).toBeInTheDocument()
    })

    it('should handle undefined player name', () => {
      render(<Avatar emoji="🎮" playerName={undefined} />)

      expect(screen.getByText('🎮')).toBeInTheDocument()
    })
  })
})
