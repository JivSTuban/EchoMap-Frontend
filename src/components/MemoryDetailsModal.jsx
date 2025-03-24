import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useNotification } from '../context/NotificationContext';

export const MemoryDetailsModal = ({ memory, isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Check if the current user owns this memory
  const isOwner = user && memory && user.id === memory.userId;
  
  // Add debug logging to see what data is received
  useEffect(() => {
    if (isOpen && memory) {
      console.log("Memory data in modal:", memory);
      console.log("Current user:", user);
      console.log("Is owner:", isOwner);
    }
  }, [memory, isOpen, user, isOwner]);

  if (!memory) return null;

  // Handle editing a memory
  const handleEdit = () => {
    navigate(`/edit-memory/${memory.id}`, { state: { memory } });
    onClose();
  };

  // Handle deleting a memory
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      await API.delete(`/api/memories/${memory.id}`);
      addNotification('Memory deleted successfully', 'success');
      onClose();
      // Force refresh the map
      window.location.reload();
    } catch (error) {
      console.error('Error deleting memory:', error);
      addNotification('Failed to delete memory', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format the creation date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      console.error("Date formatting error:", e);
      return "Unknown date";
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Background overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
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
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Media Display */}
                <div className="relative w-full h-80">
                  {!memory.mediaType || !memory.mediaUrl ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <p className="text-gray-500">No media available</p>
                    </div>
                  ) : memory.mediaType === 'IMAGE' ? (
                    <img 
                      src={memory.mediaUrl} 
                      alt={memory.description || "Memory"} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Image failed to load:", memory.mediaUrl);
                        e.target.src = '/LOGOicon.png';
                        e.target.className = "w-20 h-20 m-auto object-contain opacity-50";
                      }}
                    />
                  ) : memory.mediaType === 'VIDEO' ? (
                    <video 
                      src={memory.mediaUrl} 
                      controls
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Video failed to load:", memory.mediaUrl);
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML += '<p class="text-center mt-4 text-gray-500">Video unavailable</p>';
                      }}
                    />
                  ) : memory.mediaType === 'AUDIO' ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-indigo-100 to-purple-100">
                      <audio 
                        src={memory.mediaUrl} 
                        controls
                        className="w-5/6 mx-auto"
                        onError={(e) => {
                          console.error("Audio failed to load:", memory.mediaUrl);
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML += '<p class="text-center mt-4 text-gray-500">Audio unavailable</p>';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <p className="text-gray-500">Unknown media type: {memory.mediaType}</p>
                    </div>
                  )}
                  
                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-md text-gray-600 hover:text-gray-900 hover:bg-white"
                    aria-label="Close"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Memory Details */}
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <Dialog.Title as="h3" className="font-bold text-xl text-gray-900 truncate">
                        {memory.description || "Untitled Memory"}
                      </Dialog.Title>
                      <p className="text-sm text-gray-500">
                        {formatDate(memory.createdAt)}
                      </p>
                    </div>
                    
                    {memory.distanceInMeters && (
                      <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {memory.distanceInMeters < 1000 
                          ? `${Math.round(memory.distanceInMeters)}m away` 
                          : `${(memory.distanceInMeters / 1000).toFixed(1)}km away`}
                      </span>
                    )}
                  </div>
                  
                  {memory.description && (
                    <p className="mt-4 text-gray-700">
                      {memory.description}
                    </p>
                  )}
                  
                  {/* Memory Creator Info */}
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500">
                        {memory.username?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {memory.username || "Anonymous User"}
                        </p>
                      </div>
                    </div>
                    
                    {/* Edit/Delete Buttons (Only shown to memory owner) */}
                    {isOwner && (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleEdit}
                          className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="bg-red-50 text-red-600 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 