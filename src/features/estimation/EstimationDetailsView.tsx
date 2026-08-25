// src/features/estimation/EstimationDetailsView.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Send, Calculator } from 'lucide-react';

const EstimationDetailsView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      <div className="flex items-center gap-4 shrink-0 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:text-[#5f41b2] transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none">Draft Estimate: {id}</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Client: Michael Smith (LD-003)</p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-y-auto">
          <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <Calculator className="w-5 h-5 text-[#5f41b2]" /> Tax Summary Details
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-sm font-semibold text-gray-600">Total Income</span>
              <span className="text-sm font-bold text-gray-900">$85,000</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-sm font-semibold text-gray-600">Federal Refund</span>
              <span className="text-sm font-bold text-emerald-600">+$1,250</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-sm font-semibold text-gray-600">State Due</span>
              <span className="text-sm font-bold text-rose-600">-$200</span>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <label className="block text-xs font-bold text-gray-700 mb-2">Internal Preparation Notes</label>
              <textarea rows={3} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none bg-gray-50" defaultValue="Client qualifies for child tax credit. Added Schedule A deductions."></textarea>
            </div>
          </div>
        </div>

        <div className="flex-[0.8] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col p-6">
          <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
            <FileText className="w-5 h-5 text-[#5f41b2]" /> Client Invoice Generation
          </h2>
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Preparation Fee ($)</label>
              <input type="number" defaultValue="150" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5f41b2]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Discount/Promo</label>
              <input type="text" placeholder="Enter code" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5f41b2]" />
            </div>
          </div>
          <button className="w-full mt-4 flex items-center justify-center gap-2 bg-[#5f41b2] text-white font-bold text-sm py-3 rounded-xl hover:bg-[#4d3396] transition shadow-sm">
            <Send className="w-4 h-4" /> Send Estimate & Invoice
          </button>
        </div>
      </div>
    </div>
  );
};
export default EstimationDetailsView;