import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Edit, Trash2, Plus, Filter, DollarSign, Calendar, Route as RouteIcon, User } from 'lucide-react';

interface FareRule {
  id: number;
  route_id: number;
  passenger_type_id: number;
  price: number;
  valid_from: string;
  valid_to: string | null;
  route?: {
    id: number;
    from_station: string;
    to_station: string;
  };
  passenger_type?: {
    id: number;
    name: string;
    discount_percentage: number;
  };
}

interface Route {
  id: number;
  from_station: string;
  to_station: string;
}

interface PassengerType {
  id: number;
  name: string;
  discount_percentage: number;
}

const FareRulesManagementPage: React.FC = () => {
  const [fareRules, setFareRules] = useState<FareRule[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [passengerTypes, setPassengerTypes] = useState<PassengerType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedFareRule, setSelectedFareRule] = useState<FareRule | null>(null);
  const [filters, setFilters] = useState({
    route_id: '',
    passenger_type_id: '',
    active_only: true
  });
  
  // Form state
  const [formData, setFormData] = useState({
    route_id: '',
    passenger_type_id: '',
    price: '',
    valid_from: '',
    valid_to: ''
  });

  const { success, error } = useToast();

  useEffect(() => {
    fetchFareRules();
    fetchRoutes();
    fetchPassengerTypes();
  }, []);

  const fetchFareRules = async () => {
    try {
      setLoading(true);
      const data = await adminService.getFareRules(filters.route_id || filters.passenger_type_id ? {
        route_id: filters.route_id ? parseInt(filters.route_id) : undefined,
        passenger_type_id: filters.passenger_type_id ? parseInt(filters.passenger_type_id) : undefined,
        active_only: filters.active_only
      } : {});
      setFareRules(data);
    } catch (err) {
      error('Failed to fetch fare rules');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const data = await adminService.getRoutes();
      setRoutes(data);
    } catch (err) {
      error('Failed to fetch routes');
    }
  };

  const fetchPassengerTypes = async () => {
    try {
      const data = await adminService.getPassengerTypes();
      setPassengerTypes(data);
    } catch (err) {
      error('Failed to fetch passenger types');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        route_id: parseInt(formData.route_id),
        passenger_type_id: parseInt(formData.passenger_type_id),
        price: parseFloat(formData.price),
        valid_from: formData.valid_from,
        valid_to: formData.valid_to || null
      };

      if (isEditMode && selectedFareRule) {
        await adminService.updateFareRule(selectedFareRule.id, submitData);
        success('Fare rule updated successfully');
      } else {
        await adminService.createFareRule(submitData);
        success('Fare rule created successfully');
      }

      setIsModalOpen(false);
      resetForm();
      await fetchFareRules();
    } catch (err) {
      error(isEditMode ? 'Failed to update fare rule' : 'Failed to create fare rule');
    }
  };

  const handleEdit = (fareRule: FareRule) => {
    setSelectedFareRule(fareRule);
    setFormData({
      route_id: fareRule.route_id.toString(),
      passenger_type_id: fareRule.passenger_type_id.toString(),
      price: fareRule.price.toString(),
      valid_from: fareRule.valid_from,
      valid_to: fareRule.valid_to || ''
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this fare rule?')) return;

    try {
      await adminService.deleteFareRule(id);
      success('Fare rule deleted successfully');
      await fetchFareRules();
    } catch (err) {
      error('Failed to delete fare rule');
    }
  };

  const resetForm = () => {
    setFormData({
      route_id: '',
      passenger_type_id: '',
      price: '',
      valid_from: '',
      valid_to: ''
    });
    setSelectedFareRule(null);
    setIsEditMode(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Fare Rules Management
          </h1>
          <p className="text-gray-600 mt-1">Manage pricing rules for different routes and passenger types</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Fare Rule
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
            <select
              value={filters.route_id}
              onChange={(e) => setFilters({...filters, route_id: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Routes</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.from_station} → {route.to_station}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passenger Type</label>
            <select
              value={filters.passenger_type_id}
              onChange={(e) => setFilters({...filters, passenger_type_id: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {passengerTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.active_only.toString()}
              onChange={(e) => setFilters({...filters, active_only: e.target.value === 'true'})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="true">Active Only</option>
              <option value="false">All</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchFareRules}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Fare Rules Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passenger Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Loading fare rules...
                  </td>
                </tr>
              ) : fareRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No fare rules found
                  </td>
                </tr>
              ) : (
                fareRules.map((fareRule) => (
                  <tr key={fareRule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <RouteIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">
                          {fareRule.route?.from_station || 'Unknown'} → {fareRule.route?.to_station || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-900">
                          {fareRule.passenger_type?.name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(fareRule.price)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatDate(fareRule.valid_from)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {fareRule.valid_to ? formatDate(fareRule.valid_to) : 'No end date'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(fareRule)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(fareRule.id)}
                          className="text-red-600 hover:text-red-800 p-1"
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
                {isEditMode ? 'Edit Fare Rule' : 'Add New Fare Rule'}
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
                  Route <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.route_id}
                  onChange={(e) => setFormData({...formData, route_id: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Route</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.from_station} → {route.to_station}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passenger Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.passenger_type_id}
                  onChange={(e) => setFormData({...formData, passenger_type_id: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Passenger Type</option>
                  {passengerTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (THB) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid From <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid To (Optional)
                </label>
                <input
                  type="date"
                  value={formData.valid_to}
                  onChange={(e) => setFormData({...formData, valid_to: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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

export default FareRulesManagementPage;