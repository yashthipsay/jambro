'use client'
import { Navbar } from './components/navbar'
import { Sidebar } from './components/sidebar'
import { LandingContent } from './components/landing-content'

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-cover bg-center bg-[url('https://gigsaw.s3.eu-north-1.amazonaws.com/3d-music-related-scene.jpg')]">
      {/* Dark overlay to prevent text overlap */}
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>

      {/* Position content above overlay */}
      <div className="relative text-white">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <LandingContent />
        </div>
      </div>
    </main>
  )
}