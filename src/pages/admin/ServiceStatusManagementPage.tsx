import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
// import { useToast } from '../../contexts/ToastContext';

interface ServiceStatus {
  id: number;
  line_id?: number;
  line_name?: string;
  station_id?: number;
  station_name?: string;
  status_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  start_time?: string;
  end_time?: string;
  is_active: boolean;
  created_at?: string;
}

interface Line {
  id: number;
  name: string;
  color?: string;
}

interface Station {
  id: number;
  name: string;
  line_id?: number;
}

const ServiceStatusManagementPage: React.FC = () => {
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState<ServiceStatus | null>(null);
  const [filters, setFilters] = useState({
    line_id: '',
    station_id: '',
    active_only: true
  });

  const [formData, setFormData] = useState({
    line_id: '',
    station_id: '',
    status_type: 'delay',
    severity: 'low' as const,
    message: '',
    start_time: new Date().toISOString().slice(0, 16),
    end_time: '',
    is_active: true
  });

  // Simple toast replacement for debugging
  const showToast = (message: string, type: 'success' | 'error') => {
    alert(`${type.toUpperCase()}: ${message}`);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadServiceStatuses();
  }, [filters]);

  const loadData = async () => {
    try {
      const [linesData, stationsData] = await Promise.all([
        adminService.getLines(),
        adminService.getStations()
      ]);
      setLines(linesData);
      setStations(stationsData);
      await loadServiceStatuses();
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load data', 'error');
    }
  };

  const loadServiceStatuses = async () => {
    setLoading(true);
    try {
      const filterParams = {
        ...(filters.line_id && { line_id: parseInt(filters.line_id) }),
        ...(filters.station_id && { station_id: parseInt(filters.station_id) }),
        active_only: filters.active_only
      };
      const data = await adminService.getServiceStatuses(filterParams);
      setServiceStatuses(data);
    } catch (error) {
      console.error('Error loading service statuses:', error);
      showToast('Failed to load service statuses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('ServiceStatusManagementPage: Form submitted');
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        line_id: formData.line_id ? parseInt(formData.line_id) : null,
        station_id: formData.station_id ? parseInt(formData.station_id) : null,
        start_time: formData.start_time || new Date().toISOString(),
        end_time: formData.end_time || null
      };

      console.log('ServiceStatusManagementPage: Submit data prepared:', submitData);

      if (editingStatus) {
        console.log('ServiceStatusManagementPage: Updating service status with ID:', editingStatus.id);
        const result = await adminService.updateServiceStatus(editingStatus.id, submitData);
        console.log('ServiceStatusManagementPage: Update result:', result);
        showToast('Service status updated successfully', 'success');
      } else {
        console.log('ServiceStatusManagementPage: Creating new service status');
        const result = await adminService.createServiceStatus(submitData);
        console.log('ServiceStatusManagementPage: Create result:', result);
        showToast('Service status created successfully', 'success');
      }

      setShowModal(false);
      resetForm();
      await loadServiceStatuses();
    } catch (error: any) {
      console.error('ServiceStatusManagementPage: Error saving service status:', error);
      console.error('ServiceStatusManagementPage: Error response:', error.response);
      showToast(error.response?.data?.detail || 'Failed to save service status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (status: ServiceStatus) => {
    setEditingStatus(status);
    setFormData({
      line_id: status.line_id?.toString() || '',
      station_id: status.station_id?.toString() || '',
      status_type: status.status_type,
      severity: status.severity,
      message: status.message,
      start_time: status.start_time ? new Date(status.start_time).toISOString().slice(0, 16) : '',
      end_time: status.end_time ? new Date(status.end_time).toISOString().slice(0, 16) : '',
      is_active: status.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (status: ServiceStatus) => {
    if (!window.confirm('Are you sure you want to delete this service status?')) {
      return;
    }

    try {
      await adminService.deleteServiceStatus(status.id);
      showToast('Service status deleted successfully', 'success');
      await loadServiceStatuses();
    } catch (error: any) {
      console.error('Error deleting service status:', error);
      showToast(error.response?.data?.detail || 'Failed to delete service status', 'error');
    }
  };

  const handleResolve = async (status: ServiceStatus) => {
    if (!window.confirm('Are you sure you want to resolve this service status?')) {
      return;
    }

    try {
      await adminService.resolveServiceStatus(status.id);
      showToast('Service status resolved successfully', 'success');
      await loadServiceStatuses();
    } catch (error: any) {
      console.error('Error resolving service status:', error);
      showToast(error.response?.data?.detail || 'Failed to resolve service status', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      line_id: '',
      station_id: '',
      status_type: 'delay',
      severity: 'low',
      message: '',
      start_time: new Date().toISOString().slice(0, 16),
      end_time: '',
      is_active: true
    });
    setEditingStatus(null);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusTypeIcon = (statusType: string) => {
    switch (statusType) {
      case 'delay': return '⏰';
      case 'maintenance': return '🔧';
      case 'disruption': return '⚠️';
      case 'closure': return '🚫';
      case 'reduced_service': return '📉';
      default: return 'ℹ️';
    }
  };

  const statusTypes = [
    { value: 'delay', label: 'Delay' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'disruption', label: 'Service Disruption' },
    { value: 'closure', label: 'Service Closure' },
    { value: 'reduced_service', label: 'Reduced Service' },
    { value: 'information', label: 'Information' }
  ];

  const severityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Status Management</h1>
          <p className="text-gray-600">Manage train service alerts, delays, and maintenance notifications</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span className="mr-2">➕</span>
          Create Status
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Line</label>
            <select
              value={filters.line_id}
              onChange={(e) => setFilters(prev => ({ ...prev, line_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Lines</option>
              {lines.map(line => (
                <option key={line.id} value={line.id}>{line.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Station</label>
            <select
              value={filters.station_id}
              onChange={(e) => setFilters(prev => ({ ...prev, station_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Stations</option>
              {stations.map(station => (
                <option key={station.id} value={station.id}>{station.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
            <select
              value={filters.active_only ? 'active' : 'all'}
              onChange={(e) => setFilters(prev => ({ ...prev, active_only: e.target.value === 'active' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active Only</option>
              <option value="all">All Statuses</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadServiceStatuses}
              disabled={loading}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '🔄 Loading...' : '🔍 Apply Filters'}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Statuses</p>
              <p className="text-2xl font-bold text-gray-900">{serviceStatuses.length}</p>
            </div>
            <div className="text-blue-500 text-2xl">📊</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Issues</p>
              <p className="text-2xl font-bold text-red-600">{serviceStatuses.filter(s => s.is_active).length}</p>
            </div>
            <div className="text-red-500 text-2xl">⚠️</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Issues</p>
              <p className="text-2xl font-bold text-red-800">{serviceStatuses.filter(s => s.severity === 'critical' && s.is_active).length}</p>
            </div>
            <div className="text-red-800 text-2xl">🚨</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved Today</p>
              <p className="text-2xl font-bold text-green-600">
                {serviceStatuses.filter(s => !s.is_active && s.end_time && new Date(s.end_time).toDateString() === new Date().toDateString()).length}
              </p>
            </div>
            <div className="text-green-500 text-2xl">✅</div>
          </div>
        </div>
      </div>

      {/* Service Statuses List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Service Statuses ({serviceStatuses.length})</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            🔄 Loading service statuses...
          </div>
        ) : serviceStatuses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            📭 No service statuses found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type & Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviceStatuses.map((status) => (
                  <tr key={status.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getStatusTypeIcon(status.status_type)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {status.status_type.replace('_', ' ')}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(status.severity)}`}>
                            {status.severity}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {status.line_name && <div className="font-medium">{status.line_name}</div>}
                        {status.station_name && <div className="text-gray-500">{status.station_name}</div>}
                        {!status.line_name && !status.station_name && <span className="text-gray-400">System-wide</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={status.message}>
                        {status.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {status.start_time && <div>Start: {new Date(status.start_time).toLocaleString()}</div>}
                        {status.end_time && <div>End: {new Date(status.end_time).toLocaleString()}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        status.is_active ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {status.is_active ? 'Active' : 'Resolved'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(status)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      {status.is_active && (
                        <button
                          onClick={() => handleResolve(status)}
                          className="text-green-600 hover:text-green-900"
                          title="Resolve"
                        >
                          ✅
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(status)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingStatus ? 'Edit Service Status' : 'Create Service Status'}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status Type *</label>
                      <select
                        value={formData.status_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, status_type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {statusTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Severity *</label>
                      <select
                        value={formData.severity}
                        onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {severityOptions.map(severity => (
                          <option key={severity.value} value={severity.value}>{severity.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Line (Optional)</label>
                      <select
                        value={formData.line_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, line_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Line</option>
                        {lines.map(line => (
                          <option key={line.id} value={line.id}>{line.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Station (Optional)</label>
                      <select
                        value={formData.station_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, station_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Station</option>
                        {stations
                          .filter(station => !formData.line_id || station.line_id?.toString() === formData.line_id)
                          .map(station => (
                            <option key={station.id} value={station.id}>{station.name}</option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe the service status..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                        <input
                          type="datetime-local"
                          value={formData.start_time}
                          onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Time (Optional)</label>
                        <input
                          type="datetime-local"
                          value={formData.end_time}
                          onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-700">Active Status</label>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (editingStatus ? 'Update' : 'Create')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceStatusManagementPage;