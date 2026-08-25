// src/features/efiling/EFilingDetailsView.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckSquare, ShieldCheck, AlertTriangle } from 'lucide-react';

const EFilingDetailsView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [authPin, setAuthPin] = useState('');

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      <div className="flex items-center gap-4 shrink-0 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:text-[#5f41b2] transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none">Transmit: {id}</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Client: Michael Smith | Return: 1040</p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        <div className="flex-[1.2] bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <CheckSquare className="w-5 h-5 text-[#5f41b2]" /> Pre-Filing Validations
          </h2>
          <div className="space-y-4 flex-1">
            <label className="flex items-center gap-3 p-4 border border-emerald-200 bg-emerald-50/30 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-900">Form 8879 Authorized</p>
                <p className="text-xs text-emerald-700">Client has signed and authorized e-filing.</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 border border-emerald-200 bg-emerald-50/30 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-900">Payment Secured</p>
                <p className="text-xs text-emerald-700">Invoice paid and confidential data stored.</p>
              </div>
            </label>
            
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-500"/> Rejection Resolution (If Applicable)</h3>
              <textarea rows={3} placeholder="If rejected, enter IRS rejection code and steps taken to fix it before re-transmitting..." className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] bg-gray-50"></textarea>
            </div>
          </div>
        </div>

        <div className="flex-[0.8] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col p-6">
           <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
            <Send className="w-5 h-5 text-[#5f41b2]" /> IRS Gateway
          </h2>
          <p className="text-xs text-gray-500 mb-6">Enter your EFIN/PIN to authorize transmission of this return to the IRS.</p>
          
          <div className="mt-auto space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Preparer Authorization PIN</label>
              <input type="password" value={authPin} onChange={(e) => setAuthPin(e.target.value)} placeholder="Enter 5-digit PIN" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5f41b2]" />
            </div>
            <button className="w-full flex items-center justify-center gap-2 bg-[#5f41b2] text-white font-bold text-sm py-3 rounded-xl hover:bg-[#4d3396] transition shadow-sm">
              <Send className="w-4 h-4" /> Transmit Return to IRS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default EFilingDetailsView;