import { Navbar } from './components/navbar'
import { Sidebar } from './components/sidebar'
import { LandingContent } from './components/landing-content'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-2">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <LandingContent />
      </div>
    </main>
  )
}