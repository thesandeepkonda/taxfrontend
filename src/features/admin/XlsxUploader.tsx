// src/components/uploader/XlsxUploader.tsx
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, Trash2, CheckCircle2 } from 'lucide-react';

const XlsxUploader: React.FC = () => {
  const [tableData, setTableData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const processFile = (file: File) => {
    if (!file) return;
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      alert('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    setFileName(file.name);
    setFileSize(formatFileSize(file.size));

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
        } else {
          alert('No records found in spreadsheet.');
          setTableData([]);
          setHeaders([]);
        }
      } catch (error: any) {
        alert('Error parsing file: ' + error.message);
        setTableData([]);
        setHeaders([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handleDeleteFile = () => {
    setTableData([]);
    setHeaders([]);
    setFileName('');
    setFileSize('');
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full flex flex-col font-sans overflow-x-hidden gap-y-4">
      <header className="flex items-center justify-between gap-2 shrink-0">
        <div>
          <h1 
            className="font-extrabold text-[#1b2559] tracking-tight leading-tight flex items-center gap-2.5"
            style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)' }}
          >
            <FileSpreadsheet className="w-6 h-6 sm:w-7 sm:h-7 text-[#5f41b2] shrink-0" />
            <span>Excel Data Import</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Upload and preview bulk `.xlsx` / `.xls` spreadsheets
          </p>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 sm:p-6 lg:p-8">
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
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}

        {tableData.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-bold text-blue-900">
                  Total Records: {tableData.length}
                </span>
              </div>
              <span className="text-xs text-blue-700 font-medium">Columns: {headers.length}</span>
            </div>

            {/* Scrollable Data Table with Hidden Native Scrollbars */}
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