import { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { AuthContext } from '../context/AuthContext';
import { uploadToCloudinary } from '../config/cloudinary';
import { useNotification } from '../context/NotificationContext';
import axios from 'axios';

export const EditProfileModal = ({ isOpen, onClose, user }) => {
  const { refreshUser } = useContext(AuthContext);
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
    profilePicture: user?.profilePicture || '',
    phoneNumber: user?.phoneNumber || '',
    usernameWarningShown: false
  });
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'username' && user.username !== value && !formData.usernameWarningShown) {
      setFormData(prev => ({
        ...prev,
        usernameWarningShown: true
      }));
      setError(
        "Important: Changing your username may cause issues with social logins (Auth0, etc). " +
        "If you use social login, it's recommended to keep your original username."
      );
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB. Please choose a smaller image.');
      return;
    }
    
    if (!file.type.match('image.*')) {
      setError('Please select an image file.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { url } = await uploadToCloudinary(file, (progress) => {
        setUploadProgress(progress);
      });
      
      setFormData(prev => ({
        ...prev,
        profilePicture: url
      }));
      
      addNotification('Profile picture uploaded successfully.', 'success');
    } catch (error) {
      setError('Failed to upload image. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const dataToSubmit = { ...formData };
      if (user.socialLogin) {
        dataToSubmit.username = user.username;
        dataToSubmit.email = user.email;
      }
      
      await axios.put(
        `${import.meta.env.VITE_ECHOMAP_API_URL}/api/users/${user.id}`,
        dataToSubmit,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      await refreshUser();
      
      const usernameChanged = formData.username !== user.username;
      
      if (usernameChanged) {
        addNotification('Profile updated successfully. Note: You will need to use your new username on your next login.', 'success');
      } else {
        addNotification('Profile updated successfully.', 'success');
      }
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Profile</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24">
              <img 
                src={formData.profilePicture || '/iconLOGO.png'} 
                alt="Profile" 
                className="w-full h-full object-cover rounded-full"
              />
              <label className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 cursor-pointer">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={loading}
                />
              </label>
            </div>
          </div>

          {loading && uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={loading}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              disabled={true}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {user.socialLogin && (
              <p className="mt-1 text-sm text-gray-500">Username cannot be changed for social login accounts.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading || user.socialLogin}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {user.socialLogin && (
              <p className="mt-1 text-sm text-gray-500">Email cannot be changed for social login accounts.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              disabled={loading}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-blue-400"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

EditProfileModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    email: PropTypes.string,
    username: PropTypes.string,
    profilePicture: PropTypes.string,
    phoneNumber: PropTypes.string,
    socialLogin: PropTypes.bool,
    socialProvider: PropTypes.string
  }).isRequired
};