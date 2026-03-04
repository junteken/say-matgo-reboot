/**
 * Home Page
 *
 * Main landing page for the Say Mat-go game.
 *
 * @MX:NOTE: Home page component
 * @MX:SPEC: SPEC-UI-001
 */

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Say Mat-go Reboot</h1>
        <p className="text-gray-400 mb-8">
          Modern Korean Card Game
        </p>
        <div className="space-x-4">
          <button className="btn-primary">
            New Game
          </button>
          <button className="btn-secondary">
            Join Game
          </button>
        </div>
      </div>
    </main>
  )
}
