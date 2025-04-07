'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import {
  Home,
  Receipt,
  Wallet,
  Music,
  UserCircle,
  Package,
  MoreHorizontal,
} from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { useDashboard } from '../context/DashboardContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function Sidebar() {
  const { user } = useUser();
  const { isRegistered, jamRoomId, fundAccountId, loading } = useDashboard();

  // Keep the original sidebar items array
  const sidebarItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Receipt, label: 'Booking History', path: `/bookings/${jamRoomId}` },
    {
      icon: Wallet,
      label: 'Payout History',
      path: `/payouts/${fundAccountId}`,
    },
    {
      icon: Package,
      label: 'Plans & Packages',
      path: `/plans-and-packages/${jamRoomId}`,
    },
    { icon: UserCircle, label: 'Profile', path: `/profile/${jamRoomId}` },
    { icon: Music, label: 'Personal Branding', path: '/branding' },
  ];

  // Split items for mobile view
  const mainItems = sidebarItems.slice(0, 3);
  const dropdownItems = sidebarItems.slice(3);

  if (loading) {
    return (
      <motion.div
        className="hidden md:block fixed left-4 top-24 bottom-4 w-64 glassmorphism p-4"
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 120 }}
      >
        <div className="flex flex-col gap-6 animate-pulse">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-12 bg-white/10 rounded" />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        className="hidden md:block fixed left-4 top-24 bottom-4 w-64 glassmorphism p-4"
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 120 }}
      >
        <div className={`flex flex-col gap-6 ${(!user || !isRegistered) && 'blur-sm'}`}>
          {sidebarItems.map((item, index) => (
            <div key={index} className="relative">
              <Link href={item.path}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-primary/20 hover:text-white transition-all duration-300 py-4"
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
              {index !== sidebarItems.length - 1 && (
                <div className="absolute bottom-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-pink-200/30 to-transparent" />
              )}
            </div>
          ))}
        </div>

        {!user && (
          <div className="mt-4">
            <Button
              onClick={() => (window.location.href = '/api/auth/login')}
              className="w-full btn-primary"
            >
              Log In to Access
            </Button>
          </div>
        )}

        {user && !isRegistered && (
          <div className="mt-4">
            <Button
              onClick={() => (window.location.href = '/registration')}
              className="w-full btn-secondary"
            >
              Complete Registration
            </Button>
          </div>
        )}
      </motion.div>

      {/* Mobile Bottom Bar */}
      <motion.div
        className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 border-t border-[#7DF9FF]/20 px-2 py-2 z-50"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 120 }}
      >
        <div className={`flex justify-around items-center ${(!user || !isRegistered) && 'blur-sm'}`}>
          {/* Main Items */}
          {mainItems.map((item) => (
            <Link key={item.label} href={item.path}>
              <Button
                variant="ghost"
                className="text-white hover:bg-primary/20 p-2"
                title={item.label}
              >
                <item.icon className="h-6 w-6" />
              </Button>
            </Link>
          ))}

          {/* Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-white hover:bg-primary/20 p-2"
              >
                <MoreHorizontal className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-black/90 border border-[#7DF9FF]/20 mb-16">
              {dropdownItems.map((item) => (
                <DropdownMenuItem key={item.label} asChild>
                  <Link href={item.path} className="flex items-center gap-2 text-white p-3">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Conditional rendering of auth buttons for mobile */}
        {!user && (
          <div className="px-4 py-2">
            <Button
              onClick={() => (window.location.href = '/api/auth/login')}
              className="w-full btn-primary text-sm"
            >
              Log In to Access
            </Button>
          </div>
        )}

        {user && !isRegistered && (
          <div className="px-4 py-2">
            <Button
              onClick={() => (window.location.href = '/registration')}
              className="w-full btn-secondary text-sm"
            >
              Complete Registration
            </Button>
          </div>
        )}
      </motion.div>
    </>
  );
}