import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Button } from '@heroui/react';

export const Navigation = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const isAuthenticated = !!user;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderAuthLinks = () => {
    const buttonStyle = "text-sm font-medium px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full hover:opacity-90 transition-opacity shadow-sm";
    
    return (
      <>
        {location.pathname !== '/login' && (
          <Link to="/login" className={buttonStyle}>
            Login
          </Link>
        )}
        {location.pathname !== '/register' && location.pathname !== '/' && (
          <Link to="/register" className={buttonStyle}>
            Register
          </Link>
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Background gradients - fixed position and below content */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-slate-50 to-teal-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.3),transparent_25%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(147,51,234,0.2),transparent_25%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.01)_1px,transparent_1px)] bg-[size:20px_20px]" />
        <div className="absolute inset-0 backdrop-blur-3xl" />
      </div>

      {/* Header - fixed height */}
      <header className="h-16 flex items-center justify-between bg-white/80 backdrop-blur-sm border-b border-gray-200/80 px-6 lg:px-8">
        {!isAuthenticated ? (
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold hover:opacity-80 transition-opacity">
            <img src="/LOGOblack.svg" alt="EchoMap Logo" className="h-10 w-15" />
          </Link>)
          :
          <img src="/LOGOblack.svg" alt="EchoMap Logo" className="h-10 w-15" />
        }
        <nav className="flex items-center gap-6">
          {location.pathname !== '/about' && !isAuthenticated && (
            <Link to="/about" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              About Us
            </Link>
          )}
          {isAuthenticated && location.pathname !== '/map' && (
            <Link to="/map" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Map
            </Link>
          )}
          {isAuthenticated && location.pathname !== '/create-memory' && (
            <Link to="/create-memory" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Create Memory
            </Link>
          )}
          {isAuthenticated && location.pathname !== '/profile' && (
            <Link to="/profile" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Profile
            </Link>
          )}
          {isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MODERATOR') && location.pathname !== '/admin' && (
            <Link to="/admin" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              {user?.role === 'ADMIN' ? 'Admin Panel' : 'Moderator Panel'}
            </Link>
          )}
          {!isAuthenticated && renderAuthLinks()}
          {isAuthenticated && (
            <Button
              onPress={handleLogout}
              className="text-sm font-medium px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full hover:opacity-90 transition-opacity shadow-sm"
            >
              Logout
            </Button>
          )}
        </nav>
      </header>

      {/* Main content - takes remaining height */}
      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Footer - only show on non-map pages */}
      {location.pathname !== '/map' && (
        <footer className="border-t border-gray-200/80 bg-white/80 backdrop-blur-sm py-8 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">NaviGram</h3>
                <p className="mt-2 text-sm text-gray-600">Share your world's memories, one location at a time.</p>
              </div>
              {isAuthenticated && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Quick Links</h4>
                  <div className="mt-4 space-y-3">
                    <Link to="/map" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">Map</Link>
                    <Link to="/create-memory" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">Create Memory</Link>
                    <Link to="/profile" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">Profile</Link>
                  </div>
                </div>
              )}
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Connect</h4>
                <div className="mt-4 flex space-x-4">
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
                  </a>
                  <a href="https://github.com/jivstuban" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors">
                    <span className="sr-only">GitHub</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200/80">
              <p className="text-sm text-center text-gray-600">&copy; 2025 NaviGram. All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};