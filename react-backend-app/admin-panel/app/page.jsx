'use client';
import { LandingContent } from './components/landing-content';
import OneSignal from 'react-onesignal';
import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useDashboard } from './context/DashboardContext';

export default function HomePage() {
  const { user } = useUser();
  const { jamRoomId } = useDashboard();

  useEffect(() => {
    async function initializeOneSignal() {
      try {
        // Get window width for mobile detection
        const isMobile = window.innerWidth < 768;

        // Initialize OneSignal
        await OneSignal.init({
          appId: 'c5c4fe85-5fe4-42e8-aaf4-c8edbfe967a9',
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: true,
            position: 'bottom-right',
            offset: isMobile
              ? {
                  bottom: '70px',
                  right: '2px',
                }
              : {
                  bottom: '20px',
                  right: '40px',
                },
          },
        });

        // Request notification permission
        await OneSignal.Notifications.requestPermission();
        
        // Get the OneSignal user ID
        if (OneSignal.User?.PushSubscription?.id) {
          const oneSignalId = OneSignal.User.PushSubscription.id;
          console.log('OneSignal user id found:', oneSignalId);

          // Update the backend with the OneSignal ID
          try {
            const response = await fetch('https://api.vision.gigsaw.co.in/api/jamrooms/update-onesignal', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: user.email,
                jamRoomId: jamRoomId,
                oneSignalUserId: oneSignalId,
              }),
            });

            const data = await response.json();
            if (data.success) {
              console.log('OneSignal ID updated successfully');
            } else {
              console.error('Failed to update OneSignal ID:', data.message);
            }
          } catch (error) {
            console.error('Error updating OneSignal ID:', error);
          }
        }

        // Set up notification click handler
        OneSignal.Notifications.addEventListener('click', (event) => {
          const bookingId = event?.notification?.additionalData?.bookingId;
          if (bookingId) {
            window.location.href = `/bookings/${jamRoomId}?bookingId=${bookingId}`;
          }
        });
      } catch (error) {
        console.error('Error initializing OneSignal:', error);
      }
    }

    if (user && jamRoomId) {
      initializeOneSignal();
    }
    
    // Cleanup function
    return () => {
      if (OneSignal?.Notifications) {
        OneSignal.Notifications.removeEventListener('click');
      }
    };
  }, [user, jamRoomId]);

  return <LandingContent />;
}
