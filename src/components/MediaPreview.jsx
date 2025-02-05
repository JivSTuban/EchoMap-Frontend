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
            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
              <AdvancedImage
                cldImg={img}
                className="w-full h-full object-cover"
                onError={() => setError('Failed to load image preview')}
              />
            </div>
          );
        }
        // For local file preview
        return (
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={() => setError('Failed to load image preview')}
            />
          </div>
        );
      }

      case 'video':
        return (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
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
          <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-50">
            <DocumentIcon className="h-8 w-8 text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <audio 
                controls 
                className="mt-2 w-full"
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
    <div className="mt-4 rounded-lg border border-gray-200/80 overflow-hidden">
      {renderPreview()}
    </div>
  );
};
