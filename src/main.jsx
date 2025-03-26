import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppRoutes } from './routes';
import './index.css';

const callbackUrl = import.meta.env.MODE === 'development'
  ? 'http://localhost:5173/login/callback'
  : window.location.origin + '/login/callback';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Auth0Provider
        domain={import.meta.env.VITE_AUTH0_DOMAIN}
        clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: callbackUrl,
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
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
   - https://your-production-domain.com/login/callback (for production)
5. Save changes
*/
