import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../hooks/useAuth';
import { FlagModal } from './FlagModal';
import { useNotification } from '../context/NotificationContext';
import { CommentsSection } from './CommentsSection';

export const MemoryClusterPopup = ({ memories, isOpen, onClose, onSelectMemory, onMemoryDelete }) => {
  // Context hooks and state
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ownerProfilePic, setOwnerProfilePic] = useState(null);
  const [token] = useState(localStorage.getItem('token'));
  const [showTutorial, setShowTutorial] = useState(false);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banDuration, setBanDuration] = useState('7');
  const [banUnit, setBanUnit] = useState('days');
  const [showComments, setShowComments] = useState(false);

  // Refs
  const containerRef = useRef(null);
  const touchStartY = useRef(null);
  const touchEndY = useRef(null);
  const minSwipeDistance = 50;

  // Memoized values
  const sortedMemories = useMemo(() => {
    return [...memories].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [memories]);

  const isAdminOrMod = user?.role === 'ADMIN' || user?.role === 'MODERATOR';
  const currentMemory = sortedMemories[currentIndex];

  // Handle memory navigation
  const handleNextMemory = useCallback(() => {
    if (!sortedMemories?.length) return;
    if (currentIndex < sortedMemories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowComments(false);
      if (showTutorial) {
        setShowTutorial(false);
        localStorage.setItem('echoMapMemoryTutorialSeen', 'true');
      }
    }
  }, [currentIndex, sortedMemories?.length, showTutorial]);

  const handlePreviousMemory = useCallback(() => {
    if (!sortedMemories?.length) return;
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowComments(false);
      if (showTutorial) {
        setShowTutorial(false);
        localStorage.setItem('echoMapMemoryTutorialSeen', 'true');
      }
    }
  }, [currentIndex, sortedMemories?.length, showTutorial]);

  // Handle touch events
  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
    touchEndY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchEndY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartY.current || !touchEndY.current) return;
    
    const distance = touchStartY.current - touchEndY.current;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;
    
    if (isUpSwipe) {
      handleNextMemory();
    } else if (isDownSwipe) {
      handlePreviousMemory();
    }
    
    touchStartY.current = null;
    touchEndY.current = null;
    
    if (showTutorial) {
      setShowTutorial(false);
      localStorage.setItem('echoMapMemoryTutorialSeen', 'true');
    }
  }, [handleNextMemory, handlePreviousMemory, showTutorial]);

  // Format date helper
  const formatDate = useCallback((dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now - date;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 7) {
        return date.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } else if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
      } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else {
        return 'Just now';
      }
    } catch (e) {
      console.error("Date formatting error:", e);
      return "Unknown date";
    }
  }, []);

  // Other handlers
  const handleViewDetails = useCallback(() => {
    onSelectMemory(currentMemory);
    onClose();
  }, [currentMemory, onSelectMemory, onClose]);

  const handleFlag = useCallback(async (memoryId, reason) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/flags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ memoryId, reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to flag memory');
      }

      addNotification('Memory reported successfully', 'success');
    } catch (error) {
      console.error('Error flagging memory:', error);
      addNotification(error.message || 'Failed to report memory', 'error');
    } finally {
      setIsFlagModalOpen(false);
    }
  }, [token, addNotification]);

  const handleDeleteMemory = useCallback(async (memoryId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/memories/${memoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete memory');
      }

      addNotification('Memory deleted successfully', 'success');
      
      if (onMemoryDelete) {
        onMemoryDelete(memoryId);
      }

      if (sortedMemories.length === 1) {
        onClose();
      } else {
        setCurrentIndex(prev => Math.min(prev, sortedMemories.length - 2));
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
      addNotification(error.message || 'Failed to delete memory', 'error');
    }
    setShowDeleteConfirm(false);
  }, [token, addNotification, onMemoryDelete, onClose, sortedMemories?.length]);

  const handleBanUser = useCallback(async () => {
    try {
      const userId = currentMemory.userId;
      const endpoint = `${import.meta.env.VITE_ECHOMAP_API_URL}/api/admin/users/${userId}/${banUnit === 'permanent' ? 'ban-permanent' : 'ban'}`;
      
      const body = banUnit === 'permanent' 
        ? {} 
        : { duration: parseInt(banDuration), unit: banUnit };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error('Failed to ban user');
      }

      addNotification(
        banUnit === 'permanent' 
          ? 'User has been permanently banned' 
          : `User banned for ${banDuration} ${banUnit}`, 
        'success'
      );
      setShowBanModal(false);
    } catch (error) {
      console.error('Error banning user:', error);
      addNotification(error.message || 'Failed to ban user', 'error');
    }
  }, [currentMemory?.userId, banUnit, banDuration, token, addNotification]);

  // Effect for fetching owner profile
  useEffect(() => {
    const fetchOwnerProfile = async () => {
      if (!currentMemory?.userId || !token) return;
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_ECHOMAP_API_URL}/api/users/${currentMemory.userId}/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        setOwnerProfilePic(data || null);
      } catch (error) {
        console.error('Error fetching owner profile:', error);
        setOwnerProfilePic(null);
      }
    };

    fetchOwnerProfile();
  }, [currentMemory?.userId, token]);

  // Effect for tutorial visibility
  useEffect(() => {
    if (isOpen && sortedMemories?.length > 0) {
      const hasTutorialBeenSeen = localStorage.getItem('echoMapMemoryTutorialSeen');
      setShowTutorial(!hasTutorialBeenSeen);
    }
  }, [isOpen, sortedMemories?.length]);

  // Effect for resetting current index when memories change
  useEffect(() => {
    setCurrentIndex(0);
  }, [memories]);

  // Effect for auto-hiding tutorial
  useEffect(() => {
    if (showTutorial) {
      const timer = setTimeout(() => {
        setShowTutorial(false);
        localStorage.setItem('echoMapMemoryTutorialSeen', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showTutorial]);

  // Effect for keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || !sortedMemories?.length) return;
      
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        handleNextMemory();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        handlePreviousMemory();
      } else if (e.key === 'Escape') {
        onClose();
      }
      
      if (showTutorial) {
        setShowTutorial(false);
        localStorage.setItem('echoMapMemoryTutorialSeen', 'true');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNextMemory, handlePreviousMemory, onClose, showTutorial, sortedMemories?.length]);

  // Early return if no memories
  if (!sortedMemories?.length) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose} static>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black" />
        </Transition.Child>

        <div className="fixed inset-0">
          <div className="flex h-full">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Panel className="w-full h-full">
                <div 
                  ref={containerRef}
                  className="w-full h-full relative touch-manipulation"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className="w-full h-full relative overflow-hidden">
                    {/* Media Display */}
                    <div className={`w-full ${showComments ? 'h-1/2' : 'h-full'} transition-all duration-300`}>
                      {currentMemory.mediaType === 'IMAGE' && currentMemory.mediaUrl ? (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                          <img 
                            src={currentMemory.mediaUrl} 
                            alt={currentMemory.title || "Memory"} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.src = '/LOGOicon.png';
                              e.target.className = "w-24 h-24 object-contain opacity-50";
                            }}
                          />
                        </div>
                      ) : currentMemory.mediaType === 'VIDEO' && currentMemory.mediaUrl ? (
                        <div className="w-full h-full bg-black">
                          <video 
                            src={currentMemory.mediaUrl} 
                            controls 
                            autoPlay
                            loop
                            playsInline
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : currentMemory.mediaType === 'AUDIO' && currentMemory.mediaUrl ? (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 flex flex-col items-center justify-center">
                          <div className="w-40 h-40 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center mb-8 animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                          <audio 
                            src={currentMemory.mediaUrl} 
                            controls 
                            autoPlay
                            className="w-4/5 max-w-md"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Memory Info Overlay */}
                    <div className={`absolute bottom-0 left-0 right-16 ${showComments ? 'h-1/2' : ''} bg-gradient-to-t from-black via-black/70 to-transparent px-6 py-8`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold border border-white/30 overflow-hidden">
                            {ownerProfilePic ? (
                              <img 
                                src={ownerProfilePic} 
                                alt={currentMemory.name || "Anonymous"} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              currentMemory.name ? currentMemory.name[0].toUpperCase() : 'A'
                            )}
                          </div>
                          <div>
                            <h3 className="text-white text-lg font-semibold">
                              {currentMemory.name || "Anonymous"}
                            </h3>
                            <p className="text-white/60 text-sm">
                              {formatDate(currentMemory.createdAt)}
                            </p>
                          </div>
                          {isAdminOrMod && (
                            <button
                              onClick={() => setShowBanModal(true)}
                              className="ml-2 text-red-500 hover:text-red-400 transition-colors"
                              title="Ban User"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-white text-xl font-semibold">
                          {currentMemory.title || "Untitled Memory"}
                        </h4>
                        {currentMemory.description && (
                          <p className="text-gray-200 text-base">
                            {currentMemory.description}
                          </p>
                        )}

                        <div className="flex space-x-4">
                          {/* View Details Button */}
                          <button
                            onClick={handleViewDetails}
                            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>View Details</span>
                          </button>

                          {/* Comments Toggle Button */}
                          <button
                            onClick={() => setShowComments(!showComments)}
                            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            <span>{showComments ? 'Hide Comments' : 'Show Comments'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Comments Section */}
                      {showComments && (
                        <div className="mt-4 bg-white rounded-lg shadow-lg max-h-[calc(50vh-200px)] overflow-y-auto">
                          <CommentsSection memoryId={currentMemory.id} />
                        </div>
                      )}
                    </div>

                    {/* Memory Navigation */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center space-y-6">
                      {/* Report Button */}
                      {currentMemory.userId !== user?.id && (
                        <button
                          onClick={() => setIsFlagModalOpen(true)}
                          className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
                          title="Report memory"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                          </svg>
                        </button>
                      )}

                      {/* Delete Button */}
                      {(isAdminOrMod || currentMemory.userId === user?.id) && (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
                          title="Delete memory"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  className="absolute top-4 left-4 p-2 rounded-full bg-black/30 text-white hover:bg-black/50"
                  onClick={onClose}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

        {/* Modals */}
        <FlagModal
          isOpen={isFlagModalOpen}
          onClose={() => setIsFlagModalOpen(false)}
          onFlag={handleFlag}
          memoryId={currentMemory?.id}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-gray-500 mb-6">Are you sure you want to delete this memory? This action cannot be undone.</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteMemory(currentMemory.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ban User Modal */}
        {showBanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ban User</h3>
              <div className="space-y-4">
                <div className="flex space-x-4">
                  {banUnit !== 'permanent' && (
                    <input
                      type="number"
                      min="1"
                      value={banDuration}
                      onChange={(e) => setBanDuration(e.target.value)}
                      className="w-20 px-2 py-1 border rounded"
                    />
                  )}
                  <select
                    value={banUnit}
                    onChange={(e) => setBanUnit(e.target.value)}
                    className="px-2 py-1 border rounded"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                    <option value="permanent">Permanent</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => setShowBanModal(false)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBanUser}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Ban User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </Transition>
  );
};

MemoryClusterPopup.propTypes = {
  memories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      userId: PropTypes.string.isRequired,
      title: PropTypes.string,
      description: PropTypes.string,
      mediaType: PropTypes.string,
      mediaUrl: PropTypes.string,
      name: PropTypes.string,
      createdAt: PropTypes.string
    })
  ).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectMemory: PropTypes.func.isRequired,
  onMemoryDelete: PropTypes.func.isRequired
};
