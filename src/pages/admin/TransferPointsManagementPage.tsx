import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRightLeft, Plus, Search, Edit, Trash2, CheckCircle, XCircle, MapPin, Clock, DollarSign } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { adminService } from '../../services/api';

interface Station {
  id: number;
  name: string;
  line_id: number;
}

interface TransferPoint {
  id: number;
  station_a_id: number;
  station_a_name: string;
  station_b_id: number;
  station_b_name: string;
  walking_time_minutes: number;
  walking_distance_meters?: number;
  transfer_fee: number;
  is_active: boolean;
  created_at: string;
}

interface TransferPointFormData {
  station_a_id: string;
  station_b_id: string;
  walking_time_minutes: string;
  walking_distance_meters: string;
  transfer_fee: string;
  is_active: boolean;
}

const TransferPointsManagementPage: React.FC = () => {
  const [transferPoints, setTransferPoints] = useState<TransferPoint[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransferPoint, setEditingTransferPoint] = useState<TransferPoint | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const { success: addSuccessToast, error: addErrorToast } = useToast();

  const [formData, setFormData] = useState<TransferPointFormData>({
    station_a_id: '',
    station_b_id: '',
    walking_time_minutes: '5',
    walking_distance_meters: '',
    transfer_fee: '0.00',
    is_active: true
  });

  const fetchTransferPoints = useCallback(async () => {
    try {
      const filters: any = {};
      if (stationFilter) filters.station_a_id = parseInt(stationFilter);
      if (statusFilter) filters.is_active = statusFilter === 'true';
      
      const data = await adminService.getTransferPoints(filters);
      setTransferPoints(data);
    } catch (error) {
      console.error('Error fetching transfer points:', error);
      addErrorToast('Failed to fetch transfer points');
    } finally {
      setLoading(false);
    }
  }, [stationFilter, statusFilter, addErrorToast]);

  const fetchStations = useCallback(async () => {
    try {
      const data = await adminService.getStations();
      setStations(data);
    } catch (error) {
      console.error('Error fetching stations:', error);
      addErrorToast('Failed to fetch stations');
    }
  }, [addErrorToast]);

  useEffect(() => {
    fetchTransferPoints();
  }, [fetchTransferPoints]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const transferPointData = {
        station_a_id: parseInt(formData.station_a_id),
        station_b_id: parseInt(formData.station_b_id),
        walking_time_minutes: parseInt(formData.walking_time_minutes),
        walking_distance_meters: formData.walking_distance_meters ? parseInt(formData.walking_distance_meters) : null,
        transfer_fee: parseFloat(formData.transfer_fee),
        is_active: formData.is_active
      };

      if (editingTransferPoint) {
        await adminService.updateTransferPoint(editingTransferPoint.id, transferPointData);
        addSuccessToast('Transfer point updated successfully!');
      } else {
        await adminService.createTransferPoint(transferPointData);
        addSuccessToast('Transfer point created successfully!');
      }

      setShowModal(false);
      resetForm();
      fetchTransferPoints();
    } catch (error: any) {
      console.error('Error saving transfer point:', error);
      addErrorToast(error.message || `Failed to ${editingTransferPoint ? 'update' : 'create'} transfer point`);
    }
  };

  const handleDelete = async (transferPoint: TransferPoint) => {
    if (!window.confirm(`Are you sure you want to delete the transfer point between "${transferPoint.station_a_name}" and "${transferPoint.station_b_name}"?`)) {
      return;
    }

    try {
      await adminService.deleteTransferPoint(transferPoint.id);
      addSuccessToast('Transfer point deleted successfully!');
      fetchTransferPoints();
    } catch (error) {
      console.error('Error deleting transfer point:', error);
      addErrorToast('Failed to delete transfer point');
    }
  };

  const handleEdit = (transferPoint: TransferPoint) => {
    setEditingTransferPoint(transferPoint);
    setFormData({
      station_a_id: transferPoint.station_a_id.toString(),
      station_b_id: transferPoint.station_b_id.toString(),
      walking_time_minutes: transferPoint.walking_time_minutes.toString(),
      walking_distance_meters: transferPoint.walking_distance_meters?.toString() || '',
      transfer_fee: transferPoint.transfer_fee.toString(),
      is_active: transferPoint.is_active
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      station_a_id: '',
      station_b_id: '',
      walking_time_minutes: '5',
      walking_distance_meters: '',
      transfer_fee: '0.00',
      is_active: true
    });
    setEditingTransferPoint(null);
  };

  const filteredTransferPoints = transferPoints.filter(tp => {
    const matchesSearch = tp.station_a_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tp.station_b_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transfer Points Management</h1>
        <p className="text-gray-600">Manage station-to-station transfer connections and walking routes</p>
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
                placeholder="Search transfer points..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-train-blue focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-train-blue focus:border-transparent"
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
              >
                <option value="">All Stations</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id.toString()}>
                    {station.name}
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
              Add Transfer Point
            </button>
          </div>
        </div>
      </div>

      {/* Transfer Points Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transfer Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Walking Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transfer Fee
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
              {filteredTransferPoints.map((transferPoint) => (
                <tr key={transferPoint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-blue-600 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transferPoint.station_a_name}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <ArrowRightLeft className="h-3 w-3 mr-1" />
                          {transferPoint.station_b_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-1" />
                        {transferPoint.walking_time_minutes} minutes
                      </div>
                      {transferPoint.walking_distance_meters && (
                        <div className="text-xs text-gray-500 mt-1">
                          {transferPoint.walking_distance_meters}m walking distance
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                      ฿{transferPoint.transfer_fee}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                      transferPoint.is_active 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {transferPoint.is_active ? (
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
                        onClick={() => handleEdit(transferPoint)}
                        className="text-emerald-600 hover:text-emerald-900 p-1 hover:bg-emerald-50 rounded transition-colors duration-150"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transferPoint)}
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
          
          {filteredTransferPoints.length === 0 && (
            <div className="text-center py-8">
              <ArrowRightLeft className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transfer points found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new transfer point connection.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Point Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingTransferPoint ? 'Edit Transfer Point' : 'Add New Transfer Point'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Station A *
                  </label>
                  <select
                    required
                    value={formData.station_a_id}
                    onChange={(e) => setFormData({...formData, station_a_id: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-train-blue focus:border-transparent"
                  >
                    <option value="">Select station</option>
                    {stations.filter(s => s.id.toString() !== formData.station_b_id).map((station) => (
                      <option key={station.id} value={station.id.toString()}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Station B *
                  </label>
                  <select
                    required
                    value={formData.station_b_id}
                    onChange={(e) => setFormData({...formData, station_b_id: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-train-blue focus:border-transparent"
                  >
                    <option value="">Select station</option>
                    {stations.filter(s => s.id.toString() !== formData.station_a_id).map((station) => (
                      <option key={station.id} value={station.id.toString()}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Walking Time (minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="60"
                    value={formData.walking_time_minutes}
                    onChange={(e) => setFormData({...formData, walking_time_minutes: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-train-blue focus:border-transparent"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Walking Distance (meters)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.walking_distance_meters}
                    onChange={(e) => setFormData({...formData, walking_distance_meters: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-train-blue focus:border-transparent"
                    placeholder="300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transfer Fee (THB)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.transfer_fee}
                  onChange={(e) => setFormData({...formData, transfer_fee: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-train-blue focus:border-transparent"
                  placeholder="0.00"
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
                  Active Transfer Point
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
                  {editingTransferPoint ? 'Update' : 'Create'} Transfer Point
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferPointsManagementPage;