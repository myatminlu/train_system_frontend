import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/common/Toast';

interface RegularUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
  ticket_count: number;
  journey_count: number;
  created_at: string;
  updated_at: string;
}

interface UserStatistics {
  total_users: number;
  users_by_role: Record<string, number>;
  registration_trends: { date: string; registrations: number }[];
  most_active_users: { id: number; name: string; email: string; ticket_count: number }[];
  recent_registrations: { id: number; name: string; email: string; created_at: string }[];
  summary: {
    total_tickets_issued: number;
    total_journeys_planned: number;
    average_tickets_per_user: number;
  };
}

const RegularUserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<RegularUser[]>([]);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<RegularUser | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ skip: 0, limit: 50 });

  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  const { toasts, removeToast, success, error, warning } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [searchTerm, pagination]);

  const loadData = async () => {
    try {
      const [usersData, statsData] = await Promise.all([
        adminService.getRegularUsers({ ...pagination, search: searchTerm || undefined }),
        adminService.getUserStatistics()
      ]);
      setUsers(usersData);
      setStatistics(statsData);
    } catch (err) {
      console.error('Error loading data:', err);
      error('Failed to load data');
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getRegularUsers({ 
        ...pagination, 
        search: searchTerm || undefined 
      });
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('RegularUserManagementPage: Form submitted');
    setLoading(true);

    try {
      if (selectedUser) {
        console.log('RegularUserManagementPage: Updating user with ID:', selectedUser.id);
        console.log('RegularUserManagementPage: Form data:', formData);
        const result = await adminService.updateRegularUser(selectedUser.id, formData);
        console.log('RegularUserManagementPage: Update result:', result);
        success('User updated successfully');
      }

      setShowModal(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      console.error('RegularUserManagementPage: Error saving user:', error);
      console.error('RegularUserManagementPage: Error response:', error.response);
      error(err.response?.data?.detail || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: RegularUser) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email
    });
    setShowModal(true);
  };

  const handleViewDetails = async (user: RegularUser) => {
    try {
      setLoading(true);
      const userDetail = await adminService.getRegularUser(user.id);
      setSelectedUserDetail(userDetail);
      setShowDetailModal(true);
    } catch (err: any) {
      console.error('Error loading user details:', error);
      error(err.response?.data?.detail || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user: RegularUser) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.name}"?`)) {
      return;
    }

    try {
      await adminService.deleteRegularUser(user.id);
      success('User deleted successfully');
      await loadData();
    } catch (err: any) {
      console.error('Error deleting user:', error);
      error(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '' });
    setSelectedUser(null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'user': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'operator': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage regular users (non-admin) and view user statistics</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '🔄' : '🔃'} Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_users}</p>
              </div>
              <div className="text-blue-500 text-2xl">👥</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Admin Users</p>
                <p className="text-2xl font-bold text-red-600">{statistics.users_by_role.admin || 0}</p>
              </div>
              <div className="text-red-500 text-2xl">🛡️</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Regular Users</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.users_by_role.user || 0}</p>
              </div>
              <div className="text-blue-500 text-2xl">👤</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Tickets/User</p>
                <p className="text-2xl font-bold text-green-600">{statistics.summary.average_tickets_per_user.toFixed(1)}</p>
              </div>
              <div className="text-green-500 text-2xl">🎫</div>
            </div>
          </div>
        </div>
      )}

      {/* User Registration Trends */}
      {statistics && statistics.registration_trends.length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Trends (Last 7 Days)</h3>
          <div className="grid grid-cols-7 gap-2">
            {statistics.registration_trends.map((trend, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-500 mb-1">{new Date(trend.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="bg-blue-100 rounded px-2 py-1">
                  <div className="text-sm font-medium text-blue-800">{trend.registrations}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {statistics && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Users</h3>
            <div className="space-y-3">
              {statistics.most_active_users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <div className="text-sm font-medium text-blue-600">{user.ticket_count} tickets</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Registrations</h3>
            <div className="space-y-3">
              {statistics.recent_registrations.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <div className="text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '🔄' : '🔍'} Search
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Users ({filteredUsers.length})</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            🔄 Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            👤 No users found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(role)}`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>🎫 {user.ticket_count} tickets</div>
                      <div>🗺️ {user.journey_count} journeys</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewDetails(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full transform transition-all duration-300 ease-in-out animate-in fade-in-0 zoom-in-95">
              <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">
                    ✏️ Edit User
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Update user information below
                  </p>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter user name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[100px]"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving
                      </div>
                    ) : (
                      'Update User'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedUserDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-in-out animate-in fade-in-0 zoom-in-95">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    👤 User Details
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Comprehensive user information and activity
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4 space-y-6">
                {/* Basic Info */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    📝 Basic Information
                  </h4>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">User ID:</span>
                      <span className="font-medium">{selectedUserDetail.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedUserDetail.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedUserDetail.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Roles:</span>
                      <span className="font-medium">{selectedUserDetail.roles.join(', ')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Member Since:</span>
                      <span className="font-medium">{new Date(selectedUserDetail.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    📊 Activity Statistics
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedUserDetail.statistics.total_tickets}</div>
                      <div className="text-sm text-gray-600">Total Tickets</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{selectedUserDetail.statistics.total_journeys}</div>
                      <div className="text-sm text-gray-600">Total Journeys</div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">฿{selectedUserDetail.statistics.total_spent.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">Total Spent</div>
                    </div>
                  </div>
                </div>

                {/* Recent Tickets */}
                {selectedUserDetail.recent_tickets.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      🎫 Recent Tickets
                    </h4>
                    <div className="space-y-3">
                      {selectedUserDetail.recent_tickets.map((ticket: any) => (
                        <div key={ticket.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-gray-800">Ticket #{ticket.id}</div>
                              <div className="text-sm text-gray-600">
                                Status: <span className={`font-medium ${
                                  ticket.status === 'confirmed' ? 'text-green-600' : 
                                  ticket.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'
                                }`}>{ticket.status}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-gray-800">฿{ticket.total_amount}</div>
                              <div className="text-sm text-gray-600">
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default RegularUserManagementPage;