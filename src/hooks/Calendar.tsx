// src/hooks/Calendar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  fetchMyEvents,
  fetchAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  CalendarEvent,
} from '../store/slices/eventsSlice';
import { fetchUsers } from '../store/slices/usersSlice';
import { fetchDepartments, Department } from '../store/slices/departmentsSlice';
import { fetchTeams, fetchTeamsByDepartment, Team } from '../store/slices/teamsSlice';
import {
  X,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  CalendarDays,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
  Video,
  ExternalLink,
  CheckCircle2,
  Calendar as CalendarIcon,
} from 'lucide-react';

// ============================================================
// MODAL COMPONENT (WITH DYNAMIC TARGET DROPDOWNS)
// ============================================================
interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: CalendarEvent | null;
  onSave: (data: any) => void;
  loading: boolean;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, initialData, onSave, loading }) => {
  const dispatch = useDispatch<AppDispatch>();

  const departments = useSelector((state: RootState) => state.departments?.list || []);
  const users = useSelector((state: RootState) => state.users?.list || []);

  const [allDepartmentTeams, setAllDepartmentTeams] = useState<Team[]>([]);
  const [isFetchingTargetData, setIsFetchingTargetData] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [targetType, setTargetType] = useState<'INDIVIDUAL' | 'TEAM' | 'DEPARTMENT' | 'ALL'>('ALL');
  const [targetId, setTargetId] = useState<number | null>(null);
  const [meetingLink, setMeetingLink] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setStartTime(initialData.startTime ? initialData.startTime.slice(0, 16) : '');
      setEndTime(initialData.endTime ? initialData.endTime.slice(0, 16) : '');
      setTargetType(initialData.targetType);
      setTargetId(initialData.targetId);
      setMeetingLink(initialData.meetingLink || '');
    } else {
      setTitle('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setTargetType('ALL');
      setTargetId(null);
      setMeetingLink('');
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (targetType === 'INDIVIDUAL') {
      if (users.length === 0) {
        setIsFetchingTargetData(true);
        dispatch(fetchUsers()).finally(() => setIsFetchingTargetData(false));
      }
    } else if (targetType === 'DEPARTMENT') {
      if (departments.length === 0) {
        setIsFetchingTargetData(true);
        dispatch(fetchDepartments()).finally(() => setIsFetchingTargetData(false));
      }
    } else if (targetType === 'TEAM') {
      const loadAllTeamsAcrossDepartments = async () => {
        setIsFetchingTargetData(true);
        try {
          let currentDepts = departments;
          if (currentDepts.length === 0) {
            const deptsAction = await dispatch(fetchDepartments()).unwrap();
            currentDepts = deptsAction || [];
          }

          const teamPromises = currentDepts.map((dept: Department) =>
            dispatch(fetchTeamsByDepartment(dept.id))
              .unwrap()
              .catch(() => [])
          );
          const teamsResults = await Promise.all(teamPromises);
          const flatTeams = teamsResults.flat();

          let allCombined = flatTeams;
          if (allCombined.length === 0) {
            try {
              const allTeamsDirect = await dispatch(fetchTeams()).unwrap();
              allCombined = allTeamsDirect || [];
            } catch (e) {
              // Ignore
            }
          }

          const uniqueTeamsMap = new Map<number, Team>();
          allCombined.forEach((team: any) => {
            if (team) {
              const teamIdNum = Number(team.id ?? team.teamId);
              if (!isNaN(teamIdNum) && teamIdNum > 0) {
                uniqueTeamsMap.set(teamIdNum, {
                  id: teamIdNum,
                  name: team.name,
                  departmentId: team.departmentId,
                  departmentName: team.departmentName,
                  teamLeadId: team.teamLeadId ?? null,
                  teamLeadName: team.teamLeadName ?? null,
                  active: team.active ?? true,
                });
              }
            }
          });

          setAllDepartmentTeams(Array.from(uniqueTeamsMap.values()));
        } catch (err) {
          console.error('Failed to load teams by department:', err);
        } finally {
          setIsFetchingTargetData(false);
        }
      };

      loadAllTeamsAcrossDepartments();
    }
  }, [targetType, isOpen, dispatch, departments.length, users.length]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) {
      alert('Please fill in all required fields.');
      return;
    }
    if (targetType !== 'ALL' && !targetId) {
      alert(`Please select a ${targetType.toLowerCase()} from the dropdown.`);
      return;
    }
    onSave({ title, description, startTime, endTime, targetType, targetId, meetingLink });
  };

  const renderTargetDropdown = () => {
    if (targetType === 'ALL') return null;

    let options: { id: number; label: string }[] = [];
    let label = 'Target';
    let placeholder = 'Select...';

    if (targetType === 'INDIVIDUAL') {
      label = 'Select Employee';
      placeholder = '-- Choose an employee --';
      options = users.map((u: any) => {
        const uid = Number(u.id ?? u.userId);
        return {
          id: uid,
          label: `${u.firstName} ${u.lastName || ''} (${u.employeeCode}) ${u.departmentName ? `• ${u.departmentName}` : ''}`,
        };
      });
    } else if (targetType === 'TEAM') {
      label = 'Select Team';
      placeholder = '-- Choose a team --';
      options = allDepartmentTeams.map((t) => ({
        id: t.id,
        label: `${t.name} (${t.departmentName || 'No Dept'})`,
      }));
    } else if (targetType === 'DEPARTMENT') {
      label = 'Select Department';
      placeholder = '-- Choose a department --';
      options = departments.map((d) => ({
        id: d.id,
        label: d.name,
      }));
    }

    return (
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
          <span>
            {label} <span className="text-rose-500">*</span>
          </span>
          {isFetchingTargetData && (
            <span className="text-[10px] text-[#5f41b2] flex items-center gap-1 font-semibold">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading data...
            </span>
          )}
        </label>
        <select
          value={targetId || ''}
          onChange={(e) => setTargetId(e.target.value ? Number(e.target.value) : null)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5f41b2] text-sm bg-white font-medium text-slate-700"
          disabled={loading || isFetchingTargetData}
          required
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        {!isFetchingTargetData && options.length === 0 && (
          <p className="text-[11px] text-amber-600 mt-1">No records available for this category.</p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border-t-4 border-[#5f41b2] max-h-[90vh] overflow-y-auto [scrollbar-width:thin]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-[#1b2559] flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#5f41b2]" />
            {initialData ? 'Edit Event' : 'Create New Event'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition cursor-pointer"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Event Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent text-sm"
              placeholder="e.g., Weekly Team Sync"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5f41b2] text-sm resize-none"
              placeholder="Brief details about the meeting or event..."
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Start Date & Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5f41b2] text-sm"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                End Date & Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5f41b2] text-sm"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Event Audience (Target Type) <span className="text-rose-500">*</span>
            </label>
            <select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value as any);
                setTargetId(null);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5f41b2] text-sm bg-white font-medium text-slate-700"
              disabled={loading}
            >
              <option value="ALL">Everyone (ALL)</option>
              <option value="INDIVIDUAL">Specific Individual</option>
              <option value="TEAM">Specific Team</option>
              <option value="DEPARTMENT">Specific Department</option>
            </select>
          </div>

          {renderTargetDropdown()}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Meeting Link (Optional)</label>
            <input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5f41b2] text-sm"
              placeholder="https://meet.google.com/..."
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isFetchingTargetData}
              className="px-5 py-2 flex items-center gap-2 text-xs font-bold bg-[#5f41b2] hover:bg-[#4e3596] text-white rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {initialData ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// MAIN CALENDAR COMPONENT
