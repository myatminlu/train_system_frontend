import React, { useState, useEffect } from 'react';
import {
  MapPin, Plus, Edit, Trash2, Search, Filter, Download, Upload,
  Save, X, AlertCircle, CheckCircle, RefreshCw
} from 'lucide-react';
import { adminService } from '../../services/api';

interface Station {
  id: number;
  name: string;
  lat: string | null;
  long: string | null;
  line_id: number;
  zone_number: number;
  platform_count: number;
  is_interchange: boolean;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string | null;
}

interface StationFormData {
  name: string;
  lat: string;
  long: string;
  line_id: number;
  zone_number: number;
  platform_count: number;
  is_interchange: boolean;
  status: 'active' | 'inactive' | 'maintenance';
}

interface TrainLine {
  id: number;
  line_name: string;
  color: string;
  line_type?: string;
}

const StationManagementPage: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);
  const [trainLines, setTrainLines] = useState<TrainLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [formData, setFormData] = useState<StationFormData>({
    name: '',
    lat: '',
    long: '',
    line_id: 1,
    zone_number: 1,
    platform_count: 2,
    is_interchange: false,
    status: 'active'
  });
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLine, setFilterLine] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadStations();
    loadTrainLines();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [stations, searchTerm, filterLine, filterStatus]);

  const loadStations = async () => {
    try {
      setLoading(true);
      const data = await adminService.getStations();
      setStations(data);
      setError('');
    } catch (err: any) {
      setError('Failed to load stations: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const loadTrainLines = async () => {
    try {
      const data = await adminService.getLines();
      // Map the backend response to match frontend expectations
      const mappedLines = data.map((line: any) => ({
        id: line.id,
        line_name: line.name,  // Map 'name' to 'line_name'
        color: line.color,
        line_type: line.line_type || 'metro'
      }));
      setTrainLines(mappedLines);
    } catch (err: any) {
      console.error('Failed to load train lines:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...stations];

    if (searchTerm) {
      filtered = filtered.filter(station => 
        station.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterLine) {
      filtered = filtered.filter(station => station.line_id === parseInt(filterLine));
    }

    if (filterStatus) {
      filtered = filtered.filter(station => station.status === filterStatus);
    }

    setFilteredStations(filtered);
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      lat: '',
      long: '',
      line_id: trainLines.length > 0 ? trainLines[0].id : 1,
      zone_number: 1,
      platform_count: 2,
      is_interchange: false,
      status: 'active'
    });
    setEditingStation(null);
    setShowCreateModal(true);
  };

  const handleEdit = (station: Station) => {
    setFormData({
      name: station.name,
      lat: station.lat || '',
      long: station.long || '',
      line_id: station.line_id,
      zone_number: station.zone_number,
      platform_count: station.platform_count,
      is_interchange: station.is_interchange,
      status: station.status
    });
    setEditingStation(station);
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('StationManagementPage: Form submitted');
    
    try {
      const submitData = {
        ...formData,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        long: formData.long ? parseFloat(formData.long) : null
      };

      console.log('StationManagementPage: Submit data prepared:', submitData);

      if (editingStation) {
        console.log('StationManagementPage: Updating station with ID:', editingStation.id);
        const result = await adminService.updateStation(editingStation.id, submitData);
        console.log('StationManagementPage: Update result:', result);
        setSuccess('Station updated successfully');
      } else {
        console.log('StationManagementPage: Creating new station');
        const result = await adminService.createStation(submitData);
        console.log('StationManagementPage: Create result:', result);
        setSuccess('Station created successfully');
      }

      setShowCreateModal(false);
      loadStations();
    } catch (err: any) {
      console.error('StationManagementPage: Error saving station:', err);
      console.error('StationManagementPage: Error response:', err.response);
      setError('Failed to save station: ' + (err.response?.data?.detail || err.message || 'Unknown error'));
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete station "${name}"?`)) {
      return;
    }

    try {
      await adminService.deleteStation(id);
      setSuccess('Station deleted successfully');
      loadStations();
    } catch (err: any) {
      setError('Failed to delete station: ' + (err.message || 'Unknown error'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLineInfo = (lineId: number) => {
    const line = trainLines.find(l => l.id === lineId);
    return {
      name: line?.line_name || `Line ${lineId}`,
      color: line?.color || '#6B7280'
    };
  };

  const getLineColor = (lineId: number) => {
    const colors = {
      1: 'bg-blue-500',
      2: 'bg-green-500',
      4: 'bg-purple-500',
      5: 'bg-orange-500',
      9: 'bg-red-500'
    };
    return colors[lineId as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MapPin className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Station Management</h1>
              <p className="text-gray-600">Manage train stations across all lines</p>
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Station</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search stations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={filterLine}
              onChange={(e) => setFilterLine(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Lines</option>
              {trainLines.map((line) => (
                <option key={line.id} value={line.id.toString()}>
                  {line.line_name}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>

            <button
              onClick={loadStations}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stations Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Stations ({filteredStations.length})
            </h2>
            <div className="flex space-x-2">
              <button className="text-gray-600 hover:text-gray-900 p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                <Download className="h-5 w-5" />
              </button>
              <button className="text-gray-600 hover:text-gray-900 p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                <Upload className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center space-x-2 text-gray-500">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Loading stations...</span>
              </div>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Station
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Line
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platforms
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStations.map((station) => (
                  <tr key={station.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <MapPin className={`h-6 w-6 ${station.is_interchange ? 'text-orange-500' : 'text-gray-400'}`} />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{station.name}</div>
                          {station.is_interchange && (
                            <div className="text-xs text-orange-600">Interchange</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: getLineInfo(station.line_id).color }}
                        ></div>
                        <span className="text-sm text-gray-900">{getLineInfo(station.line_id).name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">Zone {station.zone_number}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(station.status)}`}>
                        {station.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {station.platform_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(station)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(station.id, station.name)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filteredStations.length === 0 && (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No stations found</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingStation ? 'Edit Station' : 'Create Station'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Station Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter station name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lat}
                    onChange={(e) => setFormData({...formData, lat: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="13.7563"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.long}
                    onChange={(e) => setFormData({...formData, long: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="100.5018"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Line *
                  </label>
                  <select
                    required
                    value={formData.line_id}
                    onChange={(e) => setFormData({...formData, line_id: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {trainLines.map((line) => (
                      <option key={line.id} value={line.id}>
                        {line.line_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zone *
                  </label>
                  <select
                    required
                    value={formData.zone_number}
                    onChange={(e) => setFormData({...formData, zone_number: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>Zone 1</option>
                    <option value={2}>Zone 2</option>
                    <option value={3}>Zone 3</option>
                    <option value={4}>Zone 4</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platforms *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={formData.platform_count}
                    onChange={(e) => setFormData({...formData, platform_count: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive' | 'maintenance'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_interchange"
                  checked={formData.is_interchange}
                  onChange={(e) => setFormData({...formData, is_interchange: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_interchange" className="ml-2 block text-sm text-gray-700">
                  Interchange Station
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingStation ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationManagementPage;