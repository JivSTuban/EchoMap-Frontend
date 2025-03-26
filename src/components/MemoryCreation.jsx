import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { LocationPicker } from './LocationPicker';
import { MediaPreview } from './MediaPreview';
import { uploadToCloudinary } from '../config/cloudinary';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import API from '../services/api';

export const MemoryCreation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  console.log('Auth user data:', user);
  const { addNotification } = useNotification();
  const [mediaType, setMediaType] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [location, setLocation] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('PUBLIC');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const validTypes = {
    audio: ['audio/mp3', 'audio/wav', 'audio/mpeg'],
    photo: ['image/jpeg', 'image/png', 'image/gif'],
    video: ['video/mp4', 'video/quicktime', 'video/x-msvideo']
  };

  const detectMediaType = (file) => {
    if (!file) return null;
    
    for (const [type, mimeTypes] of Object.entries(validTypes)) {
      if (mimeTypes.some(mime => file.type.startsWith(mime))) {
        return type;
      }
    }
    return null;
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const detectedType = detectMediaType(file);
    if (detectedType) {
      setMediaFile(file);
      setMediaType(detectedType);
      setError(null);
    } else {
      setError(`Unsupported file type. Please upload an image, video, or audio file.`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav'],
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'video/*': ['.mp4', '.mov', '.avi']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024 // Allow up to 50MB for all file types
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setError(null);
    
    try {
      // First check if user is authenticated
      if (!user) {
        throw new Error('You must be logged in to create a memory');
      }
      
      // Validate form
      if (!mediaFile) {
        throw new Error('Please select an image, video, or audio file');
      }
      
      if (!location) {
        throw new Error('Please select a location for your memory');
      }
      
      // The rest of the upload process
      const cloudinaryResponse = await uploadToCloudinary(mediaFile, (progress) => {
        if (progress.lengthComputable) {
          const percent = Math.round((progress.loaded * 100) / progress.total);
          setUploadProgress(percent);
        }
      });
      
      const memoryData = {
        mediaUrl: cloudinaryResponse.url,
        cloudinaryPublicId: cloudinaryResponse.publicId,
        mediaType: mediaType === 'photo' ? 'IMAGE' : mediaType === 'audio' ? 'AUDIO' : 'VIDEO',
        title,
        description,
        latitude: location.lat,
        longitude: location.lng,
        visibility: privacy,
        // userId is determined from authentication on the server side
      };

      console.log('Sending memory data to server:', memoryData);
      
      // Get the current token directly from localStorage 
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        throw new Error('Authentication token is missing. Please log in again.');
      }
      
      // Use the API instance with explicit auth header for this critical request
      const createResponse = await API.post('/api/memories', memoryData, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Memory created successfully:', createResponse.data);

      // Reset form
      setMediaFile(null);
      setMediaType(null);
      setLocation(null);
      setTitle('');
      setDescription('');
      setError(null);
      setUploadProgress(0);

      // Show success message using NotificationContext
      addNotification('Memory created successfully!', 'success');
      
      // Redirect to home page
      navigate('/map');
    } catch (err) {
      console.error('Failed to create memory:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create memory. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const inputStyle = "w-full px-4 py-3 bg-white/50 rounded-xl border border-gray-200/80 focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 text-gray-900 shadow-sm backdrop-blur-sm transition-all hover:bg-white/80";

  return (
    <form onSubmit={handleSubmit} className="container mx-auto px-6 py-12 max-w-5xl">
      <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-200/80">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-2xl font-bold leading-9 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
            Create Memory
          </h2>
          <p className="mt-1 text-center text-sm text-gray-600">
            Capture your moments and pin them to special places
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column - Media Upload */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Media
              </label>
              <div
                {...getRootProps()}
                className={`mt-2 flex justify-center rounded-lg border-2 border-dashed px-6 py-10 ${
                  isDragActive 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-900/25'
                } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="text-center">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                  <div className="mt-4 flex text-sm leading-6 text-gray-600">
                    <input {...getInputProps()} disabled={isUploading} />
                    <label className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500">
                      <span>Upload a file</span>
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-600">
                    Photos (PNG, JPG, GIF), Videos (MP4, MOV), or Audio (MP3, WAV)
                  </p>
                </div>
              </div>
            </div>

            {mediaFile && (
              <>
                <div className="bg-indigo-50 px-4 py-2 rounded-lg text-sm text-indigo-700">
                  Detected media type: <span className="font-semibold capitalize">{mediaType}</span>
                </div>
                <MediaPreview file={mediaFile} type={mediaType} />
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputStyle}
                placeholder="Enter a title for your memory"
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={`${inputStyle} resize-none`}
                placeholder="Add a description to your memory..."
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
              <LocationPicker
                value={location}
                onChange={setLocation}
                disabled={isUploading}
              />
              {location && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-500">
                    Selected: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                </div>
              )}
              {!location && (
                <p className="mt-2 text-sm text-gray-500">
                  Click on the map to place your memory marker
                </p>
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
                <option value="FOLLOWERS">Followers Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Visual connection between media and location */}
        {mediaFile && location && (
          <div className="mt-6 px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex items-center">
            <div className="flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden shadow-sm mr-4">
              {mediaType === 'photo' && (
                <img src={URL.createObjectURL(mediaFile)} alt="Preview" className="h-full w-full object-cover" />
              )}
              {mediaType === 'video' && (
                <div className="h-full w-full bg-indigo-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
              {mediaType === 'audio' && (
                <div className="h-full w-full bg-indigo-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Memory Ready to Create</h3>
              <p className="text-sm text-gray-600">Your {mediaType} will be linked to the selected location on the map.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            {error}
          </div>
        )}

        {isUploading && (
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-600 text-center">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            className={`px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full transition-all transform hover:scale-105 shadow-md ${
              isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
            }`}
            disabled={isUploading}
          >
            {isUploading ? 'Creating Memory...' : 'Create Memory'}
          </button>
        </div>
      </div>
    </form>
  );
};
