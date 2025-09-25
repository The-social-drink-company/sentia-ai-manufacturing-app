import { devLog } from '../../lib/devLog.js';
import React, { useState, useEffect } from 'react';
import { Download, Upload, Trash2, Edit, Plus } from 'lucide-react';

const ImportTemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/import/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      devLog.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async (templateId) => {
    try {
      const response = await fetch(`/api/import/templates/${templateId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `template-${templateId}.csv`;
        a.click();
      }
    } catch (error) {
      devLog.error('Failed to download template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/import/templates/${templateId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchTemplates();
      }
    } catch (error) {
      devLog.error('Failed to delete template:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Import Templates</h1>
        <p className="text-gray-600">
          Manage and download data import templates for various data types
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Available Templates</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Template
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No templates available</p>
              <p className="text-sm mt-1">Create your first template to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Type: {template.dataType}</span>
                    <span>{template.fieldCount} fields</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleDownloadTemplate(template.id)}
                      className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </button>
                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className="flex-1 bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 flex items-center justify-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="bg-red-100 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-200 flex items-center justify-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Start Guide</h3>
        <ol className="space-y-2 text-sm">
          <li>1. Download the template for your data type</li>
          <li>2. Fill in your data following the template structure</li>
          <li>3. Save the file as CSV or Excel format</li>
          <li>4. Upload the file using the Data Import page</li>
          <li>5. Map fields and validate your data</li>
          <li>6. Review and confirm the import</li>
        </ol>
      </div>
    </div>
  );
};

export default ImportTemplateManager;
