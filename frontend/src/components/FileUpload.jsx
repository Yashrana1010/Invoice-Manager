import React, { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';

export default function FileUpload({ onUploadSuccess, onUploadError }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    try {
      setUploading(true);
      setUploadResult(null);

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      // Validate file type
      const supportedTypes = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png'];
      if (!supportedTypes.includes(file.type)) {
        throw new Error('Unsupported file type. Please upload PDF, TXT, JPG, or PNG files.');
      }

      const formData = new FormData();
      formData.append('document', file);
      formData.append('autoCreate', 'false');

      const response = await axios.post('/api/upload/extract', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadResult({
        success: true,
        data: response.data,
        fileName: file.name
      });

      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      setUploadResult({
        success: false,
        error: errorMessage,
        fileName: file.name
      });

      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const resetUpload = () => {
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {!uploadResult && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${dragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
            } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />

          <div className="text-center">
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">Processing document...</p>
                <p className="text-sm text-gray-500">This may take a few moments</p>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drop your invoice here or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supported formats: PDF, TXT, JPG, PNG (max 10MB)
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {uploadResult && (
        <div className={`rounded-lg p-6 ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {uploadResult.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
              )}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <File className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {uploadResult.fileName}
                  </span>
                </div>

                {uploadResult.success ? (
                  <div>
                    <p className="text-green-800 font-medium mb-3">
                      Document processed successfully!
                    </p>
                    {uploadResult.data.extractedData && (
                      <div className="space-y-2 text-sm">
                        {uploadResult.data.extractedData.clientName && (
                          <p><span className="font-medium">Client:</span> {uploadResult.data.extractedData.clientName}</p>
                        )}
                        {uploadResult.data.extractedData.totalAmount && (
                          <p><span className="font-medium">Amount:</span> ${uploadResult.data.extractedData.totalAmount}</p>
                        )}
                        {uploadResult.data.extractedData.invoiceDate && (
                          <p><span className="font-medium">Date:</span> {uploadResult.data.extractedData.invoiceDate}</p>
                        )}
                        <p><span className="font-medium">Confidence:</span> {(uploadResult.data.extractedData.confidence * 100).toFixed(1)}%</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-red-800">{uploadResult.error}</p>
                )}
              </div>
            </div>
            <button
              onClick={resetUpload}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>AI will automatically extract invoice details from your document</p>
      </div>
    </div>
  );
}
