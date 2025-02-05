import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthProvider } from './context/AuthContext';

// Use localhost:5173 for development
const redirectUri = import.meta.env.DEV 
  ? 'http://localhost:5173/login/callback'
  : window.location.origin + '/login/callback';

const root = createRoot(document.getElementById('root'));

root.render(
  <Auth0Provider
    domain={import.meta.env.VITE_AUTH0_DOMAIN}
    clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
    authorizationParams={{
      redirect_uri: redirectUri
    }}
  >
    <AuthProvider>
      <App />
    </AuthProvider>
  </Auth0Provider>
);

/*
Instructions for Auth0 Setup:
1. Go to Auth0 Dashboard
2. Select your application
3. Go to "Settings"
4. Under "Allowed Callback URLs", add:
   - http://localhost:5173/login/callback (for development)
   - https://your-production-domain.com/login/callback (for production)
5. Save changes
*/
