import { BrowserRouter as Router } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navigation } from './components/Navigation';
import { AppRoutes } from './routes';

export const App = () => {
  return (
    <NotificationProvider>
      <Router>
        <ErrorBoundary>
          <Navigation>
            <AppRoutes />
          </Navigation>
        </ErrorBoundary>
      </Router>
    </NotificationProvider>
  );
};