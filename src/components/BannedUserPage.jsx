import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const BannedUserPage = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const banEndDate = location.state?.banEndDate;
  const reason = location.state?.reason;

  const formatBanEndDate = (dateString) => {
    if (!dateString) return "Permanent";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error("Date formatting error:", e);
      return "Unknown date";
    }
  };

  const handleReturnToLogin = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Account Banned</h1>
          <p className="text-gray-300">Your account has been suspended from using naviGram.</p>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-red-400 mb-4">Ban Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-gray-300">Ban will be lifted on:</p>
              <p className="text-white font-medium">{formatBanEndDate(banEndDate)}</p>
            </div>
            {reason && (
              <div>
                <p className="text-gray-300">Reason:</p>
                <p className="text-white font-medium">{reason}</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-gray-400 text-sm mb-8">
          <p>If you believe this is a mistake or would like to appeal,</p>
          <p>please contact our support team at support@navigram.com</p>
        </div>

        <button
          onClick={handleReturnToLogin}
          className="w-full bg-white text-gray-900 py-3 px-6 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
}; 