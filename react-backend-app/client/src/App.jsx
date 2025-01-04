import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import JamRoomFinder from './JamRoomFinder';
import JamRoomDetails from './components/JamRoomDetails';

function App() {
  const { loginWithRedirect, logout, isAuthenticated, isLoading, user } = useAuth0();

  if (isLoading) {
    return <h2>Loading...</h2>;
  }

  const handleLogin = () => {
    loginWithRedirect({
      connection: 'sms',
      screen_hint: 'login',
      authorizationParams: {
        connection: 'sms',
        prompt: 'login'
      }
    });
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