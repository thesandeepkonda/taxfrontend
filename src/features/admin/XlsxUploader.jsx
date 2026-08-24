import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const XlsxUploader = () => {
  const [tableData, setTableData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [fileName, setFileName] = useState('');

  // File select ayinappude decode chesi display cheyyi
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length > 0) {
          setHeaders(Object.keys(jsonData[0]));
          setTableData(jsonData);
        } else {
          alert('Sheet lo data ledu!');
          setTableData([]);
          setHeaders([]);
        }
      } catch (error) {
        alert('Error parsing file: ' + error.message);
        setTableData([]);
        setHeaders([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      
      <h2 className="text-2xl font-bold text-[#1b2559] mb-4">📊 XLSX File Uploader</h2>
      
      {/* File Input - Select chesthene decode avutundi */}
      <input 
        type="file" 
        accept=".xlsx, .xls" 
        onChange={handleFileUpload} 
        className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {/* Count Display */}
      {tableData.length > 0 && (
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg flex flex-wrap items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-blue-700">
              📈 Total Records: <span className="text-xl font-extrabold text-[#1b2559]">{tableData.length}</span>
            </span>
            <span className="text-xs text-gray-500 border-l border-blue-200 pl-3">
              Columns: {headers.length}
            </span>
          </div>
          <div className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-blue-100">
            📄 {fileName}
          </div>
        </div>
      )}

      {/* Empty State */}
      {tableData.length === 0 && (
        <p className="text-gray-400 text-sm">Upload an XLSX file to see data here.</p>
      )}

      {/* Data Table */}
      {tableData.length > 0 && (
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {headers.map((header, idx) => (
                  <th key={idx} className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableData.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50">
                  {headers.map((header, colIdx) => (
                    <td key={colIdx} className="px-4 py-2 text-sm text-gray-700">
                      {row[header] !== undefined && row[header] !== null ? row[header] : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default XlsxUploader;