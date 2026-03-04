/**
 * Root Layout
 *
 * Root layout component for Next.js App Router.
 * Includes global styles and metadata.
 *
 * @MX:ANCHOR: Root layout component (fan_in: all pages)
 * @MX:REASON: Single root layout for entire application
 * @MX:SPEC: SPEC-UI-001
 */

import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Say Mat-go Reboot - Modern Korean Card Game',
  description: 'Modern implementation of the traditional Korean card game',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: ['#1f2937'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
