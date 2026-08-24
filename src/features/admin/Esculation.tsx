// src/features/admin/Esculation.tsx
import React, { useState } from 'react';
import {
  Search,
  Plus,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Download,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  User,
  Calendar,
  Tag,
  MoreVertical
} from 'lucide-react';

interface Escalation {
  id: string;
  client: string;
  issue: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  assignedTo: string;
  created: string;
  lastUpdate: string;
  category: string;
}

const Esculation: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

  // Mock escalations data
  const escalations: Escalation[] = [
    {
      id: 'ESC-001',
      client: 'Acme Corp',
      issue: 'IRS audit notice - missing 1099',
      status: 'Open',
      priority: 'Critical',
      assignedTo: 'Sarah Martins',
      created: '2026-08-23 08:30 AM',
      lastUpdate: '1 hour ago',
      category: 'Audit'
    },
    {
      id: 'ESC-002',
      client: 'Stark Industries',
      issue: 'Client dispute over tax liability',
      status: 'In Progress',
      priority: 'High',
      assignedTo: 'John Doe',
      created: '2026-08-22 02:15 PM',
      lastUpdate: '3 hours ago',
      category: 'Dispute'
    },
    {
      id: 'ESC-003',
      client: 'Wayne Enterprises',
      issue: 'Missing signature on Form 8879',
      status: 'In Progress',
      priority: 'Medium',
      assignedTo: 'Akin Siyan',
      created: '2026-08-21 11:00 AM',
      lastUpdate: '5 hours ago',
      category: 'Documentation'
    },
    {
      id: 'ESC-004',
      client: 'TechFlow LLC',
      issue: 'System error during e-filing transmission',
      status: 'Resolved',
      priority: 'High',
      assignedTo: 'Nimi Odu',
      created: '2026-08-20 09:45 AM',
      lastUpdate: '1 day ago',
      category: 'Technical'
    },
    {
      id: 'ESC-005',
      client: 'Gotham Financial',
      issue: 'Client requested escalation to senior review',
      status: 'Open',
      priority: 'Medium',
      assignedTo: 'Sarah Martins',
      created: '2026-08-23 10:20 AM',
      lastUpdate: '30 mins ago',
      category: 'Review'
    },
    {
      id: 'ESC-006',
      client: 'Marvel Tech Inc.',
      issue: 'Payment processing failure',
      status: 'Closed',
      priority: 'Critical',
      assignedTo: 'John Doe',
      created: '2026-08-19 03:00 PM',
      lastUpdate: '2 days ago',
      category: 'Billing'
    },
    {
      id: 'ESC-007',
      client: 'Bruce Banner Consulting',
      issue: 'Incorrect calculation on tax return',
      status: 'Open',
      priority: 'High',
      assignedTo: 'Akin Siyan',
      created: '2026-08-23 07:50 AM',
      lastUpdate: '4 hours ago',
      category: 'Calculation'
    },
  ];

  const stats = {
    total: escalations.length,
    open: escalations.filter(e => e.status === 'Open').length,
    inProgress: escalations.filter(e => e.status === 'In Progress').length,
    resolved: escalations.filter(e => e.status === 'Resolved').length,
    closed: escalations.filter(e => e.status === 'Closed').length,
  };

  const filtered = escalations.filter(item => {
    const matchSearch = item.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchPriority = priorityFilter === 'All' || item.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
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
      'Critical': 'bg-rose-200 text-rose-800 border-rose-300',
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
            <AlertTriangle className="w-7 h-7 text-[#e11d48]" />
            Escalations
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Track and manage critical client escalations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 bg-[#e11d48] hover:bg-[#be123c] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95">
            <Plus className="w-4 h-4" />
            New Escalation
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4 shrink-0 mb-6">
        <div className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
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
              placeholder="Search escalations by client, issue, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e11d48] focus:border-transparent transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#e11d48] transition-all cursor-pointer"
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
              className="appearance-none pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#e11d48] transition-all cursor-pointer"
            >
              <option value="All">All Priority</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#e11d48] transition-colors bg-gray-50 hover:bg-rose-50/50 px-4 py-2.5 rounded-xl border border-gray-200">
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Escalations Table */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 sticky top-0 z-10">
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="p-3 rounded-tl-lg">ID</th>
                <th className="p-3">Client</th>
                <th className="p-3">Issue</th>
                <th className="p-3">Status</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Assigned To</th>
                <th className="p-3">Last Update</th>
                <th className="p-3 text-right rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-rose-50/30 transition group cursor-pointer">
                  <td className="p-3 font-bold text-[#1b2559]">{item.id}</td>
                  <td className="p-3 font-semibold text-gray-700">{item.client}</td>
                  <td className="p-3 text-gray-600 max-w-[200px] truncate">{item.issue}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(item.status)}`}>
                      {getStatusIcon(item.status)}
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getPriorityBadge(item.priority)}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">{item.assignedTo}</td>
                  <td className="p-3 text-gray-400 font-medium text-xs">{item.lastUpdate}</td>
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 text-sm">
                    No escalations match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Esculation;