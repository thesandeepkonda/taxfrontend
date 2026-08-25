// src/features/payments/PaymentDetailsView.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle2, Copy } from 'lucide-react';

const PaymentDetailsView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://pay.metrixtax.com/${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      <div className="flex items-center gap-4 shrink-0 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:text-[#5f41b2] transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none">Invoice: {id}</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Client: Michael Smith | Amount: $150.00</p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
            <CreditCard className="w-5 h-5 text-[#5f41b2]" /> Payment Processing
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-bold text-blue-900 mb-2">Payment Link</p>
            <div className="flex items-center gap-2">
              <input type="text" readOnly value={`https://pay.metrixtax.com/${id}`} className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none" />
              <button onClick={handleCopy} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2 mb-4 mt-4 border-b border-gray-100 pb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> Confidential Info Collection
          </h2>
          <p className="text-xs text-gray-500 mb-4">Required for direct deposit/withdrawal before E-Filing.</p>
          <div className="space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bank Routing Number</label>
                <input type="password" placeholder="********" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5f41b2]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Account Number</label>
                <input type="password" placeholder="********" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5f41b2]" />
              </div>
            </div>
          </div>
          <button className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold text-sm py-3 rounded-xl hover:bg-emerald-700 transition shadow-sm">
            <CheckCircle2 className="w-4 h-4" /> Mark Paid & Move to E-File
          </button>
        </div>
      </div>
    </div>
  );
};
export default PaymentDetailsView;