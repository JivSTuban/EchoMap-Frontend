import { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { LocationPicker } from './LocationPicker';
import { MediaPreview } from './MediaPreview';
import { uploadToCloudinary } from '../config/cloudinary';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';

export const EditMemoryModal = ({ isOpen, onClose, memory, onMemoryUpdate }) => {
  const { addNotification } = useNotification();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  
  // Form state
  const [title, setTitle] = useState(memory?.title || '');
  const [description, setDescription] = useState(memory?.description || '');
  const [mediaUrl, setMediaUrl] = useState(memory?.mediaUrl || '');
  const [mediaType, setMediaType] = useState(convertMediaTypeToUI(memory?.mediaType));
  const [mapLocation, setMapLocation] = useState(
    memory?.latitude && memory?.longitude 
      ? { lat: memory.latitude, lng: memory.longitude }
      : null
  );
  const [privacy, setPrivacy] = useState(memory?.visibility || 'PUBLIC');

  // Convert media type from server format to component format
  function convertMediaTypeToUI(serverType) {
    if (!serverType) return 'photo';
    const typeMap = {
      'IMAGE': 'photo',
      'VIDEO': 'video',
      'AUDIO': 'audio'
    };
    return typeMap[serverType] || 'photo';
  }

  // Convert media type from component format to server format
  function convertMediaTypeToServer(uiType) {
    const typeMap = {
      'photo': 'IMAGE',
      'video': 'VIDEO',
      'audio': 'AUDIO'
    };
    return typeMap[uiType] || 'IMAGE';
  }

  // Update form data when memory prop changes
  useEffect(() => {
    if (memory) {
      setTitle(memory.title || '');
      setDescription(memory.description || '');
      setMediaUrl(memory.mediaUrl || '');
      setMediaType(convertMediaTypeToUI(memory.mediaType));
      setMapLocation(
        memory.latitude && memory.longitude 
          ? { lat: memory.latitude, lng: memory.longitude }
          : null
      );
      setPrivacy(memory.visibility || 'PUBLIC');
    }
  }, [memory]);

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
      // Validate form
      if (!mapLocation) {
        throw new Error('Please select a location for your memory');
      }
      
      if (!title.trim()) {
        throw new Error('Title is required');
      }

      // Get the current auth token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing. Please log in again.');
      }
      
      // Prepare memory data
      const memoryData = {
        title: title.trim(),
        description: description.trim(),
        latitude: mapLocation.lat,
        longitude: mapLocation.lng,
        visibility: privacy,
        mediaType: convertMediaTypeToServer(mediaType),
        mediaUrl: mediaUrl // Keep existing media by default
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

      // Update the memory
      const response = await api.put(`/api/memories/${memory.id}`, memoryData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      addNotification('Memory updated successfully!', 'success');
      onMemoryUpdate({ ...memory, ...response.data });
      onClose();
    } catch (err) {
      console.error('Failed to update memory:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update memory. Please try again.');
      addNotification(err.response?.data?.message || err.message || 'Failed to update memory', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const inputStyle = "w-full px-4 py-3 bg-white/60 rounded-xl border border-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 text-gray-900 shadow-sm backdrop-blur-sm transition-all hover:bg-white/80";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white/80 backdrop-blur-md rounded-3xl max-w-5xl w-full max-h-[100vh] overflow-y-auto shadow-xl shadow-indigo-500/10 border border-white/50">
        <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-gray-100 rounded-t-3xl px-8 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Edit Memory
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Update your moments pinned to special places
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mx-8 mt-6 mb-2 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 pt-4 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column - Media Upload */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Media Type
              </label>
              <div className="relative">
                <select
                  value={mediaType}
                  onChange={(e) => {
                    setMediaType(e.target.value);
                    setMediaFile(null);
                  }}
                  className={`${inputStyle} appearance-none pr-10`}
                >
                  <option value="photo">Photo</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mediaFile ? 'Change Media' : 'Upload Media'}
              </label>
              
              {/* Current Media Preview */}
              {!mediaFile && mediaUrl && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Current media:</p>
                  <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100">
                    {mediaType === 'photo' && (
                      <img 
                        src={mediaUrl} 
                        alt={description || "Memory"} 
                        className="w-full h-48 object-cover"
                      />
                    )}
                    {mediaType === 'video' && (
                      <video 
                        src={mediaUrl} 
                        controls
                        className="w-full h-48 object-cover"
                      />
                    )}
                    {mediaType === 'audio' && (
                      <audio 
                        src={mediaUrl} 
                        controls
                        className="w-full"
                      />
                    )}
                  </div>
                </div>
              )}
              
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragActive ? 'border-indigo-400 bg-indigo-50/70 shadow-md' : 'border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30'
                }`}
              >
                <input {...getInputProps()} />
                {mediaFile ? (
                  <MediaPreview file={mediaFile} mediaType={mediaType} />
                ) : (
                  <div className="space-y-2">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="text-sm text-gray-600 font-medium">
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
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputStyle}
                placeholder="Enter a title for your memory"
                disabled={isUploading}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={inputStyle}
                placeholder="What makes this moment special?"
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Right Column - Location & Privacy */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="rounded-xl overflow-hidden border border-gray-200/80 shadow-md h-[300px]">
                <LocationPicker 
                  onChange={setMapLocation} 
                  initialValue={mapLocation}
                />
              </div>
              {!mapLocation && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Please select a location for your memory
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Privacy
              </label>
              <div className="relative">
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value)}
                  className={`${inputStyle} appearance-none pr-10`}
                  disabled={isUploading}
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                  <option value="FRIENDS">Friends Only</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isUploading || !mapLocation}
                className={`w-full flex justify-center items-center py-3 px-4 rounded-xl text-white font-medium transition-all ${
                  isUploading || !mapLocation
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
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
                onClick={onClose}
                className="w-full mt-4 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all hover:border-gray-400 hover:shadow-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

EditMemoryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  memory: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    mediaUrl: PropTypes.string,
    mediaType: PropTypes.string,
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
    visibility: PropTypes.string
  }).isRequired,
  onMemoryUpdate: PropTypes.func.isRequired
};
