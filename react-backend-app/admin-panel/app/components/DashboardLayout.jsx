'use client';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { useRouter } from 'next/navigation';
import { useDashboard } from '../context/DashboardContext';

export function DashboardLayout({ children }) {
  const { loading } = useDashboard();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // bg-[url('https://gigsaw.s3.eu-north-1.amazonaws.com/3d-music-related-scene.jpg')]
  return (
    <div className="relative min-h-screen bg-cover bg-center">
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      <div className="relative text-white flex flex-col">
        <Navbar />
        <div className="flex-1 overflow-hidden">
          {/* Main content area with padding adjustment for mobile */}
          <div className="overflow-auto pb-6 md:pb-6 md:pl-72">
            {children}
          </div>
        </div>
        
        {/* Sidebar handles its own responsive behavior */}
        <Sidebar />
      </div>
    </div>
  );
}
