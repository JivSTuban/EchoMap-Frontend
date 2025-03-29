import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppRoutes } from './routes';
import './index.css';

// Use environment-specific callback URL
const callbackUrl = import.meta.env.MODE === 'development'
  ? 'http://localhost:5173/login/callback'
  : import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin + '/login/callback';

// Use environment-specific audience
const audience = import.meta.env.VITE_AUTH0_AUDIENCE || 
  (import.meta.env.MODE === 'development' 
    ? 'http://localhost:8080/api'
    : 'https://echomap-server.onrender.com/api');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Auth0Provider
        domain={import.meta.env.VITE_AUTH0_DOMAIN}
        clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: callbackUrl,
          audience: audience,
          scope: "openid profile email"
        }}
      >
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </AuthProvider>
      </Auth0Provider>
    </BrowserRouter>
  </React.StrictMode>
);

/*
Instructions for Auth0 Setup:
1. Go to Auth0 Dashboard
2. Select your application
3. Go to "Settings"
4. Under "Allowed Callback URLs", add:
   - http://localhost:5173/login/callback (for development)
   - https://echomap-web.onrender.com/login/callback (for production)
5. Under "Allowed Web Origins", add:
   - http://localhost:5173 (for development)
   - https://echomap-web.onrender.com (for production)
6. Under "Allowed Logout URLs", add:
   - http://localhost:5173 (for development)
   - https://echomap-web.onrender.com (for production)
7. Save changes
*/
