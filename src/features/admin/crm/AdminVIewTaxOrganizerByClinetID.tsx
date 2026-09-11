// src/features/admin/crm/AdminVIewTaxOrganizerByClinetID.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { useToast } from '../../../contexts/ToastContext';
import api from '../../../services/api';
import {
  ArrowLeft,
  FileText,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  X,
} from 'lucide-react';

interface TaxOrganizerResponse {
  id: number;
  clientId: number;
  clientName: string;
  taxYear: number;
  fileName: string | null;
  fileUrl: string | null;
  status: string;
  submittedAt: string | null;
  notes: string | null;
}

const AdminVIewTaxOrganizerByClinetID: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  const [data, setData] = useState<TaxOrganizerResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<boolean>(false);

  // Execution lock: ensures API is called only once per unique clientId
  const lastFetchedIdRef = useRef<string | null>(null);

  const fetchTaxOrganizer = async (isManualRefresh: boolean = false) => {
    if (!clientId) return;
    const parsedId = parseInt(clientId, 10);
    if (isNaN(parsedId)) {
      setError('Invalid client ID');
      setLoading(false);
      showToast('Invalid client ID', 'error');
      return;
    }

    if (!isManualRefresh && lastFetchedIdRef.current === clientId) {
      return;
    }
    lastFetchedIdRef.current = clientId;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/admin/clients/${parsedId}/tax-organizer`);
      setData(response.data);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Tax Organizer not found';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxOrganizer(false);
  }, [clientId]);

  const handleRefresh = () => {
    fetchTaxOrganizer(true);
  };

  const handleDownload = async () => {
    if (!data?.id) return;
    try {
      const response = await api.get(`/admin/tax-organizer/${data.id}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', data.fileName || `Tax_Organizer_${clientId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Download failed', 'error');
    }
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 shrink-0 mb-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-[#5f41b2] transition cursor-pointer text-slate-600 shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#5f41b2]/10 rounded-lg">
                <FileText className="w-5 h-5 text-[#5f41b2]" />
              </div>
              <h1 className="text-xl font-extrabold text-[#1b2559] tracking-tight leading-none">
                Client Tax Organizer
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Client ID: #{clientId || 'N/A'} {data?.clientName && `• ${data.clientName}`}
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#5f41b2]' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
              <p className="text-sm font-semibold">Loading tax organizer details...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-rose-500 gap-2 py-16">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
              <p className="text-sm font-bold">{error}</p>
              <p className="text-xs text-slate-400">Unable to retrieve tax organizer record</p>
              <button
                onClick={handleRefresh}
                className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : !data ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-16">
              <FileText className="w-12 h-12 opacity-20" />
              <p className="text-sm font-semibold">No tax organizer found for this client</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="p-5 border border-slate-200/80 rounded-2xl bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-[#1b2559]">Tax Organizer Information</h3>
                    <p className="text-xs text-slate-500">Tax Year: {data.taxYear || 'N/A'}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {data.status || 'SUBMITTED'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold block mb-1">File Name</span>
                    <span className="font-semibold text-slate-700 truncate block">
                      {data.fileName || 'No file attached'}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold block mb-1">Submitted On</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {data.submittedAt ? new Date(data.submittedAt).toLocaleString() : '—'}
                    </span>
                  </div>
                </div>

                {data.notes && (
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs">
                    <span className="text-slate-400 font-bold block mb-1">Notes / Remarks</span>
                    <p className="text-slate-700 whitespace-pre-wrap">{data.notes}</p>
                  </div>
                )}

                {data.fileName && (
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5f41b2] hover:bg-[#4d3396] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Organizer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminVIewTaxOrganizerByClinetID;