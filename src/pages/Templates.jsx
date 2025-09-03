import React from 'react'
import ImportTemplateManager from '@/components/DataImport/ImportTemplateManager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Download, Upload, CheckCircle } from 'lucide-react'

const Templates = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Import Templates</h1>
                  <p className="text-gray-600">
                    Download templates and specifications for data imports
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ImportTemplateManager />
      </div>

      {/* Template Benefits */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Why Use Templates?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Download className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Correct Format</h3>
                <p className="text-sm text-gray-600">
                  Templates ensure your data is in the correct format with all required fields.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Validation Ready</h3>
                <p className="text-sm text-gray-600">
                  Pre-configured validation rules ensure data quality and consistency.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Upload className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Fast Import</h3>
                <p className="text-sm text-gray-600">
                  Standardized templates enable faster processing and fewer errors.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold mb-2">Documentation</h3>
                <p className="text-sm text-gray-600">
                  Complete field specifications and validation rules included.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Templates