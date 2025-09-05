import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Download, Upload, RefreshCw, CheckCircle, XCircle, Play, Pause, Calendar } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { adminService } from '../../services/api';

interface TrainLine {
  id: number;
  line_name: string;
  color: string;
  line_type: string;
}

interface TrainService {
  id: number;
  line_id: number;
  service_name: string;
  start_time: string;
  end_time: string;
  frequency_minutes: number;
  direction: string | null;
  is_active: boolean;
  line: TrainLine;
  timetable?: Array<{
    departure_time: string;
    sequence: number;
  }>;
}

interface ServiceFormData {
  line_id: string;
  service_name: string;
  start_time: string;
  end_time: string;
  frequency_minutes: string;
  direction: string;
  is_active: boolean;
}

const ServiceManagementPage: React.FC = () => {
  const [services, setServices] = useState<TrainService[]>([]);
  const [trainLines, setTrainLines] = useState<TrainLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<TrainService | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLine, setSelectedLine] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showTimetable, setShowTimetable] = useState<TrainService | null>(null);
  const { success: addSuccessToast, error: addErrorToast } = useToast();

  const [formData, setFormData] = useState<ServiceFormData>({
    line_id: '',
    service_name: '',
    start_time: '',
    end_time: '',
    frequency_minutes: '10',
    direction: '',
    is_active: true
  });

  const fetchServices = useCallback(async () => {
    try {
      const filters: any = {};
      if (selectedLine) filters.line_id = parseInt(selectedLine);
      if (statusFilter) filters.is_active = statusFilter === 'true';
      
      const data = await adminService.getTrainServices(filters);
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
      addErrorToast('Failed to fetch train services');
    } finally {
      setLoading(false);
    }
  }, [selectedLine, statusFilter, addErrorToast]);

  const fetchTrainLines = useCallback(async () => {
    try {
      const data = await adminService.getLines();
      // Map the backend data to match frontend interface
      const mappedLines = data.map((line: any) => ({
        id: line.id,
        line_name: line.name,  // Map 'name' to 'line_name'
        color: line.color,
        line_type: line.line_type || 'metro'  // Default line_type if not provided
      }));
      setTrainLines(mappedLines);
    } catch (error) {
      console.error('Error fetching train lines:', error);
      addErrorToast('Failed to fetch train lines');
    }
  }, [addErrorToast]);

  const fetchTimetable = async (service: TrainService) => {
    try {
      const timetableData = await adminService.getTrainServiceTimetable(service.id);
      setServices(prev => prev.map(s => 
        s.id === service.id ? { ...s, timetable: timetableData.timetable } : s
      ));
      setShowTimetable({ ...service, timetable: timetableData.timetable });
    } catch (error) {
      console.error('Error fetching timetable:', error);
      addErrorToast('Failed to fetch service timetable');
    }
  };

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    fetchTrainLines();
  }, [fetchTrainLines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const serviceData = {
        line_id: parseInt(formData.line_id),
        service_name: formData.service_name,
        start_time: formData.start_time,
        end_time: formData.end_time,
        frequency_minutes: parseInt(formData.frequency_minutes),
        direction: formData.direction || null,
        is_active: formData.is_active
      };

      if (editingService) {
        await adminService.updateTrainService(editingService.id, serviceData);
        addSuccessToast('Service updated successfully!');
      } else {
        await adminService.createTrainService(serviceData);
        addSuccessToast('Service created successfully!');
      }

      setShowModal(false);
      resetForm();
      fetchServices();
    } catch (error: any) {
      console.error('Error saving service:', error);
      addErrorToast(error.message || `Failed to ${editingService ? 'update' : 'create'} service`);
    }
  };

  const handleDelete = async (service: TrainService) => {
    if (!window.confirm(`Are you sure you want to delete the service "${service.service_name}"?`)) {
      return;
    }

    try {
      await adminService.deleteTrainService(service.id);
      addSuccessToast('Service deleted successfully!');
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      addErrorToast('Failed to delete service');
    }
  };

  const handleEdit = (service: TrainService) => {
    setEditingService(service);
    setFormData({
      line_id: service.line_id.toString(),
      service_name: service.service_name,
      start_time: service.start_time,
      end_time: service.end_time,
      frequency_minutes: service.frequency_minutes.toString(),
      direction: service.direction || '',
      is_active: service.is_active
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      line_id: '',
      service_name: '',
      start_time: '',
      end_time: '',
      frequency_minutes: '10',
      direction: '',
      is_active: true
    });
    setEditingService(null);
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.line.line_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.direction && service.direction.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Remove seconds if present
  };

  const calculateServiceDuration = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    // Handle overnight services
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }
    
    const durationMinutes = endMinutes - startMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-train-blue"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Schedule Management</h1>
        <p className="text-gray-600">Manage train service schedules and timetables</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search services..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-train-blue focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-train-blue focus:border-transparent"
                value={selectedLine}
                onChange={(e) => setSelectedLine(e.target.value)}
              >
                <option value="">All Lines</option>
                {trainLines.map((line) => (
                  <option key={line.id} value={line.id.toString()}>
                    {line.line_name}
                  </option>
                ))}
              </select>

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-train-blue focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </button>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Line
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredServices.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">{service.service_name}</div>
                      {service.direction && (
                        <div className="text-sm text-gray-500">Direction: {service.direction}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: service.line?.color || '#6B7280' }}
                      />
                      <span className="text-sm text-gray-900">{service.line?.line_name || 'Unknown Line'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatTime(service.start_time)} - {formatTime(service.end_time)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Duration: {calculateServiceDuration(service.start_time, service.end_time)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{service.frequency_minutes} minutes</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                      service.is_active 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {service.is_active ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchTimetable(service)}
                        className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded transition-colors duration-150"
                        title="View Timetable"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(service)}
                        className="text-emerald-600 hover:text-emerald-900 p-1 hover:bg-emerald-50 rounded transition-colors duration-150"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(service)}
                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors duration-150"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredServices.length === 0 && (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No services found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new train service.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Service Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Train Line *
                </label>
                <select
                  required
                  value={formData.line_id}
                  onChange={(e) => setFormData({...formData, line_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-train-blue focus:border-transparent"
                >
                  <option value="">Select a line</option>
                  {trainLines.map((line) => (
                    <option key={line.id} value={line.id.toString()}>
                      {line.line_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.service_name}
                  onChange={(e) => setFormData({...formData, service_name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-train-blue focus:border-transparent"
                  placeholder="e.g., Morning Express"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-train-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-train-blue focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency (minutes) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="120"
                  value={formData.frequency_minutes}
                  onChange={(e) => setFormData({...formData, frequency_minutes: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-train-blue focus:border-transparent"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Direction
                </label>
                <input
                  type="text"
                  value={formData.direction}
                  onChange={(e) => setFormData({...formData, direction: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-train-blue focus:border-transparent"
                  placeholder="e.g., Northbound"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="rounded border-gray-300 text-train-blue focus:ring-train-blue"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Active Service
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {editingService ? 'Update' : 'Create'} Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Timetable Modal */}
      {showTimetable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">Service Timetable</h2>
                <p className="text-gray-600">{showTimetable.service_name} - {showTimetable.line.line_name}</p>
              </div>
              <button
                onClick={() => setShowTimetable(null)}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded transition-all duration-150"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            {showTimetable.timetable && showTimetable.timetable.length > 0 ? (
              <div className="grid grid-cols-4 gap-4">
                {showTimetable.timetable.map((entry, index) => (
                  <div key={index} className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-900">
                      {formatTime(entry.departure_time)}
                    </div>
                    <div className="text-xs text-gray-500">
                      #{entry.sequence}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">No timetable generated</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagementPage;