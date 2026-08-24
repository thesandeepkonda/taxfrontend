// src/features/preparation/PreparationDetailsView.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Phone, Mail, ShieldAlert, FileText, CheckCircle2, MessageSquareWarning, Calculator
} from 'lucide-react';

const PreparationDetailsView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const clientData = {
    id: id || 'PRP-001',
    clientId: 'LD-003',
    name: 'Michael Smith',
    email: 'mike.s@email.com',
    phone: '+1 (555) 456-7890',
    ssn: '123-45-6789',
    visaStatus: 'Citizen',
    taxYear: '2023',
    status: 'IN_PROGRESS',
    documents: [
      { id: 1, name: 'W2_Form_2023.pdf', type: 'Income', date: '2026-08-20' },
      { id: 2, name: 'ID_Proof.pdf', type: 'Verification', date: '2026-08-21' }
    ]
  };

  // Permanent Masking Utilities for Employees
  const maskPhone = (phone: string) => phone.replace(/(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?/, '+1 (***) ***-');
  const maskSSN = (ssn: string) => ssn.replace(/^\d{3}-\d{2}-/, 'XXX-XX-');
  const maskEmail = (email: string) => {
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const [name, domain] = parts;
    const maskedName = name.length > 2 
      ? name.substring(0, 2) + '***' + name.substring(name.length - 1) 
      : name.substring(0, 1) + '***';
    return `${maskedName}@${domain}`;
  };

  const [checklist, setChecklist] = useState({
    docMatch: false,
    dataEntry: false,
    qualityReview: false
  });

  const handleChecklist = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      <div className="flex items-center gap-4 shrink-0 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:text-[#5f41b2] transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
            Tax Preparation: {clientData.name}
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-700 uppercase">
              {clientData.status}
            </span>
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Task ID: {clientData.id} | Tax Year: {clientData.taxYear}
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        
        {/* Left Column: Client Data & Documents */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-y-auto p-6">
          <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <User className="w-5 h-5 text-[#5f41b2]" /> Client Profile
          </h2>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Mobile Number</label>
                <p className="font-semibold text-gray-800 text-sm">{maskPhone(clientData.phone)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email Address</label>
                <p className="font-semibold text-gray-800 text-sm truncate">{maskEmail(clientData.email)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                <label className="block text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> SSN / ITIN</label>
                <p className="font-bold text-rose-700 text-sm tracking-widest">{maskSSN(clientData.ssn)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Visa Status</label>
                <p className="font-semibold text-gray-800 text-sm">{clientData.visaStatus}</p>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2 mt-8 mb-4 border-b border-gray-100 pb-4">
            <FileText className="w-5 h-5 text-[#5f41b2]" /> Source Documents
          </h2>
          <div className="space-y-3">
            {clientData.documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50 cursor-pointer hover:border-[#5f41b2] transition group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-[#5f41b2]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1b2559] group-hover:text-[#5f41b2]">{doc.name}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{doc.type} • {doc.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Tax Prep Checklist & Actions */}
        <div className="flex-[0.8] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
          <div className="p-6 border-b border-gray-100 shrink-0">
            <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-[#5f41b2]" /> Prep Checklist
            </h2>
            <p className="text-xs text-gray-500">Complete the checklist before sending for review.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <label className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition">
              <input type="checkbox" className="w-5 h-5 accent-[#5f41b2] cursor-pointer rounded" checked={checklist.docMatch} onChange={() => handleChecklist('docMatch')} />
              <div>
                <p className="text-sm font-bold text-[#1b2559]">Document-to-Return Matching</p>
                <p className="text-xs text-gray-500">Verified all source documents.</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition">
              <input type="checkbox" className="w-5 h-5 accent-[#5f41b2] cursor-pointer rounded" checked={checklist.dataEntry} onChange={() => handleChecklist('dataEntry')} />
              <div>
                <p className="text-sm font-bold text-[#1b2559]">Data Entry Complete</p>
                <p className="text-xs text-gray-500">Form 1040 data entered accurately.</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition">
              <input type="checkbox" className="w-5 h-5 accent-[#5f41b2] cursor-pointer rounded" checked={checklist.qualityReview} onChange={() => handleChecklist('qualityReview')} />
              <div>
                <p className="text-sm font-bold text-[#1b2559]">Self Quality Review</p>
                <p className="text-xs text-gray-500">Checked for errors before submission.</p>
              </div>
            </label>
            
            <div className="mt-8">
              <label className="block text-xs font-bold text-gray-700 mb-2">Missing Information?</label>
              <textarea 
                rows={3} 
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] bg-gray-50"
                placeholder="Describe missing documents or client queries here..."
              ></textarea>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 shrink-0 grid grid-cols-2 gap-3">
             <button className="flex items-center justify-center gap-2 bg-rose-50 text-rose-600 font-bold text-sm py-3 rounded-xl hover:bg-rose-100 transition border border-rose-100">
               <MessageSquareWarning className="w-4 h-4" /> Raise Query
             </button>
             <button className="flex items-center justify-center gap-2 bg-[#5f41b2] text-white font-bold text-sm py-3 rounded-xl hover:bg-[#4d3396] transition shadow-sm">
               <CheckCircle2 className="w-4 h-4" /> Send for Review
             </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default PreparationDetailsView;