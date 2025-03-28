'use client';
import { LandingContent } from './components/landing-content';
import OneSignal from 'react-onesignal';
import { useState, useEffect } from 'react';

export default function HomePage() {
  useEffect(() => {
    const initOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: 'c5c4fe85-5fe4-42e8-aaf4-c8edbfe967a9',
          notifyButton: {
            enable: true,
          },
          allowLocalhostAsSecureOrigin: true,
        });
        const deviceState = OneSignal.User.PushSubscription;
        console.log('Device State:', deviceState);
        const isEnabled = window.OneSignal.Notifications.isPushSupported();
        console.log('Push notifications enabled:', isEnabled);

        const userId = OneSignal.User.PushSubscription.id;
        console.log('User ID:', userId);
      } catch (error) {
        console.error('Error initializing OneSignal:', error);
      }
    };

    initOneSignal();
    return () => {
      if (typeof window !== 'undefined') {
        window.OneSignal = undefined;
      }
    };
  }, []);

  return <LandingContent />;
}
