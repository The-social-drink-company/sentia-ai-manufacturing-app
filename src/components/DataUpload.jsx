import { devLog } from '../lib/devLog.js';\nimport React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const DataUpload = ({ onClose }) => {
  // Authentication removed
  const user = { name: "User" };
  const isSignedIn = true;
  const isLoaded = true;
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dataType, setDataType] = useState('production');
  const [uploadResult, setUploadResult] = useState(null);

  const dataTypes = [
    { value: 'production', label: 'Production Data', description: 'Manufacturing output, efficiency, quality metrics' },
    { value: 'quality', label: 'Quality Control', description: 'Inspection results, defect rates, compliance data' },
    { value: 'inventory', label: 'Inventory Data', description: 'Stock levels, raw materials, finished goods' },
    { value: 'maintenance', label: 'Maintenance Records', description: 'Equipment service, downtime, repair history' },
    { value: 'financials', label: 'Financial Data', description: 'Working capital, A/R, A/P, cash flow data' }
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleFiles = async (file) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast.error('Only CSV and Excel files are allowed');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('dataFile', file);
      formData.append('dataType', dataType);

      const endpoint = dataType === 'financials' 
        ? '/api/working-capital/upload-financial-data' 
        : '/api/data/upload';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user.getToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      setUploadResult(result);
      toast.success(`Successfully uploaded ${result.recordCount} records!`);
      
    } catch (error) {
      devLog.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const selectedDataType = dataTypes.find(dt => dt.value === dataType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Upload Manufacturing Data</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Data Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Data Type
            </label>
            <div className="space-y-2">
              {dataTypes.map((type) => (
                <label key={type.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="dataType"
                    value={type.value}
                    checked={dataType === type.value}
                    onChange={(e) => setDataType(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* File Upload Area */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Upload File (CSV, Excel)
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploading ? (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600">Uploading and processing...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Drop your {selectedDataType.label.toLowerCase()} file here
                    </p>
                    <p className="text-gray-500">or click to browse</p>
                  </div>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleChange}
                    className="hidden"
                    id="fileInput"
                  />
                  <label
                    htmlFor="fileInput"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Choose File
                  </label>
                  <p className="text-xs text-gray-400">
                    Supports CSV, XLSX, XLS files up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="font-medium text-green-800">Upload Successful</p>
                  <p className="text-green-700 text-sm">{uploadResult.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Expected File Format */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Expected Format for {selectedDataType.label}</h4>
            <div className="text-sm text-gray-600 space-y-1">
              {dataType === 'production' && (
                <div>
                  <p><strong>Columns:</strong> Date, Production, Efficiency, Quality, Downtime, Energy</p>
                  <p><strong>Example:</strong> 2024-01-01, 1500, 94.2, 98.7, 2.1, 87.3</p>
                </div>
              )}
              {dataType === 'quality' && (
                <div>
                  <p><strong>Columns:</strong> Date, Batch, Pass Rate, Defects, Inspector</p>
                  <p><strong>Example:</strong> 2024-01-01, B001, 98.5, 3, John Doe</p>
                </div>
              )}
              {dataType === 'inventory' && (
                <div>
                  <p><strong>Columns:</strong> Date, Product, Stock Level, Reorder Point, Supplier</p>
                  <p><strong>Example:</strong> 2024-01-01, GABA Red, 1200, 500, Supplier A</p>
                </div>
              )}
              {dataType === 'maintenance' && (
                <div>
                  <p><strong>Columns:</strong> Date, Equipment, Type, Duration, Technician</p>
                  <p><strong>Example:</strong> 2024-01-01, Line A, Preventive, 2.5, Tech Team</p>
                </div>
              )}
              {dataType === 'financials' && (
                <div>
                  <p><strong>Columns:</strong> Cash, AR, AP, Inventory, Weekly Revenue, Weekly Expenses</p>
                  <p><strong>Example:</strong> 1800000, 1200000, 950000, 800000, 125000, 95000</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
            {uploadResult && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataUpload;