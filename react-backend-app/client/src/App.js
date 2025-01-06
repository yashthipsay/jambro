import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import JamRoomFinder from './JamRoomFinder';
import JamRoomDetails from './components/JamRoomDetails';
import Booking from './components/Booking';

function App() {
  const { loginWithRedirect, logout, isAuthenticated, isLoading, user, getIdTokenClaims } = useAuth0();
  

  useEffect(() => {
    const registerUser = async () => {
      if (isAuthenticated && user) {
        try {
          const response = await fetch('http://localhost:5000/api/users/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: user.name || 'NA',
              email: user.email,
              mobileNumber: user.phone_number || 'NA'
            }),
          });

          const data = await response.json();
          if (!data.success) {
            console.error('Error registering user:', data.message);
          }
        } catch (error) {
          console.error('Error registering user:', error);
        }
      }
    };

    registerUser();
  }, [isAuthenticated, user]);

  if (isLoading) {
    return <h2>Loading...</h2>;
  }




  const handleLogin = () => {
    loginWithRedirect();
  };

  return (
    <>
      <div style={{ margin: '1rem' }}>
        {isAuthenticated && user && <p>Welcome, {user.name}!</p>}
        <button 
          onClick={isAuthenticated 
            ? () => logout({ returnTo: window.location.origin }) 
            : handleLogin}
        >
          {isAuthenticated ? 'Logout' : 'Login with Phone'}
        </button>
      </div>
      <Router>
        <Routes>
          <Route path="/" element={<JamRoomFinder />} />
          <Route path="/jam-room/:id" element={<JamRoomDetails />} />
          <Route path="/booking/:id" element={<Booking />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;