// ============================================================
const Calendar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  const eventsState = useSelector((state: RootState) => state.events) || {
    myEvents: [],
    allEvents: [],
    loading: false,
    error: null,
  };
  const { myEvents, allEvents, loading, error } = eventsState;

  const isAdmin = user?.role === 'ADMIN';
  const displayEvents = isAdmin ? allEvents : myEvents;

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Active hover day state for persistent interactive popups
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calendar State
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [viewMonth, setViewMonth] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [showMonthDropdown, setShowMonthDropdown] = useState<boolean>(false);

  useEffect(() => {
    const startOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const endOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0, 23, 59, 59);
    const fromISO = startOfMonth.toISOString();
    const toISO = endOfMonth.toISOString();

    if (isAdmin) {
      dispatch(fetchAllEvents());
    } else {
      dispatch(fetchMyEvents({ fromDate: fromISO, toDate: toISO }));
    }
  }, [dispatch, viewMonth, isAdmin]);

  // Real-time Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours24 = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();
  const isAM = hours24 < 12;
  const displayHour = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const displayMinute = String(minutes).padStart(2, '0');
  const displaySecond = String(seconds).padStart(2, '0');
  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours24 % 12) * 30 + minutes * 0.5;

  const isCurrentDate =
    selectedDate.getDate() === today.getDate() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getFullYear() === today.getFullYear() &&
    viewMonth.getMonth() === today.getMonth() &&
    viewMonth.getFullYear() === today.getFullYear();

  const currentYear = viewMonth.getFullYear();
  const currentMonth = viewMonth.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const firstDayRaw = new Date(currentYear, currentMonth, 1).getDay();
  const startingDayOffset = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const fullCalendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOffset; i++) fullCalendarDays.push(null);
  for (let d = 1; d <= totalDaysInMonth; d++) fullCalendarDays.push(d);
  while (fullCalendarDays.length % 7 !== 0) fullCalendarDays.push(null);

  // Group events by Day of Month
  const eventsByDayMap = new Map<number, CalendarEvent[]>();
  displayEvents.forEach((ev) => {
    if (ev?.startTime) {
      const d = new Date(ev.startTime);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const dayNum = d.getDate();
        if (!eventsByDayMap.has(dayNum)) {
          eventsByDayMap.set(dayNum, []);
        }
        eventsByDayMap.get(dayNum)!.push(ev);
      }
    }
  });

  const handleMouseEnterDay = (day: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredDay(day);
  };

  const handleMouseLeaveDay = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredDay(null);
    }, 250);
  };

  const resetToToday = () => {
    if (isCurrentDate) return;
    const now = new Date();
    setSelectedDate(now);
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setShowMonthDropdown(false);
  };
  const goToPrevMonth = () => setViewMonth(new Date(currentYear, currentMonth - 1, 1));
  const goToNextMonth = () => setViewMonth(new Date(currentYear, currentMonth + 1, 1));

  const handleDateClick = (day: number) => {
    setSelectedDate(new Date(currentYear, currentMonth, day));
  };

  const handleMonthSelect = (monthIndex: number) => {
    setViewMonth(new Date(currentYear, monthIndex, 1));
    setSelectedDate(
      new Date(currentYear, monthIndex, Math.min(selectedDate.getDate(), new Date(currentYear, monthIndex + 1, 0).getDate()))
    );
    setShowMonthDropdown(false);
  };

  const handleYearSelect = (year: number) => {
    setSelectedDate(new Date(year, selectedDate.getMonth(), selectedDate.getDate()));
    setViewMonth(new Date(year, viewMonth.getMonth(), 1));
  };

  // ----- Event Handlers (Admin Only) -----
  const handleCreateEvent = async (data: any) => {
    setModalLoading(true);
    try {
      await dispatch(createEvent(data)).unwrap();
      showToast('Event created successfully!', 'success');
      setModalOpen(false);
      if (isAdmin) dispatch(fetchAllEvents());
      else {
        const start = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).toISOString();
        const end = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0, 23, 59, 59).toISOString();
        dispatch(fetchMyEvents({ fromDate: start, toDate: end }));
      }
    } catch (err: any) {
      showToast(err || 'Failed to create event', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateEvent = async (data: any) => {
    if (!editingEvent) return;
    setModalLoading(true);
    try {
      await dispatch(updateEvent({ id: editingEvent.id, ...data })).unwrap();
      showToast('Event updated successfully!', 'success');
      setModalOpen(false);
      setEditingEvent(null);
      if (isAdmin) dispatch(fetchAllEvents());
      else {
        const start = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).toISOString();
        const end = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0, 23, 59, 59).toISOString();
        dispatch(fetchMyEvents({ fromDate: start, toDate: end }));
      }
    } catch (err: any) {
      showToast(err || 'Failed to update event', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await dispatch(deleteEvent(id)).unwrap();
      showToast('Event deleted successfully!', 'info');
      if (isAdmin) dispatch(fetchAllEvents());
      else {
        const start = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).toISOString();
        const end = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0, 23, 59, 59).toISOString();
        dispatch(fetchMyEvents({ fromDate: start, toDate: end }));
      }
    } catch (err: any) {
      showToast(err || 'Failed to delete event', 'error');
    }
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setModalOpen(true);
  };

  const formatEventTime = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="w-full h-full bg-slate-50 rounded-2xl shadow-xl flex flex-col overflow-hidden border border-slate-200 font-sans select-none relative">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-white border-b border-slate-200 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#5f41b2]" />
          <h2 className="text-base sm:text-lg font-bold text-[#1b2559]">System Calendar</h2>
          {loading && <Loader2 className="w-4 h-4 text-[#5f41b2] animate-spin ml-2" />}
          {error && (
            <span className="text-xs text-rose-500 ml-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Error
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5f41b2] hover:bg-[#4e3596] text-white text-xs font-bold rounded-xl transition shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Event
            </button>
          )}

          <button
            type="button"
            onClick={resetToToday}
            disabled={isCurrentDate}
            className={`min-h-[44px] sm:min-h-[36px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition border shadow-xs ${
              isCurrentDate
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-white hover:bg-slate-100 text-[#5f41b2] border-slate-300 cursor-pointer active:scale-95'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Today
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] rounded-xl bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition border border-slate-200 shadow-xs cursor-pointer active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto items-start">
          {/* COLUMN 1: UPCOMING & RECENT EVENTS LIST */}
          <div className="w-full bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-[#5f41b2] p-4 text-white flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase opacity-80">Workspace Activity</p>
                <h3 className="text-xl font-bold tracking-tight">Upcoming Events</h3>
              </div>
              <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-semibold">
                {displayEvents.length} Tasks
              </span>
            </div>

            <div className="p-3.5 sm:p-4 space-y-2.5 max-h-[320px] md:max-h-[480px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {displayEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm font-medium">
                  No events scheduled.
                </div>
              ) : (
                displayEvents.map((event) => {
                  const isCompleted = new Date(event.endTime || event.startTime) <= currentTime;

                  return (
                    <div
                      key={event.id}
                      className={`rounded-xl border p-3.5 transition hover:shadow-xs relative group ${
                        isCompleted
                          ? 'border-blue-200 bg-blue-50/40 text-slate-700'
                          : 'border-slate-200 bg-white text-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-bold text-xs sm:text-sm truncate text-[#1b2559] flex items-center gap-1.5">
                          {event.title}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" /> Completed !
                            </span>
                          )}
                        </p>
                        <span className="text-[10px] font-semibold text-slate-500 shrink-0">
                          {formatEventTime(event)}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{event.description}</p>
                      )}
                      <div className="flex items-center justify-between text-[11px] opacity-80 mt-2 text-slate-600">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-slate-400" />
                          {new Date(event.startTime).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {event.meetingLink && (
                          <a
                            href={event.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline font-bold"
                          >
                            <Video className="w-3 h-3 inline" /> Meeting Link
                          </a>
                        )}
                      </div>
                      {event.targetType !== 'ALL' && (
                        <div className="mt-1.5 text-[10px] font-bold text-[#5f41b2] bg-purple-50 px-2 py-0.5 rounded w-max">
                          Target: {event.targetType} {event.targetId ? `#${event.targetId}` : ''}
                        </div>
                      )}

                      {/* Admin Actions Overlay (EDIT DISABLED ON COMPLETED EVENTS) */}
                      {isAdmin && (
                        <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {!isCompleted && (
                            <button
                              onClick={() => openEditModal(event)}
                              className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition cursor-pointer"
                              title="Edit Event"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 transition cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 2: CALENDAR GRID & YEAR SELECTOR */}
          <div className="w-full flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-3.5 sm:p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Year</p>
              <div className="h-28 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-1">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 text-center text-xs">
                  {Array.from({ length: 101 }, (_, i) => 1980 + i).map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => handleYearSelect(year)}
                      className={`py-1.5 rounded-lg text-xs transition cursor-pointer min-h-[36px] flex items-center justify-center ${
                        year === selectedDate.getFullYear()
                          ? 'bg-[#5f41b2] text-white font-bold shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-3.5 sm:p-4 relative">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-3 px-1">
                <button
                  type="button"
                  onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl min-h-[36px] transition cursor-pointer"
                >
                  <span>
                    {monthNames[currentMonth]} {currentYear}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                      showMonthDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={goToPrevMonth}
                    className="p-1.5 min-h-[36px] min-w-[36px] rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToNextMonth}
                    className="p-1.5 min-h-[36px] min-w-[36px] rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {showMonthDropdown && (
                <div className="absolute inset-x-3.5 top-14 bg-white shadow-xl rounded-xl border border-slate-200 p-2.5 z-30 grid grid-cols-3 gap-1.5 animate-in fade-in">
                  {monthNames.map((m, idx) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMonthSelect(idx)}
                      className={`py-2 text-xs rounded-lg transition min-h-[40px] font-medium cursor-pointer ${
                        idx === currentMonth
                          ? 'bg-[#5f41b2] text-white font-bold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {m.slice(0, 3)}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 mb-2">
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
                <span>S</span>
              </div>
              <div className="grid grid-cols-7 text-center text-xs text-slate-700 gap-y-1.5 items-center">
                {fullCalendarDays.map((day, index) => {
                  if (day === null) return <span key={index} aria-hidden="true" />;
                  const isSelected =
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === currentMonth &&
                    selectedDate.getFullYear() === currentYear;
                  const isToday =
                    today.getDate() === day &&
                    today.getMonth() === currentMonth &&
                    today.getFullYear() === currentYear;

                  const dayEvents = eventsByDayMap.get(day) || [];

                  // Categorize events
                  const upcomingEvents = dayEvents.filter(
                    (ev) => new Date(ev.endTime || ev.startTime) > currentTime
                  );
                  const completedEvents = dayEvents.filter(
                    (ev) => new Date(ev.endTime || ev.startTime) <= currentTime
                  );

                  const hasUpcoming = upcomingEvents.length > 0;
                  const hasOnlyCompleted = !hasUpcoming && completedEvents.length > 0;
                  const isRightColumn = index % 7 >= 4;
                  const isPopupActive = hoveredDay === day && dayEvents.length > 0;

                  return (
                    <div
                      key={index}
                      onMouseEnter={() => handleMouseEnterDay(day)}
                      onMouseLeave={handleMouseLeaveDay}
                      className="relative mx-auto flex items-center justify-center"
                    >
                      <button
                        type="button"
                        onClick={() => handleDateClick(day)}
                        className={`w-8 h-8 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl cursor-pointer transition min-h-[36px] sm:min-h-0 relative ${
                          isSelected
                            ? 'bg-[#5f41b2] text-white font-bold shadow-xs'
                            : isToday
                            ? 'border border-[#5f41b2] text-[#5f41b2] font-bold'
                            : 'hover:bg-slate-100 text-slate-700 font-medium'
                        }`}
                      >
                        <span>{day}</span>

                        {/* Upcoming Event -> Blinking RED Dot */}
                        {hasUpcoming && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex h-1.5 w-1.5 pointer-events-none">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600"></span>
                          </span>
                        )}

                        {/* Completed Event -> Solid BLUE Dot */}
                        {hasOnlyCompleted && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex h-1.5 w-1.5 pointer-events-none">
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600"></span>
                          </span>
                        )}
                      </button>

                      {/* Modal Box Style Hover Popup with Active Bridge & Clickable Links */}
                      {isPopupActive && (
                        <div
                          onMouseEnter={() => handleMouseEnterDay(day)}
                          onMouseLeave={handleMouseLeaveDay}
                          className={`absolute bottom-full mb-3 z-50 flex flex-col w-72 bg-white text-slate-800 rounded-2xl p-4 shadow-2xl border border-slate-200/90 animate-in fade-in zoom-in-95 pointer-events-auto select-text ${
                            isRightColumn ? 'right-0' : 'left-1/2 -translate-x-1/2'
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="w-4 h-4 text-[#5f41b2]" />
                              <span className="text-xs font-extrabold text-[#1b2559]">
                                {monthNames[currentMonth]} {day}, {currentYear}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                hasUpcoming
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {hasUpcoming
                                ? `${upcomingEvents.length} Upcoming`
                                : `${completedEvents.length} Completed`}
                            </span>
                          </div>

                          <div className="space-y-2.5 max-h-56 overflow-y-auto [scrollbar-width:thin] pr-1">
                            {dayEvents.map((ev) => {
                              const isEvCompleted =
                                new Date(ev.endTime || ev.startTime) <= currentTime;

                              return (
                                <div
                                  key={ev.id}
                                  className={`p-3 rounded-xl border space-y-1.5 ${
                                    isEvCompleted
                                      ? 'bg-slate-50 border-slate-200/80'
                                      : 'bg-purple-50/40 border-purple-100'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-1.5">
                                    <p className="text-xs font-bold text-[#1b2559] leading-snug">
                                      {ev.title}
                                    </p>
                                    {isEvCompleted ? (
                                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded shrink-0">
                                        <CheckCircle2 className="w-2.5 h-2.5" /> Completed !
                                      </span>
                                    ) : (
                                      ev.targetType && (
                                        <span className="text-[9px] bg-purple-100 text-[#5f41b2] font-mono px-1.5 py-0.5 rounded font-bold shrink-0">
                                          {ev.targetType}
                                        </span>
                                      )
                                    )}
                                  </div>

                                  {ev.description && (
                                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                      {ev.description}
                                    </p>
                                  )}

                                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100/80">
                                    <span className="flex items-center gap-1 font-medium text-slate-600">
                                      <Clock className="w-3 h-3 text-[#5f41b2] shrink-0" />
                                      {formatEventTime(ev)}
                                    </span>

                                    {/* Clickable Meeting Link */}
                                    {ev.meetingLink && (
                                      <a
                                        href={ev.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 text-[#5f41b2] hover:text-[#4d3396] hover:underline font-bold cursor-pointer"
                                      >
                                        <Video className="w-3 h-3 text-[#5f41b2]" />
                                        <span>Join Link</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Invisible hover bridge & visible pointer arrow */}
                          <div className="absolute top-full left-0 right-0 h-3 bg-transparent pointer-events-auto" />
                          <div
                            className={`absolute top-full -mt-1 w-2.5 h-2.5 bg-white border-r border-b border-slate-200/90 rotate-45 ${
                              isRightColumn ? 'right-4' : 'left-1/2 -translate-x-1/2'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Active Date:</span>
                <span className="font-bold text-[#1b2559]">
                  {selectedDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* COLUMN 3: LIVE CLOCK */}
          <div className="w-full bg-white rounded-2xl shadow-xs border border-slate-200 p-4 sm:p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Current Time</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1 sm:gap-1.5 font-light">
                <div className="bg-[#f4f0fd] text-[#5f41b2] text-2xl sm:text-3xl w-11 h-13 sm:w-12 sm:h-14 rounded-xl font-bold flex items-center justify-center">
                  {displayHour}
                </div>
                <span className="text-xl text-slate-400 font-bold">:</span>
                <div className="bg-slate-100 text-slate-800 text-2xl sm:text-3xl w-11 h-13 sm:w-12 sm:h-14 rounded-xl font-bold flex items-center justify-center">
                  {displayMinute}
                </div>
                <span className="text-xl text-slate-400 font-bold">:</span>
                <div className="bg-slate-100 text-rose-500 text-2xl sm:text-3xl w-11 h-13 sm:w-12 sm:h-14 rounded-xl font-bold flex items-center justify-center">
                  {displaySecond}
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col text-[10px] font-bold">
                <span className={`px-2.5 py-1.5 ${isAM ? 'bg-[#5f41b2] text-white' : 'text-slate-400'}`}>AM</span>
                <span className={`px-2.5 py-1.5 ${!isAM ? 'bg-[#5f41b2] text-white' : 'text-slate-400'}`}>PM</span>
              </div>
            </div>
            <div
              className="relative rounded-full mx-auto flex items-center justify-center my-2 bg-slate-100 border border-slate-200 shadow-inner"
              style={{ width: 'clamp(170px, 22vw, 210px)', height: 'clamp(170px, 22vw, 210px)' }}
            >
              <div className="w-3 h-3 bg-[#5f41b2] rounded-full z-20 shadow-xs" />
              {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => {
                const angle = (num / 12) * 360 - 90;
                const radius = 74;
                const x = 95 + radius * Math.cos((angle * Math.PI) / 180);
                const y = 95 + radius * Math.sin((angle * Math.PI) / 180);
                const isCurrentHour = (hours24 % 12 || 12) === num;
                return (
                  <span
                    key={num}
                    className={`absolute text-[11px] font-bold select-none ${
                      isCurrentHour ? 'text-[#5f41b2]' : 'text-slate-500'
                    }`}
                    style={{ left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -50%)' }}
                  >
                    {num}
                  </span>
                );
              })}
              <div
                className="absolute w-1 h-[44px] bg-[#5f41b2] rounded-full origin-bottom bottom-1/2 left-[calc(50%-2px)] z-10"
                style={{
                  transform: `rotate(${hourDeg}deg)`,
                  transition: 'transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)',
                }}
              />
              <div
                className="absolute w-0.5 h-[60px] bg-slate-700 rounded-full origin-bottom bottom-1/2 left-[calc(50%-1px)] z-10"
                style={{
                  transform: `rotate(${minuteDeg}deg)`,
                  transition: 'transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)',
                }}
              />
              <div
                className="absolute w-[1.5px] h-[72px] bg-rose-500 origin-bottom bottom-1/2 left-[calc(50%-0.75px)] z-10"
                style={{
                  transform: `rotate(${secondDeg}deg)`,
                  transition: secondDeg === 0 ? 'none' : 'transform 0.15s cubic-bezier(0.4, 2.08, 0.55, 0.44)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEvent(null);
        }}
        initialData={editingEvent}
        onSave={editingEvent ? handleUpdateEvent : handleCreateEvent}
        loading={modalLoading}
      />
    </div>
  );
};

export default Calendar;