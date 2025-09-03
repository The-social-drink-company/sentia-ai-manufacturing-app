import React from 'react'
import DataImportDashboard from '@/components/DataImport/DataImportDashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, Database, FileText } from 'lucide-react'

const DataImport = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Database className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Data Import System</h1>
                  <p className="text-gray-600">
                    Upload, validate, and import data into the manufacturing system
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DataImportDashboard />
      </div>

      {/* Quick Help */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Quick Help
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2 text-blue-600">Supported File Formats</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• CSV files (.csv)</li>
                  <li>• Excel files (.xlsx)</li>
                  <li>• JSON files (.json)</li>
                  <li>• Maximum file size: 10MB</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 text-green-600">Data Types</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Products</li>
                  <li>• Historical Sales</li>
                  <li>• Inventory Levels</li>
                  <li>• Manufacturing Data</li>
                  <li>• Financial Data</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 text-purple-600">Import Process</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Upload your data file</li>
                  <li>• Preview and map fields</li>
                  <li>• Configure validation rules</li>
                  <li>• Process and validate data</li>
                  <li>• Review results and finalize</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DataImport