import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const DataImportWidget = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [importStatus, setImportStatus] = useState('idle');

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    setImportStatus('importing');
    // Simulate import
    setTimeout(() => {
      setImportStatus('complete');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Data Import</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Import Data from External Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File (CSV, Excel, JSON)
              </label>
              <input
                type="file"
                onChange={handleFileSelect}
                accept=".csv,.xlsx,.json"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {selectedFile && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Selected: {selectedFile.name}</p>
                <p className="text-xs text-gray-500">Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={!selectedFile || importStatus === 'importing'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {importStatus === 'importing' ? 'Importing...' : 'Import Data'}
            </button>

            {importStatus === 'complete' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">Import completed successfully!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected Data Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Xero Accounting', status: 'connected', lastSync: '2 mins ago' },
              { name: 'Shopify Store', status: 'connected', lastSync: '5 mins ago' },
              { name: 'Amazon SP-API', status: 'connected', lastSync: '10 mins ago' },
              { name: 'PostgreSQL Database', status: 'connected', lastSync: 'Live' },
            ].map((source, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{source.name}</p>
                  <p className="text-xs text-gray-500">Last sync: {source.lastSync}</p>
                </div>
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                  {source.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataImportWidget;