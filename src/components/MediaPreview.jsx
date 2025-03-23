import { useState, useEffect } from 'react';
import { DocumentIcon } from '@heroicons/react/24/outline';
import { AdvancedImage } from '@cloudinary/react';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import cloudinary from '../config/cloudinary';

export const MediaPreview = ({ file, type }) => {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      setError(null);
      return;
    }

    try {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setError(null);

      // Free memory when component unmounts
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } catch (err) {
      setError('Failed to create preview');
      setPreview(null);
    }
  }, [file]);

  if (!file) {
    return null;
  }

  if (error) {
    return (
      <div className="mt-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
        {error}
      </div>
    );
  }

  const renderPreview = () => {
    switch (type) {
      case 'photo': {
        if (file.cloudinaryPublicId) {
          // If the image is already uploaded to Cloudinary
          const img = cloudinary
            .image(file.cloudinaryPublicId)
            .format('auto')
            .quality('auto')
            .resize(auto().gravity(autoGravity()));

          return (
            <div className="relative w-full aspect-square overflow-hidden bg-gray-100 rounded-lg">
              <div className="absolute inset-0 shadow-inner z-10"></div>
              <AdvancedImage
                cldImg={img}
                className="w-full h-full object-cover transform transition-transform hover:scale-105 duration-500"
                onError={() => setError('Failed to load image preview')}
              />
            </div>
          );
        }
        // For local file preview
        return (
          <div className="relative w-full aspect-square overflow-hidden bg-gray-100 rounded-lg">
            <div className="absolute inset-0 shadow-inner z-10"></div>
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover transform transition-transform hover:scale-105 duration-500"
              onError={() => setError('Failed to load image preview')}
            />
          </div>
        );
      }

      case 'video':
        return (
          <div className="relative w-full aspect-video overflow-hidden bg-gray-100 rounded-lg">
            <div className="absolute inset-0 shadow-inner z-10 pointer-events-none"></div>
            <video
              src={preview}
              controls
              className="w-full h-full object-cover"
              onError={() => setError('Failed to load video preview')}
            />
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center space-x-3 p-5 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex-shrink-0 rounded-full bg-indigo-100 p-3">
              <DocumentIcon className="h-8 w-8 text-indigo-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <audio 
                controls 
                className="mt-3 w-full"
                onError={() => setError('Failed to load audio preview')}
              >
                <source src={preview} type={file.type} />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 rounded-lg bg-yellow-50 text-yellow-700">
            Unsupported media type
          </div>
        );
    }
  };

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-gray-200/80 shadow-md bg-white p-1 transform transition-all">
      {renderPreview()}
      <div className="p-3 text-xs text-gray-500 bg-gray-50 rounded-b-lg">
        {file.name && <div className="truncate font-medium">{file.name}</div>}
        {file.size && <div>{(file.size / (1024 * 1024)).toFixed(2)} MB</div>}
      </div>
    </div>
  );
};
