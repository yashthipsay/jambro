import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { DashboardProvider } from './context/DashboardContext'
import { DashboardLayout } from './components/DashboardLayout'


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  
  return (
    <html lang="en">
      <head>
      <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js" defer />
      </head>
      <UserProvider>
      <DashboardProvider>
      <DashboardLayout>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
        </DashboardLayout>
        </DashboardProvider>
      </UserProvider>
    </html>
  );
}