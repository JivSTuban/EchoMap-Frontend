import { useState, useEffect, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthContext } from '../context/AuthContext';
import { uploadToCloudinary } from '../config/cloudinary';
import axios from 'axios';
import { Link } from 'react-router-dom';

export const Profile = () => {
  const { user, token } = useAuth();
  const { refreshUser } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    profilePicture: '',
    phoneNumber: '',
    usernameWarningShown: false
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        profilePicture: user.profilePicture || '',
        phoneNumber: user.phoneNumber || '',
        usernameWarningShown: false
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Show warning if username is being changed
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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB. Please choose a smaller image.');
      return;
    }
    
    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Please select an image file.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const imageUrl = await uploadToCloudinary(file, (progress) => {
        setUploadProgress(progress);
      });
      
      setFormData(prev => ({
        ...prev,
        profilePicture: imageUrl
      }));
      
      setSuccessMessage('Profile picture uploaded successfully.');
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
      const response = await axios.put(
        `${import.meta.env.VITE_ECHOMAP_API_URL}/api/users/${user.id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Refresh the user data in the auth context
      try {
        await refreshUser();
        console.log('User data refreshed in context');
      } catch (refreshError) {
        console.error('Failed to refresh user data in context:', refreshError);
      }
      
      const usernameChanged = formData.username !== user.username;
      
      setSuccessMessage(
        usernameChanged 
          ? 'Profile updated successfully. Note: You will need to use your new username on your next login.' 
          : 'Profile updated successfully.'
      );
    } catch (error) {
      console.error('Update error:', error);
      setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-white shadow-md rounded-lg my-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>
      
      {user.socialLogin && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Social Login Account</p>
          <p>You're using a social login account ({user.socialProvider || 'external provider'}). 
            Be careful when changing your username as it may affect your ability to log in.</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40 mb-4">
              {formData.profilePicture ? (
                <img 
                  src={formData.profilePicture} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full border-4 border-gray-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-full text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <label className="cursor-pointer p-2 bg-white rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
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
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            <h2 className="text-xl font-semibold text-gray-800">{formData.name}</h2>
            <p className="text-gray-600">@{formData.username}</p>
          </div>
        </div>
        
        <div className="md:w-2/3">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4">
              <div className="border-b pb-4 mb-2">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Login Information</h3>
                <div className="flex items-center mb-2">
                  <span className="font-medium text-gray-700 min-w-32">Login Method:</span>
                  <span className="text-gray-600">
                    {user.socialLogin 
                      ? `Social Login (${user.socialProvider || 'External Provider'})` 
                      : 'Email & Password'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 min-w-32">Account Created:</span>
                  <span className="text-gray-600">
                    {user.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString() 
                      : 'Unknown'}
                  </span>
                </div>
                {user.socialLogin && (
                  <p className="mt-2 text-sm text-gray-500 bg-yellow-50 p-2 rounded">
                    <span className="font-semibold">Note:</span> For social login accounts, your username is used to 
                    link your social identity to your EchoMap account. If you change your username, 
                    you may encounter login issues.
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading || user.socialLogin}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mt-4 flex justify-end">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMessage('');
                      // Reset form data to original user values
                      if (user) {
                        setFormData({
                          name: user.name || '',
                          email: user.email || '',
                          username: user.username || '',
                          profilePicture: user.profilePicture || '',
                          phoneNumber: user.phoneNumber || '',
                          usernameWarningShown: false
                        });
                      }
                    }}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 