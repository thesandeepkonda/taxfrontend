// src/features/admin/crm/AdminDocuments.tsx
import React, { useState } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { FileText, Eye, Loader2 } from 'lucide-react';
import api from '../../../services/api';

const AdminDocuments: React.FC = () => {
  const { showToast } = useToast();
  const [documentId, setDocumentId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleView = async () => {
    if (!documentId.trim()) {
      showToast('Please enter a document ID', 'warning');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/documents/admin/view/${documentId.trim()}`, {
        responseType: 'blob',
      });

      // Determine the content type from response headers
      const contentType = response.headers['content-type'] || '';

      // If the response is JSON, it's likely an error message
      if (contentType.includes('application/json')) {
        // Convert blob to text to read error details
        const errorText = await response.data.text();
        try {
          const errorJson = JSON.parse(errorText);
          showToast(errorJson.message || 'Document not found or inaccessible', 'error');
        } catch {
          showToast('Failed to retrieve document', 'error');
        }
        return;
      }

      // If it's a PDF or any other file, create a blob with the correct type
      const fileType = contentType || 'application/pdf'; // fallback
      const blob = new Blob([response.data], { type: fileType });
      const url = URL.createObjectURL(blob);

      // Open the document in a new tab
      window.open(url, '_blank');

      // Clean up the object URL after a delay (10 seconds should be enough)
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error: any) {
      // Axios errors – if response is a blob, we can try to read it
      if (error.response && error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          showToast(json.message || 'Failed to view document', 'error');
        } catch {
          showToast('An unexpected error occurred', 'error');
        }
      } else {
        showToast(error.message || 'Failed to view document', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center font-sans p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-8 h-8 text-[#5f41b2]" />
          <h1 className="text-2xl font-extrabold text-[#1b2559]">View Document</h1>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Enter the document ID to view the uploaded file.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            placeholder="e.g., 123"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent"
          />
          <button
            onClick={handleView}
            disabled={loading || !documentId.trim()}
            className="px-5 py-2.5 bg-[#5f41b2] text-white font-bold rounded-xl hover:bg-[#4e3596] transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDocuments;