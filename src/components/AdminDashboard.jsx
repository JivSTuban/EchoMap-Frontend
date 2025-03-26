import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { format } from 'date-fns';
import { FlagDetailsModal } from './FlagDetailsModal';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminDashboard() {
  const [flags, setFlags] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMemories: 0,
    totalFlags: 0,
    activeUsers: 0,
    newUsersToday: 0,
    newMemoriesToday: 0,
    flaggedMemories: 0,
    serverUptime: '24/7',
    activeSessions: 0,
    apiRequestsToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [selectedFlags, setSelectedFlags] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMemoryId, setSelectedMemoryId] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Fetch flags
      const flagsResponse = await fetch(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/flags`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!flagsResponse.ok) throw new Error('Failed to fetch flags');
      const flagsData = await flagsResponse.json();

      // Fetch memory details for each unique memory ID
      const uniqueMemoryIds = [...new Set(flagsData.map(flag => flag.memoryId))];
      const memoriesPromises = uniqueMemoryIds.map(memoryId =>
        fetch(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/memories/${memoryId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(res => res.json())
      );
      const memoriesData = await Promise.all(memoriesPromises);
      const memoriesMap = memoriesData.reduce((acc, memory) => {
        acc[memory.id] = memory;
        return acc;
      }, {});

      // Combine flags with memory details
      const flagsWithMemories = flagsData.map(flag => ({
        ...flag,
        memory: memoriesMap[flag.memoryId]
      }));
      setFlags(flagsWithMemories);

      // Fetch users
      const usersResponse = await fetch(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!usersResponse.ok) throw new Error('Failed to fetch users');
      const usersData = await usersResponse.json();
      setUsers(usersData);

      // Fetch stats
      const statsResponse = await fetch(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!statsResponse.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleResolveFlag = async (flagId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/flags/${flagId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to resolve flag');
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.message);
    }
  };

  const handleHideMemory = async (memoryId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/flags/memories/${memoryId}/hide`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to hide memory');
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.message);
    }
  };

  // Group flags by memory
  const groupedFlags = flags.reduce((acc, flag) => {
    if (!acc[flag.memoryId]) {
      acc[flag.memoryId] = {
        memoryId: flag.memoryId,
        flags: [],
        latestFlag: null
      };
    }
    acc[flag.memoryId].flags.push(flag);
    // Keep track of the latest flag
    if (!acc[flag.memoryId].latestFlag || new Date(flag.createdAt) > new Date(acc[flag.memoryId].latestFlag.createdAt)) {
      acc[flag.memoryId].latestFlag = flag;
    }
    return acc;
  }, {});

  const handleViewFlags = async (memoryId, flags) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/memories/${memoryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch memory details');
      const memoryData = await response.json();
      
      setSelectedMemory(memoryData);
      setSelectedFlags(flags);
      setIsModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMenuClick = (memoryId) => {
    setSelectedMemoryId(memoryId === selectedMemoryId ? null : memoryId);
    setIsMenuOpen(!isMenuOpen);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
      
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-4">
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-gray-700 hover:bg-white/[0.12] hover:text-blue-700'
              )
            }
          >
            Flags
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-gray-700 hover:bg-white/[0.12] hover:text-blue-700'
              )
            }
          >
            Users
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-gray-700 hover:bg-white/[0.12] hover:text-blue-700'
              )
            }
          >
            Statistics
          </Tab>
        </Tab.List>

        <Tab.Panels>
          <Tab.Panel className="bg-white rounded-lg shadow-lg p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
              <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">User Statistics</h3>
                  <p className="text-sm text-gray-500">Total Users: {stats.totalUsers}</p>
                  <p className="text-sm text-gray-500">Active Users: {stats.activeUsers}</p>
                  <p className="text-sm text-gray-500">New Users Today: {stats.newUsersToday}</p>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Memory Statistics</h3>
                  <p className="text-sm text-gray-500">Total Memories: {stats.totalMemories}</p>
                  <p className="text-sm text-gray-500">New Memories Today: {stats.newMemoriesToday}</p>
                  <p className="text-sm text-gray-500">Flagged Memories: {stats.flaggedMemories}</p>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">System Statistics</h3>
                  <p className="text-sm text-gray-500">Server Uptime: {stats.serverUptime}</p>
                  <p className="text-sm text-gray-500">Active Sessions: {stats.activeSessions}</p>
                  <p className="text-sm text-gray-500">API Requests Today: {stats.apiRequestsToday}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Flagged Memories</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Memory Details
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Author
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Flag Details
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reports
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.values(groupedFlags).map(({ memoryId, flags, latestFlag }) => {
                        const memory = flags[0]?.memory;
                        return (
                          <tr key={memoryId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{memory?.title || 'Untitled'}</div>
                              <div className="text-sm text-gray-500">ID: {memoryId}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{memory?.username}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{latestFlag.reason}</div>
                              <div className="text-sm text-gray-500">
                                {format(new Date(latestFlag.createdAt), 'PPpp')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                {flags.length} Reports
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end items-center space-x-2">
                                <div className="relative">
                                  <button
                                    onClick={() => handleMenuClick(memoryId)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                    </svg>
                                  </button>
                                  {selectedMemoryId === memoryId && (
                                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                                      <div className="py-1">
                                        <button
                                          onClick={() => {
                                            handleViewFlags(memoryId, flags);
                                            setSelectedMemoryId(null);
                                          }}
                                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                          View Details
                                        </button>
                                        <button
                                          onClick={() => {
                                            handleHideMemory(memoryId);
                                            setSelectedMemoryId(null);
                                          }}
                                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                        >
                                          Hide Memory
                                        </button>
                                        <button
                                          onClick={() => {
                                            handleResolveFlag(latestFlag.id);
                                            setSelectedMemoryId(null);
                                          }}
                                          className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
                                        >
                                          Dismiss Flag
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Tab.Panel>
          <Tab.Panel>
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Management</h3>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.username}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-sm text-gray-500">Role: {user.role}</p>
                          <p className="text-sm text-gray-500">
                            Joined: {format(new Date(user.createdAt), 'PPpp')}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Edit Role
                          </button>
                          <button
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Suspend
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Tab.Panel>
          <Tab.Panel>
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">System Statistics</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-blue-50 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-blue-500 truncate">Total Users</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalUsers}</dd>
                    </div>
                  </div>
                  <div className="bg-green-50 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-green-500 truncate">Total Memories</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalMemories}</dd>
                    </div>
                  </div>
                  <div className="bg-yellow-50 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-yellow-500 truncate">Active Flags</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalFlags}</dd>
                    </div>
                  </div>
                  <div className="bg-purple-50 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-purple-500 truncate">Active Users</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.activeUsers}</dd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      <FlagDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        memory={selectedMemory}
        flags={selectedFlags}
      />
    </div>
  );
} 