// src/features/admin/AdminTickets.tsx
import React, { useState } from 'react';
import {
  Search,
  Plus,
  ChevronDown,
  MoreVertical,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TicketIcon,
  Download,
  Users,
  Calendar,
  Tag,
  Eye,
  Edit,
  Trash2,
  RefreshCw   // <-- added to fix the error
} from 'lucide-react';

interface Ticket {
  id: string;
  client: string;
  subject: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'High' | 'Medium' | 'Low';
  assignedTo: string;
  created: string;
  lastUpdate: string;
  category: string;
}

const AdminTickets: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

  // Mock ticket data
  const tickets: Ticket[] = [
    {
      id: 'TK-1042',
      client: 'Acme Corporation',
      subject: 'Unable to upload W-2 documents',
      status: 'Open',
      priority: 'High',
      assignedTo: 'Sarah Martins',
      created: '2026-08-22 09:30 AM',
      lastUpdate: '2 hours ago',
      category: 'Documentation'
    },
    {
      id: 'TK-1045',
      client: 'Stark Industries',
      subject: 'IRS e-filing rejection - Form 1040',
      status: 'In Progress',
      priority: 'High',
      assignedTo: 'John Doe',
      created: '2026-08-22 11:15 AM',
      lastUpdate: '1 hour ago',
      category: 'E-Filing'
    },
    {
      id: 'TK-1048',
      client: 'Wayne Enterprises',
      subject: 'Missing signature on tax return',
      status: 'In Progress',
      priority: 'Medium',
      assignedTo: 'Akin Siyan',
      created: '2026-08-21 02:45 PM',
      lastUpdate: '4 hours ago',
      category: 'Documentation'
    },
    {
      id: 'TK-1051',
      client: 'TechFlow LLC',
      subject: 'Request for tax extension',
      status: 'Resolved',
      priority: 'Low',
      assignedTo: 'Nimi Odu',
      created: '2026-08-20 10:00 AM',
      lastUpdate: '1 day ago',
      category: 'General'
    },
    {
      id: 'TK-1053',
      client: 'Bruce Banner Consulting',
      subject: 'Client dispute - Additional fees',
      status: 'Open',
      priority: 'High',
      assignedTo: 'Sarah Martins',
      created: '2026-08-23 08:20 AM',
      lastUpdate: '30 mins ago',
      category: 'Billing'
    },
    {
      id: 'TK-1056',
      client: 'Marvel Tech Inc.',
      subject: 'Quarterly tax filing review',
      status: 'Closed',
      priority: 'Medium',
      assignedTo: 'John Doe',
      created: '2026-08-18 01:30 PM',
      lastUpdate: '3 days ago',
      category: 'Review'
    },
    {
      id: 'TK-1058',
      client: 'Gotham Financial',
      subject: 'Missing 1099 forms for 2025',
      status: 'Open',
      priority: 'Medium',
      assignedTo: 'Akin Siyan',
      created: '2026-08-23 10:45 AM',
      lastUpdate: '15 mins ago',
      category: 'Documentation'
    },
  ];

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length,
    closed: tickets.filter(t => t.status === 'Closed').length,
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'Open': 'bg-blue-100 text-blue-700 border-blue-200',
      'In Progress': 'bg-amber-100 text-amber-700 border-amber-200',
      'Resolved': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Closed': 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      'High': 'bg-rose-100 text-rose-700 border-rose-200',
      'Medium': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Low': 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return styles[priority] || 'bg-gray-100 text-gray-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open': return <AlertCircle className="w-3.5 h-3.5" />;
      case 'In Progress': return <Clock className="w-3.5 h-3.5" />;
      case 'Resolved': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'Closed': return <XCircle className="w-3.5 h-3.5" />;
      default: return <AlertCircle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
            <TicketIcon className="w-7 h-7 text-[#5f41b2]" />
            Support Tickets
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Manage and track all client support requests
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 bg-[#5f41b2] hover:bg-[#4d3396] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95">
            <Plus className="w-4 h-4" />
            New Ticket
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 shrink-0 mb-6">
        <div className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <TicketIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total</p>
            <h3 className="text-2xl font-extrabold text-[#1b2559]">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Open</p>
            <h3 className="text-2xl font-extrabold text-[#1b2559]">{stats.open}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">In Progress</p>
            <h3 className="text-2xl font-extrabold text-[#1b2559]">{stats.inProgress}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Resolved</p>
            <h3 className="text-2xl font-extrabold text-[#1b2559]">{stats.resolved}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Closed</p>
            <h3 className="text-2xl font-extrabold text-[#1b2559]">{stats.closed}</h3>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between gap-4 shrink-0 mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets by client, subject, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5f41b2] transition-all cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5f41b2] transition-all cursor-pointer"
            >
              <option value="All">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#5f41b2] transition-colors bg-gray-50 hover:bg-[#5f41b2]/5 px-4 py-2.5 rounded-xl border border-gray-200">
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Ticket Table */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 sticky top-0 z-10">
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="p-3 rounded-tl-lg">Ticket ID</th>
                <th className="p-3">Client</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Status</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Assigned To</th>
                <th className="p-3">Last Update</th>
                <th className="p-3 text-right rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-blue-50/30 transition group cursor-pointer">
                  <td className="p-3 font-bold text-[#1b2559]">{ticket.id}</td>
                  <td className="p-3 font-semibold text-gray-700">{ticket.client}</td>
                  <td className="p-3 text-gray-600 max-w-[200px] truncate">{ticket.subject}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      {ticket.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getPriorityBadge(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">{ticket.assignedTo}</td>
                  <td className="p-3 text-gray-400 font-medium text-xs">{ticket.lastUpdate}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 text-sm">
                    No tickets match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Optional footer with pagination can be added here */}
      </div>
    </div>
  );
};

export default AdminTickets;