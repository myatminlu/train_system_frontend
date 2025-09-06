import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/common/Toast';

interface Line {
  id: number;
  name: string;
  color: string;
  status: string;
  company_id: number;
  station_count: number;
  created_at: string;
}

interface Company {
  id: number;
  name: string;
}

const LineManagementPage: React.FC = () => {
  const [lines, setLines] = useState<Line[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLine, setEditingLine] = useState<Line | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    color: '#00A651',
    status: 'active',
    company_id: 1
  });

  const { toasts, removeToast, success, error } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading lines data...');
      const linesData = await adminService.getLines();
      console.log('Lines data loaded:', linesData);
      setLines(linesData);
      
      // Set sample companies for now
      setCompanies([
        { id: 1, name: 'BTS Group Holdings' },
        { id: 2, name: 'Mass Rapid Transit Authority' },
        { id: 3, name: 'State Railway of Thailand' },
        { id: 4, name: 'Airport Rail Link' }
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      error('Failed to load data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        company_id: parseInt(formData.company_id.toString())
      };

      console.log('Submitting line data:', submitData);

      if (editingLine) {
        console.log('Updating line:', editingLine.id);
        const result = await adminService.updateLine(editingLine.id, submitData);
        console.log('Update result:', result);
        success('Line updated successfully');
      } else {
        console.log('Creating new line');
        const result = await adminService.createLine(submitData);
        console.log('Create result:', result);
        success('Line created successfully');
      }

      setShowModal(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      console.error('Error saving line:', error);
      console.error('Error response:', error.response);
      error(error.response?.data?.detail || error.message || 'Failed to save line');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (line: Line) => {
    console.log('LineManagementPage: Edit button clicked for line:', line);
    console.log('LineManagementPage: Setting editing line state');
    setEditingLine(line);
    
    const formDataToSet = {
      name: line.name,
      color: line.color || '#00A651',
      status: line.status,
      company_id: line.company_id
    };
    console.log('LineManagementPage: Setting form data:', formDataToSet);
    setFormData(formDataToSet);
    
    console.log('LineManagementPage: Opening modal');
    setShowModal(true);
    
    console.log('LineManagementPage: Edit handler completed');
  };

  const handleDelete = async (line: Line) => {
    if (!window.confirm(`Are you sure you want to delete line "${line.name}"?`)) {
      return;
    }

    try {
      await adminService.deleteLine(line.id);
      success('Line deleted successfully');
      await loadData();
    } catch (error: any) {
      console.error('Error deleting line:', error);
      error(error.response?.data?.detail || 'Failed to delete line');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#00A651',
      status: 'active',
      company_id: 1
    });
    setEditingLine(null);
  };

  const getLineColor = (color: string) => {
    return {
      backgroundColor: color,
      borderColor: color
    };
  };

  const predefinedColors = [
    { name: 'BTS Green', value: '#00A651' },
    { name: 'MRT Blue', value: '#1E4D8C' },
    { name: 'MRT Purple', value: '#8B008B' },
    { name: 'Gold', value: '#FFD700' },
    { name: 'Pink', value: '#FFC0CB' },
    { name: 'Yellow', value: '#FFFF00' },
    { name: 'Red', value: '#E74C3C' },
    { name: 'Dark Red', value: '#8B0000' },
    { name: 'Orange', value: '#FF8C00' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Line Management</h1>
          <p className="text-gray-600">Manage Bangkok train lines and network</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span className="mr-2">➕</span>
          Add Line
        </button>
      </div>

      {/* Statistics */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Lines</p>
              <p className="text-2xl font-bold text-gray-900">{lines.length}</p>
            </div>
            <div className="text-blue-500 text-2xl">🚇</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Lines</p>
              <p className="text-2xl font-bold text-green-600">{lines.filter(l => l.status === 'active').length}</p>
            </div>
            <div className="text-green-500 text-2xl">✅</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Stations</p>
              <p className="text-2xl font-bold text-blue-600">{lines.reduce((sum, line) => sum + line.station_count, 0)}</p>
            </div>
            <div className="text-blue-500 text-2xl">🚉</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Stations/Line</p>
              <p className="text-2xl font-bold text-purple-600">
                {lines.length > 0 ? Math.round(lines.reduce((sum, line) => sum + line.station_count, 0) / lines.length) : 0}
              </p>
            </div>
            <div className="text-purple-500 text-2xl">📊</div>
          </div>
        </div>
      </div>

      {/* Lines Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Bangkok Train Lines ({lines.length})</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            🔄 Loading lines...
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lines.map((line) => (
                <div key={line.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="w-6 h-6 rounded-full border-2"
                      style={getLineColor(line.color)}
                    ></div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{line.name}</h3>
                      <p className="text-sm text-gray-600">{line.station_count} stations</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      line.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {line.status}
                    </span>
                  </div>
                  
                  <div className="mb-3 text-sm text-gray-600">
                    <div>Company ID: {line.company_id}</div>
                    <div>Color: {line.color}</div>
                    <div>Created: {new Date(line.created_at).toLocaleDateString()}</div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(line)}
                      className="flex-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(line)}
                      className="flex-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full transform transition-all duration-300 ease-in-out animate-in fade-in-0 zoom-in-95">
              <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {editingLine ? '✏️ Edit Line' : '➕ Create New Line'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {editingLine ? 'Update line information below' : 'Add a new train line to the network'}
                  </p>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Line Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., BTS Sukhumvit Line"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Line Color</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {predefinedColors.map((colorOption) => (
                          <button
                            key={colorOption.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, color: colorOption.value }))}
                            className={`w-8 h-8 rounded-full border-2 ${
                              formData.color === colorOption.value ? 'border-gray-800' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: colorOption.value }}
                            title={colorOption.name}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Under Maintenance</option>
                        <option value="construction">Under Construction</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                      <select
                        value={formData.company_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, company_id: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {companies.map(company => (
                          <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                      </select>
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
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[80px]"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving
                      </div>
                    ) : (
                      editingLine ? 'Update Line' : 'Create Line'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default LineManagementPage;