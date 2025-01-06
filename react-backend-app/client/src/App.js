import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import JamRoomFinder from './JamRoomFinder';
import JamRoomDetails from './components/JamRoomDetails';

function App() {
  const { loginWithRedirect, logout, isAuthenticated, isLoading, user, getIdTokenClaims } = useAuth0();
  
  const [userMetadata, setUserMetadata] = useState(null);

  useEffect(() => {
    const getUserMetadata = async () => {
      try {
        const claims = await getIdTokenClaims();
        const metadata = {
          phoneNumber: claims['https://jambro.com/phone_number'],
          name: claims['https://jambro.com/name'],
          email: claims['https://jambro.com/email']
        };
        setUserMetadata(metadata);
        console.log('User metadata:', metadata);
        console.log('User:', user);
      } catch (error) {
        console.error('Error getting user metadata:', error);
      }
    };

    if (isAuthenticated) {
      getUserMetadata();
    }
  }, [isAuthenticated, getIdTokenClaims]);

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
        </Routes>
      </Router>
    </>
  );
}

export default App;