import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from '@auth0/nextjs-auth0/client';


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
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
      </UserProvider>
    </html>
  );
}