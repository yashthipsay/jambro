'use client'
import { Navbar } from './navbar'
import { Sidebar } from './sidebar'

export function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-2">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 pl-72 pt-24 pr-4">
          {children}
        </main>
      </div>
    </div>
  )
}