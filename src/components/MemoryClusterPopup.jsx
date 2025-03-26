import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FlagModal } from './FlagModal';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import axios from 'axios';

export const MemoryClusterPopup = ({ memories, isOpen, onClose, onSelectMemory, onMemoryDelete }) => {
  // Context hooks
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  
  // All state hooks
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ownerProfilePic, setOwnerProfilePic] = useState(null);
  const [token] = useState(localStorage.getItem('token'));
  const [showTutorial, setShowTutorial] = useState(false);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banDuration, setBanDuration] = useState('7');
  const [banUnit, setBanUnit] = useState('days');

  // All ref hooks
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const touchStartY = useRef(null);
  const touchEndY = useRef(null);
  const minSwipeDistance = 50; // Minimum distance required for a swipe

  // Sort memories by creation date (newest first)
  const sortedMemories = [...memories].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Check if user is admin or moderator
  const isAdminOrMod = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  // Get current memory
  const currentMemory = sortedMemories[currentIndex];

  // Define all callback functions
  const handleNextMemory = useCallback(() => {
    if (!sortedMemories?.length) return;
    if (currentIndex < sortedMemories.length - 1) {
      setCurrentIndex(prev => prev + 1);
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
      if (showTutorial) {
        setShowTutorial(false);
        localStorage.setItem('echoMapMemoryTutorialSeen', 'true');
      }
    }
  }, [currentIndex, showTutorial]);

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
    
    // Reset values
    touchStartY.current = null;
    touchEndY.current = null;
    
    // Hide tutorial on first swipe
    if (showTutorial) {
      setShowTutorial(false);
      localStorage.setItem('echoMapMemoryTutorialSeen', 'true');
    }
  }, [handleNextMemory, handlePreviousMemory, showTutorial, minSwipeDistance]);

  const handleCloseTutorial = useCallback(() => {
    setShowTutorial(false);
    localStorage.setItem('echoMapMemoryTutorialSeen', 'true');
  }, []);

  // All useEffect hooks
  useEffect(() => {
    if (!currentMemory?.userId || !sortedMemories?.length) return;
    const fetchOwnerProfile = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_ECHOMAP_API_URL}/api/users/${currentMemory.userId}/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setOwnerProfilePic(response.data || null);
      } catch (error) {
        console.error('Error fetching owner profile:', error);
        setOwnerProfilePic(null);
      }
    };
    fetchOwnerProfile();
  }, [currentMemory?.userId, token]);

  useEffect(() => {
    if (isOpen && sortedMemories?.length > 0) {
      const hasTutorialBeenSeen = localStorage.getItem('echoMapMemoryTutorialSeen');
      setShowTutorial(!hasTutorialBeenSeen);
    }
  }, [isOpen, sortedMemories?.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [memories]);

  useEffect(() => {
    if (showTutorial) {
      const timer = setTimeout(() => {
        setShowTutorial(false);
        localStorage.setItem('echoMapMemoryTutorialSeen', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showTutorial]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Early return if no memories
  if (!sortedMemories?.length) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error("Date formatting error:", e);
      return "Unknown date";
    }
  };

  const handleViewDetails = (memory) => {
    onSelectMemory(memory);
    onClose();
  };

  const handleFlag = async (memoryId, reason) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User must be logged in to flag memories');
      }

      const response = await fetch(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/flags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          memoryId,
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to flag memory');
      }

      // Fetch updated memory data
      const memoryResponse = await fetch(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/memories/${memoryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!memoryResponse.ok) {
        throw new Error('Failed to fetch updated memory data');
      }

      const updatedMemory = await memoryResponse.json();
      
      // Update the memory in the sortedMemories array
      const updatedMemories = [...sortedMemories];
      updatedMemories[currentIndex] = updatedMemory;
      memories.splice(memories.indexOf(sortedMemories[currentIndex]), 1, updatedMemory);

      // Show success notification
      addNotification('Memory reported successfully', 'success');
    } catch (error) {
      console.error('Error flagging memory:', error);
      addNotification(error.message || 'Failed to report memory', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMemory = async (memoryId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User must be logged in to delete memories');
      }

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
  };

  const handleBanUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const userId = currentMemory.userId;
      const endpoint = `${import.meta.env.VITE_ECHOMAP_API_URL}/api/admin/users/${userId}/${banUnit === 'permanent' ? 'ban-permanent' : 'ban'}`;
      
      const body = banUnit === 'permanent' 
        ? {} 
        : {
            duration: parseInt(banDuration),
            unit: banUnit
          };

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
  };

  const handleEditMemory = (memory) => {
    onClose(); // Close the popup
    navigate(`/edit-memory/${memory.id}`, { state: { memory } }); // Navigate to edit page with memory data
  };

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
                {/* Touch-enabled view container */}
                <div 
                  ref={containerRef}
                  className="w-full h-full relative touch-manipulation"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Main Memory Display */}
                  <div className="w-full h-full relative overflow-hidden">
                    {/* Media Display */}
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
                          onError={(e) => {
                            e.target.parentNode.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center bg-black">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            `;
                          }}
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
                          onError={(e) => {
                            e.target.parentNode.innerHTML = `
                              <div class="text-white text-center p-4">
                                <p class="mb-2">Audio file could not be loaded</p>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" strokeLinejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            `;
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Tutorial Overlay - shows only for new users */}
                    {showTutorial && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center px-8 z-10">
                        <div className="mb-6 flex flex-col items-center">
                          <div className="text-white text-2xl font-semibold mb-4 text-center">
                            {sortedMemories.length > 1 
                              ? `${sortedMemories.length} Memories Found`
                              : "Memory View"}
                          </div>
                          
                          <div className="text-white text-base mb-8 text-center">
                            {sortedMemories.length > 1 
                              ? "Swipe up or down to browse through all memories at this location" 
                              : "View this memory at this location"}
                          </div>
                          
                          {sortedMemories.length > 1 && (
                            <div className="flex flex-col items-center mb-10">
                              <div className="flex flex-col items-center mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                                <div className="text-white text-sm mt-1">Swipe Up for Older</div>
                              </div>
                              
                              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white mb-3">
                                <span className="text-white font-bold">{currentIndex + 1}/{sortedMemories.length}</span>
                              </div>
                              
                              <div className="flex flex-col items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13l5 5m0 0l5-5m-5 5V6" />
                                </svg>
                                <div className="text-white text-sm mt-1">Swipe Down for Newer</div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <button 
                          className="bg-white text-black px-6 py-2 rounded-full font-medium"
                          onClick={handleCloseTutorial}
                        >
                          Got it
                        </button>
                      </div>
                    )}

                    {/* Memory Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-16 bg-gradient-to-t from-black via-black/70 to-transparent px-6 py-8">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold border border-white/30 overflow-hidden">
                            {ownerProfilePic ? (
                              <img 
                                src={ownerProfilePic} 
                                alt={currentMemory.name || "Anonymous"} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = currentMemory.name ? currentMemory.name[0].toUpperCase() : 'A';
                                }}
                              />
                            ) : (
                              currentMemory.name ? currentMemory.name[0].toUpperCase() : 'A'
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-white text-lg font-semibold">
                              {currentMemory.name || "Anonymous"}
                            </h3>
                            {isAdminOrMod && (
                              <button
                                onClick={() => setShowBanModal(true)}
                                className="text-red-500 hover:text-red-400 transition-colors"
                                title="Ban User"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-white/80 text-sm">
                            {formatDate(currentMemory.createdAt)}
                          </span>
                          {isAdminOrMod && currentMemory.totalFlags > 0 && (
                            <span className="text-red-400 text-sm mt-1">
                              {currentMemory.totalFlags} report{currentMemory.totalFlags !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-white text-lg font-medium">
                          {currentMemory.title || "Untitled Memory"}
                        </h4>
                        {currentMemory.description && (
                          <p className="text-gray-200 text-base line-clamp-2">
                            {currentMemory.description}
                          </p>
                        )}
                        {isAdminOrMod && currentMemory.flagReason && (
                          <div className="flex items-center space-x-2 bg-red-500/20 text-red-400 px-3 py-2 rounded-md mt-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                            </svg>
                            <span className="text-sm font-medium">Report reason: {currentMemory.flagReason}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Memory counter indicator and menu */}
                    <div className="absolute top-4 right-4">
                      {currentMemory.userId === user?.id && (
                        <div className="relative" ref={menuRef}>
                          <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex flex-col items-center"
                            aria-label="More options"
                          >
                            <div className="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center mb-1 hover:bg-black/60 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </div>
                          </button>

                          {/* Dropdown Menu */}
                          {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-md rounded-lg shadow-lg py-1 z-50">
                              <button
                                onClick={() => {
                                  handleEditMemory(currentMemory);
                                  setIsMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-white/80 flex items-center transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Edit Memory
                              </button>
                              <button
                                onClick={() => {
                                  setShowDeleteConfirm(true);
                                  setIsMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-white/80 flex items-center transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Memory
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Show just the counter if not the memory owner */}
                      {currentMemory.userId !== user?.id && (
                        <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
                          {currentIndex + 1}/{sortedMemories.length}
                        </div>
                      )}
                    </div>

                    {/* Side action buttons */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center space-y-6">
                      {/* Report Button - Only show if user is NOT the memory owner */}
                      {currentMemory.userId !== user?.id && (
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => setIsFlagModalOpen(true)}
                            className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center mb-1 hover:bg-black/60 transition-colors"
                            title="Report memory"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                            </svg>
                          </button>
                          <span className="text-white text-xs font-medium">Report</span>
                        </div>
                      )}

                      {/* Delete Button - Show for admins/mods and memory owner */}
                      {(isAdminOrMod || currentMemory.userId === user?.id) && (
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center mb-1 hover:bg-black/60 transition-colors"
                            title="Delete memory"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <span className="text-white text-xs font-medium">Delete</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  className="absolute top-4 left-4 p-2 rounded-full bg-black/30 text-white hover:bg-black/50"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

        {/* Add FlagModal */}
        <FlagModal
          isOpen={isFlagModalOpen}
          onClose={() => setIsFlagModalOpen(false)}
          onFlag={handleFlag}
          memoryId={memories[currentIndex]?.id}
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
        <Transition appear show={showBanModal} as={Fragment}>
          <Dialog 
            as="div" 
            className="relative z-50" 
            onClose={(e) => {
              e.stopPropagation();
              setShowBanModal(false);
            }}
            static
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-50" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 mb-4">
                      Ban User
                    </Dialog.Title>
                    <p className="text-gray-500 mb-4">Select ban duration for {currentMemory.name || "Anonymous"}:</p>
                    <div className="flex space-x-4 mb-6">
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
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowBanModal(false);
                        }}
                        className="px-4 py-2 text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBanUser();
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Ban User
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </Dialog>
    </Transition>
  );
}; 