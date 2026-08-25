// src/components/layout/Sidebar.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Users, FileText, Calendar as CalendarIcon, BarChart2, Bell, Settings,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, MoreVertical, LogOut,
  CheckSquare, FolderCheck, Calculator, AlertCircle, CreditCard, Send, ShieldCheck
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

type SubItem = { name: string; path: string; };
type NavItem = { id: string; name: string; path?: string; icon: React.ElementType; subItems?: SubItem[]; };
type NavSection = { title: string; items: NavItem[]; };

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'income': true, 'audience': false, 'settings': false, 'team': true, 
    'leads': true, 'prep_tasks': true, 'estimations': true, 'payments': true, 'filings': true
  });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    logout();
    navigate('/login');
  };

  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  let menuSections: NavSection[] = [];

  if (user?.role === 'ADMIN') {
    menuSections = [
      {
        title: 'Main',
        items: [
          { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: Home },
          { id: 'audience', name: 'Audience', icon: Users, subItems: [{ name: 'Overview', path: '/manage-users' }, { name: 'Demographics', path: '/team-performance' }]},
          { id: 'posts', name: 'Posts', path: '/posts', icon: FileText },
          { id: 'schedules', name: 'Schedules', path: '/schedules', icon: CalendarIcon },
          { id: 'income', name: 'Income', icon: BarChart2, subItems: [{ name: 'Earnings', path: '/earnings' }, { name: 'Refunds', path: '/refunds' }, { name: 'Declines', path: '/declines' }, { name: 'Payouts', path: '/payouts' }]}
        ]
      },
      {
        title: 'Settings',
        items: [
          { id: 'notifications', name: 'Notification', path: '/notifications', icon: Bell },
          { id: 'settings', name: 'Settings', icon: Settings, subItems: [{ name: 'General', path: '/general-settings' }, { name: 'Account & Security', path: '/security-settings' }]}
        ]
      }
    ];
  } else if (user?.role === 'TEAMLEAD') {
    menuSections = [
      {
        title: 'Operations',
        items: [
          { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: Home },
          { id: 'team', name: 'My Team', icon: Users, subItems: [{ name: 'Roster Overview', path: '/team-roster' }, { name: 'Performance Metrics', path: '/team-metrics' }]},
          { id: 'approvals', name: 'Workflows', icon: CheckSquare, subItems: [{ name: 'Pending Approvals', path: '/approvals' }, { name: 'Escalations', path: '/escalations' }]},
          { id: 'schedules', name: 'Team Schedules', path: '/schedules', icon: CalendarIcon }
        ]
      }
    ];
  } else if (user?.role === 'EMPLOYEE' && user?.team === 'DOCUMENTATION') {
    menuSections = [
      {
        title: 'Workspace',
        items: [
          { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: Home },
          { id: 'leads', name: 'Lead Management', icon: Users, subItems: [{ name: 'Assigned Leads', path: '/leads/assigned' }, { name: 'Follow-ups', path: '/leads/follow-ups' }, { name: 'Completed / OK', path: '/leads/completed' }, { name: 'Not Interested', path: '/leads/rejected' }]},
          { id: 'docs', name: 'Client Documents', icon: FolderCheck, subItems: [{ name: 'Pending Uploads', path: '/docs/pending' }, { name: 'Verified Files', path: '/docs/verified' }]}
        ]
      }
    ];
  } else if (user?.role === 'EMPLOYEE' && user?.team === 'PREPARATION') {
    menuSections = [
      {
        title: 'Tax Workspace',
        items: [
          { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: Home },
          { id: 'prep_tasks', name: 'Tax Preparation', icon: Calculator, subItems: [{ name: 'My Queue', path: '/prep/queue' }, { name: 'In Progress', path: '/prep/in-progress' }, { name: 'Ready for Review', path: '/prep/review' }]},
          { id: 'queries', name: 'Client Queries', path: '/prep/queries', icon: AlertCircle }
        ]
      }
    ];
  } else if (user?.role === 'EMPLOYEE' && user?.team === 'ESTIMATION') {
    menuSections = [
      {
        title: 'Estimations',
        items: [
          { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: Home },
          { id: 'estimations', name: 'Tax Estimates', icon: FileText, subItems: [{ name: 'Pending Estimates', path: '/estimation/pending' }, { name: 'Sent to Client', path: '/estimation/sent' }]}
        ]
      }
    ];
  } else if (user?.role === 'EMPLOYEE' && user?.team === 'PAYMENTS') {
    menuSections = [
      {
        title: 'Billing & Support',
        items: [
          { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: Home },
          { id: 'payments', name: 'Invoices', icon: CreditCard, subItems: [{ name: 'Awaiting Payment', path: '/payments/pending' }, { name: 'Completed', path: '/payments/completed' }]}
        ]
      }
    ];
  } else if (user?.role === 'EMPLOYEE' && user?.team === 'E-FILING') {
    menuSections = [
      {
        title: 'IRS Transmissions',
        items: [
          { id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: Home },
          { id: 'filings', name: 'E-Filing Queue', icon: Send, subItems: [{ name: 'Ready to Transmit', path: '/transmit/ready' }, { name: 'IRS Rejected', path: '/transmit/rejected' }, { name: 'Accepted', path: '/transmit/accepted' }]}
        ]
      }
    ];
  } else {
    menuSections = [{ title: 'Main', items: [{ id: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: Home }] }];
  }

  return (
    <aside className={`relative h-screen max-h-screen bg-white border-r border-gray-100 flex flex-col justify-between p-4 select-none shrink-0 z-40 font-sans transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <button type="button" onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3.5 top-14 w-7 h-7 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-gray-900 z-50 cursor-pointer transition-transform hover:scale-110 active:scale-95">
        {isCollapsed ? <ChevronRight className="w-4 h-4 stroke-[2.5]" /> : <ChevronLeft className="w-4 h-4 stroke-[2.5]" />}
      </button>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center justify-between px-1 pb-4 pt-1 shrink-0">
          <div className={`flex items-center overflow-hidden w-full ${isCollapsed ? 'justify-center' : 'pl-3'}`}>
            <img src={logoImg} alt="Metrix Logo" className={`${isCollapsed ? 'w-12 h-12 object-contain' : 'h-16 w-auto max-w-[200px] object-contain'} transition-all duration-200`} />
          </div>
          {!isCollapsed && <button className="text-slate-400 hover:text-slate-700 transition shrink-0"><MoreVertical className="w-4 h-4" /></button>}
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {menuSections.map((section, sIdx) => (
            <div key={sIdx}>
              {!isCollapsed && <span className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">{section.title}</span>}
              <nav className="mt-1.5 space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isOpen = openMenus[item.id] || false;
                  if (item.subItems) {
                    return (
                      <div key={item.id}>
                        <button type="button" title={item.name} onClick={() => toggleMenu(item.id)} className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition ${isCollapsed ? 'justify-center' : ''} ${isOpen && !isCollapsed ? 'bg-slate-50 text-slate-900 font-bold' : ''}`}>
                          <div className="flex items-center min-w-0">
                            <Icon className="w-4 h-4 text-slate-500 stroke-[2] shrink-0" />
                            {!isCollapsed && <span className="ml-3 truncate">{item.name}</span>}
                          </div>
                          {!isCollapsed && <span>{isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-700 stroke-[2.5]" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}</span>}
                        </button>
                        {isOpen && !isCollapsed && (
                          <div className="relative ml-5 pl-4 border-l border-slate-200 mt-1 space-y-1">
                            {item.subItems.map((subItem, subIdx) => (
                              <NavLink key={subIdx} to={subItem.path} className={({ isActive }) => `block py-1.5 px-3 text-xs transition truncate rounded-lg ${isActive ? 'font-bold text-slate-900 bg-slate-100' : 'font-medium text-slate-500 hover:text-slate-900'}`}>{subItem.name}</NavLink>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <NavLink key={item.id} to={item.path!} title={item.name} className={({ isActive }) => `flex items-center px-3 py-2 text-xs font-semibold rounded-xl transition ${isActive ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'} ${isCollapsed ? 'justify-center' : ''}`}>
                      <Icon className="w-4 h-4 text-slate-500 stroke-[2] shrink-0" />
                      {!isCollapsed && <span className="ml-3 truncate">{item.name}</span>}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-slate-100 shrink-0">
        <button type="button" onClick={handleLogout} title="Logout" className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center transition active:scale-[0.98] ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <LogOut className="w-4 h-4 stroke-[2] shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;