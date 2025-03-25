import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useAuth } from '../hooks/useAuth';

export const MemoryClusterPopup = ({ memories, isOpen, onClose, onSelectMemory }) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);
  const touchStartY = useRef(null);
  const touchEndY = useRef(null);
  const minSwipeDistance = 50; // Minimum distance required for a swipe
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Sort memories by creation date (newest first)
  const sortedMemories = [...memories].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Check if user has seen tutorial before and initialize showTutorial state
  useEffect(() => {
    if (isOpen && sortedMemories.length > 0) {
      const hasTutorialBeenSeen = localStorage.getItem('echoMapMemoryTutorialSeen');
      setShowTutorial(!hasTutorialBeenSeen);
    }
  }, [isOpen, sortedMemories]);

  // Reset current index when memories change
  useEffect(() => {
    setCurrentIndex(0);
  }, [memories]);

  // Hide tutorial after 5 seconds or on first swipe
  useEffect(() => {
    if (showTutorial) {
      const timer = setTimeout(() => {
        setShowTutorial(false);
        localStorage.setItem('echoMapMemoryTutorialSeen', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showTutorial]);

  const handleNextMemory = useCallback(() => {
    if (currentIndex < sortedMemories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      if (showTutorial) {
        setShowTutorial(false);
        localStorage.setItem('echoMapMemoryTutorialSeen', 'true');
      }
    }
  }, [currentIndex, sortedMemories.length, showTutorial]);

  const handlePreviousMemory = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      if (showTutorial) {
        setShowTutorial(false);
        localStorage.setItem('echoMapMemoryTutorialSeen', 'true');
      }
    }
  }, [currentIndex, showTutorial]);

  // Touch event handlers
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
  }, [handleNextMemory, handlePreviousMemory, showTutorial]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        handleNextMemory();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        handlePreviousMemory();
      } else if (e.key === 'Escape') {
        onClose();
      }
      
      // Hide tutorial on key navigation
      if (showTutorial) {
        setShowTutorial(false);
        localStorage.setItem('echoMapMemoryTutorialSeen', 'true');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNextMemory, handlePreviousMemory, onClose, showTutorial]);

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

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('echoMapMemoryTutorialSeen', 'true');
  };

  if (!sortedMemories?.length) return null;
  const currentMemory = sortedMemories[currentIndex];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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

                    {/* Side action buttons (like TikTok) */}
                    <div className="absolute right-3 bottom-20 flex flex-col items-center space-y-4">
                      {/* View Details Button */}
                      <button
                        onClick={() => handleViewDetails(currentMemory)}
                        className="flex flex-col items-center"
                        aria-label="View full details"
                      >
                        <div className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-white text-xs">Details</span>
                      </button>
                      
                      {/* Memory Counter as profile pic with count */}
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-1 border-2 border-white">
                          <span className="text-white text-xs font-bold">{sortedMemories.length}</span>
                        </div>
                        <span className="text-white text-xs">Memories</span>
                      </div>
                    </div>

                    {/* Content Overlay - Bottom */}
                    <div className="absolute bottom-0 left-0 right-12 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                      <h3 className="text-xl font-semibold mb-1">
                        @{currentMemory.username || "anonymous"}
                      </h3>
                      <h4 className="text-base mb-2">
                        {currentMemory.title || "Untitled Memory"}
                      </h4>
                      {currentMemory.description && (
                        <p className="text-sm text-gray-200 mb-2 line-clamp-2">
                          {currentMemory.description}
                        </p>
                      )}
                      <div className="flex items-center text-xs text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(currentMemory.createdAt)}
                      </div>
                    </div>

                    {/* Memory counter indicator */}
                    <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded-full text-sm">
                      {currentIndex + 1} / {sortedMemories.length}
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
      </Dialog>
    </Transition>
  );
}; 