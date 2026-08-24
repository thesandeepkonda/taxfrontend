// src/features/documentation/ClientDetailsView.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  ShieldAlert, 
  Eye, 
  EyeOff,
  UploadCloud,
  FileText,
  CheckCircle2
} from 'lucide-react';

const ClientDetailsView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showSensitive, setShowSensitive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Dummy client data based on ID
  const clientData = {
    id: id || 'LD-001',
    name: 'Rahul Sharma',
    email: 'rahul.s@email.com',
    phone: '+1 (555) 123-4567',
    ssn: '123-45-6789',
    visaStatus: 'H1B',
    taxYear: '2023',
    status: 'NEW',
    documents: [
      { id: 1, name: 'Passport_Copy.pdf', type: 'ID Proof', date: '2026-08-20' },
      { id: 2, name: 'W2_Form_2023.pdf', type: 'Income', date: '2026-08-21' }
    ]
  };

  // Masking Utilities
  const maskPhone = (phone: string) => phone.replace(/(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?/, '+1 (***) ***-');
  const maskSSN = (ssn: string) => ssn.replace(/^\d{3}-\d{2}-/, 'XXX-XX-');
  const maskEmail = (email: string) => {
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const [name, domain] = parts;
    // Shows first 2 letters and last letter of the name, rest is masked (e.g., ra***s@email.com)
    const maskedName = name.length > 2 
      ? name.substring(0, 2) + '***' + name.substring(name.length - 1) 
      : name.substring(0, 1) + '***';
    return `${maskedName}@${domain}`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      // Simulate upload delay
      setTimeout(() => {
        setIsUploading(false);
        alert(`File ${e.target.files![0].name} uploaded successfully!`);
      }, 1500);
    }
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 shrink-0 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:text-[#5f41b2] transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
            {clientData.name}
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-700 uppercase">
              {clientData.status}
            </span>
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Client ID: {clientData.id} | Tax Year: {clientData.taxYear}
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        
        {/* Left Column: Client Details */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
              <User className="w-5 h-5 text-[#5f41b2]" />
              Personal Information
            </h2>
            <button 
              onClick={() => setShowSensitive(!showSensitive)}
              className="text-xs font-bold text-gray-500 hover:text-[#5f41b2] flex items-center gap-1.5 transition bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200"
            >
              {showSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showSensitive ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Mobile Number
                </label>
                <p className="font-semibold text-gray-800 text-sm">
                  {showSensitive ? clientData.phone : maskPhone(clientData.phone)}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email Address
                </label>
                <p className="font-semibold text-gray-800 text-sm truncate" title={showSensitive ? clientData.email : "Email is masked"}>
                  {showSensitive ? clientData.email : maskEmail(clientData.email)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                <label className="block text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> SSN / ITIN
                </label>
                <p className="font-bold text-rose-700 text-sm tracking-widest">
                  {showSensitive ? clientData.ssn : maskSSN(clientData.ssn)}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Visa Status
                </label>
                <p className="font-semibold text-gray-800 text-sm">
                  {clientData.visaStatus}
                </p>
              </div>
            </div>
            
            <div className="pt-4 mt-4 border-t border-gray-100">
               <button className="w-full bg-[#5f41b2] hover:bg-[#4d3396] text-white font-bold text-sm py-2.5 rounded-xl transition shadow-sm">
                 Save / Update Details
               </button>
            </div>
          </div>
        </div>

        {/* Right Column: Document Upload & List */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
          <div className="p-6 border-b border-gray-100 shrink-0">
            <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2 mb-4">
              <UploadCloud className="w-5 h-5 text-[#5f41b2]" />
              Document Vault
            </h2>
            
            {/* Upload Area */}
            <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl p-6 text-center hover:bg-blue-50 transition cursor-pointer relative">
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileUpload}
              />
              <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-[#1b2559]">Click or drag documents here</p>
              <p className="text-xs text-gray-400 font-medium mt-1">Supports W-2, 1099, Passports (PDF, JPG)</p>
              {isUploading && <p className="text-xs text-blue-600 font-bold mt-2 animate-pulse">Uploading securely...</p>}
            </div>
          </div>

          {/* Uploaded Files List */}
          <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Uploaded Files</h3>
            {clientData.documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-emerald-200 bg-gray-50 hover:bg-emerald-50/30 transition group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-emerald-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1b2559]">{doc.name}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{doc.type} • Uploaded on {doc.date}</p>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 opacity-0 group-hover:opacity-100 transition" />
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ClientDetailsView;