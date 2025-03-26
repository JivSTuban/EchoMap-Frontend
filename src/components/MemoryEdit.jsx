import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { LocationPicker } from './LocationPicker';
import { MediaPreview } from './MediaPreview';
import { uploadToCloudinary } from '../config/cloudinary';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import API from '../services/api';

export const MemoryEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { memory: initialMemory } = location.state || {};
  const { user } = useAuth();
  const { addNotification } = useNotification();
  
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('photo');
  const [mapLocation, setMapLocation] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('PUBLIC');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [memory, setMemory] = useState(null);
  const [isLoading, setIsLoading] = useState(!initialMemory);

  // Convert media type from server format to component format
  const convertMediaTypeToUI = (serverType) => {
    if (!serverType) return 'photo';
    const typeMap = {
      'IMAGE': 'photo',
      'VIDEO': 'video',
      'AUDIO': 'audio'
    };
    return typeMap[serverType] || 'photo';
  };

  // Convert media type from component format to server format
  const convertMediaTypeToServer = (uiType) => {
    const typeMap = {
      'photo': 'IMAGE',
      'video': 'VIDEO',
      'audio': 'AUDIO'
    };
    return typeMap[uiType] || 'IMAGE';
  };

  // Load memory data if not provided in location state
  useEffect(() => {
    const fetchMemory = async () => {
      try {
        setIsLoading(true);
        const response = await API.get(`/api/memories/${id}`);
        setMemory(response.data);
        
        // Initialize form with memory data
        setTitle(response.data.title || '');
        setDescription(response.data.description || '');
        setMediaUrl(response.data.mediaUrl || '');
        setMediaType(convertMediaTypeToUI(response.data.mediaType));
        setMapLocation(response.data.latitude && response.data.longitude 
          ? { lat: response.data.latitude, lng: response.data.longitude }
          : null);
        setPrivacy(response.data.visibility || 'PUBLIC');
      } catch (error) {
        console.error('Error fetching memory:', error);
        addNotification('Failed to load memory data', 'error');
        navigate('/map');
      } finally {
        setIsLoading(false);
      }
    };

    // If we have initial memory data from navigation state, use it
    if (initialMemory) {
      setMemory(initialMemory);
      setTitle(initialMemory.title || '');
      setDescription(initialMemory.description || '');
      setMediaUrl(initialMemory.mediaUrl || '');
      setMediaType(convertMediaTypeToUI(initialMemory.mediaType));
      setMapLocation(initialMemory.latitude && initialMemory.longitude
        ? { lat: initialMemory.latitude, lng: initialMemory.longitude }
        : null);
      setPrivacy(initialMemory.visibility || 'PUBLIC');
    } else if (id) {
      // Otherwise fetch it from the API
      fetchMemory();
    } else {
      // No ID or initial data, redirect back to map
      navigate('/map');
    }
  }, [id, initialMemory, navigate, addNotification]);

  // Ownership check
  useEffect(() => {
    if (memory && user && memory.userId !== user.id) {
      addNotification('You do not have permission to edit this memory', 'error');
      navigate('/map');
    }
  }, [memory, user, navigate, addNotification]);

  const validTypes = {
    audio: ['audio/mp3', 'audio/wav', 'audio/mpeg'],
    photo: ['image/jpeg', 'image/png', 'image/gif'],
    video: ['video/mp4', 'video/quicktime', 'video/x-msvideo']
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (validTypes[mediaType].some(type => file.type.startsWith(type))) {
      setMediaFile(file);
      setError(null);
    } else {
      setError(`Please select a valid ${mediaType} file.`);
    }
  }, [mediaType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': mediaType === 'audio' ? ['.mp3', '.wav'] : [],
      'image/*': mediaType === 'photo' ? ['.jpeg', '.jpg', '.png', '.gif'] : [],
      'video/*': mediaType === 'video' ? ['.mp4', '.mov', '.avi'] : []
    },
    multiple: false,
    maxSize: mediaType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setError(null);
    
    try {
      // First check if user is authenticated
      if (!user) {
        throw new Error('You must be logged in to edit a memory');
      }
      
      // Get the current auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing. Please log in again.');
      }
      
      // Validate form
      if (!mapLocation) {
        throw new Error('Please select a location for your memory');
      }
      
      // Prepare memory data
      const memoryData = {
        id: memory.id,
        title,
        description,
        latitude: mapLocation.lat,
        longitude: mapLocation.lng,
        visibility: privacy,
        mediaType: convertMediaTypeToServer(mediaType),
        mediaUrl: memory.mediaUrl, // Keep existing media by default
        userId: memory.userId, // Preserve original owner
      };

      // If a new media file was selected, upload it first
      if (mediaFile) {
        const cloudinaryResponse = await uploadToCloudinary(mediaFile, (progress) => {
          if (progress.lengthComputable) {
            const percent = Math.round((progress.loaded * 100) / progress.total);
            setUploadProgress(percent);
          }
        });
        
        // Update media info in the memory data
        memoryData.mediaUrl = cloudinaryResponse.url;
        memoryData.cloudinaryPublicId = cloudinaryResponse.publicId;
      }

      console.log('Sending updated memory data to server:', memoryData);
      
      // Update the memory using PUT request
      await API.put(`/api/memories/${memory.id}`, memoryData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Show success message
      addNotification('Memory updated successfully!', 'success');
      
      // Navigate back to the map
      navigate('/map');
    } catch (err) {
      console.error('Failed to update memory:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update memory. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const inputStyle = "w-full px-4 py-3 bg-white/50 rounded-xl border border-gray-200/80 focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 text-gray-900 shadow-sm backdrop-blur-sm transition-all hover:bg-white/80";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="ml-2">Loading memory data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="container mx-auto px-6 py-12 max-w-5xl">
      <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-200/80">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-2xl font-bold leading-9 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
            Edit Memory
          </h2>
          <p className="mt-1 text-center text-sm text-gray-600">
            Update your moments pinned to special places
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column - Media Upload */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Media Type
              </label>
              <select
                value={mediaType}
                onChange={(e) => {
                  setMediaType(e.target.value);
                  setMediaFile(null); // Reset file when type changes
                }}
                className={inputStyle}
              >
                <option value="photo">Photo</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
              </select>
            </div>

            {/* Media Upload Dropzone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mediaFile ? 'Change Media' : 'Upload Media'}
              </label>
              
              {/* Current Media Preview */}
              {!mediaFile && mediaUrl && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Current media:</p>
                  {mediaType === 'photo' && (
                    <img 
                      src={mediaUrl} 
                      alt={description || "Memory"} 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  {mediaType === 'video' && (
                    <video 
                      src={mediaUrl} 
                      controls
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  {mediaType === 'audio' && (
                    <audio 
                      src={mediaUrl} 
                      controls
                      className="w-full rounded-lg"
                    />
                  )}
                </div>
              )}
              
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300'
                }`}
              >
                <input {...getInputProps()} />
                {mediaFile ? (
                  <MediaPreview file={mediaFile} mediaType={mediaType} />
                ) : (
                  <div className="space-y-2">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      {isDragActive
                        ? `Drop your ${mediaType} here...`
                        : `Drag and drop your ${mediaType}, or click to select`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {mediaType === 'photo' ? 'JPG, PNG, GIF up to 10MB' : 
                       mediaType === 'video' ? 'MP4, MOV up to 50MB' : 
                       'MP3, WAV up to 10MB'}
                    </p>
                  </div>
                )}
              </div>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter a title for your memory"
                disabled={isUploading}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputStyle}
                placeholder="What makes this moment special?"
              />
            </div>
          </div>

          {/* Right Column - Location & Privacy */}
          <div className="space-y-6">
            {/* Location Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="rounded-xl overflow-hidden border border-gray-200/80 shadow-sm h-[300px]">
                <LocationPicker 
                  onChange={setMapLocation} 
                  initialValue={mapLocation}
                />
              </div>
              {!mapLocation && (
                <p className="mt-2 text-sm text-red-600">Please select a location for your memory</p>
              )}
            </div>

            {/* Privacy Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Privacy
              </label>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                className={inputStyle}
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
                <option value="FRIENDS">Friends Only</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isUploading || !mapLocation}
                className={`w-full flex justify-center items-center py-3 px-4 rounded-xl text-white font-medium transition-all ${
                  isUploading || !mapLocation
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg'
                }`}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Processing...'}
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/map')}
                className="w-full mt-4 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}; 