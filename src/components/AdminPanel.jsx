import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { MemoryClusterPopup } from './MemoryClusterPopup';
import API from '../services/api';

export const AdminPanel = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [flaggedMemories, setFlaggedMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMemoryId, setSelectedMemoryId] = useState(null);
  const [selectedReports, setSelectedReports] = useState(null);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMemoryPopup, setShowMemoryPopup] = useState(false);
  const [selectedMemoryForPopup, setSelectedMemoryForPopup] = useState(null);
  const itemsPerPage = 7;

  useEffect(() => {
    // Wait for auth state to be ready
    if (authLoading) return;

    // Check if user is admin or moderator
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      navigate('/map');
      return;
    }

    const fetchAdminData = async () => {
      try {
        const [statsResponse, flaggedResponse] = await Promise.all([
          API.get('/api/admin/stats'),
          API.get('/api/admin/flagged-memories')
        ]);
        setStats(statsResponse.data);
        setFlaggedMemories(flaggedResponse.data);
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
        setError('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user, navigate, authLoading]);

  const handleMemoryAction = async (memoryId, action) => {
    try {
      await API.post(`/api/admin/memories/${memoryId}/${action}`);
      // Refresh flagged memories after action
      const response = await API.get('/api/admin/flagged-memories');
      setFlaggedMemories(response.data);
      setSelectedMemoryId(null); // Close menu after action
    } catch (err) {
      console.error(`Failed to ${action} memory:`, err);
      setError(`Failed to ${action} memory`);
    }
  };

  const handleMenuClick = (memoryId) => {
    setSelectedMemoryId(memoryId === selectedMemoryId ? null : memoryId);
  };

  const handleViewMemory = async (memoryId) => {
    const memoryToView = flaggedMemories.find(m => m.id === memoryId);
    if (memoryToView) {
      setSelectedMemoryForPopup([memoryToView]); // Wrap in array since MemoryClusterPopup expects array
      setShowMemoryPopup(true);
      setSelectedMemoryId(null);
    }
  };

  const handleViewReports = async (memoryId) => {
    try {
      const response = await API.get(`/api/admin/memories/${memoryId}/flags`);
      setSelectedReports(response.data);
      setShowReportsModal(true);
      setSelectedMemoryId(null);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError('Failed to load reports');
    }
  };

  // Add click outside handler to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.menu-button')) {
        setSelectedMemoryId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Calculate pagination values
  const totalPages = Math.ceil(flaggedMemories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMemories = flaggedMemories.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setSelectedMemoryId(null); // Close any open menus when changing pages
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          {user?.role === 'ADMIN' ? 'Admin Dashboard' : 'Moderator Dashboard'}
        </h1>
        <div className="space-x-4">
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin/users"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Manage Users
            </Link>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Stats */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            {user?.role === 'ADMIN' ? 'User Statistics' : 'Community Overview'}
          </h2>
          <div className="space-y-2">
            <p>Total Users: {stats?.totalUsers || 0}</p>
            <p>Active Users: {stats?.activeUsers || 0}</p>
            <p>New Users Today: {stats?.newUsersToday || 0}</p>
          </div>
        </div>

        {/* Memory Stats */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            {user?.role === 'ADMIN' ? 'Memory Statistics' : 'Content Overview'}
          </h2>
          <div className="space-y-2">
            <p>Total Memories: {stats?.totalMemories || 0}</p>
            <p>New Memories Today: {stats?.newMemoriesToday || 0}</p>
            <p>Flagged Memories: {stats?.flaggedMemories || 0}</p>
          </div>
        </div>

        {/* System Stats - Only show to admins */}
        {user?.role === 'ADMIN' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">System Statistics</h2>
            <div className="space-y-2">
              <p>Server Uptime: {stats?.serverUptime || 'N/A'}</p>
              <p>Active Sessions: {stats?.activeSessions || 0}</p>
              <p>API Requests Today: {stats?.apiRequestsToday || 0}</p>
            </div>
          </div>
        )}
      </div>

      {/* Flagged Memories Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">
          {user?.role === 'ADMIN' ? 'Flagged Memories' : 'Reported Content'}
        </h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto" style={{ minHeight: '200px' }}>
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4 min-w-[200px]">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 min-w-[150px]">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4 min-w-[200px]">Latest Report</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px] min-w-[100px]">Reports</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px] min-w-[200px]">Actions</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px] min-w-[100px]">Menu</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentMemories.map((memory) => (
                  <tr key={memory.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap w-1/4 min-w-[200px]">
                      <div className="text-sm font-medium text-gray-900">{memory.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap w-1/6 min-w-[150px]">
                      <div className="text-sm text-gray-900">{memory.username}</div>
                    </td>
                    <td className="px-6 py-4 w-1/4 min-w-[200px]">
                      <div className="text-sm text-gray-900">{memory.flagReason || 'No reason provided'}</div>
                    </td>
                    <td className="px-6 py-4 text-center w-[100px] min-w-[100px]">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {memory.totalFlags}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium w-[200px] min-w-[200px]">
                      <button
                        onClick={() => handleMemoryAction(memory.id, 'approve')}
                        className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 mr-2"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleMemoryAction(memory.id, 'delete')}
                        className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center relative w-[100px] min-w-[100px]">
                      <button
                        onClick={() => handleMenuClick(memory.id)}
                        className="menu-button p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      {selectedMemoryId === memory.id && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1" role="menu">
                            <button
                              onClick={() => handleViewMemory(memory.id)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              role="menuitem"
                            >
                              View Memory
                            </button>
                            <button
                              onClick={() => handleViewReports(memory.id)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              role="menuitem"
                            >
                              View All Reports
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {flaggedMemories.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No flagged memories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {flaggedMemories.length > 0 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(endIndex, flaggedMemories.length)}
                    </span>{' '}
                    of <span className="font-medium">{flaggedMemories.length}</span> results
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handlePageChange(index + 1)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === index + 1
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Memory Popup */}
      {showMemoryPopup && selectedMemoryForPopup && (
        <MemoryClusterPopup
          memories={selectedMemoryForPopup}
          isOpen={showMemoryPopup}
          onClose={() => {
            setShowMemoryPopup(false);
            setSelectedMemoryForPopup(null);
          }}
          onSelectMemory={() => {}} // Empty function since we don't need this functionality
          onMemoryDelete={async (memoryId) => {
            await handleMemoryAction(memoryId, 'delete');
            setShowMemoryPopup(false);
            setSelectedMemoryForPopup(null);
          }}
        />
      )}

      {/* Reports Modal */}
      {showReportsModal && selectedReports && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">All Reports ({selectedReports.length})</h3>
              <button
                onClick={() => {
                  setShowReportsModal(false);
                  setSelectedReports(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {selectedReports.map((report, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <p className="text-sm text-gray-500">Reported by: {report.reporterUsername}</p>
                  <p className="text-sm text-gray-500">Date: {new Date(report.createdAt).toLocaleString()}</p>
                  <p className="mt-2">{report.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 