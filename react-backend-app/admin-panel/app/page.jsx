'use client'
import { Navbar } from './components/navbar'
import { Sidebar } from './components/sidebar'
import { LandingContent } from './components/landing-content'
import OneSignal from "react-onesignal";
import {useState, useEffect} from 'react'

export default function HomePage() {
  useEffect(() => {
    const initOneSignal = async () => {
      try {
        
        await OneSignal.init({
          appId: "c5c4fe85-5fe4-42e8-aaf4-c8edbfe967a9",
          notifyButton: {
            enable: true,
          },
          allowLocalhostAsSecureOrigin: true,    
        });
        const deviceState = OneSignal.User.PushSubscription
        console.log("Device State:", deviceState);
        const isEnabled = window.OneSignal.Notifications.isPushSupported();
        console.log("Push notifications enabled:", isEnabled);

        const userId =  OneSignal.User.PushSubscription.id;
        console.log("User ID:", userId);
      } catch (error) {
        console.error("Error initializing OneSignal:", error);
      }
    };

    initOneSignal();
    return () => {
      if (typeof window !== 'undefined') {
        window.OneSignal = undefined;
      }
    };
  }, []);

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