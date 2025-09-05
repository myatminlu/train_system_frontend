import React, { useState } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/common/Toast';

interface ImportResult {
  success: number;
  total: number;
  errors: string[];
}

const BulkDataPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [selectedDataType, setSelectedDataType] = useState<'lines' | 'users' | 'service-status' | 'stations'>('lines');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [dragOver, setDragOver] = useState(false);

  const { toasts, removeToast, success, error, warning } = useToast();

  const dataTypes = [
    { value: 'lines', label: 'Train Lines', icon: '🚇' },
    { value: 'stations', label: 'Stations', icon: '🚉' },
    { value: 'users', label: 'Users', icon: '👥' },
    { value: 'service-status', label: 'Service Status', icon: '📊' }
  ] as const;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResults(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
        setSelectedFile(file);
        setImportResults(null);
      } else {
        error('Please select a CSV or Excel file');
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      error('Please select a file to import');
      return;
    }

    setImporting(true);
    try {
      let result;
      switch (selectedDataType) {
        case 'lines':
          result = await adminService.bulkImportLines(selectedFile);
          break;
        case 'users':
          result = await adminService.bulkImportUsers(selectedFile);
          break;
        case 'service-status':
          result = await adminService.bulkImportServiceStatus(selectedFile);
          break;
        case 'stations':
          // Note: stations bulk import uses existing endpoint
          const formData = new FormData();
          formData.append('file', selectedFile);
          result = await adminService.createStation(formData as any);
          break;
      }

      setImportResults(result);
      
      if (result.success > 0) {
        success(`Successfully imported ${result.success} out of ${result.total} records`);
      }
      
      if (result.errors?.length > 0) {
        warning(`Import completed with ${result.errors.length} errors. See details below.`);
      }
    } catch (err: any) {
      error(`Import failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      let blob: Blob;
      let filename: string;

      switch (selectedDataType) {
        case 'lines':
          blob = await adminService.bulkExportLines(exportFormat);
          filename = `train_lines.${exportFormat === 'excel' ? 'xlsx' : 'csv'}`;
          break;
        case 'users':
          blob = await adminService.bulkExportUsers(exportFormat);
          filename = `users.${exportFormat === 'excel' ? 'xlsx' : 'csv'}`;
          break;
        case 'service-status':
          blob = await adminService.bulkExportServiceStatus(exportFormat);
          filename = `service_status.${exportFormat === 'excel' ? 'xlsx' : 'csv'}`;
          break;
        case 'stations':
          blob = await adminService.bulkExportStations(exportFormat);
          filename = `stations.${exportFormat === 'excel' ? 'xlsx' : 'csv'}`;
          break;
      }

      // Download the file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      success(`Successfully exported ${selectedDataType} data as ${exportFormat.toUpperCase()}`);
    } catch (err: any) {
      error(`Export failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const blob = await adminService.getImportTemplate(selectedDataType);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedDataType}_import_template.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      success(`Downloaded ${selectedDataType} import template`);
    } catch (err: any) {
      error(`Failed to download template: ${err.response?.data?.detail || err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bulk Data Management</h1>
        <p className="text-gray-600">Import and export data in bulk for efficient management</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('import')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📥 Import Data
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📤 Export Data
            </button>
          </nav>
        </div>
      </div>

      {/* Data Type Selection */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Data Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dataTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedDataType(type.value)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedDataType === type.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">{type.icon}</div>
              <div className="font-medium">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Import Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="text-blue-500 text-xl mr-3">ℹ️</div>
              <div>
                <h4 className="text-blue-900 font-semibold mb-2">Import Instructions</h4>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Supported formats: CSV (.csv) and Excel (.xlsx)</li>
                  <li>• Download the template first to see the required format</li>
                  <li>• Ensure all required fields are filled</li>
                  <li>• Large files may take longer to process</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Template Download */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Import Template</h3>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                📥 Download Template
              </button>
            </div>
            <p className="text-gray-600">
              Download the CSV template for {dataTypes.find(t => t.value === selectedDataType)?.label} 
              to see the required format and field structure.
            </p>
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload File</h3>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver
                  ? 'border-blue-400 bg-blue-50'
                  : selectedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              {selectedFile ? (
                <div>
                  <div className="text-green-500 text-3xl mb-2">✅</div>
                  <p className="text-green-700 font-medium">{selectedFile.name}</p>
                  <p className="text-gray-600 text-sm">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Unknown type'}
                  </p>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-gray-400 text-3xl mb-2">📁</div>
                  <p className="text-gray-600 mb-2">
                    Drag and drop your CSV or Excel file here, or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />
                  <label
                    htmlFor="file-input"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    Browse Files
                  </label>
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {importing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      🚀 Start Import
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Import Results */}
          {importResults && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Results</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                  <div className="text-sm text-green-700">Successful</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{importResults.errors.length}</div>
                  <div className="text-sm text-red-700">Errors</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{importResults.total}</div>
                  <div className="text-sm text-blue-700">Total Records</div>
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-red-900 font-semibold mb-2">Import Errors:</h4>
                  <div className="max-h-40 overflow-y-auto">
                    {importResults.errors.map((error, index) => (
                      <div key={index} className="text-red-800 text-sm py-1">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'export' && (
        <div className="space-y-6">
          {/* Export Instructions */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="text-green-500 text-xl mr-3">📋</div>
              <div>
                <h4 className="text-green-900 font-semibold mb-2">Export Information</h4>
                <ul className="text-green-800 text-sm space-y-1">
                  <li>• Choose between CSV or Excel format</li>
                  <li>• Export includes all current data</li>
                  <li>• Files are generated in real-time</li>
                  <li>• Large datasets may take longer to export</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Export Format Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Format</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => setExportFormat('csv')}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  exportFormat === 'csv'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                }`}
              >
                📄 CSV File
              </button>
              <button
                onClick={() => setExportFormat('excel')}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  exportFormat === 'excel'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Excel File
              </button>
            </div>
          </div>

          {/* Export Action */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ready to Export</h3>
            <p className="text-gray-600 mb-6">
              Export all {dataTypes.find(t => t.value === selectedDataType)?.label} data 
              as a {exportFormat.toUpperCase()} file
            </p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  📤 Export {exportFormat.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default BulkDataPage;