/**
 * FileUploadZone Component
 *
 * Drag-and-drop file upload zone for CSV/Excel files
 * Supports file validation, preview, and progress tracking
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ACCEPTED_FILE_TYPES = {
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

export default function FileUploadZone({ onFileSelect, disabled = false }) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null);

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      const error = rejection.errors[0];

      if (error.code === 'file-too-large') {
        setError(`File size exceeds 50MB limit. Please upload a smaller file.`);
      } else if (error.code === 'file-invalid-type') {
        setError('Only CSV and Excel files (.csv, .xls, .xlsx) are supported.');
      } else {
        setError(`Upload failed: ${error.message}`);
      }
      return;
    }

    // Handle accepted files
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setUploadProgress(0);

      // Simulate upload progress (in real implementation, this would be from XHR)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      // Call parent handler
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled,
    onDrop,
  });

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setUploadProgress(0);
    setError(null);
    onFileSelect(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive && !isDragReject ? 'border-blue-500 bg-blue-50' : ''}
          ${isDragReject ? 'border-red-500 bg-red-50' : ''}
          ${!isDragActive && !isDragReject ? 'border-gray-300 hover:border-gray-400' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        {!selectedFile ? (
          <>
            <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900">
                {isDragActive
                  ? 'Drop the file here'
                  : 'Drag and drop file here, or click to browse'}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                CSV, Excel (.csv, .xls, .xlsx) - Max 50MB
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <DocumentTextIcon className="h-10 w-10 text-blue-500" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                type="button"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadProgress === 100 && (
              <div className="flex items-center justify-center text-xs text-green-600">
                <svg
                  className="h-4 w-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Upload complete
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {selectedFile && uploadProgress === 100 && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-700">
            <strong>Tip:</strong> Click "Next" to continue with column mapping and validation.
          </p>
        </div>
      )}
    </div>
  );
}
