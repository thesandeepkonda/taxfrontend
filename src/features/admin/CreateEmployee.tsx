// src/features/admin/CreateEmployee.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { createEmployee, clearError } from '../../store/slices/usersSlice';
import { fetchRoles } from '../../store/slices/rolesSlice';
import { fetchTeams } from '../../store/slices/teamsSlice';
import { fetchDepartments } from '../../store/slices/departmentsSlice';
import { fetchAttendancePolicies } from '../../store/slices/attendanceSlice';
import { useToast } from '../../contexts/ToastContext';
import { 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Users, 
  Building2, 
  Shield, 
  ChevronRight,
  ChevronLeft,
  Briefcase,
  IdCard,
  Check,
  AlertCircle,
  Clock
} from 'lucide-react';

interface FormErrors {
  employeeCode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  departmentId?: string;
  teamId?: string;
  roleId?: string;
  attendancePolicyId?: string;
  workMode?: string;
}

const CreateEmployee: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.users);
  const { list: roles } = useSelector((state: RootState) => state.roles);
  const { list: teams } = useSelector((state: RootState) => state.teams);
  const { list: departments } = useSelector((state: RootState) => state.departments);
  const { list: attendancePolicies } = useSelector((state: RootState) => state.attendance);
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const [formData, setFormData] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    teamId: '',
    roleId: '',
    attendancePolicyId: '',
    workMode: '',
  });

  const [success, setSuccess] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<any>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchInitialData = async () => {
      setFetchingData(true);
      try {
        await Promise.all([
          dispatch(fetchRoles()).unwrap(),
          dispatch(fetchTeams()).unwrap(),
          dispatch(fetchDepartments()).unwrap(),
          dispatch(fetchAttendancePolicies()).unwrap(),
        ]);

        if (departments.length > 0) {
          const defaultDept = departments[0];
          setFormData(prev => ({ ...prev, departmentId: String(defaultDept.id) }));
          const filtered = teams.filter(t => t.departmentId === defaultDept.id);
          if (filtered.length > 0) {
            setFormData(prev => ({ ...prev, teamId: String(filtered[0].id) }));
          }
        }
        if (roles.length > 0) {
          setFormData(prev => ({ ...prev, roleId: String(roles[0].id) }));
        }
        if (attendancePolicies.length > 0) {
          setFormData(prev => ({ ...prev, attendancePolicyId: String(attendancePolicies[0].attendancePolicyId) }));
        }
        setFormData(prev => ({ ...prev, workMode: 'OFFICE' }));
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setFetchingData(false);
      }
    };
    fetchInitialData();
  }, [dispatch]);

  const filteredTeams = teams.filter(team => team.departmentId === Number(formData.departmentId));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const validateField = (name: string, value: string) => {
    const errors: FormErrors = { ...formErrors };

    switch (name) {
      case 'employeeCode':
        if (!value.trim()) errors.employeeCode = 'Employee code is required';
        else if (value.trim().length < 3) errors.employeeCode = 'Must be at least 3 characters';
        else if (value.trim().length > 30) errors.employeeCode = 'Must not exceed 30 characters';
        else delete errors.employeeCode;
        break;
      case 'firstName':
        if (!value.trim()) errors.firstName = 'First name is required';
        else if (value.trim().length > 100) errors.firstName = 'Must not exceed 100 characters';
        else delete errors.firstName;
        break;
      case 'email':
        if (!value.trim()) errors.email = 'Email is required';
        else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value.trim())) errors.email = 'Enter a valid email address';
        else delete errors.email;
        break;
      case 'phone':
        if (!value.trim()) errors.phone = 'Phone number is required';
        else if (!/^[0-9]{10}$/.test(value.trim())) errors.phone = 'Phone number must be exactly 10 digits';
        else delete errors.phone;
        break;
      case 'departmentId':
        if (!value) errors.departmentId = 'Department is required';
        else delete errors.departmentId;
        break;
      case 'teamId':
        if (!value) errors.teamId = 'Team is required';
        else delete errors.teamId;
        break;
      case 'roleId':
        if (!value) errors.roleId = 'Role is required';
        else delete errors.roleId;
        break;
      case 'attendancePolicyId':
        if (!value) errors.attendancePolicyId = 'Attendance policy is required';
        else delete errors.attendancePolicyId;
        break;
      case 'workMode':
        if (!value) errors.workMode = 'Work mode is required';
        else delete errors.workMode;
        break;
    }

    setFormErrors(errors);
    return errors;
  };

  const validateStep = (step: number): boolean => {
    const fields: Record<number, string[]> = {
      1: ['employeeCode', 'firstName', 'lastName', 'email', 'phone'],
      2: ['departmentId', 'teamId', 'roleId', 'attendancePolicyId', 'workMode'],
    };

    const stepFields = fields[step] || [];
    let isValid = true;
    const newErrors: FormErrors = { ...formErrors };

    stepFields.forEach(field => {
      const value = formData[field as keyof typeof formData];
      const errors = validateField(field, value);
      if (errors[field as keyof FormErrors]) {
        isValid = false;
        newErrors[field as keyof FormErrors] = errors[field as keyof FormErrors];
      }
    });

    setFormErrors(newErrors);
    const newTouched: Record<string, boolean> = {};
    stepFields.forEach(field => { newTouched[field] = true; });
    setTouched(prev => ({ ...prev, ...newTouched }));

    return isValid;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) setCurrentStep(prev => prev + 1);
    else showToast('Please fix all errors before proceeding', 'error');
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(2)) {
      showToast('Please fix all errors before submitting', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      setSuccess(false);
      dispatch(clearError());

      const payload = {
        employeeCode: formData.employeeCode.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim() || null,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        departmentId: Number(formData.departmentId),
        teamId: Number(formData.teamId),
        roleId: Number(formData.roleId),
        attendancePolicyId: Number(formData.attendancePolicyId),
        workMode: formData.workMode as 'OFFICE' | 'WORK_FROM_HOME' | 'HYBRID',
      };

      const result = await dispatch(createEmployee(payload)).unwrap();
      setCreatedEmployee(result);
      setSuccess(true);
      showToast(`Employee "${result.firstName} ${result.lastName}" created!`, 'success');

      setFormData({
        employeeCode: '', firstName: '', lastName: '', email: '', phone: '',
        departmentId: formData.departmentId, teamId: formData.teamId, roleId: formData.roleId,
        attendancePolicyId: formData.attendancePolicyId,
        workMode: formData.workMode,
      });
      setFormErrors({});
      setTouched({});
      setCurrentStep(1);

      setTimeout(() => {
        setSuccess(false);
        setCreatedEmployee(null);
      }, 5000);
    } catch (err: any) {
      showToast(err || 'Failed to create employee', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white rounded-2xl border border-slate-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#5f41b2] animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col font-sans overflow-x-hidden gap-y-4">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 sm:p-6 lg:p-8">
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-5 mb-5 animate-in fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm sm:text-base font-bold text-emerald-800">Employee Created Successfully!</h4>
                <p className="text-xs sm:text-sm text-emerald-700 mt-0.5">
                  <span className="font-bold">{createdEmployee?.firstName} {createdEmployee?.lastName}</span> ({createdEmployee?.employeeCode})
                </p>
                <div className="mt-2.5 p-2.5 bg-emerald-100/60 rounded-lg border border-emerald-200 text-xs text-emerald-800 space-y-1">
                  <p><span className="font-semibold">Temporary Password:</span> <span className="font-mono font-bold">{createdEmployee?.temporaryPassword}</span></p>
                  <p><span className="font-semibold">Role:</span> {createdEmployee?.roleName}</p>
                  <p><span className="font-semibold">Attendance Policy:</span> {createdEmployee?.attendancePolicyName}</p>
                  <p><span className="font-semibold">Work Mode:</span> {createdEmployee?.workMode}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6">
          {/* Step 1 - Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <IdCard className="w-5 h-5 text-[#5f41b2]" />
                <h2 className="text-sm sm:text-base font-bold text-[#1b2559]">Personal Information</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1" htmlFor="employeeCode">
                    Employee Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="employeeCode"
                    type="text"
                    name="employeeCode"
                    value={formData.employeeCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g., EMP001"
                    className={`w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] ${
                      touched.employeeCode && formErrors.employeeCode ? 'border-rose-500' : 'border-slate-300'
                    }`}
                    disabled={isSubmitting}
                    required
                  />
                  {touched.employeeCode && formErrors.employeeCode && (
                    <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{formErrors.employeeCode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1" htmlFor="firstName">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g., John"
                    className={`w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] ${
                      touched.firstName && formErrors.firstName ? 'border-rose-500' : 'border-slate-300'
                    }`}
                    disabled={isSubmitting}
                    required
                  />
                  {touched.firstName && formErrors.firstName && (
                    <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{formErrors.firstName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1" htmlFor="lastName">
                    Last Name <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g., Doe"
                    className="w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2]"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1" htmlFor="email">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="john.doe@company.com"
                    className={`w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] ${
                      touched.email && formErrors.email ? 'border-rose-500' : 'border-slate-300'
                    }`}
                    disabled={isSubmitting}
                    required
                  />
                  {touched.email && formErrors.email && (
                    <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{formErrors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1" htmlFor="phone">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="9876543210 (10 digits)"
                  className={`w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] ${
                    touched.phone && formErrors.phone ? 'border-rose-500' : 'border-slate-300'
                  }`}
                  disabled={isSubmitting}
                  required
                />
                {touched.phone && formErrors.phone && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{formErrors.phone}</p>
                )}
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 bg-[#5f41b2] hover:bg-[#4d3396] text-white font-bold px-6 py-2.5 rounded-xl transition cursor-pointer active:scale-95"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 - Role, Department, Attendance & Work Mode */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Briefcase className="w-5 h-5 text-[#5f41b2]" />
                <h2 className="text-sm sm:text-base font-bold text-[#1b2559]">Role & Work Configuration</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1" htmlFor="departmentId">
                    <Building2 className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="departmentId"
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] bg-white"
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1" htmlFor="teamId">
                    <Users className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                    Team <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="teamId"
                    name="teamId"
                    value={formData.teamId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] bg-white"
                    disabled={isSubmitting || !formData.departmentId}
                    required
                  >
                    <option value="">Select Team</option>
                    {filteredTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1" htmlFor="roleId">
                  <Shield className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  Role <span className="text-rose-500">*</span>
                </label>
                <select
                  id="roleId"
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] bg-white"
                  disabled={isSubmitting}
                  required
                >
                  <option value="">Select a Role</option>
                  {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
              </div>

              {/* Attendance Policy */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1" htmlFor="attendancePolicyId">
                  <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  Attendance Policy <span className="text-rose-500">*</span>
                </label>
                <select
                  id="attendancePolicyId"
                  name="attendancePolicyId"
                  value={formData.attendancePolicyId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] bg-white ${
                    touched.attendancePolicyId && formErrors.attendancePolicyId ? 'border-rose-500' : 'border-slate-300'
                  }`}
                  disabled={isSubmitting || attendancePolicies.length === 0}
                  required
                >
                  <option value="">Select Attendance Policy</option>
                  {attendancePolicies.map((policy) => (
                    <option key={policy.attendancePolicyId} value={policy.attendancePolicyId}>
                      {policy.name} ({policy.startTime} - {policy.endTime})
                    </option>
                  ))}
                </select>
                {touched.attendancePolicyId && formErrors.attendancePolicyId && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{formErrors.attendancePolicyId}</p>
                )}
              </div>

              {/* Work Mode */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                  Work Mode <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['OFFICE', 'WORK_FROM_HOME', 'HYBRID'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, workMode: mode }));
                        setTouched(prev => ({ ...prev, workMode: true }));
                        validateField('workMode', mode);
                      }}
                      className={`min-h-[44px] px-3 py-2 text-xs sm:text-sm font-bold rounded-xl border transition ${
                        formData.workMode === mode
                          ? 'bg-[#5f41b2] text-white border-[#5f41b2]'
                          : touched.workMode && formErrors.workMode
                          ? 'border-rose-500 bg-rose-50 text-rose-700'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {mode.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                {touched.workMode && formErrors.workMode && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{formErrors.workMode}</p>
                )}
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm space-y-1.5">
                <h4 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Summary</h4>
                <div className="flex justify-between"><span className="text-slate-500">Employee Code:</span> <span className="font-semibold">{formData.employeeCode || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Name:</span> <span className="font-semibold">{formData.firstName} {formData.lastName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Department:</span> <span className="font-semibold">{departments.find(d => d.id === Number(formData.departmentId))?.name || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Team:</span> <span className="font-semibold">{teams.find(t => t.id === Number(formData.teamId))?.name || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Role:</span> <span className="font-semibold">{roles.find(r => r.id === Number(formData.roleId))?.name || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Attendance Policy:</span> <span className="font-semibold">{attendancePolicies.find(p => p.attendancePolicyId === Number(formData.attendancePolicyId))?.name || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Work Mode:</span> <span className="font-semibold">{formData.workMode || '-'}</span></div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="min-h-[44px] flex items-center justify-center gap-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-5 py-2.5 rounded-xl transition"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[44px] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-sm active:scale-95 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Create Employee</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateEmployee;