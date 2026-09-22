// src/features/admin/chat/AdminChatMonitor.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import {
  fetchAdminChatEmployees,
  fetchAdminEmployeeConversations,
  fetchAdminDirectMessages,
  fetchAdminGroupMessages,
  setSelectedEmployee,
  setSelectedPartner,
  clearAdminChat,
  AdminChatEmployee,
  AdminChatConversation,
  AdminChatMessage,
} from '../../../store/slices/adminChatSlice';
import {
  Users,
  MessageSquare,
  Loader2,
  Circle,
  Search,
  User,
  Users as UsersIcon,
  RefreshCw,
  AlertCircle,
  Info,
  FileText,
  Download,
  ExternalLink,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import api from '../../../services/api';

// ============================================================
// READ-ONLY MESSAGE BUBBLE
// ============================================================
interface MessageBubbleProps {
  message: AdminChatMessage;
  isFromSelectedEmployee: boolean;
  selectedEmployeeName: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isFromSelectedEmployee,
  selectedEmployeeName,
}) => {
  const isDeleted = message.isDeleted || message.content === 'This message was deleted';

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!message.fileUrl) return;
    try {
      let cleanUrl = message.fileUrl;
      if (cleanUrl.startsWith('http')) {
        cleanUrl = new URL(cleanUrl).pathname;
      }
      if (cleanUrl.startsWith('/api')) {
        cleanUrl = cleanUrl.substring(4);
      }
      if (!cleanUrl.startsWith('/')) cleanUrl = '/' + cleanUrl;

      const response = await api.get(
        `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}download=true`,
        { responseType: 'blob' }
      );
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', message.fileName || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!message.fileUrl) return;
    let cleanUrl = message.fileUrl;
    if (cleanUrl.startsWith('http')) cleanUrl = new URL(cleanUrl).pathname;
    if (cleanUrl.startsWith('/api')) cleanUrl = cleanUrl.substring(4);
    if (!cleanUrl.startsWith('/')) cleanUrl = '/' + cleanUrl;
    window.open(cleanUrl, '_blank');
  };

  return (
    <div
      className={`flex flex-col ${
        isFromSelectedEmployee ? 'items-end' : 'items-start'
      } mb-3`}
    >
      {/* Sender Name */}
      <span className="text-[10px] font-bold text-slate-400 mb-0.5 px-1">
        {message.senderName}
        {isFromSelectedEmployee && (
          <span className="ml-1.5 text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
            (viewing)
          </span>
        )}
      </span>

      {/* Bubble */}
      <div
        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm shadow-sm break-words whitespace-pre-wrap ${
          isDeleted
            ? 'bg-transparent border border-gray-200 text-gray-500 rounded-2xl italic'
            : isFromSelectedEmployee
            ? 'bg-[#5f41b2] text-white rounded-br-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
        }`}
      >
        {isDeleted ? (
          <span className="text-xs opacity-70">This message was deleted</span>
        ) : (
          <>
            {message.isForwarded && (
              <div
                className={`flex items-center gap-1 text-[9px] italic opacity-80 mb-1 ${
                  isFromSelectedEmployee ? 'text-blue-100' : 'text-gray-400'
                }`}
              >
                <Info className="w-3 h-3" /> Forwarded
              </div>
            )}

            {message.replyToMessage && (
              <div
                className={`mb-1.5 p-1.5 rounded text-[10px] border-l-4 flex flex-col overflow-hidden ${
                  isFromSelectedEmployee
                    ? 'bg-white/20 border-white text-white'
                    : 'bg-black/5 border-[#5f41b2] text-gray-700'
                }`}
              >
                <span className="font-bold truncate">
                  {message.replyToMessage.senderName}
                </span>
                <span className="truncate opacity-90">
                  {message.replyToMessage.content || 'Attachment'}
                </span>
              </div>
            )}

            <div>{message.content}</div>

            {message.fileUrl && (
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={handlePreview}
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded ${
                    isFromSelectedEmployee
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'bg-white text-[#5f41b2] border border-[#5f41b2]/20 hover:bg-[#5f41b2]/5'
                  }`}
                >
                  <ExternalLink className="w-3 h-3" /> Preview
                </button>
                <button
                  onClick={handleDownload}
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded ${
                    isFromSelectedEmployee
                      ? 'bg-white text-[#5f41b2] hover:bg-gray-50'
                      : 'bg-[#5f41b2] text-white hover:bg-[#4d3396]'
                  }`}
                >
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Timestamp */}
      <span className="text-[10px] text-slate-400 font-medium mt-0.5 px-1">
        {message.timestamp
          ? new Date(message.timestamp).toLocaleString([], {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: 'short',
            })
          : ''}
        {message.isEdited && !isDeleted && (
          <span className="italic ml-1">(edited)</span>
        )}
      </span>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const AdminChatMonitor: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    employees,
    isLoadingEmployees,
    selectedEmployee,
    conversations,
    isLoadingConversations,
    selectedPartner,
    messages,
    isLoadingMessages,
    messagesPage,
    hasMoreMessages,
    totalMessages,
    error,
  } = useSelector((state: RootState) => state.adminChat);

  const [employeeSearch, setEmployeeSearch] = useState('');
  const [partnerSearch, setPartnerSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // -------- Load employees on mount (STEP 1) --------
  useEffect(() => {
    dispatch(fetchAdminChatEmployees());
    return () => {
      dispatch(clearAdminChat());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------- Scroll to bottom when messages load --------
  useEffect(() => {
    if (messages.length > 0 && messagesPage === 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages.length, messagesPage]);

  // -------- STEP 2: Click employee --------
  const handleEmployeeClick = (employee: AdminChatEmployee) => {
    dispatch(setSelectedEmployee(employee));
    dispatch(fetchAdminEmployeeConversations(employee.id));
  };

  // -------- STEP 3: Click partner --------
  const handlePartnerClick = (partner: AdminChatConversation) => {
    if (!selectedEmployee) return;

    const partnerObj = {
      id: partner.id,
      name: partner.name,
      type: partner.type,
    };
    dispatch(setSelectedPartner(partnerObj));

    if (partner.type === 'GROUP') {
      dispatch(
        fetchAdminGroupMessages({
          groupId: partner.id,
          page: 0,
          size: 50,
        })
      );
    } else {
      dispatch(
        fetchAdminDirectMessages({
          employeeId: selectedEmployee.id,
          partnerId: partner.id,
          page: 0,
          size: 50,
        })
      );
    }
  };

  // -------- Load more (older messages) --------
  const handleLoadMore = () => {
    if (!selectedEmployee || !selectedPartner) return;
    const nextPage = messagesPage + 1;

    if (selectedPartner.type === 'GROUP') {
      dispatch(
        fetchAdminGroupMessages({
          groupId: selectedPartner.id,
          page: nextPage,
          size: 50,
        })
      );
    } else {
      dispatch(
        fetchAdminDirectMessages({
          employeeId: selectedEmployee.id,
          partnerId: selectedPartner.id,
          page: nextPage,
          size: 50,
        })
      );
    }
  };

  // -------- Filter lists --------
  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      (e.departmentName || '')
        .toLowerCase()
        .includes(employeeSearch.toLowerCase()) ||
      (e.roleName || '').toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(partnerSearch.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden bg-slate-50">
      {/* ============== TOP HEADER ============== */}
      <div className="shrink-0 mb-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#5f41b2]/10 rounded-xl border border-[#5f41b2]/20">
              <ShieldCheck className="w-5 h-5 text-[#5f41b2]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#1b2559] tracking-tight leading-none">
                Chat Monitor
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Read-only view of all employee conversations
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch(fetchAdminChatEmployees())}
            disabled={isLoadingEmployees}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isLoadingEmployees ? 'animate-spin text-[#5f41b2]' : ''
              }`}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* ============== 3-COLUMN LAYOUT ============== */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-3">
        {/* ---------- COLUMN 1: EMPLOYEES ---------- */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col min-h-0 overflow-hidden">
          <div className="p-3 border-b border-slate-100 shrink-0 bg-slate-50/50">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#5f41b2]" />
              <h2 className="text-xs font-bold text-[#1b2559] uppercase tracking-wider">
                Employees ({filteredEmployees.length})
              </h2>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#5f41b2]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">
            {isLoadingEmployees && employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#5f41b2]" />
                <p className="text-xs font-semibold">Loading employees...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-1 py-12">
                <Users className="w-8 h-8 opacity-20" />
                <p className="text-xs font-semibold">No employees found</p>
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const isSelected = selectedEmployee?.id === emp.id;
                return (
                  <button
                    key={emp.id}
                    onClick={() => handleEmployeeClick(emp)}
                    className={`w-full text-left p-2.5 rounded-xl mb-1 flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#5f41b2] text-white shadow-sm'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-[#5f41b2]/10 text-[#5f41b2]'
                        }`}
                      >
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <Circle
                        className={`w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 fill-current ${
                          emp.isOnline
                            ? 'text-emerald-500'
                            : isSelected
                            ? 'text-white/40'
                            : 'text-gray-300'
                        }`}
                        strokeWidth={0}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-bold truncate ${
                          isSelected ? 'text-white' : 'text-slate-800'
                        }`}
                      >
                        {emp.name}
                      </p>
                      <p
                        className={`text-[10px] font-medium truncate ${
                          isSelected ? 'text-purple-100' : 'text-slate-400'
                        }`}
                      >
                        {emp.departmentName || '—'} • {emp.roleName || '—'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ---------- COLUMN 2: CONVERSATIONS ---------- */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col min-h-0 overflow-hidden">
          <div className="p-3 border-b border-slate-100 shrink-0 bg-slate-50/50">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-[#5f41b2]" />
              <h2 className="text-xs font-bold text-[#1b2559] uppercase tracking-wider truncate">
                {selectedEmployee
                  ? `${selectedEmployee.name.split(' ')[0]}'s Chats (${filteredConversations.length})`
                  : 'Conversations'}
              </h2>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={partnerSearch}
                onChange={(e) => setPartnerSearch(e.target.value)}
                disabled={!selectedEmployee}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#5f41b2] disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">
            {!selectedEmployee ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-12 px-3 text-center">
                <User className="w-10 h-10 opacity-20" />
                <p className="text-xs font-semibold">
                  Select an employee to view their chats
                </p>
              </div>
            ) : isLoadingConversations ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#5f41b2]" />
                <p className="text-xs font-semibold">Loading chats...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-1 py-12 px-3 text-center">
                <MessageSquare className="w-8 h-8 opacity-20" />
                <p className="text-xs font-semibold">No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedPartner?.id === conv.id;
                const isGroup = conv.type === 'GROUP';
                return (
                  <button
                    key={`${conv.type}-${conv.id}`}
                    onClick={() => handlePartnerClick(conv)}
                    className={`w-full text-left p-2.5 rounded-xl mb-1 flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#5f41b2] text-white shadow-sm'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {isGroup ? (
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-indigo-100 text-indigo-600'
                          }`}
                        >
                          <UsersIcon className="w-4 h-4" />
                        </div>
                      ) : (
                        <>
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-emerald-100 text-emerald-600'
                            }`}
                          >
                            {conv.name.charAt(0).toUpperCase()}
                          </div>
                          <Circle
                            className={`w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 fill-current ${
                              conv.isOnline
                                ? 'text-emerald-500'
                                : isSelected
                                ? 'text-white/40'
                                : 'text-gray-300'
                            }`}
                            strokeWidth={0}
                          />
                        </>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-bold truncate ${
                          isSelected ? 'text-white' : 'text-slate-800'
                        }`}
                      >
                        {conv.name}
                      </p>
                      <p
                        className={`text-[10px] font-medium truncate ${
                          isSelected ? 'text-purple-100' : 'text-slate-400'
                        }`}
                      >
                        {isGroup ? 'Group chat' : 'Direct message'}
                        {conv.updatedAt && (
                          <>
                            {' • '}
                            {new Date(conv.updatedAt).toLocaleDateString()}
                          </>
                        )}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white text-[#5f41b2]'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ---------- COLUMN 3: CHAT MESSAGES ---------- */}
        <div className="col-span-12 md:col-span-4 lg:col-span-6 bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col min-h-0 overflow-hidden">
          {!selectedPartner ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 p-6 text-center">
              <MessageSquare className="w-14 h-14 opacity-20" />
              <p className="text-sm font-bold text-slate-600">
                Select a conversation to view messages
              </p>
              <p className="text-xs text-slate-400">
                Choose an employee on the left, then pick a chat
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="shrink-0 px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <div className="relative shrink-0">
                  {selectedPartner.type === 'GROUP' ? (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <UsersIcon className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">
                      {selectedPartner.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-[#1b2559] truncate">
                    {selectedPartner.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedPartner.type === 'GROUP'
                      ? 'Group conversation'
                      : 'Direct conversation'}{' '}
                    • {totalMessages} message{totalMessages === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="shrink-0 text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                  READ-ONLY
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50/30 [scrollbar-width:thin]">
                {hasMoreMessages && messages.length > 0 && (
                  <div className="flex justify-center mb-3">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMessages}
                      className="text-[11px] font-bold text-[#5f41b2] bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {isLoadingMessages ? (
                        <>
                          <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                          Loading...
                        </>
                      ) : (
                        'Load older messages'
                      )}
                    </button>
                  </div>
                )}

                {isLoadingMessages && messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[#5f41b2]" />
                    <p className="text-xs font-semibold">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-12">
                    <MessageSquare className="w-10 h-10 opacity-20" />
                    <p className="text-xs font-semibold">
                      No messages in this conversation
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isFromSelectedEmployee={
                        !!selectedEmployee && msg.senderId === selectedEmployee.id
                      }
                      selectedEmployeeName={selectedEmployee?.name || ''}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatMonitor;