// src/features/documentation/DocTeamCallReports.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { useAuth } from '../../contexts/AuthContext';
import { 
  fetchTeamCallReport, 
  fetchEmployeeClientsReport, 
  fetchClientCallDetails,
  clearTeamReports
} from '../../store/slices/docClientsSlice';
import { 
  PhoneOutgoing, 
  Users, 
  CalendarDays, 
  Loader2, 
  X, 
  ChevronRight, 
  ChevronDown, 
  Clock, 
  CheckCircle2, 
  XCircle,
  PhoneIncoming
} from 'lucide-react';

const DocTeamCallReports: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { 
    teamCallReport, 
    employeeClientsReport, 
    clientCallDetails, 
    isTeamReportLoading, 
    isEmployeeClientsLoading, 
    isClientCallDetailsLoading 
  } = useSelector((state: RootState) => state.docClients);

  // Global Date Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal & Drill-down States
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: number; name: string; code: string } | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<number | null>(null);

  // Authorization Check
  const isDocLead = 
    (user?.role === 'TEAMLEAD' || user?.role === 'TEAM_LEAD') && 
    (user?.departmentName?.toUpperCase().includes('DOC') || user?.teamName?.toUpperCase().includes('DOC') || user?.team?.toUpperCase().includes('DOC'));

  useEffect(() => {
    if (isDocLead) {
      dispatch(fetchTeamCallReport());
    }
    return () => {
      dispatch(clearTeamReports());
    };
  }, [dispatch, isDocLead]);

  const handleSearch = () => {
    dispatch(fetchTeamCallReport({
      startDate: startDate || undefined,
      endDate: endDate || undefined
    }));
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    dispatch(fetchTeamCallReport());
  };

  const handleOpenEmployeeModal = (empId: number, name: string, code: string) => {
    setSelectedEmployee({ id: empId, name, code });
    setExpandedClientId(null);
    dispatch(fetchEmployeeClientsReport({
      employeeId: empId,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: 0,
      size: 50 // Default size to cover most clients in view
    }));
  };

  const handleCloseEmployeeModal = () => {
    setSelectedEmployee(null);
    setExpandedClientId(null);
  };

  const handleToggleClientDetails = (clientId: number) => {
    if (expandedClientId === clientId) {
      setExpandedClientId(null);
    } else {
      setExpandedClientId(clientId);
      dispatch(fetchClientCallDetails({
        employeeId: selectedEmployee!.id,
        clientId: clientId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: 0,
        size: 50
      }));
    }
  };

  const formatDuration = (seconds: number | null | undefined) => {
    if (seconds === null || seconds === undefined) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const renderStatus = (status: string | undefined) => {
    const s = (status || '').toUpperCase();
    if (s === 'SUCCESS' || s === 'ANSWERED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
          <CheckCircle2 className="w-3 h-3" /> {s || 'ANSWERED'}
        </span>
      );
    }
    if (s === 'INITIATED' || s === 'IN_PROGRESS' || s === 'RINGING') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
          <Clock className="w-3 h-3" /> {s}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100">
        <XCircle className="w-3 h-3" /> {s || 'FAILED'}
      </span>
    );
  };

  if (!isDocLead) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center font-sans">
        <XCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Unauthorized Access</h2>
        <p className="text-gray-500 mt-2">Only Documentation Team Leads can view this page.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      {/* Header & Global Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between shrink-0 mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
            <Users className="w-7 h-7 text-[#5f41b2]" />
            Team Call Reports
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Review call metrics and performance of your team members.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 flex-1 sm:flex-none min-w-[280px]">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] shadow-sm text-gray-600"
            />
            <span className="text-xs font-bold text-gray-400">TO</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] shadow-sm text-gray-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleSearch}
              className="flex-1 sm:flex-none bg-[#5f41b2] hover:bg-[#4d3396] text-white px-5 py-2 rounded-lg text-sm font-bold transition shadow-sm"
            >
              Search
            </button>
            <button
              onClick={handleReset}
              className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2 rounded-lg text-sm font-bold transition shadow-sm"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Level 1: Team Members Table */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2">
          {isTeamReportLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
              <p className="text-sm font-semibold">Loading team reports...</p>
            </div>
          ) : teamCallReport.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <Users className="w-12 h-12 opacity-20" />
              <p className="text-sm font-semibold">No team metrics found for this period.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 sticky top-0 z-10">
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-3">Employee</th>
                  <th className="p-3 text-center">Total Clients Called</th>
                  <th className="p-3 text-center">Total Calls Made</th>
                  <th className="p-3 text-center">Answered / Failed</th>
                  <th className="p-3 text-center">Total Talk Time</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teamCallReport.map((emp) => (
                  <tr key={emp.userId} className="hover:bg-blue-50/30 transition">
                    <td className="p-3">
                      <p className="font-bold text-[#1b2559]">{emp.employeeName}</p>
                      <p className="text-[11px] text-gray-500">{emp.employeeCode}</p>
                    </td>
                    <td className="p-3 text-center font-bold text-gray-700">{emp.totalClients}</td>
                    <td className="p-3 text-center font-bold text-[#5f41b2]">{emp.totalCalls}</td>
                    <td className="p-3 text-center">
                      <span className="text-emerald-600 font-bold">{emp.answeredCalls}</span> 
                      <span className="text-gray-300 mx-1">/</span> 
                      <span className="text-rose-600 font-bold">{emp.failedCalls}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 px-2.5 py-1.5 rounded-md text-xs font-bold border border-gray-200">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {formatDuration(emp.totalTalkTimeSeconds)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenEmployeeModal(emp.userId, emp.employeeName, emp.employeeCode)}
                        className="text-xs font-bold bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition"
                      >
                        View Clients
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Level 2 & 3: Employee Clients Modal & Call Details Drill-down */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
                  <PhoneOutgoing className="w-5 h-5 text-[#5f41b2]" />
                  Client Call Report - {selectedEmployee.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Code: {selectedEmployee.code} | Reviewing clients contacted by this agent.</p>
              </div>
              <button
                onClick={handleCloseEmployeeModal}
                className="p-2 bg-white border border-gray-200 rounded-full hover:bg-rose-50 hover:text-rose-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-2 bg-gray-50/30">
              {isEmployeeClientsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
                  <p className="text-sm font-semibold">Fetching client reports...</p>
                </div>
              ) : employeeClientsReport.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
                  <Users className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-semibold">No clients contacted by this employee.</p>
                </div>
              ) : (
                <div className="space-y-3 p-2">
                  {employeeClientsReport.map((client) => {
                    const isExpanded = expandedClientId === client.clientId;
                    return (
                      <div key={client.clientId} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all duration-200">
                        {/* Client Row */}
                        <div 
                          onClick={() => handleToggleClientDetails(client.clientId)}
                          className={`p-4 flex items-center justify-between cursor-pointer hover:bg-blue-50/30 transition ${isExpanded ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex-1">
                            <p className="font-bold text-[#1b2559]">{client.clientName}</p>
                            <p className="text-[11px] text-gray-500">ID: {client.clientId} | Ph: {client.phone}</p>
                          </div>
                          
                          <div className="flex-1 text-center">
                            <div className="flex items-center justify-center gap-4 text-xs font-semibold">
                              <span className="text-[#5f41b2]">{client.totalCalls} Calls</span>
                              <span className="text-emerald-600">{client.answeredCalls} Ans</span>
                              <span className="text-rose-600">{client.failedCalls} Fail</span>
                            </div>
                          </div>

                          <div className="flex-1 text-right flex items-center justify-end gap-4">
                            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {formatDuration(client.totalTalkTimeSeconds)}
                            </span>
                            <div className={`p-1.5 rounded-full transition-colors ${isExpanded ? 'bg-[#5f41b2] text-white' : 'bg-gray-100 text-gray-500'}`}>
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {/* Level 3: Expanded Call Details */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 bg-gray-50 p-4 animate-in slide-in-from-top-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <CalendarDays className="w-4 h-4" /> Detailed Call Logs
                            </h4>
                            
                            {isClientCallDetailsLoading ? (
                              <div className="flex items-center justify-center py-6 text-gray-400 gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-[#5f41b2]" />
                                <span className="text-xs font-semibold">Loading specific calls...</span>
                              </div>
                            ) : clientCallDetails.length === 0 ? (
                              <div className="text-center py-6 text-gray-400 text-xs font-medium">
                                No detailed logs found for this client.
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead className="text-gray-400 uppercase tracking-wider border-b border-gray-200">
                                    <tr>
                                      <th className="pb-2 font-bold">Date & Time</th>
                                      <th className="pb-2 font-bold text-center">Type</th>
                                      <th className="pb-2 font-bold text-center">Duration</th>
                                      <th className="pb-2 font-bold text-center">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {clientCallDetails.map((detail) => {
                                      const isIncoming = (detail.callType || '').toLowerCase() === 'incoming';
                                      return (
                                        <tr key={detail.callHistoryId} className="hover:bg-white transition">
                                          <td className="py-2.5 font-medium text-gray-700">
                                            {formatDate(detail.callTime || detail.startTime)}
                                          </td>
                                          <td className="py-2.5 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                              isIncoming ? 'text-purple-700 bg-purple-100' : 'text-blue-700 bg-blue-100'
                                            }`}>
                                              {isIncoming ? <PhoneIncoming className="w-2.5 h-2.5" /> : <PhoneOutgoing className="w-2.5 h-2.5" />}
                                              {detail.callType || 'Outgoing'}
                                            </span>
                                          </td>
                                          <td className="py-2.5 text-center font-semibold text-gray-600">
                                            {formatDuration(detail.durationSeconds)}
                                          </td>
                                          <td className="py-2.5 text-center">
                                            {renderStatus(detail.status)}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocTeamCallReports;