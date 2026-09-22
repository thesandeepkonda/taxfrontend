// src/components/layout/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { changePassword } from '../../store/slices/usersSlice';
import { useToast } from '../../contexts/ToastContext';
import {
  Home, Users, FileText, Calendar as CalendarIcon, BarChart2, Bell, Settings,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, LogOut,
  CheckSquare, FolderCheck, Calculator, AlertCircle, CreditCard, Send, X,
  Eye, Shield, Clock, CalendarDays, Lock, EyeOff, Loader2, PhoneOutgoing,
  MessageSquare
} from 'lucide-react';
import logo from '../../assets/logo.png';

type SubItem = { name: string; path: string };
type NavItem = { id: string; name: string; path?: string; icon: React.ElementType; subItems?: SubItem[] };
type NavSection = { title: string; items: NavItem[] };

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed } = useSidebar();
  const dispatch = useDispatch<AppDispatch>();

  // Change Password State
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [cpCurrentPassword, setCpCurrentPassword] = useState('');
  const [cpNewPassword, setCpNewPassword] = useState('');
  const [cpConfirmPassword, setCpConfirmPassword] = useState('');
  const [cpShowPassword, setCpShowPassword] = useState(false);
  const [cpLoading, setCpLoading] = useState(false);
  const [cpError, setCpError] = useState<string | null>(null);

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('sidebarState');
      const defaultMenus = {
        income: true,
        audience: false,
        settings: true,
        teams: true,
        leads: true,
        prep_tasks: true,
        estimations: true,
        payments: true,
        filings: true,
        approvals: true,
        dept_menu: false,
        view_data: false,
        security: false,
        crm: false,
        leave_approvals: false
      };
      return stored ? JSON.parse(stored).openMenus || defaultMenus : defaultMenus;
    } catch {
      return {
        income: true, audience: false, settings: true, teams: true,
        leads: true, prep_tasks: true, estimations: true, payments: true,
        filings: true, approvals: true, dept_menu: false, view_data: false,
        security: false, crm: false, leave_approvals: false
      };
    }
  });

  useEffect(() => {
    localStorage.setItem(
      'sidebarState',
      JSON.stringify({ isSidebarOpen: !isCollapsed, openMenus })
    );
  }, [isCollapsed, openMenus]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname, setIsMobileOpen]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      logout();
      navigate('/login');
    }
  };

  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpError(null);

    if (!cpCurrentPassword || !cpNewPassword || !cpConfirmPassword) {
      setCpError('All fields are required');
      return;
    }
    if (cpNewPassword.length < 8) {
      setCpError('New password must be at least 8 characters');
      return;
    }
    if (cpNewPassword !== cpConfirmPassword) {
      setCpError('New password and confirm password do not match');
      return;
    }

    setCpLoading(true);
    try {
      await dispatch(changePassword({
        currentPassword: cpCurrentPassword,
        newPassword: cpNewPassword,
        confirmPassword: cpConfirmPassword,
      })).unwrap();

      showToast('Password changed successfully! Please login again.', 'success');
      
      // Logout and redirect to login page
      logout();
      navigate('/login');
      setShowChangePassword(false);
    } catch (err: any) {
      const errorMsg = err || 'Failed to change password. Please try again.';
      setCpError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setCpLoading(false);
    }
  };

  const getDocumentationWorkspace = () => ({
    id: 'leads', name: 'Lead Management', icon: Users,
    subItems: [
      { name: 'Assigned Leads', path: '/leads/assigned' },
      { name: 'Interested', path: '/leads/interested' },
      { name: 'Not Interested', path: '/leads/not-interested' },
      { name: 'Follow-ups', path: '/leads/follow-ups' },
      { name: 'Call Back', path: '/leads/call-back' },
      { name: 'Not Lifted', path: '/leads/not-lifted' },
      { name: 'Completed / OK', path: '/leads/completed' },
      { name: 'Call History', path: '/leads/calls' }
    ]
  });

  const getClientDocsWorkspace = () => ({
    id: 'docs', name: 'Client Documents', icon: FolderCheck,
    subItems: [
      { name: 'Pending Uploads', path: '/docs/pending' },
      { name: 'Verified Files', path: '/docs/verified' }
    ]
  });

  const getPreparationWorkspace = () => ({
    id: 'prep_tasks', name: 'Tax Preparation', icon: Calculator,
    subItems: [
      { name: 'Assigned Tasks', path: '/prep/assigned' },
      { name: 'Ready for Review', path: '/prep/review' }
    ]
  });

  const getEstimationWorkspace = () => ({
    id: 'estimations', name: 'Tax Estimates', icon: FileText,
    subItems: [
      { name: 'Pending Estimates', path: '/estimation/pending' },
      { name: 'Sent to Client', path: '/estimation/sent' }
    ]
  });

  const getPaymentsWorkspace = () => ({
    id: 'payments', name: 'Invoices', icon: CreditCard,
    subItems: [
      { name: 'Awaiting Payment', path: '/payments/pending' },
      { name: 'Completed', path: '/payments/completed' }
    ]
  });

  const getEfilingWorkspace = () => ({
    id: 'filings', name: 'E-Filing Queue', icon: Send,
    subItems: [
      { name: 'Ready to Transmit', path: '/transmit/ready' },
      { name: 'IRS Rejected', path: '/transmit/rejected' },
      { name: 'Accepted', path: '/transmit/accepted' }
    ]
  });

  let menuSections: NavSection[] = [];

  if (user?.role === 'ADMIN') {
    menuSections = [
      {
        title: 'Main',
        items: [
          { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: Home },
          // ✅ NEW: Admin Chat Monitor
          { id: 'view-chats', name: 'View Chats', path: '/admin/view-chats', icon: Eye },
          // ✅ Chat Option for Admin
          { id: 'chat', name: 'Chat Workspace', path: '/chat', icon: MessageSquare },
          {
            id: 'posts', name: 'Post', icon: FileText,
            subItems: [
              { name: 'Upload Excel Data', path: '/admin/postexcel' },
              { name: 'Create Department', path: '/admin/post-departments' },
              { name: 'Create Team', path: '/admin/post-teams' },
              { name: 'Create Role', path: '/admin/post-roles' },
              { name: 'Create Employee', path: '/admin/post-employees' },
              { name: 'Bulk Create Employee', path: '/admin/bulk-post-employees' }
            ]
          },
          {
            id: 'view_data', name: 'View Data', icon: Eye,
            subItems: [
              { name: 'View Departments', path: '/admin/view-departments' },
              { name: 'View Teams', path: '/admin/view-teams' },
              { name: 'View Employees', path: '/admin/view-employees' },
              { name: 'View Attendance', path: '/admin/view-attendance' }
            ]
          },
          { id: 'leave-approvals', name: 'Leave Approvals', path: '/admin/leave-approvals', icon: Clock },
          { id: 'schedules', name: 'Schedules', path: '/admin/schedules', icon: CalendarIcon },
          {
            id: 'income', name: 'Income', icon: BarChart2,
            subItems: [
              { name: 'Earnings', path: '/earnings' },
              { name: 'Refunds', path: '/refunds' },
              { name: 'Declines', path: '/declines' },
              { name: 'Payouts', path: '/payouts' }
            ]
          }
        ]
      },
      {
        title: 'Access Control',
        items: [
          {
            id: 'security', name: 'Roles & Permissions', icon: Shield,
            subItems: [
              { name: 'View Roles', path: '/admin/view-roles' },
            ]
          }
        ]
      },
      {
        title: 'CRM',
        items: [
          {
            id: 'crm', name: 'Client Management', icon: Users,
            subItems: [
              { name: 'Clients', path: '/admin/crm/clients' },
              { name: 'Calls', path: '/admin/crm/calls' },
              { name: 'Reports', path: '/admin/crm/reports' },
              { name: 'Comments', path: '/admin/crm/comments' },
              { name: 'Documents', path: '/admin/crm/documents' },
            ]
          }
        ]
      },
      {
        title: 'Settings',
        items: [
          { id: 'notifications', name: 'Notification', path: '/notifications', icon: Bell },
          {
            id: 'settings', name: 'Settings', icon: Settings,
            subItems: [
              { name: 'General', path: '/general-settings' },
              { name: 'Account & Security', path: '/security-settings' }
            ]
          }
        ]
      }
    ];
  } else {
    const departmentName = user?.departmentName || user?.team || 'NONE';
    const deptName = departmentName?.toUpperCase()?.trim() || '';
    
    let specificWorkspaceItems: NavItem[] = [];
    let teamManagementItems: NavItem[] = [];

    if (user?.role === 'TEAMLEAD' || user?.role === 'TEAM_LEAD') {
      teamManagementItems = [
        { id: 'dashboard', name: 'TL Dashboard', path: '/dashboard', icon: Home },
        { id: 'chat', name: 'Chat Workspace', path: '/chat', icon: MessageSquare },
        { id: 'events', name: 'Events', path: '/events', icon: CalendarIcon },
        { id: 'leaves', name: 'Leave Management', path: '/leaves', icon: CalendarDays },
        {
          id: 'team', name: 'My Team', icon: Users,
          subItems: [
            { name: 'Roster Overview', path: '/team-roster' },
            { name: 'Performance Metrics', path: '/team-metrics' }
          ]
        },
        { id: 'schedules', name: 'Team Schedules', path: '/schedules', icon: CalendarIcon }
      ];

      if (deptName.includes('DOC')) {
        teamManagementItems.push({
          id: 'team_calls',
          name: 'Team Call Reports',
          path: '/docs/team-calls',
          icon: PhoneOutgoing
        });
      }
    } else {
      teamManagementItems = [
        { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: Home },
        { id: 'chat', name: 'Chat Workspace', path: '/chat', icon: MessageSquare },
        { id: 'events', name: 'Events', path: '/events', icon: CalendarIcon },
        { id: 'leaves', name: 'Leave Management', path: '/leaves', icon: CalendarDays }
      ];
    }

    if (deptName.includes('DOCUMENTATION')) {
      specificWorkspaceItems = [getDocumentationWorkspace(), getClientDocsWorkspace()];
    } else if (deptName.includes('PREPARATION')) {
      specificWorkspaceItems = [getPreparationWorkspace()];
    } else if (deptName.includes('ESTIMATION')) {
      specificWorkspaceItems = [getEstimationWorkspace()];
    } else if (deptName.includes('PAYMENTS')) {
      specificWorkspaceItems = [getPaymentsWorkspace()];
    } else if (deptName.includes('E-FILING')) {
      specificWorkspaceItems = [getEfilingWorkspace()];
    }

    menuSections = [
      { title: (user?.role === 'TEAMLEAD' || user?.role === 'TEAM_LEAD') ? 'Team Management' : 'Workspace', items: teamManagementItems }
    ];

    if (specificWorkspaceItems.length > 0) {
      menuSections.push({ title: `${departmentName} Workspace`, items: specificWorkspaceItems });
    }
  }

  return (
    <>
      <div
        onClick={() => setIsMobileOpen(false)}
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 transition-opacity duration-300 md:hidden ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col justify-between 
          transition-all duration-300 ease-in-out font-sans select-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          w-[min(85vw,300px)] p-4
          md:translate-x-0 md:static md:h-screen md:max-h-screen
          ${isCollapsed ? 'md:w-20 md:p-3' : 'md:w-64 lg:w-64 2xl:w-72 md:p-4'}
        `}
      >
        <button
          type="button"
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          onClick={() => setIsCollapsed(prev => !prev)}
          className="hidden md:flex absolute -right-3.5 top-12 w-7 h-7 bg-white border border-slate-200 rounded-full shadow-md items-center justify-center text-slate-500 hover:text-slate-900 z-50 cursor-pointer transition-transform hover:scale-110 active:scale-95 min-h-[28px] min-w-[28px]"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4 stroke-[2.5]" /> : <ChevronLeft className="w-4 h-4 stroke-[2.5]" />}
        </button>

        <button
          type="button"
          aria-label="Close Navigation"
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden absolute right-3 top-3.5 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-800"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className={`flex items-center pb-4 pt-1 shrink-0 ${isCollapsed ? 'md:justify-center' : 'pl-2'}`}>
            <img
              src={logo}
              alt="Application Logo"
              className={`object-contain transition-all duration-200 ${
                isCollapsed ? 'w-10 h-10' : 'h-12 w-auto max-w-[180px]'
              }`}
            />
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-2">
            {menuSections.map((section, sIdx) => (
              <div key={sIdx}>
                {(!isCollapsed || isMobileOpen) && (
                  <span className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    {section.title}
                  </span>
                )}
                <nav className="mt-1.5 space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isOpen = openMenus[item.id] || false;

                    if (item.subItems) {
                      return (
                        <div key={item.id}>
                          <button
                            type="button"
                            title={item.name}
                            onClick={() => toggleMenu(item.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] md:min-h-[38px] text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition ${
                              isCollapsed && !isMobileOpen ? 'md:justify-center' : ''
                            } ${isOpen && (!isCollapsed || isMobileOpen) ? 'bg-slate-50 text-slate-900 font-bold' : ''}`}
                          >
                            <div className="flex items-center min-w-0">
                              <Icon className="w-5 h-5 md:w-4 md:h-4 text-slate-500 stroke-[2] shrink-0" />
                              {(!isCollapsed || isMobileOpen) && (
                                <span className="ml-3 truncate text-left">{item.name}</span>
                              )}
                            </div>
                            {(!isCollapsed || isMobileOpen) && (
                              <span>
                                {isOpen ? (
                                  <ChevronUp className="w-4 h-4 text-slate-700 stroke-[2.5]" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </span>
                            )}
                          </button>
                          
                          {isOpen && (!isCollapsed || isMobileOpen) && (
                            <div className="relative ml-5 pl-3 border-l border-slate-200 mt-1 space-y-1">
                              {item.subItems.map((subItem, subIdx) => (
                                <NavLink
                                  key={subIdx}
                                  to={subItem.path}
                                  className={({ isActive }) =>
                                    `block py-2 md:py-1.5 px-3 min-h-[40px] md:min-h-[32px] text-xs transition truncate rounded-lg ${
                                      isActive
                                        ? 'font-bold text-slate-900 bg-slate-100'
                                        : 'font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }`
                                  }
                                >
                                  {subItem.name}
                                </NavLink>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <NavLink
                        key={item.id}
                        to={item.path!}
                        title={item.name}
                        className={({ isActive }) =>
                          `flex items-center px-3 py-2.5 min-h-[44px] md:min-h-[38px] text-xs font-semibold rounded-xl transition ${
                            isActive
                              ? 'bg-slate-100 text-slate-900 font-bold'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          } ${isCollapsed && !isMobileOpen ? 'md:justify-center' : ''}`
                        }
                      >
                        <Icon className="w-5 h-5 md:w-4 md:h-4 text-slate-500 stroke-[2] shrink-0" />
                        {(!isCollapsed || isMobileOpen) && (
                          <span className="ml-3 truncate">{item.name}</span>
                        )}
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 shrink-0 space-y-2">
          {(!isCollapsed || isMobileOpen) && user && (
            <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full flex items-center justify-center gap-2 text-[11px] font-bold text-[#5f41b2] hover:text-[#4d3396] bg-white hover:bg-purple-50 border border-[#5f41b2]/20 rounded-lg py-1.5 transition shadow-2xs cursor-pointer active:scale-95"
              >
                <Lock className="w-3.5 h-3.5" />
                Change Password
              </button>
            </div>
          )}

          {isCollapsed && !isMobileOpen && user && (
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full flex items-center justify-center py-2.5 text-slate-500 hover:text-[#5f41b2] transition rounded-lg hover:bg-purple-50"
              title="Change Password"
            >
              <Lock className="w-5 h-5 md:w-4 md:h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className={`w-full py-2.5 px-3 min-h-[44px] md:min-h-[38px] rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center transition active:scale-[0.98] ${
              isCollapsed && !isMobileOpen ? 'md:justify-center' : 'space-x-3'
            }`}
          >
            <LogOut className="w-5 h-5 md:w-4 md:h-4 stroke-[2] shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {showChangePassword && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border-t-4 border-[#5f41b2]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1b2559] flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#5f41b2]" />
                Change Password
              </h3>
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setCpError(null);
                  setCpCurrentPassword('');
                  setCpNewPassword('');
                  setCpConfirmPassword('');
                }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-5">
              Enter your current password and choose a new one.
            </p>

            {cpError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-sm text-rose-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{cpError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={cpShowPassword ? 'text' : 'password'}
                    value={cpCurrentPassword}
                    onChange={(e) => setCpCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent pr-10"
                    placeholder="Enter current password"
                    disabled={cpLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setCpShowPassword(!cpShowPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {cpShowPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  New Password <span className="text-xs font-normal text-gray-400">(min 8 chars)</span>
                </label>
                <input
                  type={cpShowPassword ? 'text' : 'password'}
                  value={cpNewPassword}
                  onChange={(e) => setCpNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent"
                  placeholder="Enter new password"
                  disabled={cpLoading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={cpShowPassword ? 'text' : 'password'}
                  value={cpConfirmPassword}
                  onChange={(e) => setCpConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent"
                  placeholder="Confirm new password"
                  disabled={cpLoading}
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setCpError(null);
                    setCpCurrentPassword('');
                    setCpNewPassword('');
                    setCpConfirmPassword('');
                  }}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                  disabled={cpLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cpLoading}
                  className="px-5 py-2 flex items-center gap-2 text-sm font-bold bg-[#5f41b2] text-white rounded-xl hover:bg-[#4d3396] transition shadow-sm disabled:opacity-50"
                >
                  {cpLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;