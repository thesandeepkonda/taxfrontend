import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchDepartments } from '../../store/slices/departmentsSlice';
import {
  Home, Users, FileText, Calendar as CalendarIcon, BarChart2, Bell, Settings,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, LogOut,
  CheckSquare, FolderCheck, Calculator, AlertCircle, CreditCard, Send, X,
  Building2
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

type SubItem = { name: string; path: string };
type NavItem = { id: string; name: string; path?: string; icon: React.ElementType; subItems?: SubItem[] };
type NavSection = { title: string; items: NavItem[] };

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed } = useSidebar();
  const dispatch = useDispatch<AppDispatch>();

  const departments = useSelector((state: RootState) => state.departments.list);
  const deptLoading = useSelector((state: RootState) => state.departments.loading);

  useEffect(() => {
    if (user?.role === 'ADMIN' && departments.length === 0 && !deptLoading) {
      dispatch(fetchDepartments());
    }
  }, [user, dispatch, departments.length, deptLoading]);

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('sidebarState');
      const defaultMenus = {
        income: true, audience: false, settings: true, teams: true,
        leads: true, prep_tasks: true, estimations: true, payments: true,
        filings: true, approvals: true, dept_menu: false
      };
      return stored ? JSON.parse(stored).openMenus || defaultMenus : defaultMenus;
    } catch {
      return {};
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

  const getDocumentationWorkspace = () => ({
    id: 'leads', name: 'Lead Management', icon: Users,
    subItems: [
      { name: 'Assigned Leads', path: '/leads/assigned' },
      { name: 'Follow-ups', path: '/leads/follow-ups' },
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
      { name: 'My Queue', path: '/prep/queue' },
      { name: 'In Progress', path: '/prep/in-progress' },
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
    // Filter departments - ignore SYSTEM
    const filteredDepts = departments.filter(dept => dept.name !== 'SYSTEM');
    
    // Display name mapping
    const getDisplayName = (deptName: string) => {
      const mapping: Record<string, string> = {
        'DOCUMENTATION DEPARTMENT': 'Doc Team',
        'ESTIMATION': 'Estimation Team',
        'PREPARATION': 'Preparation Team',
        'PAYMENTS': 'Payment Team',
        'E-FILING': 'E-Filing Team',
      };
      return mapping[deptName] || deptName;
    };

    // Path mapping for each department
    const getPath = (deptId: number, deptName: string) => {
      const mapping: Record<string, string> = {
        'DOCUMENTATION DEPARTMENT': `/admin/docteams?depID=${deptId}`,
        'PREPARATION': `/admin/preparationteam?depID=${deptId}`,
        'ESTIMATION': `/admin/estimationteam?depID=${deptId}`,
        'PAYMENTS': `/admin/paymentteam?depID=${deptId}`,
        'E-FILING': `/admin/e-filing-team?depID=${deptId}`,
      };
      return mapping[deptName] || `/admin/teams?depID=${deptId}`;
    };

    // Create dynamic subitems for Teams
    const teamSubItems: SubItem[] = filteredDepts.map(dept => ({
      name: getDisplayName(dept.name),
      path: getPath(dept.id, dept.name),
    }));

    const teamsItems = deptLoading
      ? [{ name: 'Loading...', path: '#' }]
      : teamSubItems.length > 0
      ? teamSubItems
      : [{ name: 'No departments', path: '#' }];

    menuSections = [
      {
        title: 'Main',
        items: [
          { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: Home },
          {
            id: 'teams',
            name: 'Teams',
            icon: Users,
            subItems: teamsItems, // ✅ Dynamic teams
          },
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

    if (user?.role === 'TEAMLEAD') {
      teamManagementItems = [
        { id: 'dashboard', name: 'TL Dashboard', path: '/dashboard', icon: Home },
        {
          id: 'team', name: 'My Team', icon: Users,
          subItems: [
            { name: 'Roster Overview', path: '/team-roster' },
            { name: 'Performance Metrics', path: '/team-metrics' }
          ]
        },
        {
          id: 'approvals', name: 'Workflows', icon: CheckSquare,
          subItems: [
            { name: 'Pending Approvals', path: '/approvals' },
            { name: 'Escalations', path: '/escalations' }
          ]
        },
        { id: 'schedules', name: 'Team Schedules', path: '/schedules', icon: CalendarIcon }
      ];
    } else {
      teamManagementItems = [{ id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: Home }];
    }

    if (deptName.includes('DOCUMENTATION')) {
      specificWorkspaceItems = [getDocumentationWorkspace(), getClientDocsWorkspace()];
    } else if (deptName.includes('PREPARATION')) {
      specificWorkspaceItems = [getPreparationWorkspace(), { id: 'queries', name: 'Client Queries', path: '/prep/queries', icon: AlertCircle }];
    } else if (deptName.includes('ESTIMATION')) {
      specificWorkspaceItems = [getEstimationWorkspace()];
    } else if (deptName.includes('PAYMENTS')) {
      specificWorkspaceItems = [getPaymentsWorkspace()];
    } else if (deptName.includes('E-FILING')) {
      specificWorkspaceItems = [getEfilingWorkspace()];
    }

    menuSections = [
      { title: user?.role === 'TEAMLEAD' ? 'Team Management' : 'Workspace', items: teamManagementItems }
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
              src={logoImg}
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

        <div className="mt-2 pt-2 border-t border-slate-100 shrink-0">
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
    </>
  );
};

export default Sidebar;