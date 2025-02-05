import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { LocationPicker } from './LocationPicker';
import { MediaPreview } from './MediaPreview';
import { PrivacyControls } from './PrivacyControls';
import { uploadToCloudinary } from '../config/cloudinary';
import { useAuth } from '../hooks/useAuth';
import API from '../services/api';

export const MemoryCreation = () => {
  const { user } = useAuth();
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState('photo');
  const [location, setLocation] = useState(null);
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
    if (!mediaFile || !location) {
      setError('Please select a media file and provide a location.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      // Upload to Cloudinary
      const cloudinaryResponse = await uploadToCloudinary(mediaFile, (progress) => {
        if (progress.lengthComputable) {
          const percent = Math.round((progress.loaded * 100) / progress.total);
          setUploadProgress(percent);
        }
      });

      // Create memory
      const memoryData = {
        mediaUrl: cloudinaryResponse.url,
        cloudinaryPublicId: cloudinaryResponse.publicId,
        mediaType: mediaType === 'photo' ? 'IMAGE' : mediaType.toUpperCase(),
        description,
        latitude: location.lat,
        longitude: location.lng,
        visibility: privacy,
        userId: user?.sub
      };

      await API.post('/api/memories', memoryData);

      // Reset form
      setMediaFile(null);
      setLocation(null);
      setDescription('');
      setError(null);
      setUploadProgress(0);

      // Show success message using NotificationContext
      addNotification('Memory created successfully!', 'success');
    } catch (err) {
      console.error('Failed to create memory:', err);
      setError(err.response?.data?.message || 'Failed to create memory. Please try again.');
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
                  setMediaFile(null);
                  setError(null);
                }}
                className={inputStyle}
                disabled={isUploading}
              >
                <option value="photo">Photo</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
              </select>
            </div>

            <div>
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
                    {mediaType === 'audio' ? 'MP3, WAV up to 10MB' :
                     mediaType === 'photo' ? 'PNG, JPG, GIF up to 10MB' :
                     'MP4, MOV up to 50MB'}
                  </p>
                </div>
              </div>
            </div>

            {mediaFile && (
              <MediaPreview file={mediaFile} type={mediaType} />
            )}

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
                <p className="mt-2 text-sm text-gray-500">
                  Selected: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
              )}
            </div>

            <div className="p-4 bg-white/50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Privacy Settings</h3>
              <PrivacyControls onPrivacyChange={setPrivacy} disabled={isUploading} />
            </div>
          </div>
        </div>

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
