import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import dataImportService from '../../services/dataImportService';
import {
  Upload, FileSpreadsheet, Cloud, AlertCircle, CheckCircle,
  Eye, Download, Trash2, RefreshCw, Microsoft, File
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const DataImportWizard = ({ onImportComplete, initialDataType = 'production' }) => {
  // Authentication removed
  const user = { name: "User" };
  const isSignedIn = true;
  const isLoaded = true;
  const { 
    isAuthenticated: isMicrosoftAuthenticated, 
    loginToMicrosoft, 
    getAccessToken,
    userInfo: microsoftUserInfo
  } = useMicrosoftAuth();
  
  const [step, setStep] = useState('method'); // method, source, preview, import, complete
  const [importMethod, setImportMethod] = useState(null); // file, microsoft
  const [dataType, setDataType] = useState(initialDataType);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  
  // Microsoft Graph state
  const [microsoftFiles, setMicrosoftFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [worksheets, setWorksheets] = useState([]);
  const [selectedWorksheet, setSelectedWorksheet] = useState(null);
  
  // Import results
  const [importResult, setImportResult] = useState(null);

  // File upload handlers
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadedFile(file);
    setError(null);
    setIsLoading(true);

    try {
      // Parse file for preview
      const parsed = await dataImportService.parseExcelFile(file);
      const firstSheet = Object.keys(parsed)[0];
      setPreviewData({ ...parsed[firstSheet], sheetName: firstSheet });
      setStep('preview');
    } catch (err) {
      setError(`Failed to parse file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    disabled: isLoading
  });

  // Microsoft Graph handlers
  const handleMicrosoftLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await loginToMicrosoft();
      await loadMicrosoftFiles();
      setStep('source');
    } catch (err) {
      setError(`Microsoft login failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMicrosoftFiles = async () => {
    try {
      const accessToken = await getAccessToken();
      const authToken = await user.getToken();
      
      const response = await dataImportService.getMicrosoftFiles(accessToken, authToken, {
        includeSharePoint: true
      });
      
      setMicrosoftFiles(response.files || []);
    } catch (err) {
      setError(`Failed to load Microsoft files: ${err.message}`);
    }
  };

  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    setError(null);
    setIsLoading(true);

    try {
      const accessToken = await getAccessToken();
      const authToken = await user.getToken();
      
      const response = await dataImportService.getMicrosoftWorksheets(
        accessToken, 
        file.id, 
        authToken, 
        { isSharePoint: file.source === 'sharepoint', siteId: file.siteId }
      );
      
      setWorksheets(response.worksheets || []);
      setStep('preview');
    } catch (err) {
      setError(`Failed to load worksheets: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorksheetSelect = async (worksheet) => {
    setSelectedWorksheet(worksheet);
    setError(null);
    setIsLoading(true);

    try {
      const accessToken = await getAccessToken();
      const authToken = await user.getToken();
      
      const response = await dataImportService.previewData(
        accessToken,
        selectedFile.id,
        worksheet.name,
        authToken,
        { 
          isSharePoint: selectedFile.source === 'sharepoint', 
          siteId: selectedFile.siteId,
          previewRows: 10
        }
      );
      
      setPreviewData({ ...response.preview, sheetName: worksheet.name, totalRows: response.totalRows });
    } catch (err) {
      setError(`Failed to preview data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Import handlers
  const handleImport = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const authToken = await user.getToken();
      let result;

      if (importMethod === 'file') {
        result = await dataImportService.importFromFile(uploadedFile, dataType, authToken);
      } else if (importMethod === 'microsoft') {
        const accessToken = await getAccessToken();
        result = await dataImportService.importFromMicrosoft(
          accessToken,
          selectedFile.id,
          selectedWorksheet.name,
          dataType,
          authToken,
          {
            isSharePoint: selectedFile.source === 'sharepoint',
            siteId: selectedFile.siteId
          }
        );
      }

      setImportResult(result);
      setStep('complete');
      
      toast.success(`Successfully imported ${result.recordsImported} records!`);
      
      if (onImportComplete) {
        onImportComplete(result);
      }
    } catch (err) {
      setError(`Import failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetWizard = () => {
    setStep('method');
    setImportMethod(null);
    setUploadedFile(null);
    setPreviewData(null);
    setSelectedFile(null);
    setSelectedWorksheet(null);
    setWorksheets([]);
    setImportResult(null);
    setError(null);
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'method', label: 'Method' },
      { key: 'source', label: 'Source' },
      { key: 'preview', label: 'Preview' },
      { key: 'import', label: 'Import' },
      { key: 'complete', label: 'Complete' }
    ];

    const currentIndex = steps.findIndex(s => s.key === step);

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((stepItem, index) => (
          <div key={stepItem.key} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index <= currentIndex 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {index + 1}
            </div>
            <span className={`ml-2 text-sm ${
              index <= currentIndex ? 'text-blue-600 font-medium' : 'text-gray-500'
            }`}>
              {stepItem.label}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-12 h-px mx-4 ${
                index < currentIndex ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderMethodSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Manufacturing Data</h2>
        <p className="text-gray-600">Choose your data source to get started</p>
      </div>

      {/* Data Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Data Type</label>
        <select
          value={dataType}
          onChange={(e) => setDataType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="production">Production Data</option>
          <option value="quality">Quality Control Data</option>
          <option value="inventory">Inventory Data</option>
          <option value="financial">Financial Data</option>
        </select>
      </div>

      {/* Import Method Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          onClick={() => {
            setImportMethod('file');
            setStep('source');
          }}
          className="p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <div className="text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload File</h3>
            <p className="text-gray-600">Upload Excel files (.xlsx, .xls) or CSV files from your computer</p>
          </div>
        </div>

        <div 
          onClick={() => {
            setImportMethod('microsoft');
            if (isMicrosoftAuthenticated) {
              loadMicrosoftFiles().then(() => setStep('source'));
            } else {
              handleMicrosoftLogin();
            }
          }}
          className="p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <div className="text-center">
            <Microsoft className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Microsoft 365</h3>
            <p className="text-gray-600">Connect to OneDrive or SharePoint to access your Excel files</p>
            {isMicrosoftAuthenticated && (
              <p className="text-sm text-green-600 mt-2">âœ“ Connected as {microsoftUserInfo?.displayName}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFileUpload = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your File</h2>
        <p className="text-gray-600">Drag and drop your Excel file or click to browse</p>
      </div>

      <div {...getRootProps()} className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}>
        <input {...getInputProps()} />
        <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop your file here...</p>
        ) : (
          <>
            <p className="text-gray-600 mb-2">Drop your Excel file here, or click to select</p>
            <p className="text-sm text-gray-500">Supports .xlsx, .xls, and .csv files</p>
          </>
        )}
      </div>

      {uploadedFile && (
        <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <File className="w-5 h-5 text-green-600 mr-3" />
          <div className="flex-1">
            <p className="font-medium text-green-900">{uploadedFile.name}</p>
            <p className="text-sm text-green-600">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
          </div>
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
      )}
    </div>
  );

  const renderMicrosoftFiles = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your File</h2>
        <p className="text-gray-600">Choose an Excel file from your OneDrive or SharePoint</p>
      </div>

      {microsoftFiles.length === 0 ? (
        <div className="text-center py-8">
          <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No Excel files found in your Microsoft 365 account</p>
          <button
            onClick={loadMicrosoftFiles}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Refresh Files
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
          {microsoftFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => handleFileSelect(file)}
              className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center">
                <FileSpreadsheet className={`w-8 h-8 mr-3 ${
                  file.source === 'sharepoint' ? 'text-orange-500' : 'text-green-500'
                }`} />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{file.name}</h4>
                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <span>{file.source === 'sharepoint' ? 'SharePoint' : 'OneDrive'}</span>
                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                    <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                  </div>
                  {file.siteName && (
                    <p className="text-xs text-orange-600">Site: {file.siteName}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderWorksheetSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Worksheet</h2>
        <p className="text-gray-600">Choose the worksheet containing your {dataType} data</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {worksheets.map((worksheet) => (
          <div
            key={worksheet.id}
            onClick={() => handleWorksheetSelect(worksheet)}
            className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileSpreadsheet className="w-6 h-6 text-green-600 mr-3" />
                <span className="font-medium text-gray-900">{worksheet.name}</span>
              </div>
              <span className="text-sm text-gray-500">Position {worksheet.position + 1}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Preview</h2>
        <p className="text-gray-600">Review your data before importing</p>
      </div>

      {previewData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">{previewData.sheetName || 'Preview'}</h3>
              <p className="text-sm text-gray-600">
                {previewData.data.length} rows Ã— {previewData.headers.length} columns
                {previewData.totalRows && ` (${previewData.totalRows} total rows)`}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              previewData.data.length > 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {previewData.data.length > 0 ? 'Ready to Import' : 'No Data Found'}
            </span>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {previewData.headers.map((header, index) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.data.slice(0, 5).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {previewData.headers.map((_, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row[colIndex] || 'â€”'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {previewData.data.length > 5 && (
            <p className="text-sm text-gray-500 text-center">
              Showing first 5 rows of {previewData.data.length} preview rows
            </p>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(importMethod === 'file' ? 'source' : 'preview')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              â† Back
            </button>
            <button
              onClick={handleImport}
              disabled={isLoading || previewData.data.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Importing...' : `Import ${previewData.data.length} Records`}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderComplete = () => (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Complete!</h2>
        <p className="text-gray-600">Your data has been successfully imported</p>
      </div>

      {importResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-green-900">Records Imported:</span>
              <span className="ml-2 text-green-700">{importResult.recordsImported}</span>
            </div>
            <div>
              <span className="font-medium text-green-900">Data Type:</span>
              <span className="ml-2 text-green-700 capitalize">{dataType}</span>
            </div>
          </div>
          
          {importResult.validation && importResult.validation.warnings?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <span className="font-medium text-yellow-800">Warnings:</span>
              <ul className="mt-1 text-sm text-yellow-700">
                {importResult.validation.warnings.slice(0, 3).map((warning, index) => (
                  <li key={index}>â€¢ {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-center space-x-4">
        <button
          onClick={resetWizard}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Import More Data
        </button>
        <button
          onClick={onImportComplete}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          View Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {renderStepIndicator()}
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-red-900">Import Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-8">
        {step === 'method' && renderMethodSelection()}
        {step === 'source' && importMethod === 'file' && renderFileUpload()}
        {step === 'source' && importMethod === 'microsoft' && renderMicrosoftFiles()}
        {step === 'preview' && importMethod === 'microsoft' && worksheets.length > 0 && !selectedWorksheet && renderWorksheetSelection()}
        {step === 'preview' && previewData && renderPreview()}
        {step === 'complete' && renderComplete()}
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mr-3" />
            <span className="text-gray-900">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataImportWizard;
