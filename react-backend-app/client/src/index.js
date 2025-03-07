import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter as Router, Routes, Route, BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

  <React.StrictMode>

    <Auth0Provider
      domain={'dev-veq6ppuvr633oybb.us.auth0.com'}
      clientId={'maV0dZmjJ5rDMaLGt6vfjmJ0VugXzXsF'}
      redirectUri={window.location.origin}
      audience={`https://dev-veq6ppuvr633oybb.us.auth0.com/api/v2/`}
      useRefreshTokens={true}
      cacheLocation="localstorage"
      scope="openid profile email read:current_user update:current_user_metadata"
    >
      <BrowserRouter>
        <App />
    </BrowserRouter>
    </Auth0Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
