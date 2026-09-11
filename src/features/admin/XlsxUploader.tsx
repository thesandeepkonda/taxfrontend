// src/components/uploader/XlsxUploader.tsx
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, Trash2, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface ImportResponse {
  totalRows: number;
  successful: number;
  duplicates: number;
  invalidRows: number;
  message: string;
}

const XlsxUploader: React.FC = () => {
  const { showToast } = useToast();
  const [tableData, setTableData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<ImportResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const processFile = (fileObj: File) => {
    if (!fileObj) return;
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = fileObj.name.slice(fileObj.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      showToast('Please upload a valid Excel file (.xlsx or .xls)', 'error');
      return;
    }

    setFile(fileObj);
    setFileName(fileObj.name);
    setFileSize(formatFileSize(fileObj.size));
    setUploadResult(null); // clear previous results

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length > 0) {
          setHeaders(Object.keys(jsonData[0]));
          setTableData(jsonData);
          showToast(`Loaded ${jsonData.length} records from Excel`, 'info');
        } else {
          showToast('No records found in spreadsheet.', 'warning');
          setTableData([]);
          setHeaders([]);
        }
      } catch (error: any) {
        showToast('Error parsing file: ' + error.message, 'error');
        setTableData([]);
        setHeaders([]);
      }
    };
    reader.readAsArrayBuffer(fileObj);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileObj = e.target.files?.[0];
    if (fileObj) processFile(fileObj);
    e.target.value = '';
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handleDeleteFile = () => {
    setTableData([]);
    setHeaders([]);
    setFileName('');
    setFileSize('');
    setFile(null);
    setUploadResult(null);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadToServer = async () => {
    if (!file) {
      showToast('Please select a file first', 'warning');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/admin/client-imports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result: ImportResponse = response.data;
      setUploadResult(result);

      if (result.successful > 0) {
        showToast(`✅ ${result.successful} clients uploaded successfully!`, 'success');
      } else {
        showToast(`⚠️ No clients were uploaded. Check errors below.`, 'warning');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Upload failed. Please try again.';
      showToast(msg, 'error');
      setUploadResult({
        totalRows: 0,
        successful: 0,
        duplicates: 0,
        invalidRows: 0,
        message: msg,
      });
    } finally {
      setUploading(false);
    }
  };

  const isUploaded = uploadResult && uploadResult.successful > 0;

  return (
    <div className="w-full flex flex-col font-sans overflow-x-hidden gap-y-4">
      <header className="flex items-center justify-between gap-2 shrink-0">
        <div>
          <h1 
            className="font-extrabold text-[#1b2559] tracking-tight leading-tight flex items-center gap-2.5"
            style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)' }}
          >
            <FileSpreadsheet className="w-6 h-6 sm:w-7 sm:h-7 text-[#5f41b2] shrink-0" />
            <span>Excel Client Import</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Upload `.xlsx` / `.xls` files to bulk import clients
          </p>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 sm:p-6 lg:p-8">
        {/* Expected format hint */}
        <div className="mb-4 p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-800 flex flex-wrap items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Expected columns:</strong> 
            <span className="font-mono mx-1">Name</span> (required), 
            <span className="font-mono mx-1">Email</span> (optional), 
            <span className="font-mono mx-1">Phone</span> (required, 10 digits)
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          className="hidden"
        />

        {!fileName ? (
          <div
            onClick={openFilePicker}
            onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
            }}
            className={`w-full border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
              isDragging ? 'border-blue-500 bg-blue-50/60' : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/30'
            }`}
          >
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <UploadCloud className={`w-10 h-10 sm:w-12 sm:h-12 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
              <p className="text-xs sm:text-sm font-bold text-slate-700">Drag & drop files here to upload</p>
              <p className="text-[11px] sm:text-xs text-slate-400">or</p>
              <span className="text-xs sm:text-sm font-semibold text-[#5f41b2] underline min-h-[44px] inline-flex items-center">
                Browse Files
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File info */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{fileName}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500">{fileSize}</p>
                </div>
              </div>
              <button
                onClick={handleDeleteFile}
                className="min-h-[44px] min-w-[44px] p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition flex items-center justify-center"
                aria-label="Remove spreadsheet"
                disabled={uploading}
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Upload action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleUploadToServer}
                disabled={uploading || !file}
                className="flex items-center gap-2 bg-[#5f41b2] hover:bg-[#4e3596] disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-sm active:scale-95"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Upload to Server
                  </>
                )}
              </button>
              {uploading && <span className="text-xs text-slate-400">Please wait, uploading clients...</span>}
            </div>

            {/* Upload result summary */}
            {uploadResult && (
              <div className={`p-4 rounded-xl border ${uploadResult.successful > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                  {uploadResult.successful > 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  )}
                  Import Summary
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <p className="text-slate-500 font-medium">Total Rows</p>
                    <p className="font-bold text-slate-800">{uploadResult.totalRows}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <p className="text-slate-500 font-medium">Successful</p>
                    <p className="font-bold text-emerald-600">{uploadResult.successful}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <p className="text-slate-500 font-medium">Duplicates</p>
                    <p className="font-bold text-amber-600">{uploadResult.duplicates}</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <p className="text-slate-500 font-medium">Invalid Rows</p>
                    <p className="font-bold text-rose-600">{uploadResult.invalidRows}</p>
                  </div>
                </div>
                {uploadResult.message && (
                  <p className="mt-2 text-xs text-slate-600 italic">{uploadResult.message}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Preview table (if data loaded) */}
        {tableData.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-bold text-blue-900">
                  Preview: {tableData.length} records
                </span>
              </div>
              <span className="text-xs text-blue-700 font-medium">Columns: {headers.length}</span>
            </div>

            <div className="w-full overflow-x-auto max-h-[420px] overflow-y-auto border border-slate-200 rounded-xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-left text-xs min-w-[500px] divide-y divide-slate-200">
                <thead className="bg-slate-100 sticky top-0 z-10">
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="px-3.5 py-2.5 font-bold text-slate-600 uppercase text-[10px] tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {tableData.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50 transition">
                      {headers.map((h, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2 text-slate-700 whitespace-nowrap">
                          {row[h] ?? '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default XlsxUploader;