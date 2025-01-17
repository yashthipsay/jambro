import { Navbar } from './components/navbar'
import { Sidebar } from './components/sidebar'
import { LandingContent } from './components/landing-content'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#191970] to-[#0C0C3C]">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <LandingContent />
      </div>
    </main>
  )
}