// src/features/documentation/TaxOrganizerModal.tsx
import React, { useState, useEffect } from 'react';
import { apiDev2 } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { X, Save, Send, Loader2, FileText, UserPlus, Trash2, Edit } from 'lucide-react';

interface TaxOrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  clientName: string;
}

const initialSpouse = {
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  ssnItin: '',
  visaStatus: '',
  visaStatusChanged: false,
  occupation: '',
  email: '',
  hasSsn: false,
  hasItin: false,
};

const initialDependent = {
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  ssnItin: '',
  relationship: '',
  monthsLivedWithYou: 12,
  usCitizenResident: true,
  childCareExpenses: false,
  ssnStatus: 'NONE',
  itinApplicationRequired: false,
};

const TaxOrganizerModal: React.FC<TaxOrganizerModalProps> = ({ isOpen, onClose, clientId, clientName }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('NEW');
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    ssnItin: '',
    visaStatus: '',
    visaStatusChanged: false,
    maritalStatus: 'Single',
    currentAddress: '',
    emailAddress: '',
    phoneNumber: '',
    occupation: '',
    statesLivedIn2026: '',
    hasDependents: false,
    spouse: { ...initialSpouse },
    dependents: [] as typeof initialDependent[],
  });

  // Always Reset data to empty initially when opened, then fetch real data
  useEffect(() => {
    if (isOpen && clientId) {
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        ssnItin: '',
        visaStatus: '',
        visaStatusChanged: false,
        maritalStatus: 'Single',
        currentAddress: '',
        emailAddress: '',
        phoneNumber: '',
        occupation: '',
        statesLivedIn2026: '',
        hasDependents: false,
        spouse: { ...initialSpouse },
        dependents: [],
      });
      setExistingId(null);
      setStatus('NEW');
      setIsEditing(false); // Reset edit mode on open
      fetchOrganizerData();
    }
  }, [isOpen, clientId]);

  const fetchOrganizerData = async () => {
    setLoading(true);
    try {
      const response = await apiDev2.get(`/doc/clients/${clientId}/tax-organizer`);
      if (response.data && response.data.id) {
        setExistingId(response.data.id);
        setStatus(response.data.status);
        setFormData({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          dateOfBirth: response.data.dateOfBirth || '',
          ssnItin: response.data.ssnItin || '',
          visaStatus: response.data.visaStatus || '',
          visaStatusChanged: response.data.visaStatusChanged || false,
          maritalStatus: response.data.maritalStatus || 'Single',
          currentAddress: response.data.currentAddress || '',
          emailAddress: response.data.emailAddress || '',
          phoneNumber: response.data.phoneNumber || '',
          occupation: response.data.occupation || '',
          statesLivedIn2026: response.data.statesLivedIn2026 || '',
          hasDependents: response.data.hasDependents || false,
          spouse: response.data.spouse || { ...initialSpouse },
          dependents: response.data.dependents || [],
        });
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        showToast('Failed to load existing organizer data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSpouseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      spouse: {
        ...prev.spouse,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleDependentChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const newDependents = [...formData.dependents];
    newDependents[index] = {
      ...newDependents[index],
      [name]: type === 'checkbox' ? checked : value,
    };
    setFormData((prev) => ({ ...prev, dependents: newDependents }));
  };

  const addDependent = () => {
    setFormData((prev) => ({
      ...prev,
      dependents: [...prev.dependents, { ...initialDependent }],
    }));
  };

  const removeDependent = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      dependents: prev.dependents.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (isSubmit: boolean = false) => {
    setSaving(true);
    try {
      const payload = { ...formData };
      
      // Clean up conditional objects
      if (payload.maritalStatus !== 'Married Filing Jointly' && payload.maritalStatus !== 'Married Filing Separately') {
        payload.spouse = null as any;
      }
      if (!payload.hasDependents) {
        payload.dependents = [];
      }

      let res;
      if (isSubmit) {
        res = await apiDev2.post(`/doc/clients/${clientId}/tax-organizer/submit`, payload);
        showToast('Tax Organizer submitted successfully!', 'success');
        onClose();
      } else {
        if (existingId) {
          res = await apiDev2.put(`/doc/clients/${clientId}/tax-organizer`, payload);
        } else {
          res = await apiDev2.post(`/doc/clients/${clientId}/tax-organizer`, payload);
        }
        
        // Re-sync with backend to get correct IDs
        setExistingId(res.data.id);
        setStatus(res.data.status);
        setFormData({
          firstName: res.data.firstName || '',
          lastName: res.data.lastName || '',
          dateOfBirth: res.data.dateOfBirth || '',
          ssnItin: res.data.ssnItin || '',
          visaStatus: res.data.visaStatus || '',
          visaStatusChanged: res.data.visaStatusChanged || false,
          maritalStatus: res.data.maritalStatus || 'Single',
          currentAddress: res.data.currentAddress || '',
          emailAddress: res.data.emailAddress || '',
          phoneNumber: res.data.phoneNumber || '',
          occupation: res.data.occupation || '',
          statesLivedIn2026: res.data.statesLivedIn2026 || '',
          hasDependents: res.data.hasDependents || false,
          spouse: res.data.spouse || { ...initialSpouse },
          dependents: res.data.dependents || [],
        });
        
        setIsEditing(false); // Go back to read-only mode after explicit save
        showToast('Draft saved successfully!', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save data', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Make it read-only if it's submitted AND we are NOT in editing mode
  const isReadOnly = status === 'SUBMITTED' && !isEditing;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-[#1b2559] flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#5f41b2]" />
              Tax Organizer 
              {status === 'SUBMITTED' && !isEditing && <span className="ml-2 px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded-md">SUBMITTED</span>}
              {status === 'SUBMITTED' && isEditing && <span className="ml-2 px-2 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded-md">EDITING MODE</span>}
            </h3>
            <p className="text-sm text-gray-500 mt-1">Filling details for: <span className="font-bold">{clientName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
              <p className="text-sm font-semibold">Loading data...</p>
            </div>
          ) : (
            <div className="space-y-8 max-w-4xl mx-auto">
              
              {/* Primary Info */}
              <div className={`p-6 rounded-xl border shadow-sm transition-colors ${isReadOnly ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200'}`}>
                <h4 className="text-base font-bold text-[#1b2559] mb-4 border-b pb-2">Primary Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} disabled={isReadOnly} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-[#5f41b2] focus:border-[#5f41b2] disabled:bg-gray-100 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Last Name *</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} disabled={isReadOnly} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-[#5f41b2] focus:border-[#5f41b2] disabled:bg-gray-100 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Date of Birth *</label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} disabled={isReadOnly} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-[#5f41b2] focus:border-[#5f41b2] disabled:bg-gray-100 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">SSN / ITIN *</label>
                    <input type="text" name="ssnItin" value={formData.ssnItin} onChange={handleInputChange} disabled={isReadOnly} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-[#5f41b2] focus:border-[#5f41b2] disabled:bg-gray-100 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
                    <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} disabled={isReadOnly} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-[#5f41b2] focus:border-[#5f41b2] disabled:bg-gray-100 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                    <input type="email" name="emailAddress" value={formData.emailAddress} onChange={handleInputChange} disabled={isReadOnly} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-[#5f41b2] focus:border-[#5f41b2] disabled:bg-gray-100 disabled:text-gray-500" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Current Address *</label>
                    <input type="text" name="currentAddress" value={formData.currentAddress} onChange={handleInputChange} disabled={isReadOnly} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-[#5f41b2] focus:border-[#5f41b2] disabled:bg-gray-100 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Occupation *</label>
                    <input type="text" name="occupation" value={formData.occupation} onChange={handleInputChange} disabled={isReadOnly} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-[#5f41b2] focus:border-[#5f41b2] disabled:bg-gray-100 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Visa Status *</label>
                    <input type="text" name="visaStatus" value={formData.visaStatus} onChange={handleInputChange} disabled={isReadOnly} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-[#5f41b2] focus:border-[#5f41b2] disabled:bg-gray-100 disabled:text-gray-500" />
                  </div>
                  <div className="flex items-center mt-6">
                    <input type="checkbox" id="visaStatusChanged" name="visaStatusChanged" checked={formData.visaStatusChanged} onChange={handleInputChange} disabled={isReadOnly} className="w-4 h-4 text-[#5f41b2] rounded focus:ring-[#5f41b2] disabled:opacity-50" />
                    <label htmlFor="visaStatusChanged" className="ml-2 text-sm font-semibold text-gray-700">Visa Status Changed in 2026?</label>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">States Lived In (2026) *</label>
                    <input type="text" name="statesLivedIn2026" value={formData.statesLivedIn2026} onChange={handleInputChange} disabled={isReadOnly} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-[#5f41b2] focus:border-[#5f41b2] disabled:bg-gray-100 disabled:text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Marital Status *</label>
                    <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange} disabled={isReadOnly} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-[#5f41b2] focus:border-[#5f41b2] bg-white disabled:bg-gray-100 disabled:text-gray-500">
                      <option value="Single">Single</option>
                      <option value="Married Filing Jointly">Married Filing Jointly</option>
                      <option value="Married Filing Separately">Married Filing Separately</option>
                      <option value="Head of Household">Head of Household</option>
                      <option value="Qualifying Widow(er)">Qualifying Widow(er)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Spouse Info Conditional */}
              {(formData.maritalStatus === 'Married Filing Jointly' || formData.maritalStatus === 'Married Filing Separately') && (
                <div className={`p-6 rounded-xl border shadow-sm animate-in fade-in transition-colors ${isReadOnly ? 'bg-purple-50/20 border-purple-100/50' : 'bg-purple-50/50 border-purple-100'}`}>
                  <h4 className="text-base font-bold text-purple-900 mb-4 border-b border-purple-200 pb-2">Spouse Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
                      <input type="text" name="firstName" value={formData.spouse.firstName} onChange={handleSpouseChange} disabled={isReadOnly} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-[#5f41b2] disabled:bg-white/50 disabled:text-gray-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Middle Name</label>
                      <input type="text" name="middleName" value={formData.spouse.middleName} onChange={handleSpouseChange} disabled={isReadOnly} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-[#5f41b2] disabled:bg-white/50 disabled:text-gray-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Last Name *</label>
                      <input type="text" name="lastName" value={formData.spouse.lastName} onChange={handleSpouseChange} disabled={isReadOnly} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-[#5f41b2] disabled:bg-white/50 disabled:text-gray-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Date of Birth *</label>
                      <input type="date" name="dateOfBirth" value={formData.spouse.dateOfBirth} onChange={handleSpouseChange} disabled={isReadOnly} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-[#5f41b2] disabled:bg-white/50 disabled:text-gray-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">SSN / ITIN *</label>
                      <input type="text" name="ssnItin" value={formData.spouse.ssnItin} onChange={handleSpouseChange} disabled={isReadOnly} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-[#5f41b2] disabled:bg-white/50 disabled:text-gray-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Visa Status *</label>
                      <input type="text" name="visaStatus" value={formData.spouse.visaStatus} onChange={handleSpouseChange} disabled={isReadOnly} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-[#5f41b2] disabled:bg-white/50 disabled:text-gray-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Occupation *</label>
                      <input type="text" name="occupation" value={formData.spouse.occupation} onChange={handleSpouseChange} disabled={isReadOnly} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-[#5f41b2] disabled:bg-white/50 disabled:text-gray-500" />
                    </div>
                    <div className="flex items-center gap-4 mt-6 col-span-2">
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        <input type="checkbox" name="hasSsn" checked={formData.spouse.hasSsn} onChange={handleSpouseChange} disabled={isReadOnly} className="mr-2 w-4 h-4 text-[#5f41b2] rounded disabled:opacity-50" /> Has SSN
                      </label>
                      <label className="flex items-center text-sm font-semibold text-gray-700">
                        <input type="checkbox" name="hasItin" checked={formData.spouse.hasItin} onChange={handleSpouseChange} disabled={isReadOnly} className="mr-2 w-4 h-4 text-[#5f41b2] rounded disabled:opacity-50" /> Has ITIN
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Dependents Toggle */}
              <div className={`p-6 rounded-xl border shadow-sm transition-colors ${isReadOnly ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                  <h4 className="text-base font-bold text-[#1b2559]">Dependents</h4>
                  <div className="flex items-center">
                    <label className="text-sm font-bold text-gray-700 mr-3">Did you have any dependents in 2026?</label>
                    <input type="checkbox" name="hasDependents" checked={formData.hasDependents} onChange={handleInputChange} disabled={isReadOnly} className="w-5 h-5 text-[#5f41b2] rounded focus:ring-[#5f41b2] disabled:opacity-50" />
                  </div>
                </div>

                {formData.hasDependents && (
                  <div className="space-y-4 animate-in fade-in">
                    {formData.dependents.map((dep, index) => (
                      <div key={index} className={`p-4 border rounded-lg relative ${isReadOnly ? 'bg-gray-100/50 border-gray-200/50' : 'bg-gray-50 border-gray-200'}`}>
                        {!isReadOnly && (
                          <button onClick={() => removeDependent(index)} className="absolute top-3 right-3 text-rose-500 hover:bg-rose-100 p-1.5 rounded-md transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <h5 className="text-sm font-bold text-gray-700 mb-3">Dependent #{index + 1}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">First Name *</label>
                            <input type="text" name="firstName" value={dep.firstName} onChange={(e) => handleDependentChange(index, e)} disabled={isReadOnly} className="w-full px-2 py-1.5 border rounded text-xs disabled:bg-gray-100 disabled:text-gray-500" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">Last Name *</label>
                            <input type="text" name="lastName" value={dep.lastName} onChange={(e) => handleDependentChange(index, e)} disabled={isReadOnly} className="w-full px-2 py-1.5 border rounded text-xs disabled:bg-gray-100 disabled:text-gray-500" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">Date of Birth *</label>
                            <input type="date" name="dateOfBirth" value={dep.dateOfBirth} onChange={(e) => handleDependentChange(index, e)} disabled={isReadOnly} className="w-full px-2 py-1.5 border rounded text-xs disabled:bg-gray-100 disabled:text-gray-500" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">Relationship *</label>
                            <input type="text" name="relationship" value={dep.relationship} onChange={(e) => handleDependentChange(index, e)} disabled={isReadOnly} className="w-full px-2 py-1.5 border rounded text-xs disabled:bg-gray-100 disabled:text-gray-500" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">SSN/ITIN Status *</label>
                            <select name="ssnStatus" value={dep.ssnStatus} onChange={(e) => handleDependentChange(index, e)} disabled={isReadOnly} className="w-full px-2 py-1.5 border rounded text-xs bg-white disabled:bg-gray-100 disabled:text-gray-500">
                              <option value="SSN">Has SSN</option>
                              <option value="ITIN">Has ITIN</option>
                              <option value="NONE">No SSN/ITIN</option>
                            </select>
                          </div>
                          {dep.ssnStatus !== 'NONE' && (
                            <div>
                              <label className="block text-[11px] font-bold text-gray-600 mb-1">SSN/ITIN Number *</label>
                              <input type="text" name="ssnItin" value={dep.ssnItin} onChange={(e) => handleDependentChange(index, e)} disabled={isReadOnly} className="w-full px-2 py-1.5 border rounded text-xs disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                          )}
                          {dep.ssnStatus === 'NONE' && (
                            <div className="flex items-center mt-5">
                              <input type="checkbox" id={`itinApp-${index}`} name="itinApplicationRequired" checked={dep.itinApplicationRequired} onChange={(e) => handleDependentChange(index, e)} disabled={isReadOnly} className="w-3.5 h-3.5 text-[#5f41b2] rounded disabled:opacity-50" />
                              <label htmlFor={`itinApp-${index}`} className="ml-1.5 text-[11px] font-bold text-gray-700">W-7 Required?</label>
                            </div>
                          )}
                          <div className="flex items-center mt-5">
                            <input type="checkbox" id={`citizen-${index}`} name="usCitizenResident" checked={dep.usCitizenResident} onChange={(e) => handleDependentChange(index, e)} disabled={isReadOnly} className="w-3.5 h-3.5 text-[#5f41b2] rounded disabled:opacity-50" />
                            <label htmlFor={`citizen-${index}`} className="ml-1.5 text-[11px] font-bold text-gray-700">US Citizen/Resident?</label>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!isReadOnly && (
                      <button onClick={addDependent} className="flex items-center gap-1.5 text-sm font-bold text-[#5f41b2] hover:bg-purple-50 px-3 py-2 rounded-lg transition">
                        <UserPlus className="w-4 h-4" /> Add Dependent
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-white shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition">
            Close
          </button>
          
          {status === 'SUBMITTED' && !isEditing && (
            <button 
              onClick={() => setIsEditing(true)} 
              className="px-5 py-2.5 flex items-center gap-2 text-sm font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl transition"
            >
              <Edit className="w-4 h-4" />
              Edit Details
            </button>
          )}

          {!isReadOnly && (
            <>
              <button 
                onClick={() => handleSave(false)} 
                disabled={saving || loading}
                className="px-5 py-2.5 flex items-center gap-2 text-sm font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Draft
              </button>
              <button 
                onClick={() => handleSave(true)} 
                disabled={saving || loading}
                className="px-5 py-2.5 flex items-center gap-2 text-sm font-bold bg-[#5f41b2] text-white hover:bg-[#4d3396] rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit & Generate Document
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaxOrganizerModal;