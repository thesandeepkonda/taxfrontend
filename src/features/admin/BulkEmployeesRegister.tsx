// src/features/admin/BulkEmployeesRegister.tsx
import React, { useState, useRef } from 'react';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';
import {
  UploadCloud,
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  XCircle,
} from 'lucide-react';

// Response structure from backend (based on OpenAPI)
interface BulkEmployeeError {
  rowNumber: number;
  field: string;
  value: string;
  message: string;
}

interface BulkEmployeeResponse {
  success: boolean;
  totalRows: number;
  successRows: number;
  errorRows: number;
  errors: BulkEmployeeError[];
}

const BulkEmployeesRegister: React.FC = () => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [responseData, setResponseData] = useState<BulkEmployeeResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validExtensions = ['.xlsx', '.xls'];
      const ext = selectedFile.name.slice(selectedFile.name.lastIndexOf('.')).toLowerCase();
      if (!validExtensions.includes(ext)) {
        showToast('Please upload a valid Excel file (.xlsx or .xls)', 'error');
        e.target.value = '';
        return;
      }
      setFile(selectedFile);
      setResponseData(null);
      setErrorMessage(null);
    }
  };

  // Remove selected file
  const removeFile = () => {
    setFile(null);
    setResponseData(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Trigger file input
  const openFilePicker = () => fileInputRef.current?.click();

  // Upload to backend
  const handleUpload = async () => {
    if (!file) {
      showToast('Please select an Excel file first', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('file', file); // field name must be "file" per OpenAPI spec

    setUploading(true);
    setUploadProgress(0);
    setResponseData(null);
    setErrorMessage(null);

    try {
      const response = await api.post('/employees/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      const data: BulkEmployeeResponse = response.data;
      setResponseData(data);

      if (data.success) {
        showToast(`Upload successful! ${data.successRows} employees registered.`, 'success');
      } else {
        // Even if success flag is false, we have error details
        showToast(`Upload completed with ${data.errorRows} errors.`, 'error');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to upload file. Please try again.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  // Download error report (if needed) – you can add CSV/Excel download logic here
  const downloadErrorReport = () => {
    if (!responseData?.errors?.length) return;
    // Simple: show errors in console or build a CSV
    // For now, we'll just show a toast
    showToast('Error details displayed below.', 'info');
  };

  // Render error list
  const renderErrors = () => {
    if (!responseData?.errors?.length) return null;
    return (
      <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-4 max-h-60 overflow-y-auto">
        <h4 className="text-sm font-bold text-rose-800 flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4" />
          Error Details ({responseData.errors.length})
        </h4>
        <ul className="space-y-1 text-xs text-rose-700">
          {responseData.errors.map((err, idx) => (
            <li key={idx} className="border-b border-rose-100 pb-1 last:border-0">
              <span className="font-semibold">Row {err.rowNumber}</span> – 
              <span className="ml-1">{err.field}:</span>
              <span className="ml-1 font-mono">"{err.value}"</span>
              <span className="ml-1">→ {err.message}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col font-sans overflow-x-hidden gap-y-4">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div>
          <h1
            className="font-extrabold text-[#1b2559] tracking-tight leading-tight flex items-center gap-2.5"
            style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)' }}
          >
            <UploadCloud className="w-6 h-6 sm:w-7 sm:h-7 text-[#5f41b2] shrink-0" />
            <span>Bulk Employee Registration</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Upload an Excel file (.xlsx / .xls) to register multiple employees at once
          </p>
        </div>
      </header>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 sm:p-6 lg:p-8">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Drag & Drop / File Selection Area */}
        {!file ? (
          <div
            onClick={openFilePicker}
            className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-8 sm:p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
          >
            <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Click to browse or drag & drop</p>
            <p className="text-xs text-slate-400 mt-1">Supported: .xlsx, .xls</p>
          </div>
        ) : (
          // File selected – show details and upload button
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <FileSpreadsheet className="w-8 h-8 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                disabled={uploading}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#5f41b2] h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
                <p className="text-xs text-slate-500 mt-1 text-right">{uploadProgress}%</p>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 bg-[#5f41b2] hover:bg-[#4d3396] disabled:opacity-70 text-white font-bold text-sm py-3 rounded-xl transition shadow-sm active:scale-95"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5" />
                  <span>Upload File</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Upload Response Summary */}
        {responseData && (
          <div className="mt-6 space-y-4 border-t border-slate-200 pt-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase">Total Rows</p>
                <p className="text-xl font-extrabold text-[#1b2559]">{responseData.totalRows}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl text-center border border-emerald-200">
                <p className="text-xs font-bold text-emerald-600 uppercase">Success</p>
                <p className="text-xl font-extrabold text-emerald-700">{responseData.successRows}</p>
              </div>
              <div className="bg-rose-50 p-3 rounded-xl text-center border border-rose-200">
                <p className="text-xs font-bold text-rose-600 uppercase">Errors</p>
                <p className="text-xl font-extrabold text-rose-700">{responseData.errorRows}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl text-center border border-blue-200">
                <p className="text-xs font-bold text-blue-600 uppercase">Status</p>
                <p className="text-sm font-bold text-blue-700">
                  {responseData.success ? (
                    <span className="flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Success
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      <XCircle className="w-4 h-4" /> Partial
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Error details */}
            {renderErrors()}
          </div>
        )}

        {/* General error message */}
        {errorMessage && !responseData && (
          <div className="mt-5 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <p className="text-sm text-rose-700">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkEmployeesRegister;