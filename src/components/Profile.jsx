import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { useMemories } from '../hooks/useMemories';
import { EditProfileModal } from './EditProfileModal';
import { EditMemoryModal } from './EditMemoryModal';
import { useNotification } from '../context/NotificationContext';
import { CommentsSection } from './CommentsSection';

const baseURL = import.meta.env.VITE_ECHOMAP_API_URL;
export const Profile = () => {
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditMemoryModalOpen, setIsEditMemoryModalOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [followCountsLoading, setFollowCountsLoading] = useState(false);
  const { addNotification } = useNotification();
  const token = window.localStorage.getItem("token");
  const [previewMemory, setPreviewMemory] = useState(null);
  const [memoryToDelete, setMemoryToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  useEffect(() => {
    const fetchFollowCounts = async () => {
      setFollowCountsLoading(true);
      try {
        const response = await fetch(`${baseURL}/api/users/${user?.id}/follow-counts`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        const data = await response.json();
        if (data.success) {
          setFollowCounts(data.data);
        }
      } catch (error) {
        console.error('Error fetching follow counts:', error);
      } finally {
        setFollowCountsLoading(false);
      }
    };

    if (user?.id) {
      fetchFollowCounts();
    }
  }, [user?.id]);

  const { memories, setMemories, loading: memoriesLoading } = useMemories(null, user?.id);

  const handleMemoryUpdate = (updatedMemory) => {
    setMemories(memories.map(memory => 
      memory.id === updatedMemory.id ? updatedMemory : memory
    ));
  };

  const handleDeleteMemory = async (memoryId) => {
    try {
      await fetch(`${baseURL}/api/memories/${memoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setMemories(memories.filter(m => m.id !== memoryId));
      addNotification('Memory deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting memory:', error);
      addNotification('Failed to delete memory', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setMemoryToDelete(null);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white shadow-md rounded-lg">
          <p className="text-xl font-medium text-gray-700">Please log in to view your profile.</p>
          <Link to="/login" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row mb-8 items-center md:items-start">
        {/* Profile Picture */}
        <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 mb-4 md:mb-0 md:mr-8">
          <img
            src={user.profilePicture || '/iconLOGO.png'}
            alt="Profile"
            className="w-full h-full rounded-full object-cover border-2 border-gray-200"
          />
        </div>

        {/* Profile Info */}
        <div className="flex-grow">
          <div className="flex items-center mb-4 justify-center md:justify-start">
            <h1 className="text-2xl font-light mr-4">{user.name||user.username}</h1>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-4 py-2 border border-gray-300 rounded font-semibold text-sm hover:bg-gray-50"
              >
                Edit Profile
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-lg shadow-xl z-20 border border-gray-200">
                  <button
                    onClick={() => {
                      setIsEditModalOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => {
                      // Handle settings
                      setIsDropdownOpen(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Settings
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-8 justify-center md:justify-start mb-4">
            <div>
              <span className="font-semibold">{memories?.length || 0}</span>{" "}
              <span className="text-gray-500">memories</span>
            </div>
            <div>
              <span className="font-semibold">
                {followCountsLoading ? "..." : followCounts.followers}
              </span>{" "}
              <span className="text-gray-500">followers</span>
            </div>
            <div>
              <span className="font-semibold">
                {followCountsLoading ? "..." : followCounts.following}
              </span>{" "}
              <span className="text-gray-500">following</span>
            </div>
          </div>

          <div className="text-center md:text-left">
            <h2 className="font-semibold">@{user.username}</h2>
            {user.bio && <p className="text-gray-600">{user.bio}</p>}
          </div>
        </div>
      </div>

      {/* Memories Grid */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">My Memories</h3>
        {memoriesLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : memories?.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {memories.map((memory) => (
              <div key={memory.id} className="relative pt-[100%] group">
                <div className="absolute inset-0">
                  <img
                    src={memory.mediaUrl}
                    alt={memory.description}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setPreviewMemory(memory)}
                  />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const menu = document.getElementById(`memory-menu-${memory.id}`);
                        menu.classList.toggle('hidden');
                      }}
                      className="p-1 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>
                    <div
                      id={`memory-menu-${memory.id}`}
                      className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50"
                    >
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setSelectedMemory(memory);
                            setIsEditMemoryModalOpen(true);
                            document.getElementById(`memory-menu-${memory.id}`).classList.add('hidden');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setMemoryToDelete(memory);
                            setShowDeleteConfirm(true);
                            document.getElementById(`memory-menu-${memory.id}`).classList.add('hidden');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No memories yet</p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
      />

      {/* Edit Memory Modal */}
      {selectedMemory && (
        <EditMemoryModal
          isOpen={isEditMemoryModalOpen}
          onClose={() => {
            setIsEditMemoryModalOpen(false);
            setSelectedMemory(null);
          }}
          memory={selectedMemory}
          onMemoryUpdate={handleMemoryUpdate}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && memoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl border border-white/50">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this memory? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setMemoryToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMemory(memoryToDelete.id)}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 shadow-md font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Memory Preview Modal */}
      {previewMemory && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-7xl w-full mx-4 bg-white rounded-lg overflow-hidden flex h-[80vh]">
            {/* Left side - Media */}
            <div className="w-[60%] relative bg-black flex items-center">
              {previewMemory.mediaType === 'video' ? (
                <video 
                  src={previewMemory.mediaUrl} 
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                />
              ) : previewMemory.mediaType === 'audio' ? (
                <div className="w-full p-8 bg-gray-900 flex items-center justify-center">
                  <audio 
                    src={previewMemory.mediaUrl} 
                    className="w-full"
                    controls
                    autoPlay
                  />
                </div>
              ) : (
                <img 
                  src={previewMemory.mediaUrl} 
                  alt={previewMemory.description}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Right side - Comments */}
            <div className="w-[40%] flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <img 
                        src={user.profilePicture || '/iconLOGO.png'} 
                        alt={user.username}
                        className="w-8 h-8 rounded-full mr-3"
                      />
                      <div>
                        <p className="font-semibold">{user.username}</p>
                        <p className="text-xs text-gray-500">{previewMemory.location}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPreviewMemory(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <h2 className="text-xl font-semibold mb-2">{previewMemory.title}</h2>
                  <p className="text-gray-600 mb-2">{previewMemory.description}</p>
                  <p className="text-sm text-gray-500 mb-3">
                    {new Date(previewMemory.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Comments Section */}
              <CommentsSection memoryId={previewMemory.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
