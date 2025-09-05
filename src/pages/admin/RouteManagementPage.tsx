import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Edit, Trash2, Plus, Filter, Route, MapPin, Activity, Clock, Zap } from 'lucide-react';

interface Route {
  id: number;
  from_station_id: number;
  to_station_id: number;
  from_station: string;
  to_station: string;
  distance: number | null;
  estimated_duration: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Station {
  id: number;
  name: string;
}

const RouteManagementPage: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [filters, setFilters] = useState({
    from_station_id: '',
    to_station_id: '',
    status: ''
  });
  
  // Form state
  const [formData, setFormData] = useState({
    from_station_id: '',
    to_station_id: '',
    distance: '',
    estimated_duration: '',
    status: 'active'
  });

  const { success, error } = useToast();

  useEffect(() => {
    fetchRoutes();
    fetchStations();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const filterParams = {
        from_station_id: filters.from_station_id ? parseInt(filters.from_station_id) : undefined,
        to_station_id: filters.to_station_id ? parseInt(filters.to_station_id) : undefined,
        status: filters.status || undefined
      };
      const data = await adminService.getRoutes(filterParams);
      setRoutes(data);
    } catch (err) {
      error('Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      const data = await adminService.getStations();
      setStations(data);
    } catch (err) {
      error('Failed to fetch stations');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        from_station_id: parseInt(formData.from_station_id),
        to_station_id: parseInt(formData.to_station_id),
        distance: formData.distance ? parseFloat(formData.distance) : undefined,
        estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : undefined,
        status: formData.status
      };

      if (isEditMode && selectedRoute) {
        await adminService.updateRoute(selectedRoute.id, submitData);
        success('Route updated successfully');
      } else {
        await adminService.createRoute(submitData);
        success('Route created successfully');
      }

      setIsModalOpen(false);
      resetForm();
      await fetchRoutes();
    } catch (err: any) {
      if (err.response?.data?.detail) {
        error(err.response.data.detail);
      } else {
        error(isEditMode ? 'Failed to update route' : 'Failed to create route');
      }
    }
  };

  const handleEdit = (route: Route) => {
    setSelectedRoute(route);
    setFormData({
      from_station_id: route.from_station_id.toString(),
      to_station_id: route.to_station_id.toString(),
      distance: route.distance?.toString() || '',
      estimated_duration: route.estimated_duration?.toString() || '',
      status: route.status
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, routeName: string) => {
    if (!confirm(`Are you sure you want to delete the route "${routeName}"?`)) return;

    try {
      await adminService.deleteRoute(id);
      success('Route deleted successfully');
      await fetchRoutes();
    } catch (err: any) {
      if (err.response?.data?.detail?.includes('fare rules')) {
        error('Cannot delete route that has associated fare rules');
      } else {
        error('Failed to delete route');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      from_station_id: '',
      to_station_id: '',
      distance: '',
      estimated_duration: '',
      status: 'active'
    });
    setSelectedRoute(null);
    setIsEditMode(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDuration = (duration: number | null) => {
    if (!duration) return 'N/A';
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getStationName = (stationId: number) => {
    const station = stations.find(s => s.id === stationId);
    return station?.name || 'Unknown';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Route className="w-6 h-6" />
            Route Management
          </h1>
          <p className="text-gray-600 mt-1">Manage train routes between stations</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Route
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Station</label>
            <select
              value={filters.from_station_id}
              onChange={(e) => setFilters({...filters, from_station_id: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Stations</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Station</label>
            <select
              value={filters.to_station_id}
              onChange={(e) => setFilters({...filters, to_station_id: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Stations</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchRoutes}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Routes Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Loading routes...
                  </td>
                </tr>
              ) : routes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No routes found
                  </td>
                </tr>
              ) : (
                routes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {route.from_station} → {route.to_station}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {route.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-900">
                          {route.distance ? `${route.distance} km` : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-900">
                          {formatDuration(route.estimated_duration)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                        <Activity className="w-3 h-3 mr-1" />
                        {route.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatDate(route.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(route)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit route"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(route.id, `${route.from_station} → ${route.to_station}`)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete route"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditMode ? 'Edit Route' : 'Add New Route'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Station <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.from_station_id}
                  onChange={(e) => setFormData({...formData, from_station_id: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select From Station</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Station <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.to_station_id}
                  onChange={(e) => setFormData({...formData, to_station_id: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select To Station</option>
                  {stations.filter(station => station.id.toString() !== formData.from_station_id).map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distance (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.distance}
                  onChange={(e) => setFormData({...formData, distance: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter distance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.estimated_duration}
                  onChange={(e) => setFormData({...formData, estimated_duration: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter duration in minutes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  {isEditMode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteManagementPage;