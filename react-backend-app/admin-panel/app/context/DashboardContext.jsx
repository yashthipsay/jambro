'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const { user } = useUser();
  const [isRegistered, setIsRegistered] = useState(false);
  const [jamRoomId, setJamRoomId] = useState(null);
  const [fundAccountId, setFundAccountId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyRegistration = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        // First try with existing token
        const token = localStorage.getItem('jamroom_token');
        if (token) {
          const response = await fetch(
            'http://43.205.169.90/api/auth/verify',
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const data = await response.json();
          console.log('Token verification response:', data); // Add logging

          if (data.success) {
            setIsRegistered(true);
            setJamRoomId(data.jamRoomId);
            setFundAccountId(data.fundAccountId);
            setLoading(false);
            return;
          }
        }

        // If token verification fails, try registration check
        const response = await fetch(
          'http://43.205.169.90/api/auth/check-registration',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email }),
          }
        );

        const data = await response.json();
        console.log('Registration check response:', data); // Add logging

        if (data.success && data.isRegistered) {
          setIsRegistered(true);
          setJamRoomId(data.jamRoomId);
          if (data.token) {
            localStorage.setItem('jamroom_token', data.token);
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            setFundAccountId(payload.fundAccountId);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Registration check failed:', error);
        setIsRegistered(false);
        setLoading(false);
      }
    };

    if (user) {
      console.log('User detected, verifying registration...'); // Add logging
      verifyRegistration();
    } else {
      setLoading(false);
    }
  }, [user]);

  console.log('DashboardContext state:', { isRegistered, loading, user }); // Add logging

  return (
    <DashboardContext.Provider
      value={{
        isRegistered,
        jamRoomId,
        setIsRegistered,
        setJamRoomId,
        fundAccountId,
        loading,
        user,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => useContext(DashboardContext);
