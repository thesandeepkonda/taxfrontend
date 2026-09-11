// src/features/leave/LeaveManagement.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchMyLeaveRequests, createLeaveRequest } from '../../store/slices/leaveSlice';
import { useToast } from '../../contexts/ToastContext';
import { CalendarDays, Plus, X, Loader2, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';

const LeaveManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  
  const { myLeaves, loading } = useSelector((state: RootState) => state.leave);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    leaveType: 'CASUAL',
    fromDate: '',
    toDate: '',
    description: ''
  });

  useEffect(() => {
    dispatch(fetchMyLeaveRequests());
  }, [dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fromDate || !formData.toDate) {
      showToast('Please select both From and To dates', 'warning');
      return;
    }

    if (new Date(formData.fromDate) > new Date(formData.toDate)) {
      showToast('From Date cannot be later than To Date', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(createLeaveRequest(formData)).unwrap();
      showToast('Leave request submitted successfully!', 'success');
      setIsModalOpen(false);
      setFormData({ leaveType: 'CASUAL', fromDate: '', toDate: '', description: '' });
      dispatch(fetchMyLeaveRequests()); // Refresh the list
    } catch (error: any) {
      showToast(error || 'Failed to submit leave request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3"/> Approved</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1 w-max"><XCircle className="w-3 h-3"/> Rejected</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1 w-max"><Clock className="w-3 h-3"/> Pending</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-gray-100 text-gray-600 flex items-center gap-1 w-max">{status}</span>;
    }
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden relative">
      
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
            <CalendarDays className="w-7 h-7 text-[#5f41b2]" />
            Leave Management
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Track and manage your time off</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#5f41b2] hover:bg-[#4d3396] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Apply Leave
        </button>
      </div>

      {/* Leave History Table */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0 bg-gray-50/50">
          <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#5f41b2]" /> My Leave Requests
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {loading && myLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
              <p className="text-sm font-semibold">Loading leaves...</p>
            </div>
          ) : myLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 p-8 text-center">
              <CalendarDays className="w-12 h-12 opacity-20 mb-2" />
              <p className="text-sm font-semibold">No leave requests found.</p>
              <p className="text-xs mt-1">When you apply for leave, it will show up here.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 sticky top-0 z-10">
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-3 rounded-tl-lg">Leave Type</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3 text-center">Days</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Applied On</th>
                  <th className="p-3 rounded-tr-lg">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myLeaves.map((leave) => (
                  <tr key={leave.leaveId} className="hover:bg-blue-50/30 transition group">
                    <td className="p-3">
                      <span className="font-bold text-[#1b2559]">{leave.leaveType.replace('_', ' ')}</span>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-gray-700">{new Date(leave.fromDate).toLocaleDateString()}</p>
                      <p className="text-[11px] text-gray-500">To: {new Date(leave.toDate).toLocaleDateString()}</p>
                    </td>
                    <td className="p-3 text-center font-bold text-[#1b2559]">
                      {leave.totalDays}
                    </td>
                    <td className="p-3">
                      {getStatusBadge(leave.status)}
                    </td>
                    <td className="p-3 text-gray-500 font-medium text-xs">
                      {new Date(leave.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-gray-600 text-xs max-w-[200px] truncate" title={leave.adminRemark || leave.description}>
                      {leave.adminRemark ? (
                        <span className="text-rose-600 font-semibold">Admin: {leave.adminRemark}</span>
                      ) : (
                        <span>{leave.description || '-'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border-t-4 border-[#5f41b2]">
            <div className="flex justify-between items-start p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-[#1b2559] flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-[#5f41b2]" />
                  Request Leave
                </h3>
                <p className="text-sm text-gray-500 mt-1">Fill in the details for your time off.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition bg-white p-1.5 rounded-lg border border-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Leave Type</label>
                <select 
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5f41b2] bg-white text-sm font-medium"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="EARNED">Earned Leave</option>
                  <option value="COMP_OFF">Comp Off</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="PATERNITY">Paternity Leave</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">From Date</label>
                  <input 
                    type="date" 
                    name="fromDate"
                    value={formData.fromDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5f41b2] text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">To Date</label>
                  <input 
                    type="date" 
                    name="toDate"
                    value={formData.toDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5f41b2] text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Reason / Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3} 
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5f41b2] resize-none text-sm"
                  placeholder="Briefly describe the reason for your leave..."
                  required
                />
              </div>

              <div className="pt-4 mt-2">
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#5f41b2] text-white font-bold text-sm py-3 rounded-xl hover:bg-[#4d3396] transition shadow-sm disabled:opacity-70"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LeaveManagement;